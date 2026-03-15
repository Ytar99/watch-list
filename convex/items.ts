import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./lib/auth";
import { internal } from "./_generated/api";

/** My items in a board, sorted by order (for "My items" tab and reorder). */
export const listMyByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", boardId).eq("userId", userId))
      .unique();
    if (!member) return [];
    return await ctx.db
      .query("items")
      .withIndex("byBoardUserOrder", (q) => q.eq("boardId", boardId).eq("userId", userId))
      .order("asc")
      .collect();
  },
});

/** All non-hidden items in board (for merge). Grouped by userId, each group sorted by order. */
async function getItemsByMember(
  ctx: import("./_generated/server").QueryCtx,
  boardId: import("./_generated/dataModel").Id<"boards">,
) {
  const members = await ctx.db
    .query("boardMembers")
    .withIndex("byBoard", (q) => q.eq("boardId", boardId))
    .collect();
  const result: Array<{
    userId: import("./_generated/dataModel").Id<"users">;
    items: Array<import("./_generated/server").Doc<"items">>;
  }> = [];
  for (const m of members) {
    const items = await ctx.db
      .query("items")
      .withIndex("byBoardUserOrder", (q) => q.eq("boardId", boardId).eq("userId", m.userId))
      .filter((q) => q.eq(q.field("isHidden"), false))
      .order("asc")
      .collect();
    if (items.length) result.push({ userId: m.userId, items });
  }
  return result;
}

/** Merged list: round-robin from each member's items (ABAB, ABCABC...). */
export const getMergedBoardItems = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", boardId).eq("userId", userId))
      .unique();
    if (!member) return [];
    const byMember = await getItemsByMember(ctx, boardId);
    const userDocs = await Promise.all(
      byMember.map(async ({ userId: uid }) => ({
        userId: uid,
        user: await ctx.db.get(uid),
      })),
    );
    const userName = (uid: import("./_generated/dataModel").Id<"users">) =>
      userDocs.find((d) => d.userId === uid)?.user?.name ?? "—";
    const queues = byMember.map((g) => [...g.items]);
    const merged: Array<{ item: import("./_generated/server").Doc<"items">; userName: string }> = [];
    let hasAny = true;
    while (hasAny) {
      hasAny = false;
      for (let i = 0; i < queues.length; i++) {
        const arr = queues[i];
        if (arr.length) {
          const item = arr.shift()!;
          merged.push({ item, userName: userName(byMember[i].userId) });
          hasAny = true;
        }
      }
    }
    return merged;
  },
});

export const create = mutation({
  args: {
    boardId: v.id("boards"),
    title: v.string(),
    totalEpisodes: v.number(),
    currentEpisode: v.number(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, { boardId, title, totalEpisodes, currentEpisode, url }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", boardId).eq("userId", userId))
      .unique();
    if (!member) throw new Error("Not a member of this board");
    const existing = await ctx.db
      .query("items")
      .withIndex("byBoardUserOrder", (q) => q.eq("boardId", boardId).eq("userId", userId))
      .order("desc")
      .first();
    const order = (existing?.order ?? -1) + 1;
    const now = Date.now();
    const itemId = await ctx.db.insert("items", {
      boardId,
      userId,
      title: title.trim() || "Без названия",
      totalEpisodes: Math.max(0, totalEpisodes),
      currentEpisode: Math.max(0, Math.min(currentEpisode, totalEpisodes || currentEpisode)),
      url: url?.trim() || undefined,
      order,
      createdAt: now,
      updatedAt: now,
      isHidden: false,
    });
    await ctx.runMutation(internal.history.log, {
      boardId,
      itemId,
      action: "create",
      details: { title: title.trim() || "Без названия" },
      userId,
    });
    return itemId;
  },
});

export const update = mutation({
  args: {
    itemId: v.id("items"),
    title: v.optional(v.string()),
    totalEpisodes: v.optional(v.number()),
    currentEpisode: v.optional(v.number()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { itemId, ...updates } = args;
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", item.boardId).eq("userId", userId))
      .unique();
    if (!member) throw new Error("Not a member of this board");
    const patch: Partial<typeof item> = { updatedAt: Date.now() };
    if (updates.title !== undefined) patch.title = updates.title.trim() || "Без названия";
    if (updates.totalEpisodes !== undefined) patch.totalEpisodes = Math.max(0, updates.totalEpisodes);
    if (updates.currentEpisode !== undefined) {
      const total = updates.totalEpisodes ?? item.totalEpisodes;
      patch.currentEpisode = Math.max(0, Math.min(updates.currentEpisode, total));
    }
    if (updates.url !== undefined) patch.url = updates.url?.trim() || undefined;
    if (Object.keys(patch).length > 1) {
      await ctx.db.patch(itemId, patch);
      await ctx.runMutation(internal.history.log, {
        boardId: item.boardId,
        itemId,
        action: "update",
        details: updates,
        userId,
      });
    }
    return null;
  },
});

/** Soft delete: set isHidden = true. Any member. */
export const remove = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item) return null;
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", item.boardId).eq("userId", userId))
      .unique();
    if (!member) throw new Error("Not a member of this board");
    await ctx.db.patch(itemId, { isHidden: true });
    await ctx.runMutation(internal.history.log, {
      boardId: item.boardId,
      itemId,
      action: "delete",
      userId,
    });
    return null;
  },
});

/** Mark complete: set currentEpisode = totalEpisodes. Any member. */
export const complete = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", item.boardId).eq("userId", userId))
      .unique();
    if (!member) throw new Error("Not a member of this board");
    if (item.currentEpisode >= item.totalEpisodes) return null;
    await ctx.db.patch(itemId, {
      currentEpisode: item.totalEpisodes,
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.history.log, {
      boardId: item.boardId,
      itemId,
      action: "complete",
      userId,
    });
    return null;
  },
});

/** Restore a previously hidden item (isHidden = false). Any board member. */
export const restore = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", item.boardId).eq("userId", userId))
      .unique();
    if (!member) throw new Error("Not a member of this board");
    if (!item.isHidden) return null;
    await ctx.db.patch(itemId, {
      isHidden: false,
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.history.log, {
      boardId: item.boardId,
      itemId,
      action: "update",
      details: { isHidden: false },
      userId,
    });
    return null;
  },
});

/** Hard delete an item completely. Only the owner can do this, typically from their personal list. */
export const hardDelete = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item) return null;
    if (item.userId !== userId) throw new Error("Only owner can permanently delete item");
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", item.boardId).eq("userId", userId))
      .unique();
    if (!member) throw new Error("Not a member of this board");
    await ctx.db.delete(itemId);
    await ctx.runMutation(internal.history.log, {
      boardId: item.boardId,
      itemId,
      action: "delete",
      details: { hard: true },
      userId,
    });
    return null;
  },
});

/** Reorder: only owner can reorder their items. newOrder = array of item ids in desired order. */
export const reorder = mutation({
  args: { boardId: v.id("boards"), newOrder: v.array(v.id("items")) },
  handler: async (ctx, { boardId, newOrder }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", boardId).eq("userId", userId))
      .unique();
    if (!member) throw new Error("Not a member of this board");
    const myItems = await ctx.db
      .query("items")
      .withIndex("byBoardUserOrder", (q) => q.eq("boardId", boardId).eq("userId", userId))
      .collect();
    const myIds = new Set(myItems.map((i) => i._id));
    const validOrder = newOrder.filter((id) => myIds.has(id));
    if (validOrder.length !== myItems.length) throw new Error("Invalid reorder");
    for (let i = 0; i < validOrder.length; i++) {
      await ctx.db.patch(validOrder[i], { order: i, updatedAt: Date.now() });
    }
    return null;
  },
});

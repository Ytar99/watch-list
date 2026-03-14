import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./lib/auth";

const roleValidator = v.union(
  v.literal("creator"),
  v.literal("moderator"),
  v.literal("member"),
);

/** List members of a board (only for board members). */
export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const myMember = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", userId),
      )
      .unique();
    if (!myMember) return null;
    const members = await ctx.db
      .query("boardMembers")
      .withIndex("byBoard", (q) => q.eq("boardId", boardId))
      .collect();
    const users = await Promise.all(
      members.map((m) => ctx.db.get(m.userId).then((u) => ({ ...m, userName: u?.name ?? "—", userEmail: u?.email }))),
    );
    return users;
  },
});

/** Add a member (creator or moderator). If already member, no-op. */
export const add = mutation({
  args: { boardId: v.id("boards"), userId: v.id("users"), role: roleValidator },
  handler: async (ctx, { boardId, userId, role }) => {
    const me = await getCurrentUserId(ctx);
    if (!me) throw new Error("Not authenticated");
    const myMember = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", me),
      )
      .unique();
    if (!myMember || (myMember.role !== "creator" && myMember.role !== "moderator"))
      throw new Error("Only creator or moderator can add members");
    if (role === "creator") throw new Error("Cannot add another creator");
    const existing = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", userId),
      )
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("boardMembers", {
      boardId,
      userId,
      role,
      joinedAt: Date.now(),
    });
  },
});

/** Update a member's role. Only creator can set moderator/member. */
export const updateRole = mutation({
  args: {
    boardId: v.id("boards"),
    userId: v.id("users"),
    role: roleValidator,
  },
  handler: async (ctx, { boardId, userId, role }) => {
    const me = await getCurrentUserId(ctx);
    if (!me) throw new Error("Not authenticated");
    const myMember = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", me),
      )
      .unique();
    if (!myMember || myMember.role !== "creator")
      throw new Error("Only creator can change roles");
    if (role === "creator") throw new Error("Cannot assign creator role");
    const target = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", userId),
      )
      .unique();
    if (!target) throw new Error("Member not found");
    await ctx.db.patch(target._id, { role });
    return null;
  },
});

/** Remove a member. Creator or moderator. When removing: set all their items isHidden = true. */
export const remove = mutation({
  args: { boardId: v.id("boards"), userId: v.id("users") },
  handler: async (ctx, { boardId, userId }) => {
    const me = await getCurrentUserId(ctx);
    if (!me) throw new Error("Not authenticated");
    const myMember = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", me),
      )
      .unique();
    if (!myMember || (myMember.role !== "creator" && myMember.role !== "moderator"))
      throw new Error("Only creator or moderator can remove members");
    const target = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", userId),
      )
      .unique();
    if (!target) return null;
    if (target.role === "creator") throw new Error("Cannot remove creator");
    await ctx.db.delete(target._id);
    const items = await ctx.db
      .query("items")
      .withIndex("byBoardUserOrder", (q) =>
        q.eq("boardId", boardId).eq("userId", userId),
      )
      .collect();
    for (const item of items) {
      await ctx.db.patch(item._id, { isHidden: true });
    }
    return null;
  },
});

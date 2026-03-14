import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./lib/auth";

const actionValidator = v.union(
  v.literal("create"),
  v.literal("update"),
  v.literal("delete"),
  v.literal("complete"),
  v.literal("uncomplete"),
);

/** Log a history entry. Called only from other mutations (items/boards). Pass userId when calling from server. */
export const log = internalMutation({
  args: {
    boardId: v.id("boards"),
    itemId: v.optional(v.id("items")),
    action: actionValidator,
    details: v.optional(v.any()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { boardId, itemId, action, details, userId: passedUserId }) => {
    const userId = passedUserId ?? (await getCurrentUserId(ctx));
    if (!userId) return null;
    await ctx.db.insert("history", {
      boardId,
      userId,
      itemId,
      action,
      details: details ?? undefined,
      timestamp: Date.now(),
    });
    return null;
  },
});

/** List history for a board (newest first). */
export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", userId),
      )
      .unique();
    if (!member) return [];
    const entries = await ctx.db
      .query("history")
      .withIndex("byBoard", (q) => q.eq("boardId", boardId))
      .order("desc")
      .take(100);
    const withUserNames = await Promise.all(
      entries.map(async (e) => {
        const u = await ctx.db.get(e.userId);
        return { ...e, userName: u?.name ?? "—" };
      }),
    );
    return withUserNames;
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const memberships = await ctx.db
      .query("boardMembers")
      .withIndex("byUser", (q) => q.eq("userId", userId))
      .collect();
    const boards: Array<{
      _id: import("./_generated/dataModel").Id<"boards">;
      _creationTime: number;
      name: string;
      createdBy: import("./_generated/dataModel").Id<"users">;
      createdAt: number;
      isActive: boolean;
      role: "creator" | "moderator" | "member";
    }> = [];
    for (const m of memberships) {
      const board = await ctx.db.get(m.boardId);
      if (board && board.isActive) {
        boards.push({ ...board, role: m.role });
      }
    }
    boards.sort((a, b) => b.createdAt - a.createdAt);
    return boards;
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    const boardId = await ctx.db.insert("boards", {
      name: name.trim() || "Без названия",
      createdBy: userId,
      createdAt: now,
      isActive: true,
    });
    await ctx.db.insert("boardMembers", {
      boardId,
      userId,
      role: "creator",
      joinedAt: now,
    });
    return boardId;
  },
});

export const get = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const board = await ctx.db.get(boardId);
    if (!board || !board.isActive) return null;
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", userId),
      )
      .unique();
    if (!member) return null;
    return { ...board, myRole: member.role };
  },
});

export const update = mutation({
  args: {
    boardId: v.id("boards"),
    name: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { boardId, name, isActive }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", userId),
      )
      .unique();
    if (!member || member.role !== "creator")
      throw new Error("Only creator can update board");
    const patch: { name?: string; isActive?: boolean } = {};
    if (name !== undefined) patch.name = name.trim() || "Без названия";
    if (isActive !== undefined) patch.isActive = isActive;
    if (Object.keys(patch).length) await ctx.db.patch(boardId, patch);
    return null;
  },
});

/** Soft delete: set isActive = false. Only creator. */
export const remove = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) =>
        q.eq("boardId", boardId).eq("userId", userId),
      )
      .unique();
    if (!member || member.role !== "creator")
      throw new Error("Only creator can delete board");
    await ctx.db.patch(boardId, { isActive: false });
    return null;
  },
});

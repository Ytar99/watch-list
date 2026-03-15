import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  boards: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    isActive: v.boolean(),
    emoji: v.optional(v.string()),
  }).index("byCreatedBy", ["createdBy"]),
  boardMembers: defineTable({
    boardId: v.id("boards"),
    userId: v.id("users"),
    role: v.union(v.literal("creator"), v.literal("moderator"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("byBoard", ["boardId"])
    .index("byUser", ["userId"])
    .index("byBoardUser", ["boardId", "userId"]),
  items: defineTable({
    boardId: v.id("boards"),
    userId: v.id("users"),
    title: v.string(),
    totalEpisodes: v.number(),
    currentEpisode: v.number(),
    url: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isHidden: v.boolean(),
  })
    .index("byBoard", ["boardId"])
    .index("byUser", ["userId"])
    .index("byBoardOrder", ["boardId", "order"])
    .index("byBoardUserOrder", ["boardId", "userId", "order"]),
  history: defineTable({
    boardId: v.id("boards"),
    userId: v.id("users"),
    itemId: v.optional(v.id("items")),
    action: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("complete"),
      v.literal("uncomplete"),
    ),
    details: v.optional(v.any()),
    timestamp: v.number(),
  }).index("byBoard", ["boardId"]),
});

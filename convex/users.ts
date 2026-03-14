import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the current user document, or null if not authenticated.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

/**
 * Search users by email (for inviting to boards).
 * Returns at most one user; email comparison is case-sensitive in Convex.
 */
export const searchByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", trimmed))
      .first();
    return user ? [user] : [];
  },
});

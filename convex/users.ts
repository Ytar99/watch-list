import { mutation, query } from "./_generated/server";
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
 * Update current user's profile (only name, email is immutable).
 */
export const updateProfile = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const trimmed = name.trim();
    await ctx.db.patch(userId, { name: trimmed || undefined });
    return null;
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

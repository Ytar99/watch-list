import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./lib/auth";
import { internal } from "./_generated/api";

/** Get average ratings for an item */
export const getAverageRatings = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("byItem", (q) => q.eq("itemId", itemId))
      .collect();

    if (ratings.length === 0) {
      return {
        count: 0,
        plotCharacters: 0,
        atmosphereStyle: 0,
        executionQuality: 0,
        originality: 0,
        emotionalImpact: 0,
        overall: 0,
      };
    }

    const sum = ratings.reduce(
      (acc, r) => ({
        plotCharacters: acc.plotCharacters + r.plotCharacters,
        atmosphereStyle: acc.atmosphereStyle + r.atmosphereStyle,
        executionQuality: acc.executionQuality + r.executionQuality,
        originality: acc.originality + r.originality,
        emotionalImpact: acc.emotionalImpact + r.emotionalImpact,
      }),
      { plotCharacters: 0, atmosphereStyle: 0, executionQuality: 0, originality: 0, emotionalImpact: 0 },
    );

    const count = ratings.length;
    const avg = {
      plotCharacters: Math.round((sum.plotCharacters / count) * 10) / 10,
      atmosphereStyle: Math.round((sum.atmosphereStyle / count) * 10) / 10,
      executionQuality: Math.round((sum.executionQuality / count) * 10) / 10,
      originality: Math.round((sum.originality / count) * 10) / 10,
      emotionalImpact: Math.round((sum.emotionalImpact / count) * 10) / 10,
    };

    const overall =
      Math.round(
        ((avg.plotCharacters + avg.atmosphereStyle + avg.executionQuality + avg.originality + avg.emotionalImpact) /
          5) *
          10,
      ) / 10;

    return {
      count,
      ...avg,
      overall,
    };
  },
});

/** Get all reviews for an item with user info */
export const getItemReviews = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("byItem", (q) => q.eq("itemId", itemId))
      .order("desc")
      .collect();

    if (reviews.length === 0) return [];

    const ratingIds = reviews.map((r) => r.ratingId);
    const ratings = await Promise.all(ratingIds.map((id) => ctx.db.get(id)));

    const userIds = reviews.map((r) => r.userId);
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));

    return reviews.map((review, index) => ({
      ...review,
      rating: ratings[index],
      user: users[index],
    }));
  },
});

/** Get user's rating for an item */
export const getUserRating = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;

    const rating = await ctx.db
      .query("ratings")
      .withIndex("byItemUser", (q) => q.eq("itemId", itemId).eq("userId", userId))
      .unique();

    if (!rating) return null;

    const review = await ctx.db
      .query("reviews")
      .withIndex("byRating", (q) => q.eq("ratingId", rating._id))
      .unique();

    return {
      ...rating,
      comment: review?.comment || "",
    };
  },
});

/** Submit a rating and optional review */
export const submitRating = mutation({
  args: {
    itemId: v.id("items"),
    plotCharacters: v.number(),
    atmosphereStyle: v.number(),
    executionQuality: v.number(),
    originality: v.number(),
    emotionalImpact: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    // Check if user is a member of the board
    const member = await ctx.db
      .query("boardMembers")
      .withIndex("byBoardUser", (q) => q.eq("boardId", item.boardId).eq("userId", userId))
      .unique();
    if (!member) throw new Error("Not a member of this board");

    // Check if item is completed
    if (item.currentEpisode < item.totalEpisodes) {
      throw new Error("Cannot rate incomplete item");
    }

    const now = Date.now();

    // Check if user already has a rating for this item
    const existingRating = await ctx.db
      .query("ratings")
      .withIndex("byItemUser", (q) => q.eq("itemId", args.itemId).eq("userId", userId))
      .unique();

    if (existingRating) {
      // Update existing rating
      await ctx.db.patch(existingRating._id, {
        plotCharacters: Math.max(1, Math.min(5, args.plotCharacters)),
        atmosphereStyle: Math.max(1, Math.min(5, args.atmosphereStyle)),
        executionQuality: Math.max(1, Math.min(5, args.executionQuality)),
        originality: Math.max(1, Math.min(5, args.originality)),
        emotionalImpact: Math.max(1, Math.min(5, args.emotionalImpact)),
        updatedAt: now,
      });

      // Update or create review
      const existingReview = await ctx.db
        .query("reviews")
        .withIndex("byRating", (q) => q.eq("ratingId", existingRating._id))
        .unique();

      if (args.comment !== undefined) {
        if (existingReview) {
          await ctx.db.patch(existingReview._id, {
            comment: args.comment.trim(),
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("reviews", {
            itemId: args.itemId,
            userId,
            ratingId: existingRating._id,
            comment: args.comment.trim(),
            createdAt: now,
            updatedAt: now,
          });
        }
      } else if (existingReview) {
        await ctx.db.delete(existingReview._id);
      }

      return existingRating._id;
    } else {
      // Create new rating
      const ratingId = await ctx.db.insert("ratings", {
        itemId: args.itemId,
        userId,
        plotCharacters: Math.max(1, Math.min(5, args.plotCharacters)),
        atmosphereStyle: Math.max(1, Math.min(5, args.atmosphereStyle)),
        executionQuality: Math.max(1, Math.min(5, args.executionQuality)),
        originality: Math.max(1, Math.min(5, args.originality)),
        emotionalImpact: Math.max(1, Math.min(5, args.emotionalImpact)),
        createdAt: now,
        updatedAt: now,
      });

      // Create review if comment provided
      if (args.comment !== undefined && args.comment.trim()) {
        await ctx.db.insert("reviews", {
          itemId: args.itemId,
          userId,
          ratingId,
          comment: args.comment.trim(),
          createdAt: now,
          updatedAt: now,
        });
      }

      return ratingId;
    }
  },
});

/** Delete a rating and associated review */
export const deleteRating = mutation({
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

    const rating = await ctx.db
      .query("ratings")
      .withIndex("byItemUser", (q) => q.eq("itemId", itemId).eq("userId", userId))
      .unique();

    if (!rating) return null;

    // Delete associated review
    const review = await ctx.db
      .query("reviews")
      .withIndex("byRating", (q) => q.eq("ratingId", rating._id))
      .unique();

    if (review) {
      await ctx.db.delete(review._id);
    }

    // Delete rating
    await ctx.db.delete(rating._id);

    return null;
  },
});

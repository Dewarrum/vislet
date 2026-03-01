import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized");
  }

  return identity.subject;
}

export const listForCurrentUser = query({
  args: {
    searchText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const trimmedSearchText = args.searchText?.trim();

    if (!trimmedSearchText) {
      return await ctx.db
        .query("categories")
        .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("categories")
      .withSearchIndex("search_name", (q) =>
        q.search("name", trimmedSearchText).eq("userId", userId),
      )
      .take(50);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    return await ctx.db.insert("categories", {
      createdAt: Date.now(),
      name: args.name.trim(),
      userId,
    });
  },
});

export const rename = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const category = await ctx.db.get(args.categoryId);

    if (!category) {
      throw new Error("Category not found");
    }

    if (category.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.categoryId, {
      name: args.name.trim(),
    });
  },
});

export const remove = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const category = await ctx.db.get(args.categoryId);

    if (!category) {
      throw new Error("Category not found");
    }

    if (category.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.categoryId);
  },
});

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
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    return await ctx.db
      .query("bankAccounts")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    currency: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    return await ctx.db.insert("bankAccounts", {
      createdAt: Date.now(),
      currency: args.currency.toUpperCase(),
      name: args.name.trim(),
      userId,
    });
  },
});

export const rename = mutation({
  args: {
    accountId: v.id("bankAccounts"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const account = await ctx.db.get(args.accountId);

    if (!account) {
      throw new Error("Bank account not found");
    }

    if (account.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.accountId, {
      name: args.name.trim(),
    });
  },
});

export const remove = mutation({
  args: {
    accountId: v.id("bankAccounts"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const account = await ctx.db.get(args.accountId);

    if (!account) {
      throw new Error("Bank account not found");
    }

    if (account.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.accountId);
  },
});

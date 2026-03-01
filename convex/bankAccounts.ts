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

async function listAccountsForUser(ctx: QueryCtx | MutationCtx, userId: string) {
  return await ctx.db
    .query("bankAccounts")
    .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();
}

export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const accounts = await listAccountsForUser(ctx, userId);
    const hasExplicitDefault = accounts.some((account) => account.isDefault === true);

    if (hasExplicitDefault) {
      return accounts;
    }

    return accounts.map((account, index) => ({
      ...account,
      isDefault: index === 0,
    }));
  },
});

export const create = mutation({
  args: {
    currency: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existingAccounts = await listAccountsForUser(ctx, userId);

    return await ctx.db.insert("bankAccounts", {
      createdAt: Date.now(),
      currency: args.currency.toUpperCase(),
      isDefault: existingAccounts.length === 0,
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

export const setDefault = mutation({
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

    const accounts = await listAccountsForUser(ctx, userId);
    await Promise.all(
      accounts.map(async (userAccount) => {
        const shouldBeDefault = userAccount._id === args.accountId;
        const isDefault = userAccount.isDefault === true;

        if (isDefault === shouldBeDefault) {
          return;
        }

        await ctx.db.patch(userAccount._id, {
          isDefault: shouldBeDefault,
        });
      }),
    );

    return null;
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

    if (account.isDefault !== true) {
      return null;
    }

    const remainingAccounts = await listAccountsForUser(ctx, userId);
    const nextDefault = remainingAccounts[0];

    if (!nextDefault) {
      return null;
    }

    await Promise.all(
      remainingAccounts.map(async (remainingAccount) => {
        const shouldBeDefault = remainingAccount._id === nextDefault._id;
        const isDefault = remainingAccount.isDefault === true;

        if (isDefault === shouldBeDefault) {
          return;
        }

        await ctx.db.patch(remainingAccount._id, {
          isDefault: shouldBeDefault,
        });
      }),
    );

    return null;
  },
});

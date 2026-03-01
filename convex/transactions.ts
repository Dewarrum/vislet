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
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_purchaseDate_createdAt", (q) =>
        q.eq("userId", userId),
      )
      .order("desc")
      .collect();

    return await Promise.all(
      transactions.map(async (transaction) => {
        const [account, category] = await Promise.all([
          ctx.db.get(transaction.accountId),
          ctx.db.get(transaction.categoryId),
        ]);

        return {
          _id: transaction._id,
          _creationTime: transaction._creationTime,
          accountCurrency: account?.currency ?? "-",
          accountId: transaction.accountId,
          accountName: account?.name ?? "Unknown account",
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          categoryName: category?.name ?? "Unknown category",
          createdAt: transaction.createdAt,
          name: transaction.name,
          purchaseDate: transaction.purchaseDate,
          userId: transaction.userId,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    accountId: v.id("bankAccounts"),
    amount: v.number(),
    categoryId: v.id("categories"),
    name: v.string(),
    purchaseDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.name.trim();

    if (!name) {
      throw new Error("Transaction name is required");
    }

    if (!Number.isFinite(args.amount)) {
      throw new Error("Amount must be a valid number");
    }

    if (!Number.isFinite(args.purchaseDate)) {
      throw new Error("Purchase date must be a valid timestamp");
    }

    const [account, category] = await Promise.all([
      ctx.db.get(args.accountId),
      ctx.db.get(args.categoryId),
    ]);

    if (!account) {
      throw new Error("Bank account not found");
    }

    if (account.userId !== userId) {
      throw new Error("Unauthorized");
    }

    if (!category) {
      throw new Error("Category not found");
    }

    if (category.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("transactions", {
      accountId: args.accountId,
      amount: args.amount,
      categoryId: args.categoryId,
      createdAt: Date.now(),
      name,
      purchaseDate: args.purchaseDate,
      userId,
    });
  },
});

export const rename = mutation({
  args: {
    name: v.string(),
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const name = args.name.trim();

    if (!name) {
      throw new Error("Transaction name is required");
    }

    await ctx.db.patch(args.transactionId, {
      name,
    });
  },
});

export const remove = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.transactionId);
  },
});

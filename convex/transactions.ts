import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
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

export const expenseBreakdownByCategory = query({
  args: {
    accountIds: v.optional(v.array(v.id("bankAccounts"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const accountIdFilter = args.accountIds
      ? new Set<Id<"bankAccounts">>(args.accountIds)
      : null;
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_purchaseDate_createdAt", (q) =>
        q.eq("userId", userId),
      )
      .collect();

    const totalsByCategory = new Map<
      Id<"categories">,
      { totalAmount: number; transactionCount: number }
    >();

    for (const transaction of transactions) {
      if (accountIdFilter && !accountIdFilter.has(transaction.accountId)) {
        continue;
      }

      if (transaction.amount >= 0) {
        continue;
      }

      const current = totalsByCategory.get(transaction.categoryId) ?? {
        totalAmount: 0,
        transactionCount: 0,
      };

      totalsByCategory.set(transaction.categoryId, {
        totalAmount: current.totalAmount + Math.abs(transaction.amount),
        transactionCount: current.transactionCount + 1,
      });
    }

    const categoryIds = Array.from(totalsByCategory.keys());
    const categories = await Promise.all(
      categoryIds.map((categoryId) => ctx.db.get(categoryId)),
    );
    const categoryNameById = new Map(
      categoryIds.map((categoryId, index) => [
        categoryId,
        categories[index]?.name ?? "Unknown category",
      ]),
    );

    return categoryIds
      .map((categoryId) => {
        const totals = totalsByCategory.get(categoryId);

        if (!totals) {
          throw new Error("Missing expense totals for category");
        }

        return {
          categoryId,
          categoryName: categoryNameById.get(categoryId) ?? "Unknown category",
          totalAmount: totals.totalAmount,
          transactionCount: totals.transactionCount,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
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

export const changeType = mutation({
  args: {
    transactionId: v.id("transactions"),
    type: v.union(v.literal("expense"), v.literal("income")),
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

    const absoluteAmount = Math.abs(transaction.amount);
    const nextAmount =
      args.type === "income" ? absoluteAmount : -absoluteAmount;

    if (transaction.amount === nextAmount) {
      return null;
    }

    await ctx.db.patch(args.transactionId, {
      amount: nextAmount,
    });

    return null;
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

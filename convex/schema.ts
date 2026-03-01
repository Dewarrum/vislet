import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  bankAccounts: defineTable({
    createdAt: v.number(),
    currency: v.string(),
    isDefault: v.optional(v.boolean()),
    name: v.string(),
    userId: v.string(),
  }).index("by_userId_and_createdAt", ["userId", "createdAt"]),
  categories: defineTable({
    createdAt: v.number(),
    name: v.string(),
    userId: v.string(),
  })
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .searchIndex("search_name", {
      filterFields: ["userId"],
      searchField: "name",
    }),
  transactions: defineTable({
    accountId: v.id("bankAccounts"),
    amount: v.number(),
    categoryId: v.id("categories"),
    createdAt: v.number(),
    name: v.string(),
    purchaseDate: v.number(),
    userId: v.string(),
  }).index("by_userId_and_purchaseDate_createdAt", [
    "userId",
    "purchaseDate",
    "createdAt",
  ]),
  numbers: defineTable({
    value: v.number(),
  }),
});

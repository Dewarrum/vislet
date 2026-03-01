"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function formatPurchaseDate(purchaseDate: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(purchaseDate);
}

function formatAmount(amount: number, currency: string) {
  if (/^[A-Z]{3}$/.test(currency)) {
    try {
      return new Intl.NumberFormat("en-US", {
        currency,
        style: "currency",
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  return amount.toFixed(2);
}

function toDateInputValue(date: Date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function parseDateInput(dateInput: string) {
  if (!dateInput) {
    return null;
  }

  const [yearString, monthString, dayString] = dateInput.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (!year || !month || !day) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
}

export default function TransactionsPage() {
  const transactions = useQuery(api.transactions.listForCurrentUser);
  const accounts = useQuery(api.bankAccounts.listForCurrentUser);
  const categories = useQuery(api.categories.listForCurrentUser, {});
  const createTransaction = useMutation(api.transactions.create);
  const renameTransaction = useMutation(api.transactions.rename);
  const removeTransaction = useMutation(api.transactions.remove);

  const [newAccountId, setNewAccountId] = useState<Id<"bankAccounts"> | "">("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<Id<"categories"> | "">("");
  const [newName, setNewName] = useState("");
  const [newPurchaseDate, setNewPurchaseDate] = useState(() =>
    toDateInputValue(new Date()),
  );
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transactionRows = useMemo(() => transactions ?? [], [transactions]);
  const accountOptions = useMemo(() => accounts ?? [], [accounts]);
  const categoryOptions = useMemo(() => categories ?? [], [categories]);

  useEffect(() => {
    if (!newAccountId && accountOptions.length > 0) {
      setNewAccountId(accountOptions[0]._id);
    }
  }, [newAccountId, accountOptions]);

  useEffect(() => {
    if (!newCategoryId && categoryOptions.length > 0) {
      setNewCategoryId(categoryOptions[0]._id);
    }
  }, [newCategoryId, categoryOptions]);

  const onCreate = async () => {
    const trimmedName = newName.trim();
    const parsedAmount = Number(newAmount);
    const parsedPurchaseDate = parseDateInput(newPurchaseDate);

    if (!newAccountId) {
      setErrorMessage("Select a bank account first.");
      return;
    }

    if (!Number.isFinite(parsedAmount)) {
      setErrorMessage("Amount must be a valid number.");
      return;
    }

    if (!newCategoryId) {
      setErrorMessage("Select a category first.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Transaction name is required.");
      return;
    }

    if (parsedPurchaseDate === null) {
      setErrorMessage("Purchase date is required.");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      await createTransaction({
        accountId: newAccountId,
        amount: parsedAmount,
        categoryId: newCategoryId,
        name: trimmedName,
        purchaseDate: parsedPurchaseDate,
      });

      setNewAmount("");
      setNewName("");
    } catch {
      setErrorMessage("Could not create the transaction. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const onRename = async (transactionId: Id<"transactions">, currentName: string) => {
    const draftName = draftNames[transactionId]?.trim();

    if (!draftName || draftName === currentName) {
      return;
    }

    setSavingId(transactionId);
    setErrorMessage(null);

    try {
      await renameTransaction({
        name: draftName,
        transactionId,
      });
    } catch {
      setErrorMessage("Could not rename the transaction. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (transactionId: Id<"transactions">, transactionName: string) => {
    const confirmed = window.confirm(
      `Delete the transaction "${transactionName}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(transactionId);
    setErrorMessage(null);

    try {
      await removeTransaction({ transactionId });
      setDraftNames((previous) => {
        const next = { ...previous };
        delete next[transactionId];
        return next;
      });
    } catch {
      setErrorMessage("Could not delete the transaction. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const canCreate =
    !isCreating &&
    accountOptions.length > 0 &&
    categoryOptions.length > 0 &&
    newName.trim().length > 0 &&
    newAmount.trim().length > 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Record transactions and edit transaction names.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a transaction</CardTitle>
          <CardDescription>
            Each transaction stores account id, amount, category id, name, and
            purchase date.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-3 px-6 pb-6 md:grid-cols-6 md:items-end">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="new-transaction-account">Account</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="new-transaction-account"
              onChange={(event) =>
                setNewAccountId(event.target.value as Id<"bankAccounts">)
              }
              value={newAccountId}
            >
              {accountOptions.length === 0 ? (
                <option value="">No accounts</option>
              ) : null}
              {accountOptions.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="new-transaction-amount">Amount</Label>
            <Input
              id="new-transaction-amount"
              onChange={(event) => setNewAmount(event.target.value)}
              placeholder="25.50"
              type="number"
              value={newAmount}
            />
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="new-transaction-category">Category</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="new-transaction-category"
              onChange={(event) =>
                setNewCategoryId(event.target.value as Id<"categories">)
              }
              value={newCategoryId}
            >
              {categoryOptions.length === 0 ? (
                <option value="">No categories</option>
              ) : null}
              {categoryOptions.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="new-transaction-name">Name</Label>
            <Input
              id="new-transaction-name"
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Coffee"
              value={newName}
            />
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="new-transaction-purchase-date">Purchase date</Label>
            <Input
              id="new-transaction-purchase-date"
              onChange={(event) => setNewPurchaseDate(event.target.value)}
              type="date"
              value={newPurchaseDate}
            />
          </div>

          <Button disabled={!canCreate} onClick={onCreate}>
            {isCreating ? "Creating..." : "Create transaction"}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your transactions</CardTitle>
          <CardDescription>
            You can edit each transaction name and delete any transaction.
          </CardDescription>
        </CardHeader>

        <div className="px-6 pb-6">
          {transactions === undefined || accounts === undefined || categories === undefined ? (
            <p className="text-sm text-slate-600">Loading transactions...</p>
          ) : transactionRows.length === 0 ? (
            <p className="text-sm text-slate-600">No transactions found yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Account currency</TableHead>
                  <TableHead>Account name</TableHead>
                  <TableHead>Category name</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Purchase date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionRows.map((transaction) => {
                  const draftName =
                    draftNames[transaction._id] ?? transaction.name;
                  const isSaving = savingId === transaction._id;
                  const isDeleting = deletingId === transaction._id;
                  const canSave =
                    draftName.trim().length > 0 &&
                    draftName.trim() !== transaction.name &&
                    !isSaving &&
                    !isDeleting;

                  return (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        {formatAmount(
                          transaction.amount,
                          transaction.accountCurrency,
                        )}
                      </TableCell>
                      <TableCell>{transaction.accountCurrency}</TableCell>
                      <TableCell>{transaction.accountName}</TableCell>
                      <TableCell>{transaction.categoryName}</TableCell>
                      <TableCell className="w-[22%] min-w-[220px]">
                        <Input
                          aria-label={`Name for ${transaction._id}`}
                          onChange={(event) =>
                            setDraftNames((previous) => ({
                              ...previous,
                              [transaction._id]: event.target.value,
                            }))
                          }
                          value={draftName}
                        />
                      </TableCell>
                      <TableCell>
                        {formatPurchaseDate(transaction.purchaseDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            disabled={!canSave}
                            onClick={() =>
                              onRename(transaction._id, transaction.name)
                            }
                            size="sm"
                            variant="outline"
                          >
                            {isSaving ? "Saving..." : "Save name"}
                          </Button>
                          <Button
                            disabled={isDeleting || isSaving}
                            onClick={() =>
                              onDelete(transaction._id, transaction.name)
                            }
                            size="sm"
                            variant="destructive-outline"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CreateTransactionDialog } from "@/components/create-transaction-dialog";
import type { CreateTransactionInput } from "@/components/create-transaction-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
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

type TransactionType = "expense" | "income";

export default function TransactionsPage() {
  const transactions = useQuery(api.transactions.listForCurrentUser);
  const accounts = useQuery(api.bankAccounts.listForCurrentUser);
  const categories = useQuery(api.categories.listForCurrentUser, {});
  const createTransaction = useMutation(api.transactions.create);
  const renameTransaction = useMutation(api.transactions.rename);
  const changeTransactionType = useMutation(api.transactions.changeType);
  const removeTransaction = useMutation(api.transactions.remove);

  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [switchingTypeId, setSwitchingTypeId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transactionRows = useMemo(() => transactions ?? [], [transactions]);
  const accountOptions = useMemo(() => accounts ?? [], [accounts]);
  const categoryOptions = useMemo(() => categories ?? [], [categories]);
  const onCreate = async (input: CreateTransactionInput) => {
    setErrorMessage(null);

    try {
      await createTransaction(input);
    } catch {
      setErrorMessage("Could not create the transaction. Please try again.");
      throw new Error("Could not create the transaction. Please try again.");
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

  const onChangeType = async (
    transactionId: Id<"transactions">,
    currentType: TransactionType,
  ) => {
    const nextType: TransactionType =
      currentType === "expense" ? "income" : "expense";

    setSwitchingTypeId(transactionId);
    setErrorMessage(null);

    try {
      await changeTransactionType({
        transactionId,
        type: nextType,
      });
    } catch {
      setErrorMessage("Could not change the transaction type. Please try again.");
    } finally {
      setSwitchingTypeId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Record transactions and edit transaction names.
          </p>
        </div>
        <CreateTransactionDialog
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          onCreate={onCreate}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your transactions</CardTitle>
          <CardDescription>
            You can edit names, click a type badge to switch between expense and
            income, and delete transactions.
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
                  <TableHead>Type</TableHead>
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
                  const isSwitchingType = switchingTypeId === transaction._id;
                  const isDeleting = deletingId === transaction._id;
                  const isExpense = transaction.amount < 0;
                  const currentType: TransactionType = isExpense
                    ? "expense"
                    : "income";
                  const nextTypeLabel = isExpense ? "Income" : "Expense";
                  const canSave =
                    draftName.trim().length > 0 &&
                    draftName.trim() !== transaction.name &&
                    !isSaving &&
                    !isDeleting &&
                    !isSwitchingType;

                  return (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <Menu>
                          <MenuTrigger className="inline-flex cursor-pointer appearance-none rounded-sm border-0 bg-transparent p-0 text-inherit outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background">
                            <Badge
                              size="sm"
                              variant={isExpense ? "error" : "success"}
                            >
                              {isExpense ? "Expense" : "Income"}
                            </Badge>
                          </MenuTrigger>
                          <MenuPopup align="start">
                            <MenuItem
                              disabled={isSwitchingType || isSaving || isDeleting}
                              onClick={() =>
                                onChangeType(transaction._id, currentType)
                              }
                            >
                              {isSwitchingType
                                ? "Switching..."
                                : `Switch to ${nextTypeLabel}`}
                            </MenuItem>
                          </MenuPopup>
                        </Menu>
                      </TableCell>
                      <TableCell>
                        {formatAmount(
                          Math.abs(transaction.amount),
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
                            disabled={isDeleting || isSaving || isSwitchingType}
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

"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { PencilIcon } from "lucide-react";
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
  const changeTransactionAmount = useMutation(api.transactions.changeAmount);
  const changeTransactionCategory = useMutation(api.transactions.changeCategory);
  const changeTransactionAccount = useMutation(api.transactions.changeAccount);
  const removeTransaction = useMutation(api.transactions.remove);

  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [draftAmounts, setDraftAmounts] = useState<Record<string, string>>({});
  const [editingNameId, setEditingNameId] = useState<Id<"transactions"> | null>(
    null,
  );
  const [savingNameId, setSavingNameId] = useState<Id<"transactions"> | null>(
    null,
  );
  const [editingAmountId, setEditingAmountId] = useState<Id<"transactions"> | null>(
    null,
  );
  const [savingAmountId, setSavingAmountId] = useState<Id<"transactions"> | null>(
    null,
  );
  const [switchingTypeId, setSwitchingTypeId] = useState<Id<"transactions"> | null>(
    null,
  );
  const [switchingAccountId, setSwitchingAccountId] = useState<
    Id<"transactions"> | null
  >(null);
  const [switchingCategoryId, setSwitchingCategoryId] = useState<
    Id<"transactions"> | null
  >(null);
  const [deletingId, setDeletingId] = useState<Id<"transactions"> | null>(null);
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

  const onStartNameEdit = (
    transactionId: Id<"transactions">,
    currentName: string,
  ) => {
    setEditingNameId(transactionId);
    setErrorMessage(null);
    setDraftNames((previous) => ({
      ...previous,
      [transactionId]: currentName,
    }));
  };

  const onCancelNameEdit = (transactionId: Id<"transactions">) => {
    setEditingNameId((previous) => (previous === transactionId ? null : previous));
    setDraftNames((previous) => {
      const next = { ...previous };
      delete next[transactionId];
      return next;
    });
  };

  const onSaveName = async (
    transactionId: Id<"transactions">,
    currentName: string,
  ) => {
    const draftName = draftNames[transactionId]?.trim() ?? "";

    if (!draftName) {
      setErrorMessage("Name cannot be empty.");
      return;
    }

    if (draftName === currentName) {
      onCancelNameEdit(transactionId);
      return;
    }

    setSavingNameId(transactionId);
    setErrorMessage(null);

    try {
      await renameTransaction({
        name: draftName,
        transactionId,
      });
      onCancelNameEdit(transactionId);
    } catch {
      setErrorMessage("Could not rename the transaction. Please try again.");
    } finally {
      setSavingNameId(null);
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
      setDraftAmounts((previous) => {
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

  const onStartAmountEdit = (
    transactionId: Id<"transactions">,
    currentAmount: number,
  ) => {
    setEditingAmountId(transactionId);
    setErrorMessage(null);
    setDraftAmounts((previous) => ({
      ...previous,
      [transactionId]: Math.abs(currentAmount).toString(),
    }));
  };

  const onCancelAmountEdit = (transactionId: Id<"transactions">) => {
    setEditingAmountId((previous) =>
      previous === transactionId ? null : previous,
    );
    setDraftAmounts((previous) => {
      const next = { ...previous };
      delete next[transactionId];
      return next;
    });
  };

  const onSaveAmount = async (
    transactionId: Id<"transactions">,
    currentAmount: number,
  ) => {
    const draftAmount = draftAmounts[transactionId]?.trim() ?? "";
    const parsedAmount = Number(draftAmount);

    if (!draftAmount || !Number.isFinite(parsedAmount)) {
      setErrorMessage("Amount must be a valid number.");
      return;
    }

    const nextAmount =
      currentAmount < 0 ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

    if (nextAmount === currentAmount) {
      onCancelAmountEdit(transactionId);
      return;
    }

    setSavingAmountId(transactionId);
    setErrorMessage(null);

    try {
      await changeTransactionAmount({
        amount: nextAmount,
        transactionId,
      });
      onCancelAmountEdit(transactionId);
    } catch {
      setErrorMessage("Could not change the transaction amount. Please try again.");
    } finally {
      setSavingAmountId(null);
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

  const onChangeCategory = async (
    transactionId: Id<"transactions">,
    currentCategoryId: Id<"categories">,
    nextCategoryId: Id<"categories">,
  ) => {
    if (currentCategoryId === nextCategoryId) {
      return;
    }

    setSwitchingCategoryId(transactionId);
    setErrorMessage(null);

    try {
      await changeTransactionCategory({
        categoryId: nextCategoryId,
        transactionId,
      });
    } catch {
      setErrorMessage("Could not change the transaction category. Please try again.");
    } finally {
      setSwitchingCategoryId(null);
    }
  };

  const onChangeAccount = async (
    transactionId: Id<"transactions">,
    currentAccountId: Id<"bankAccounts">,
    nextAccountId: Id<"bankAccounts">,
  ) => {
    if (currentAccountId === nextAccountId) {
      return;
    }

    setSwitchingAccountId(transactionId);
    setErrorMessage(null);

    try {
      await changeTransactionAccount({
        accountId: nextAccountId,
        transactionId,
      });
    } catch {
      setErrorMessage("Could not change the transaction account. Please try again.");
    } finally {
      setSwitchingAccountId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-4">
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
            You can edit names and amounts, click a type badge to switch between
            expense and income, click account/category badges to reassign them,
            and delete transactions.
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
                  const isEditingName = editingNameId === transaction._id;
                  const isSavingName = savingNameId === transaction._id;
                  const isEditingAmount = editingAmountId === transaction._id;
                  const isSavingAmount = savingAmountId === transaction._id;
                  const isSwitchingType = switchingTypeId === transaction._id;
                  const isSwitchingAccount =
                    switchingAccountId === transaction._id;
                  const isSwitchingCategory =
                    switchingCategoryId === transaction._id;
                  const isDeleting = deletingId === transaction._id;
                  const isExpense = transaction.amount < 0;
                  const currentType: TransactionType = isExpense
                    ? "expense"
                    : "income";
                  const nextTypeLabel = isExpense ? "Income" : "Expense";
                  const draftAmountValue =
                    draftAmounts[transaction._id] ??
                    Math.abs(transaction.amount).toString();
                  const draftNameValue =
                    draftNames[transaction._id] ?? transaction.name;
                  const trimmedDraftName = draftNameValue.trim();
                  const trimmedDraftAmount = draftAmountValue.trim();
                  const parsedDraftAmount = Number(trimmedDraftAmount);
                  const isDraftAmountValid =
                    trimmedDraftAmount.length > 0 &&
                    Number.isFinite(parsedDraftAmount);
                  const nextSignedAmount = isExpense
                    ? -Math.abs(parsedDraftAmount)
                    : Math.abs(parsedDraftAmount);
                  const canSaveAmount =
                    !isSavingAmount &&
                    isDraftAmountValid &&
                    nextSignedAmount !== transaction.amount;
                  const formattedAmount = formatAmount(
                    Math.abs(transaction.amount),
                    transaction.accountCurrency,
                  );
                  const canSaveName =
                    !isSavingName &&
                    trimmedDraftName.length > 0 &&
                    trimmedDraftName !== transaction.name;

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
                              disabled={
                                isEditingName ||
                                isSavingName ||
                                isEditingAmount ||
                                isSavingAmount ||
                                isSwitchingType ||
                                isSwitchingAccount ||
                                isSwitchingCategory ||
                                isDeleting
                              }
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
                      <TableCell className="w-[260px] min-w-[260px]">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2">
                          {isEditingAmount ? (
                            <Input
                              aria-label={`Amount for ${transaction._id}`}
                              className="w-full min-w-0"
                              disabled={isSavingAmount}
                              onChange={(event) =>
                                setDraftAmounts((previous) => ({
                                  ...previous,
                                  [transaction._id]: event.target.value,
                                }))
                              }
                              value={draftAmountValue}
                            />
                          ) : (
                            <span className="truncate">{formattedAmount}</span>
                          )}
                          <Button
                            aria-label={`Edit amount for ${transaction._id}`}
                            className={isEditingAmount ? "invisible" : "justify-self-end"}
                            disabled={
                              isEditingAmount ||
                              isEditingName ||
                              isSavingName ||
                              isSavingAmount ||
                              isSwitchingType ||
                              isSwitchingAccount ||
                              isSwitchingCategory ||
                              isDeleting
                            }
                            onClick={() =>
                              onStartAmountEdit(transaction._id, transaction.amount)
                            }
                            size="icon-xs"
                            variant="ghost"
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            className={isEditingAmount ? "justify-self-end" : "invisible justify-self-end"}
                            disabled={!isEditingAmount || !canSaveAmount}
                            onClick={() =>
                              onSaveAmount(transaction._id, transaction.amount)
                            }
                            size="xs"
                            variant="outline"
                          >
                            {isSavingAmount ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            className={isEditingAmount ? "justify-self-end" : "invisible justify-self-end"}
                            disabled={!isEditingAmount || isSavingAmount}
                            onClick={() => onCancelAmountEdit(transaction._id)}
                            size="xs"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.accountCurrency}</TableCell>
                      <TableCell>
                        <Menu>
                          <MenuTrigger className="inline-flex cursor-pointer appearance-none rounded-sm border-0 bg-transparent p-0 text-inherit outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background">
                            <Badge size="lg" variant="outline">
                              {transaction.accountName}
                            </Badge>
                          </MenuTrigger>
                          <MenuPopup align="start">
                            {accountOptions.length === 0 ? (
                              <MenuItem disabled>No accounts available</MenuItem>
                            ) : (
                              accountOptions.map((account) => {
                                const isCurrentAccount =
                                  account._id === transaction.accountId;

                                return (
                                  <MenuItem
                                    disabled={
                                      isEditingName ||
                                      isSavingName ||
                                      isEditingAmount ||
                                      isSavingAmount ||
                                      isSwitchingAccount ||
                                      isSwitchingCategory ||
                                      isSwitchingType ||
                                      isDeleting ||
                                      isCurrentAccount
                                    }
                                    key={account._id}
                                    onClick={() =>
                                      onChangeAccount(
                                        transaction._id,
                                        transaction.accountId,
                                        account._id,
                                      )
                                    }
                                  >
                                    {isCurrentAccount ? `${account.name} (Current)` : account.name}
                                  </MenuItem>
                                );
                              })
                            )}
                          </MenuPopup>
                        </Menu>
                      </TableCell>
                      <TableCell>
                        <Menu>
                          <MenuTrigger className="inline-flex cursor-pointer appearance-none rounded-sm border-0 bg-transparent p-0 text-inherit outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background">
                            <Badge size="lg" variant="outline">
                              {transaction.categoryName}
                            </Badge>
                          </MenuTrigger>
                          <MenuPopup align="start">
                            {categoryOptions.length === 0 ? (
                              <MenuItem disabled>No categories available</MenuItem>
                            ) : (
                              categoryOptions.map((category) => {
                                const isCurrentCategory =
                                  category._id === transaction.categoryId;

                                return (
                                  <MenuItem
                                    disabled={
                                      isEditingName ||
                                      isSavingName ||
                                      isEditingAmount ||
                                      isSavingAmount ||
                                      isSwitchingAccount ||
                                      isSwitchingCategory ||
                                      isSwitchingType ||
                                      isDeleting ||
                                      isCurrentCategory
                                    }
                                    key={category._id}
                                    onClick={() =>
                                      onChangeCategory(
                                        transaction._id,
                                        transaction.categoryId,
                                        category._id,
                                      )
                                    }
                                  >
                                    {isCurrentCategory ? `${category.name} (Current)` : category.name}
                                  </MenuItem>
                                );
                              })
                            )}
                          </MenuPopup>
                        </Menu>
                      </TableCell>
                      <TableCell className="w-[320px] min-w-[320px]">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2">
                          {isEditingName ? (
                            <Input
                              aria-label={`Name for ${transaction._id}`}
                              className="w-full min-w-0"
                              disabled={isSavingName}
                              onChange={(event) =>
                                setDraftNames((previous) => ({
                                  ...previous,
                                  [transaction._id]: event.target.value,
                                }))
                              }
                              value={draftNameValue}
                            />
                          ) : (
                            <span className="truncate">{transaction.name}</span>
                          )}
                          <Button
                            aria-label={`Edit name for ${transaction._id}`}
                            className={isEditingName ? "invisible" : "justify-self-end"}
                            disabled={
                              isEditingName ||
                              isSavingName ||
                              isEditingAmount ||
                              isSavingAmount ||
                              isSwitchingType ||
                              isSwitchingAccount ||
                              isSwitchingCategory ||
                              isDeleting
                            }
                            onClick={() =>
                              onStartNameEdit(transaction._id, transaction.name)
                            }
                            size="icon-xs"
                            variant="ghost"
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            className={isEditingName ? "justify-self-end" : "invisible justify-self-end"}
                            disabled={!isEditingName || !canSaveName}
                            onClick={() =>
                              onSaveName(transaction._id, transaction.name)
                            }
                            size="xs"
                            variant="outline"
                          >
                            {isSavingName ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            className={isEditingName ? "justify-self-end" : "invisible justify-self-end"}
                            disabled={!isEditingName || isSavingName}
                            onClick={() => onCancelNameEdit(transaction._id)}
                            size="xs"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPurchaseDate(transaction.purchaseDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            disabled={
                              isDeleting ||
                              isSavingName ||
                              isEditingName ||
                              isEditingAmount ||
                              isSavingAmount ||
                              isSwitchingType ||
                              isSwitchingAccount ||
                              isSwitchingCategory
                            }
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

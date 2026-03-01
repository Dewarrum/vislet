"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Id } from "@/convex/_generated/dataModel";

export type TransactionType = "expense" | "income";

export type CreateTransactionInput = {
  accountId: Id<"bankAccounts">;
  amount: number;
  categoryId: Id<"categories">;
  name: string;
  purchaseDate: number;
};

type AccountOption = {
  _id: Id<"bankAccounts">;
  name: string;
  currency: string;
  isDefault?: boolean;
};

type CategoryOption = {
  _id: Id<"categories">;
  name: string;
};

type CreateTransactionDialogProps = {
  accountOptions: AccountOption[];
  categoryOptions: CategoryOption[];
  onCreate: (input: CreateTransactionInput) => Promise<void>;
};

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

export function CreateTransactionDialog({ accountOptions, categoryOptions, onCreate }: CreateTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState<Id<"bankAccounts"> | "">("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | "">("");
  const [name, setName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => toDateInputValue(new Date()));
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultAccountId = useMemo(
    () =>
      accountOptions.find((account) => account.isDefault === true)?._id ??
      accountOptions[0]?._id ??
      "",
    [accountOptions],
  );

  useEffect(() => {
    if (accountOptions.length === 0) {
      if (accountId !== "") {
        setAccountId("");
      }
      return;
    }

    const isCurrentAccountValid = accountOptions.some(
      (account) => account._id === accountId,
    );

    if (!isCurrentAccountValid && defaultAccountId) {
      setAccountId(defaultAccountId);
    }
  }, [accountId, accountOptions, defaultAccountId]);

  useEffect(() => {
    if (!categoryId && categoryOptions.length > 0) {
      setCategoryId(categoryOptions[0]._id);
    }
  }, [categoryId, categoryOptions]);

  const canCreate =
    !isCreating &&
    accountOptions.length > 0 &&
    categoryOptions.length > 0 &&
    name.trim().length > 0 &&
    amount.trim().length > 0;

  const submit = async () => {
    const trimmedName = name.trim();
    const parsedAmount = Number(amount);
    const amountToSave =
      type === "income" ? parsedAmount : -Math.abs(parsedAmount);
    const parsedPurchaseDate = parseDateInput(purchaseDate);

    if (!accountId) {
      setErrorMessage("Select a bank account first.");
      return;
    }

    if (!Number.isFinite(parsedAmount)) {
      setErrorMessage("Amount must be a valid number.");
      return;
    }

    if (!categoryId) {
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
      await onCreate({
        accountId,
        amount: amountToSave,
        categoryId,
        name: trimmedName,
        purchaseDate: parsedPurchaseDate,
      });
      setAmount("");
      setName("");
      setOpen(false);
    } catch (error) {
      if (error instanceof Error && error.message.trim().length > 0) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not create the transaction. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setErrorMessage(null);
        }
      }}
      open={open}
    >
      <Button render={<DialogTrigger />} variant="default">
        New transaction
      </Button>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create a transaction</DialogTitle>
          <DialogDescription>
            Each transaction stores account id, amount, category id, name, and
            purchase date.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-transaction-account">Account</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="new-transaction-account"
                onChange={(event) =>
                  setAccountId(event.target.value as Id<"bankAccounts">)
                }
                value={accountId}
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

            <div className="space-y-2">
              <Label htmlFor="new-transaction-amount">Amount</Label>
              <Input
                id="new-transaction-amount"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="25.50"
                type="number"
                value={amount}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-transaction-type">Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="new-transaction-type"
                onChange={(event) =>
                  setType(event.target.value as TransactionType)
                }
                value={type}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-transaction-category">Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="new-transaction-category"
                onChange={(event) =>
                  setCategoryId(event.target.value as Id<"categories">)
                }
                value={categoryId}
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

            <div className="space-y-2">
              <Label htmlFor="new-transaction-name">Name</Label>
              <Input
                id="new-transaction-name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Coffee"
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-transaction-purchase-date">Purchase date</Label>
              <Input
                id="new-transaction-purchase-date"
                onChange={(event) => setPurchaseDate(event.target.value)}
                type="date"
                value={purchaseDate}
              />
            </div>
            {errorMessage ? (
              <p className="text-sm text-red-600 md:col-span-2">{errorMessage}</p>
            ) : null}
          </form>
        </DialogPanel>
        <DialogFooter variant="bare">
          <Button render={<DialogClose />} variant="outline">
            Cancel
          </Button>
          <Button disabled={!canCreate} onClick={() => void submit()}>
            {isCreating ? "Creating..." : "Create transaction"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

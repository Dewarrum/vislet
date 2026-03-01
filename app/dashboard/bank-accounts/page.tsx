"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CreateBankAccountDialog } from "@/components/create-bank-account-dialog";
import type { CreateBankAccountInput } from "@/components/create-bank-account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function formatCreatedAt(createdAt: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdAt);
}

export default function BankAccountsPage() {
  const accounts = useQuery(api.bankAccounts.listForCurrentUser);
  const createBankAccount = useMutation(api.bankAccounts.create);
  const renameBankAccount = useMutation(api.bankAccounts.rename);
  const setDefaultBankAccount = useMutation(api.bankAccounts.setDefault);
  const removeBankAccount = useMutation(api.bankAccounts.remove);

  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const accountRows = useMemo(() => accounts ?? [], [accounts]);

  const onRename = async (accountId: Id<"bankAccounts">, currentName: string) => {
    const draftName = draftNames[accountId]?.trim();

    if (!draftName || draftName === currentName) {
      return;
    }

    setSavingId(accountId);
    setErrorMessage(null);

    try {
      await renameBankAccount({
        accountId,
        name: draftName,
      });
    } catch {
      setErrorMessage("Could not rename the bank account. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const onCreate = async (input: CreateBankAccountInput) => {
    setErrorMessage(null);

    try {
      await createBankAccount(input);
    } catch {
      setErrorMessage("Could not create the bank account. Please try again.");
      throw new Error("Could not create the bank account. Please try again.");
    }
  };

  const onDelete = async (accountId: Id<"bankAccounts">, accountName: string) => {
    const confirmed = window.confirm(
      `Delete the bank account "${accountName}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(accountId);
    setErrorMessage(null);

    try {
      await removeBankAccount({ accountId });
      setDraftNames((previous) => {
        const next = { ...previous };
        delete next[accountId];
        return next;
      });
    } catch {
      setErrorMessage("Could not delete the bank account. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const onSetDefault = async (accountId: Id<"bankAccounts">) => {
    setSettingDefaultId(accountId);
    setErrorMessage(null);

    try {
      await setDefaultBankAccount({ accountId });
    } catch {
      setErrorMessage("Could not set the default bank account. Please try again.");
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Bank accounts
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review your accounts and update account names.
          </p>
        </div>
        <CreateBankAccountDialog onCreate={onCreate} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your accounts</CardTitle>
          <CardDescription>
            Each account stores an id, editable name, created timestamp,
            currency, and optional default status.
          </CardDescription>
        </CardHeader>

        <div className="px-6 pb-6">
          {accounts === undefined ? (
            <p className="text-sm text-slate-600">Loading bank accounts...</p>
          ) : accountRows.length === 0 ? (
            <p className="text-sm text-slate-600">
              No bank accounts found yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Created at</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountRows.map((account) => {
                  const draftName = draftNames[account._id] ?? account.name;
                  const isSaving = savingId === account._id;
                  const isSettingDefault = settingDefaultId === account._id;
                  const isDeleting = deletingId === account._id;
                  const isDefault = account.isDefault === true;
                  const canSave =
                    draftName.trim().length > 0 &&
                    draftName.trim() !== account.name &&
                    !isSaving &&
                    !isDeleting &&
                    !isSettingDefault;

                  return (
                    <TableRow key={account._id}>
                      <TableCell className="w-[30%] min-w-[220px]">
                        <Input
                          aria-label={`Name for ${account._id}`}
                          onChange={(event) =>
                            setDraftNames((previous) => ({
                              ...previous,
                              [account._id]: event.target.value,
                            }))
                          }
                          value={draftName}
                        />
                      </TableCell>
                      <TableCell>
                        {isDefault ? (
                          <Badge size="sm" variant="success">
                            Default
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-500">No</span>
                        )}
                      </TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>{formatCreatedAt(account.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {account._id}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            disabled={!canSave}
                            onClick={() => onRename(account._id, account.name)}
                            size="sm"
                            variant="outline"
                          >
                            {isSaving ? "Saving..." : "Save name"}
                          </Button>
                          <Button
                            disabled={isDefault || isDeleting || isSaving || isSettingDefault}
                            onClick={() => onSetDefault(account._id)}
                            size="sm"
                            variant="outline"
                          >
                            {isSettingDefault ? "Setting..." : "Set default"}
                          </Button>
                          <Button
                            disabled={isDeleting || isSaving || isSettingDefault}
                            onClick={() => onDelete(account._id, account.name)}
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

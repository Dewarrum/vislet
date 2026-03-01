"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ExpenseBreakdownPieCard from "@/components/expense-breakdown-pie-card";
import MonthlyExpensesBarCard from "@/components/monthly-expenses-bar-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";

export default function DashboardPage() {
  const accounts = useQuery(api.bankAccounts.listForCurrentUser);
  const accountOptions = useMemo(() => accounts ?? [], [accounts]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<
    Array<Id<"bankAccounts">>
  >([]);

  const accountIds = useMemo(
    () => accountOptions.map((account) => account._id),
    [accountOptions],
  );
  const accountById = useMemo(
    () => new Map(accountOptions.map((account) => [account._id, account])),
    [accountOptions],
  );
  const defaultSelectedAccountIds = useMemo(() => {
    if (accountOptions.length === 0) {
      return [];
    }

    const explicitDefaultId = accountOptions.find(
      (account) => account.isDefault === true,
    )?._id;

    if (explicitDefaultId) {
      return [explicitDefaultId];
    }

    return [accountOptions[0]._id];
  }, [accountOptions]);
  const effectiveSelectedAccountIds = useMemo(() => {
    if (selectedAccountIds.length === 0) {
      return defaultSelectedAccountIds;
    }

    const accountIdSet = new Set(accountIds);
    const validSelectedIds = selectedAccountIds.filter((accountId) =>
      accountIdSet.has(accountId),
    );

    if (validSelectedIds.length === 0) {
      return defaultSelectedAccountIds;
    }

    const selectedCurrency = accountById.get(validSelectedIds[0])?.currency;

    if (!selectedCurrency) {
      return defaultSelectedAccountIds;
    }

    const sameCurrencyIds = validSelectedIds.filter(
      (accountId) => accountById.get(accountId)?.currency === selectedCurrency,
    );

    if (sameCurrencyIds.length === 0) {
      return defaultSelectedAccountIds;
    }

    return sameCurrencyIds;
  }, [
    accountById,
    accountIds,
    defaultSelectedAccountIds,
    selectedAccountIds,
  ]);
  const selectedCurrency =
    effectiveSelectedAccountIds.length > 0
      ? accountById.get(effectiveSelectedAccountIds[0])?.currency ?? null
      : null;
  const currentCurrencyAccountIds = useMemo(() => {
    if (!selectedCurrency) {
      return [];
    }

    return accountOptions
      .filter((account) => account.currency === selectedCurrency)
      .map((account) => account._id);
  }, [accountOptions, selectedCurrency]);
  const areAllAccountsSelected =
    accountOptions.length > 0 &&
    effectiveSelectedAccountIds.length === currentCurrencyAccountIds.length;
  const selectedAccountNames = useMemo(
    () =>
      accountOptions
        .filter((account) => effectiveSelectedAccountIds.includes(account._id))
        .map((account) => account.name),
    [accountOptions, effectiveSelectedAccountIds],
  );
  const selectedAccountsLabel = useMemo(() => {
    if (accountOptions.length === 0) {
      return "No accounts";
    }

    if (areAllAccountsSelected) {
      return `All ${selectedCurrency ?? ""} accounts`.trim();
    }

    if (selectedAccountNames.length === 1) {
      return selectedAccountNames[0];
    }

    return `${selectedAccountNames.length} accounts`;
  }, [
    accountOptions.length,
    areAllAccountsSelected,
    selectedAccountNames,
    selectedCurrency,
  ]);

  const onToggleAccount = (accountId: Id<"bankAccounts">) => {
    setSelectedAccountIds((previous) => {
      const account = accountById.get(accountId);

      if (!account) {
        return previous;
      }

      const baseSelectedIds = (previous.length === 0
        ? defaultSelectedAccountIds
        : previous
      ).filter((selectedId) => accountIds.includes(selectedId));

      if (baseSelectedIds.length === 0) {
        return defaultSelectedAccountIds;
      }

      const baseCurrency = accountById.get(baseSelectedIds[0])?.currency;
      if (baseCurrency && account.currency !== baseCurrency) {
        return [accountId];
      }

      const isSelected = baseSelectedIds.includes(accountId);

      if (isSelected) {
        if (baseSelectedIds.length === 1) {
          return baseSelectedIds;
        }

        return baseSelectedIds.filter((selectedId) => selectedId !== accountId);
      }

      return [...baseSelectedIds, accountId];
    });
  };

  const onSelectAllAccounts = () => {
    setSelectedAccountIds(currentCurrencyAccountIds);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Dashboard overview
      </h1>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Accounts
          </p>
          <Menu>
            <Button
              className="w-full justify-between"
              render={<MenuTrigger />}
              size="sm"
              variant="outline"
            >
              {selectedAccountsLabel}
            </Button>
            <MenuPopup align="start">
              <MenuItem
                disabled={areAllAccountsSelected || accountOptions.length === 0}
                onClick={onSelectAllAccounts}
              >
                Select all {selectedCurrency ?? ""} accounts
              </MenuItem>
              <MenuSeparator />
              {accountOptions.length === 0 ? (
                <MenuItem disabled>No bank accounts</MenuItem>
              ) : (
                accountOptions.map((account) => {
                  const isSelected = effectiveSelectedAccountIds.includes(
                    account._id,
                  );
                  const isLastSelected =
                    isSelected && effectiveSelectedAccountIds.length === 1;

                  return (
                    <MenuCheckboxItem
                      checked={isSelected}
                      disabled={isLastSelected}
                      key={account._id}
                      onCheckedChange={() => onToggleAccount(account._id)}
                    >
                      {account.name} ({account.currency})
                    </MenuCheckboxItem>
                  );
                })
              )}
            </MenuPopup>
          </Menu>
        </div>
      </div>
      <ExpenseBreakdownPieCard selectedAccountIds={effectiveSelectedAccountIds} />
      <MonthlyExpensesBarCard selectedAccountIds={effectiveSelectedAccountIds} />
      <Card>
        <CardHeader>
          <CardTitle>Bank accounts</CardTitle>
          <CardDescription>
            Manage and review your connected bank accounts.
          </CardDescription>
          <div className="pt-2">
            <Button render={<Link href="/dashboard/bank-accounts" />}>
              Open bank accounts
            </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Create and maintain your expense categories.
          </CardDescription>
          <div className="pt-2">
            <Button render={<Link href="/dashboard/categories" />} variant="outline">
              Open categories
            </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Track transaction activity and maintain transaction names.
          </CardDescription>
          <div className="pt-2">
            <Button
              render={<Link href="/dashboard/transactions" />}
              variant="outline"
            >
              Open transactions
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

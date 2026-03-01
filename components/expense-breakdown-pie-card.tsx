"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
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

const CHART_COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#3b82f6",
] as const;

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ExpenseBreakdownPieCard() {
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

    const defaultCurrency = accountOptions[0].currency;
    return accountOptions
      .filter((account) => account.currency === defaultCurrency)
      .map((account) => account._id);
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

  const queryArgs = useMemo(() => {
    return {
      accountIds: effectiveSelectedAccountIds,
    };
  }, [effectiveSelectedAccountIds]);
  const expenseBreakdown = useQuery(
    api.transactions.expenseBreakdownByCategory,
    queryArgs,
  );

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

  const chartData = useMemo(() => {
    const rows = expenseBreakdown ?? [];
    const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);

    return rows.map((row, index) => ({
      ...row,
      fill: CHART_COLORS[index % CHART_COLORS.length],
      percentage: totalAmount > 0 ? (row.totalAmount / totalAmount) * 100 : 0,
    }));
  }, [expenseBreakdown]);

  const totalAmount = useMemo(
    () => chartData.reduce((sum, row) => sum + row.totalAmount, 0),
    [chartData],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by category</CardTitle>
        <CardDescription>
          Expense totals are grouped by category using absolute transaction
          amounts and filtered by selected bank account(s). You can select
          multiple accounts only when they share the same currency.
        </CardDescription>
        <CardAction>
          <Menu>
            <Button render={<MenuTrigger />} size="sm" variant="outline">
              Accounts: {selectedAccountsLabel}
            </Button>
            <MenuPopup align="end">
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
        </CardAction>
      </CardHeader>
      <CardContent>
        {expenseBreakdown === undefined ? (
          <p className="text-sm text-slate-600">Loading expense breakdown...</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-slate-600">
            No expense transactions found yet.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="totalAmount"
                    innerRadius={62}
                    nameKey="categoryName"
                    outerRadius={118}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {chartData.map((row) => (
                      <Cell key={row.categoryId} fill={row.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      formatAmount(value ?? 0)
                    }
                    separator=": "
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total expenses
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatAmount(totalAmount)}
                </p>
              </div>
              <div className="space-y-2">
                {chartData.map((row) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                    key={row.categoryId}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: row.fill }}
                        />
                        <p className="truncate text-sm font-medium text-slate-900">
                          {row.categoryName}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {row.transactionCount} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatAmount(row.totalAmount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

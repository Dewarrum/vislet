"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

type ExpenseBreakdownPieCardProps = {
  monthRange: number;
  selectedAccountIds: Array<Id<"bankAccounts">>;
};

export default function ExpenseBreakdownPieCard({
  monthRange,
  selectedAccountIds,
}: ExpenseBreakdownPieCardProps) {
  const queryArgs = useMemo(
    () => ({
      accountIds: selectedAccountIds,
      monthCount: monthRange,
    }),
    [monthRange, selectedAccountIds],
  );
  const expenseBreakdown = useQuery(
    api.transactions.expenseBreakdownByCategory,
    queryArgs,
  );

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
          amounts and filtered by the shared dashboard account and date-range
          filters.
        </CardDescription>
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

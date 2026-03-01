"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

const yAxisFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

type MonthlyExpensesBarCardProps = {
  monthRange: number;
  selectedAccountIds: Array<Id<"bankAccounts">>;
};

export default function MonthlyExpensesBarCard({
  monthRange,
  selectedAccountIds,
}: MonthlyExpensesBarCardProps) {
  const queryArgs = useMemo(
    () => ({
      accountIds: selectedAccountIds,
      monthCount: monthRange,
    }),
    [monthRange, selectedAccountIds],
  );
  const monthlyExpenses = useQuery(
    api.transactions.expenseTotalsByMonthLastSixMonths,
    queryArgs,
  );
  const chartData = useMemo(() => monthlyExpenses ?? [], [monthlyExpenses]);
  const totalSpent = useMemo(
    () => chartData.reduce((sum, row) => sum + row.totalAmount, 0),
    [chartData],
  );
  const hasSpending = useMemo(
    () => chartData.some((row) => row.totalAmount > 0),
    [chartData],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly expenses</CardTitle>
        <CardDescription>
          Amount spent each month for the selected range.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {monthlyExpenses === undefined ? (
          <p className="text-sm text-slate-600">Loading monthly expenses...</p>
        ) : !hasSpending ? (
          <p className="text-sm text-slate-600">
            No expense transactions found in this date range.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis tickFormatter={(value: number) => yAxisFormatter.format(value)} />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      formatAmount(value ?? 0)
                    }
                    separator=": "
                  />
                  <Bar dataKey="totalAmount" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Total spend ({monthRange} months)
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {formatAmount(totalSpent)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

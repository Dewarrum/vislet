"use client";

import { useMemo, useState } from "react";
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
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
} from "@/components/ui/select";

const MONTH_RANGE_OPTIONS = [3, 6, 9, 12] as const;

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
  selectedAccountIds: Array<Id<"bankAccounts">>;
};

export default function MonthlyExpensesBarCard({
  selectedAccountIds,
}: MonthlyExpensesBarCardProps) {
  const [monthRange, setMonthRange] = useState<number>(6);
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
        <CardAction className="w-[180px]">
          <Select
            onValueChange={(value) => setMonthRange(Number(value))}
            value={monthRange.toString()}
          >
            <SelectTrigger size="sm">
              Last {monthRange} months
            </SelectTrigger>
            <SelectPopup>
              {MONTH_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  Last {option} months
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {monthlyExpenses === undefined ? (
          <p className="text-sm text-slate-600">Loading monthly expenses...</p>
        ) : !hasSpending ? (
          <p className="text-sm text-slate-600">
            No expense transactions found in this date range.
          </p>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 20, right: 8, top: 8 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis
                  tickFormatter={(value: number) => yAxisFormatter.format(value)}
                  tickMargin={8}
                  width={90}
                />
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
        )}
      </CardContent>
    </Card>
  );
}

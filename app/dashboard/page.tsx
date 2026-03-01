import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Dashboard overview
      </h1>
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

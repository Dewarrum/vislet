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
    </div>
  );
}

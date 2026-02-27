"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  ArrowRightIcon,
  BarChart3Icon,
  Clock3Icon,
  ShieldCheckIcon,
  WalletIcon,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Clear visual summaries",
    description:
      "Understand your spending patterns at a glance with focused, interactive charts.",
    icon: BarChart3Icon,
  },
  {
    title: "Fast daily logging",
    description:
      "Capture expenses quickly so tracking becomes a habit instead of a chore.",
    icon: Clock3Icon,
  },
  {
    title: "Budget awareness",
    description:
      "Stay aligned with your goals using budget categories and progress tracking.",
    icon: WalletIcon,
  },
  {
    title: "Private by default",
    description:
      "Your expense data is protected and available only after authentication.",
    icon: ShieldCheckIcon,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.18),transparent_40%),linear-gradient(to_bottom,#fff7ed,white)]">
      <header className="border-b border-slate-200/80 bg-white/75 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Vislet
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Smart Expense Tracking
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton forceRedirectUrl="/dashboard" mode="redirect">
                <Button>
                  Sign in to dashboard
                  <ArrowRightIcon />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button render={<Link href="/dashboard" />} variant="outline">
                Open dashboard
                <ArrowRightIcon />
              </Button>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
        <section className="grid items-center gap-8 rounded-3xl border border-slate-200/70 bg-white/70 p-8 shadow-sm backdrop-blur lg:grid-cols-2">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Built for clarity
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Know exactly where your money goes.
            </h2>
            <p className="max-w-xl text-base text-slate-600 sm:text-lg">
              Vislet helps you track expenses, organize categories, and understand trends with clean, visual reporting.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <SignedOut>
                <SignInButton forceRedirectUrl="/dashboard" mode="redirect">
                  <Button size="lg">
                    Sign in to get started
                    <ArrowRightIcon />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Button render={<Link href="/dashboard" />} size="lg">
                  Open your dashboard
                  <ArrowRightIcon />
                </Button>
              </SignedIn>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Why people use Vislet</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Replace scattered notes and spreadsheets with one clear system.</li>
              <li>Understand spending behavior before it becomes a problem.</li>
              <li>Stay consistent with lightweight daily tracking.</li>
              <li>Make better money decisions from visual insight, not guesswork.</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-2 inline-flex w-fit rounded-lg bg-slate-100 p-2">
                    <Icon className="size-5 text-slate-700" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>1. Connect your routine</CardTitle>
              <CardDescription>
                Log purchases as they happen and keep your records up to date.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2. Organize spending</CardTitle>
              <CardDescription>
                Group expenses by category so patterns are easy to spot.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>3. Act on insights</CardTitle>
              <CardDescription>
                Use visual trends to decide what to cut, keep, or optimize.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <Card className="border-teal-200/70 bg-teal-50/60">
          <CardHeader>
            <CardTitle>Ready to see your own dashboard?</CardTitle>
            <CardDescription>
              Sign in to access your protected expense tracking workspace.
            </CardDescription>
          </CardHeader>
          <CardPanel>
            <SignedOut>
              <SignInButton forceRedirectUrl="/dashboard" mode="redirect">
                <Button>
                  Sign in
                  <ArrowRightIcon />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button render={<Link href="/dashboard" />} variant="outline">
                Go to dashboard
                <ArrowRightIcon />
              </Button>
            </SignedIn>
          </CardPanel>
        </Card>
      </main>
    </div>
  );
}

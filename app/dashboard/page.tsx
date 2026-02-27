import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await currentUser();
  const userName =
    user?.firstName ??
    user?.username ??
    user?.emailAddresses[0]?.emailAddress ??
    "User";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
        Hello {userName}!
      </h1>
    </main>
  );
}

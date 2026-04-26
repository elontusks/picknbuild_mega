import Link from "next/link";
import { redirect } from "next/navigation";
import { loadSession } from "@/services/team-01-auth";

export default async function Home() {
  const session = await loadSession();

  if (session.state === "ready") redirect("/search");

  if (session.state === "anonymous") {
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          See every real path to your next car.
        </h1>
        <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          picknbuild compares dealer, auction, picknbuild, and private-seller
          paths side by side — with all-in pricing, your credit tier, and the
          actual barrier to entry. Sign up with your phone to get started.
        </p>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Log in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
        One quick step left.
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Tell us your ZIP, budget, and credit estimate so we can show real
        paths instead of generic ones.
      </p>
      <Link
        href="/onboarding"
        className="inline-flex h-11 items-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Finish setup
      </Link>
    </section>
  );
}

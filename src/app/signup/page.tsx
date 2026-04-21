import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">
          Create account
        </h1>

        <form action={signup} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Password</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            className="mt-2 h-10 rounded-md bg-black text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign up
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Have an account?{" "}
          <Link href="/login" className="font-medium text-black underline dark:text-zinc-50">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

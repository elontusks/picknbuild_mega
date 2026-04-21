import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md rounded-lg border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
          Account
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-medium text-black dark:text-zinc-50">{user?.email}</span>
        </p>

        <form action={logout}>
          <button
            type="submit"
            className="h-10 rounded-md border border-black/10 px-4 text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-zinc-50 dark:hover:bg-white/5"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

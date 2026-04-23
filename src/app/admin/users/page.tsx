import Link from "next/link";
import { listAllUsers, type AdminUserRow } from "@/lib/admin/users";
import type { UserRole } from "@/contracts";

type SearchParams = { role?: string };

const VALID_ROLES: UserRole[] = ["buyer", "dealer", "seller", "admin"];

const isRole = (raw: string | undefined): raw is UserRole =>
  Boolean(raw && (VALID_ROLES as string[]).includes(raw));

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const role = isRole(params.role) ? params.role : undefined;
  const users = await listAllUsers(role ? { role } : {});

  return (
    <section data-testid="admin-users" className="flex flex-col gap-3">
      <RoleFilter current={role} />
      <table className="w-full text-left text-sm" data-testid="admin-users-table">
        <thead className="text-xs text-zinc-500">
          <tr>
            <th className="pb-2">User</th>
            <th className="pb-2">Role</th>
            <th className="pb-2">ZIP</th>
            <th className="pb-2">Onboarded</th>
            <th className="pb-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </tbody>
      </table>
      {users.length === 0 ? (
        <p className="text-sm text-zinc-500">No users match this filter.</p>
      ) : null}
    </section>
  );
}

function RoleFilter({ current }: { current?: UserRole }) {
  const all: Array<{ href: string; label: string; active: boolean }> = [
    { href: "/admin/users", label: "All", active: !current },
    ...VALID_ROLES.map((r) => ({
      href: `/admin/users?role=${r}`,
      label: r,
      active: current === r,
    })),
  ];
  return (
    <div data-testid="admin-users-filter" className="flex flex-wrap gap-2 text-xs">
      {all.map((opt) => (
        <Link
          key={opt.href}
          href={opt.href}
          className={`rounded-full border px-3 py-1 ${
            opt.active
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}

function UserRow({ user }: { user: AdminUserRow }) {
  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-900">
      <td className="py-2">
        <Link
          href={`/admin/users/${user.id}`}
          className="underline underline-offset-2"
        >
          {user.displayName ?? user.email ?? user.id}
        </Link>
        {user.email ? (
          <div className="text-xs text-zinc-500">{user.email}</div>
        ) : null}
      </td>
      <td className="py-2">{user.role}</td>
      <td className="py-2">{user.zip ?? "—"}</td>
      <td className="py-2">{user.onboarded ? "yes" : "no"}</td>
      <td className="py-2 text-xs text-zinc-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

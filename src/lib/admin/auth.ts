import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@/contracts";
import { getCurrentUser } from "@/services/team-01-auth";

// Admin gate for every /admin route. Non-admins get kicked to /. Throws via
// redirect(); callers use it as the first line of an RSC, route handler, or
// server action — mirrors the shape of `requireUser` from Team 1.
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  return user;
}

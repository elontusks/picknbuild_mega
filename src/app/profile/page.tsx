import { redirect } from "next/navigation";
import { requireUser } from "@/services/team-01-auth";

export const dynamic = "force-dynamic";

/**
 * Routes the header + mobile nav's "Profile" link to the right profile kind
 * for the signed-in user. Buyers (and admins) land on /users, dealers on
 * /dealers, sellers on /sellers. The three pages live in separate Team 2
 * namespaces so routing can be statically analyzed.
 */
export default async function ProfileRedirectPage() {
  const user = await requireUser();
  switch (user.role) {
    case "dealer":
      redirect(`/dealers/${user.id}`);
    case "seller":
      redirect(`/sellers/${user.id}`);
    default:
      redirect(`/users/${user.id}`);
  }
}

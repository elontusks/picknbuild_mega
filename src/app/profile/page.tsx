import { redirect } from "next/navigation";
import { requireUser } from "@/services/team-01-auth";

export const dynamic = "force-dynamic";

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

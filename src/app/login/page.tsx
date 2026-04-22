import { redirect } from "next/navigation";
import { loadSession } from "@/services/team-01-auth";
import { PhoneAuthForm } from "../signup/phone-auth-form";

export default async function LoginPage() {
  const session = await loadSession();
  if (session.state === "ready") redirect("/");
  if (session.state === "needs-onboarding") redirect("/onboarding");
  return <PhoneAuthForm mode="login" />;
}

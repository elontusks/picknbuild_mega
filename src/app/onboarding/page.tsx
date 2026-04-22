import { redirect } from "next/navigation";
import { loadSession } from "@/services/team-01-auth";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await loadSession();
  if (session.state === "anonymous") redirect("/login");
  if (session.state === "ready") redirect("/");
  return <OnboardingWizard />;
}

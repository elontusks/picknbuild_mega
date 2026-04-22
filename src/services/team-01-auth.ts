import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  mapProfileToUser,
  type ProfileForUser,
} from "@/lib/auth/map-user";
import type { BestFitPreference, User } from "@/contracts";

const PROFILE_COLUMNS =
  "id, roles, phone, email, display_name, full_name, zip, budget, credit_score, no_credit, preferences, created_at, onboarded_at" as const;

export type AuthSessionState =
  | { state: "anonymous" }
  | { state: "needs-onboarding"; userId: string; phone: string }
  | { state: "ready"; user: User };

/**
 * Source of truth for "who is this request" on the server. Loads the auth
 * session, joins the profile row, and returns one of three flat states so
 * callers don't have to coordinate two queries.
 */
export async function loadSession(): Promise<AuthSessionState> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { state: "anonymous" };

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile) return { state: "anonymous" };

  const user = mapProfileToUser(profile as ProfileForUser, {
    id: authUser.id,
    phone: authUser.phone,
    email: authUser.email,
  });

  if (user) return { state: "ready", user };
  return {
    state: "needs-onboarding",
    userId: authUser.id,
    phone: profile.phone ?? authUser.phone ?? "",
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await loadSession();
  return session.state === "ready" ? session.user : null;
}

/**
 * Server gate for routes that require a fully-onboarded User. Mirrors the
 * `requireAuth` mentioned in §5 Team 1 publishes. Throws via redirect() so
 * callers can use it as the first line of an RSC or route handler.
 */
export async function requireUser(): Promise<User> {
  const session = await loadSession();
  if (session.state === "anonymous") redirect("/login");
  if (session.state === "needs-onboarding") redirect("/onboarding");
  return session.user;
}

export type StartPhoneOtpResult =
  | { ok: true }
  | { ok: false; error: string };

export async function startPhoneOtp(phone: string): Promise<StartPhoneOtpResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type VerifyPhoneOtpResult =
  | { ok: true; userId: string; needsOnboarding: boolean }
  | { ok: false; error: string };

export async function verifyPhoneOtp(
  phone: string,
  token: string,
): Promise<VerifyPhoneOtpResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "verification failed" };
  }

  // Stamp phone_verified_at so authz's verification.ts can clear `phoneVerified`.
  // The handle_new_user trigger created the profile row already; we just patch.
  const nowIso = new Date().toISOString();
  await supabase
    .from("profiles")
    .update({ phone, phone_verified_at: nowIso })
    .eq("id", data.user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", data.user.id)
    .maybeSingle();

  const needsOnboarding = !profile || !profile.zip;
  return { ok: true, userId: data.user.id, needsOnboarding };
}

export type OnboardingInput = {
  zip: string;
  budget?: number;
  creditScore?: number;
  noCredit?: boolean;
  displayName?: string;
  bestFit?: BestFitPreference;
  notifChannels?: string[];
};

export type OnboardingResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

export function validateOnboarding(input: Partial<OnboardingInput>): {
  ok: true;
  value: OnboardingInput;
} | { ok: false; error: string } {
  const zip = input.zip?.trim() ?? "";
  if (!/^\d{5}$/.test(zip)) {
    return { ok: false, error: "ZIP must be a 5-digit code." };
  }
  if (input.budget != null && (!Number.isFinite(input.budget) || input.budget < 0)) {
    return { ok: false, error: "Budget must be a non-negative number." };
  }
  if (input.creditScore != null) {
    if (!Number.isInteger(input.creditScore) || input.creditScore < 300 || input.creditScore > 850) {
      return { ok: false, error: "Credit score must be between 300 and 850." };
    }
  }
  if (input.noCredit && input.creditScore != null) {
    return { ok: false, error: "Choose either a credit score or No Credit, not both." };
  }
  if (input.bestFit && input.bestFit !== "lowestTotal" && input.bestFit !== "lowestMonthly") {
    return { ok: false, error: "Invalid bestFit preference." };
  }
  return {
    ok: true,
    value: {
      zip,
      ...(input.budget != null ? { budget: input.budget } : {}),
      ...(input.creditScore != null ? { creditScore: input.creditScore } : {}),
      ...(input.noCredit ? { noCredit: true } : {}),
      ...(input.displayName ? { displayName: input.displayName.trim() } : {}),
      bestFit: input.bestFit ?? "lowestTotal",
      notifChannels:
        Array.isArray(input.notifChannels) && input.notifChannels.length > 0
          ? input.notifChannels
          : ["in-app"],
    },
  };
}

export async function saveOnboarding(
  raw: Partial<OnboardingInput>,
): Promise<OnboardingResult> {
  const validated = validateOnboarding(raw);
  if (!validated.ok) return { ok: false, error: validated.error };
  const value = validated.value;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { ok: false, error: "Not signed in." };

  const update = {
    zip: value.zip,
    budget: value.budget ?? null,
    credit_score: value.creditScore ?? null,
    no_credit: value.noCredit ?? false,
    display_name: value.displayName ?? null,
    preferences: {
      bestFit: value.bestFit ?? "lowestTotal",
      notifChannels: value.notifChannels ?? ["in-app"],
    },
    onboarded_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", authUser.id);
  if (error) return { ok: false, error: error.message };

  const session = await loadSession();
  if (session.state !== "ready") {
    return { ok: false, error: "Profile saved but user not yet ready." };
  }
  return { ok: true, user: session.user };
}

export async function signOut(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

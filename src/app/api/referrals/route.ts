import { NextRequest, NextResponse } from "next/server";
import { loadSession } from "@/services/team-01-auth";

// In-memory per-process store. NOT persisted — counts reset when the dev
// server restarts. A real implementation would back this with a `referrals`
// Supabase table (see DROPPED.md note about referral system).
type ReferralRecord = {
  invitesSent: number;
  completedReferrals: number;
  earnedCredits: number;
  inviteCode: string;
  invitedEmails: string[];
};

const REFERRAL_STORE: Map<string, ReferralRecord> = new Map();

/**
 * Deterministic short code derived from the user id so the same user always
 * gets the same invite code within a process — looks "real" without persistence.
 */
function inviteCodeForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  // Base36, padded to 6 chars uppercased.
  return hash.toString(36).toUpperCase().slice(0, 6).padStart(6, "0");
}

function loadOrCreate(userId: string): ReferralRecord {
  const existing = REFERRAL_STORE.get(userId);
  if (existing) return existing;
  const fresh: ReferralRecord = {
    invitesSent: 0,
    completedReferrals: 0,
    earnedCredits: 0,
    inviteCode: inviteCodeForUser(userId),
    invitedEmails: [],
  };
  REFERRAL_STORE.set(userId, fresh);
  return fresh;
}

function publicView(record: ReferralRecord) {
  return {
    invitesSent: record.invitesSent,
    completedReferrals: record.completedReferrals,
    earnedCredits: record.earnedCredits,
    inviteCode: record.inviteCode,
  };
}

export async function GET() {
  const session = await loadSession();
  if (session.state !== "ready") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const record = loadOrCreate(session.user.id);
  return NextResponse.json(publicView(record));
}

export async function POST(req: NextRequest) {
  const session = await loadSession();
  if (session.state !== "ready") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { email?: unknown };
  try {
    body = (await req.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const record = loadOrCreate(session.user.id);
  if (!record.invitedEmails.includes(email.toLowerCase())) {
    record.invitedEmails.push(email.toLowerCase());
    record.invitesSent += 1;
    REFERRAL_STORE.set(session.user.id, record);
  }

  return NextResponse.json(publicView(record));
}

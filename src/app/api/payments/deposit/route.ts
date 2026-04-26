import { NextResponse, type NextRequest } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { createDepositCharge } from "@/services/team-14-payments";

type Body = {
  buildRecordId?: string;
  agreementId?: string;
};

export async function POST(req: NextRequest) {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.buildRecordId || !body.agreementId) {
    return NextResponse.json(
      { error: "buildRecordId and agreementId are required" },
      { status: 400 },
    );
  }
  try {
    const result = await createDepositCharge({
      userId: principal.id,
      buildRecordId: body.buildRecordId,
      agreementId: body.agreementId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "charge-failed" },
      { status: 502 },
    );
  }
}

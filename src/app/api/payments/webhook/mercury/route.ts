import { getMercuryClient } from "@/lib/payments/mercury-client";
import { handleWebhookEvent } from "@/services/team-14-payments";

export const POST = async (req: Request): Promise<Response> => {
  const signature = req.headers.get("x-hub-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature header" }, { status: 401 });
  }

  const payload = await req.text();
  const secret = process.env.MERCURY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[mercury-webhook] MERCURY_WEBHOOK_SECRET not configured");
    return Response.json({ error: "Misconfigured" }, { status: 500 });
  }

  try {
    const mercury = getMercuryClient();
    const event = mercury.verifyWebhook({
      payload,
      signature,
      secret,
    });

    const result = await handleWebhookEvent(event);
    if (!result.handled) {
      return Response.json(
        {
          ok: true,
          message: result.reason ?? "Event processed",
          dealId: result.dealId,
        },
        { status: 200 },
      );
    }

    return Response.json(
      {
        ok: true,
        paymentId: result.payment?.id,
        dealId: result.dealId,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[mercury-webhook]", message);
    return Response.json({ error: message }, { status: 400 });
  }
};

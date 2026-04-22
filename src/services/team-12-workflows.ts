import {
  canTransition,
  makeFixtureDealRecord,
  type ConversionState,
  type DealRecord,
  type DealStatus,
  type PathKind,
} from "@/contracts";

export type ConversionContext = {
  userId: string;
  listingId: string;
  path: PathKind;
};

export const getConversionState = async (
  ctx: Pick<ConversionContext, "userId" | "listingId">,
): Promise<ConversionState> => "decided";

export const transitionConversionState = async (input: {
  ctx: ConversionContext;
  from: ConversionState;
  to: ConversionState;
}): Promise<{ ok: boolean; state: ConversionState; reason?: string }> => {
  if (!canTransition(input.from, input.to)) {
    return { ok: false, state: input.from, reason: "illegal-transition" };
  }
  return { ok: true, state: input.to };
};

export const onDepositReceived = async (input: {
  userId: string;
  buildRecordId: string;
  agreementId: string;
  paymentId: string;
}): Promise<DealRecord> =>
  makeFixtureDealRecord({
    userId: input.userId,
    buildRecordId: input.buildRecordId,
    agreementId: input.agreementId,
  });

export const advanceBuildStartedWorkflow = async (input: {
  dealId: string;
  toStatus: DealStatus;
}): Promise<{ ok: true; dealId: string; status: DealStatus }> => ({
  ok: true,
  dealId: input.dealId,
  status: input.toStatus,
});

export type DealerLead = {
  id: string;
  userId: string;
  dealerId: string;
  listingId: string;
  status: "sent" | "unlocked" | "responded" | "closed";
  createdAt: string;
};

export const createDealerLead = async (input: {
  userId: string;
  dealerId: string;
  listingId: string;
}): Promise<DealerLead> => ({
  id: `lead_${Date.now()}`,
  userId: input.userId,
  dealerId: input.dealerId,
  listingId: input.listingId,
  status: "sent",
  createdAt: new Date().toISOString(),
});

export type SellerInvite = {
  id: string;
  userId: string;
  sellerContact: string;
  listingId: string;
  status: "invited" | "onboarded" | "ignored";
  createdAt: string;
};

export const createSellerInvite = async (input: {
  userId: string;
  sellerContact: string;
  listingId: string;
}): Promise<SellerInvite> => ({
  id: `invite_${Date.now()}`,
  userId: input.userId,
  sellerContact: input.sellerContact,
  listingId: input.listingId,
  status: "invited",
  createdAt: new Date().toISOString(),
});

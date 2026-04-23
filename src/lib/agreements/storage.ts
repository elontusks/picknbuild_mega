import "server-only";

import type { AgreementDocument } from "@/contracts";
import * as Storage from "@/services/team-15-storage";

// Bucket name is frozen against team-12-workflows.ts so onDepositReceived
// resolves the AgreementDocument Team 9 wrote here. Do not rename without
// coordinating with Team 12.
export const AGREEMENTS_BUCKET = "agreements";

export const getAgreement = (
  id: string,
): Promise<AgreementDocument | null> =>
  Storage.getRecord<AgreementDocument>(AGREEMENTS_BUCKET, id);

export const putAgreement = async (
  doc: AgreementDocument,
): Promise<void> => {
  await Storage.putRecord(AGREEMENTS_BUCKET, doc.id, doc);
};

export type AgreementAccess =
  | { ok: true; agreement: AgreementDocument }
  | { ok: false; reason: "not-found" | "forbidden" };

export const loadAgreementForUser = async (input: {
  agreementId: string;
  userId: string;
}): Promise<AgreementAccess> => {
  const agreement = await getAgreement(input.agreementId);
  if (!agreement) return { ok: false, reason: "not-found" };
  if (agreement.userId !== input.userId) return { ok: false, reason: "forbidden" };
  return { ok: true, agreement };
};

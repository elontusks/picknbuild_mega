import { nextFixtureId, nowIso, type ISOTimestamp } from "./common";

export type SignaturePayload = {
  image: string;
  signedAt: ISOTimestamp;
  ip: string;
};

export type AgreementDocument = {
  id: string;
  userId: string;
  buildRecordId: string;
  renderedSpecSummary: string;
  clauses: string[];
  signaturePayload: SignaturePayload;
  nonRefundableAcknowledged: true;
  insuranceAcknowledged: true;
  pdfUrl: string;
};

export const makeFixtureAgreementDocument = (
  overrides: Partial<AgreementDocument> = {},
): AgreementDocument => ({
  id: nextFixtureId("agreement"),
  userId: "user_fixture",
  buildRecordId: "build_fixture",
  renderedSpecSummary: "2018-2020 Honda Accord, clean title, 40k-70k miles",
  clauses: ["clause.non-refundable", "clause.insurance-required"],
  signaturePayload: {
    image: "data:image/png;base64,AAAA",
    signedAt: nowIso(),
    ip: "127.0.0.1",
  },
  nonRefundableAcknowledged: true,
  insuranceAcknowledged: true,
  pdfUrl: "https://example.com/agreements/fixture.pdf",
  ...overrides,
});

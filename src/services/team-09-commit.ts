import "server-only";

// Team 9 — Commit / Checkout.
//
// Publishes the BuildRecord (§3.3) and AgreementDocument (§3.5) persistence
// surfaces so Team 12's onDepositReceived can resolve both by id after the
// deposit charge succeeds. Buckets are frozen here:
//   - BuildRecord  -> "build_records"
//   - Agreement    -> "agreements"
// These match team-12-workflows.ts. Do not rename without coordinating.

export {
  BUILD_RECORDS_BUCKET,
  getBuildRecord,
  putBuildRecord,
  listBuildRecordsForUser,
  loadBuildRecordForUser,
} from "@/lib/build-records/storage";

export {
  AGREEMENTS_BUCKET,
  getAgreement,
  putAgreement,
  loadAgreementForUser,
} from "@/lib/agreements/storage";

import type { Capability, UserRole } from "./types";
import { ALL_CAPABILITIES, CAPABILITIES as C } from "./capabilities";

const BUYER_BASE: Capability[] = [
  C.listings.view,
  C.messages.read,
  C.messages.send,
  C.feed.view,
  C.feed.post_own,
  C.feed.delete_own,
  C.comments.create,
  C.comments.edit_own,
  C.comments.delete_own,
  C.reality_check.preview,
  C.reality_check.start,
  C.reality_check.lock,
  C.garage.pick,
  C.garage.unpick,
  C.garage.view_own,
  C.reports.submit,
];

export const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  buyer: BUYER_BASE,
  individual_seller: [
    ...BUYER_BASE,
    C.listings.create,
    C.listings.edit_own,
    C.listings.delete_own,
  ],
  dealer: [
    ...BUYER_BASE,
    C.listings.create,
    C.listings.edit_own,
    C.listings.delete_own,
    C.dealer.claim,
    C.dealer.profile_edit,
    C.dealer.logo_upload,
    C.dealer.analytics_view,
    C.dealer.subscription_manage,
    C.dealer.responses_manage,
  ],
  admin: ALL_CAPABILITIES,
};

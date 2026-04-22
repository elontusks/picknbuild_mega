import type { Capability, Condition } from "./types";
import { CAPABILITIES as C } from "./capabilities";
import {
  accountActive,
  emailVerified,
  phoneVerified,
} from "./conditions/verification";
import { ownsResource } from "./conditions/ownership";
import {
  dealerPageClaimed,
  dealerSubscriptionActive,
} from "./conditions/dealer";

/**
 * Capability → ordered list of conditions that must all pass.
 * Empty array = role grant alone suffices (anonymous-friendly when combined
 * with a public role grant). Missing entry = defaults to [accountActive].
 */
export const CAPABILITY_POLICIES: Partial<Record<Capability, Condition[]>> = {
  // Public (anonymous-accessible)
  [C.reality_check.preview]: [],
  [C.feed.view]: [],

  // Signed-in + active account
  [C.listings.view]: [accountActive],
  [C.messages.read]: [accountActive],
  [C.comments.create]: [accountActive],
  [C.garage.pick]: [accountActive],
  [C.garage.view_own]: [accountActive],
  [C.reports.submit]: [accountActive],

  // Email verification required
  [C.reality_check.start]: [accountActive, emailVerified],
  [C.feed.post_own]: [accountActive, emailVerified],

  // High-intent (email + phone)
  [C.listings.create]: [accountActive, emailVerified, phoneVerified],
  [C.messages.send]: [accountActive, emailVerified, phoneVerified],

  // Ownership-gated
  [C.listings.edit_own]:   [accountActive, ownsResource],
  [C.listings.delete_own]: [accountActive, ownsResource],
  [C.feed.delete_own]:     [accountActive, ownsResource],
  [C.comments.edit_own]:   [accountActive, ownsResource],
  [C.comments.delete_own]: [accountActive, ownsResource],
  [C.garage.unpick]:       [accountActive, ownsResource],
  [C.reality_check.lock]:  [accountActive, ownsResource],

  // Dealer claim-gated
  [C.dealer.profile_edit]:        [accountActive, dealerPageClaimed],
  [C.dealer.logo_upload]:         [accountActive, dealerPageClaimed],
  [C.dealer.responses_manage]:    [accountActive, dealerPageClaimed],
  [C.dealer.subscription_manage]: [accountActive, dealerPageClaimed],

  // Dealer subscription-gated
  [C.dealer.analytics_view]: [
    accountActive,
    dealerPageClaimed,
    dealerSubscriptionActive,
  ],

  // Dealer claim action — proof supplied at call site
  [C.dealer.claim]: [accountActive, emailVerified],

  // Admin surfaces (role grant alone is strong; keep accountActive as floor)
  [C.admin.dashboard_view]:  [accountActive],
  [C.admin.users_suspend]:   [accountActive],
  [C.admin.users_ban]:       [accountActive],
  [C.admin.users_restore]:   [accountActive],
  [C.admin.listings_remove]: [accountActive],
  [C.admin.posts_remove]:    [accountActive],
  [C.listings.edit_any]:     [accountActive],
  [C.listings.delete_any]:   [accountActive],
  [C.comments.delete_any]:   [accountActive],
  [C.feed.moderate]:         [accountActive],
  [C.reports.review]:        [accountActive],
  [C.reports.resolve]:       [accountActive],
};

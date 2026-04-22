import type { Capability } from "./types";

const c = (s: string): Capability => s as Capability;

export const CAPABILITIES = {
  listings: {
    view:       c("listings.view"),
    create:     c("listings.create"),
    edit_own:   c("listings.edit.own"),
    edit_any:   c("listings.edit.any"),
    delete_own: c("listings.delete.own"),
    delete_any: c("listings.delete.any"),
  },
  messages: {
    read: c("messages.read"),
    send: c("messages.send"),
  },
  feed: {
    view:       c("feed.view"),
    post_own:   c("feed.post.own"),
    delete_own: c("feed.delete.own"),
    moderate:   c("feed.moderate"),
  },
  comments: {
    create:     c("comments.create"),
    edit_own:   c("comments.edit.own"),
    delete_own: c("comments.delete.own"),
    delete_any: c("comments.delete.any"),
  },
  reality_check: {
    preview: c("reality_check.preview"),
    start:   c("reality_check.start"),
    lock:    c("reality_check.lock"),
  },
  dealer: {
    claim:               c("dealer.claim"),
    profile_edit:        c("dealer.profile.edit"),
    logo_upload:         c("dealer.logo.upload"),
    analytics_view:      c("dealer.analytics.view"),
    subscription_manage: c("dealer.subscription.manage"),
    responses_manage:    c("dealer.responses.manage"),
  },
  garage: {
    pick:     c("garage.pick"),
    unpick:   c("garage.unpick"),
    view_own: c("garage.view.own"),
  },
  reports: {
    submit:  c("reports.submit"),
    review:  c("reports.review"),
    resolve: c("reports.resolve"),
  },
  admin: {
    dashboard_view:  c("admin.dashboard.view"),
    users_suspend:   c("admin.users.suspend"),
    users_ban:       c("admin.users.ban"),
    users_restore:   c("admin.users.restore"),
    listings_remove: c("admin.listings.remove"),
    posts_remove:    c("admin.posts.remove"),
  },
} as const;

export const ALL_CAPABILITIES: Capability[] = Object.values(CAPABILITIES).flatMap(
  (group) => Object.values(group),
);

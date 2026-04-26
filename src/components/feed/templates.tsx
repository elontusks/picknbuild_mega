import type { FeedPost } from "@/lib/feed/types";

// Per-kind templates. Each template assumes the generic Feed Post Card is
// already rendering poster identity + body + media + engagement — the
// template is responsible only for kind-specific decoration (labels,
// extras like price, severity chip). Keep them small; they're switched
// on by FeedPostCard.

const KIND_LABEL: Record<FeedPost["kind"], string> = {
  deal: "Deal",
  problem: "Problem / experience",
  question: "Question",
  build: "Build",
  recommendation: "Recommendation",
  warning: "Warning",
};

const KIND_CHIP_CLASS: Record<FeedPost["kind"], string> = {
  deal: "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200",
  problem: "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200",
  question: "bg-sky-200 text-sky-900 dark:bg-sky-900 dark:text-sky-200",
  build: "bg-violet-200 text-violet-900 dark:bg-violet-900 dark:text-violet-200",
  recommendation:
    "bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200",
  warning: "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200",
};

export function PostKindChip({ kind }: { kind: FeedPost["kind"] }) {
  return (
    <span
      data-testid="post-kind-chip"
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_CHIP_CLASS[kind]}`}
    >
      {KIND_LABEL[kind]}
    </span>
  );
}

export function DealPostTemplate({ post }: { post: FeedPost }) {
  const price = post.extras?.dealPrice;
  return (
    <div data-testid="tpl-deal" className="flex flex-col gap-1">
      {price !== undefined ? (
        <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Deal price: ${price.toLocaleString()}
        </div>
      ) : null}
    </div>
  );
}

export function ProblemPostTemplate({ post: _post }: { post: FeedPost }) {
  return (
    <div
      data-testid="tpl-problem"
      className="text-xs text-amber-700 dark:text-amber-300"
    >
      Shared as a problem / experience report.
    </div>
  );
}

export function QuestionPostTemplate({ post: _post }: { post: FeedPost }) {
  return (
    <div
      data-testid="tpl-question"
      className="text-xs text-sky-700 dark:text-sky-300"
    >
      Looking for input — reply below.
    </div>
  );
}

export function BuildPostTemplate({ post }: { post: FeedPost }) {
  const before = post.extras?.buildBeforeRef;
  const after = post.extras?.buildAfterRef;
  if (!before && !after) {
    return (
      <div data-testid="tpl-build" className="text-xs text-violet-700 dark:text-violet-300">
        Build update.
      </div>
    );
  }
  return (
    <div data-testid="tpl-build" className="grid grid-cols-2 gap-2 text-xs">
      {before ? (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Before</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={before}
            alt="Before"
            className="aspect-video w-full rounded object-cover"
          />
        </div>
      ) : null}
      {after ? (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">After</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={after}
            alt="After"
            className="aspect-video w-full rounded object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}

export function RecommendationPostTemplate({ post }: { post: FeedPost }) {
  const target = post.extras?.recommendationTarget;
  return (
    <div
      data-testid="tpl-recommendation"
      className="text-xs text-indigo-700 dark:text-indigo-300"
    >
      {target ? `Recommends: ${target}` : "Recommendation."}
    </div>
  );
}

export function WarningPostTemplate({ post }: { post: FeedPost }) {
  const severity = post.extras?.warningSeverity ?? "med";
  const chip =
    severity === "high"
      ? "bg-rose-200 text-rose-900"
      : severity === "low"
        ? "bg-rose-100 text-rose-800"
        : "bg-rose-100 text-rose-800";
  return (
    <div
      data-testid="tpl-warning"
      className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300"
    >
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${chip}`}
      >
        {severity.toUpperCase()}
      </span>
      <span>Warning shared with the community.</span>
    </div>
  );
}

export function PostKindTemplate({ post }: { post: FeedPost }) {
  switch (post.kind) {
    case "deal":
      return <DealPostTemplate post={post} />;
    case "problem":
      return <ProblemPostTemplate post={post} />;
    case "question":
      return <QuestionPostTemplate post={post} />;
    case "build":
      return <BuildPostTemplate post={post} />;
    case "recommendation":
      return <RecommendationPostTemplate post={post} />;
    case "warning":
      return <WarningPostTemplate post={post} />;
  }
}

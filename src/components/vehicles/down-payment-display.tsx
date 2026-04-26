import type { PathKind, PathQuote } from "@/contracts";

const PATH_LABEL: Record<PathKind, string> = {
  dealer: "Dealer",
  auction: "Auction",
  picknbuild: "picknbuild",
  private: "Private",
};

const formatUsd = (n: number): string => `$${n.toLocaleString()}`;

type DownPaymentDisplayProps = {
  quotes: PathQuote[];
  className?: string;
};

export function DownPaymentDisplay({ quotes, className }: DownPaymentDisplayProps) {
  if (quotes.length === 0) return null;
  return (
    <dl
      data-testid="down-payment-display"
      className={
        className ??
        "grid grid-cols-2 gap-3 rounded-lg border border-border bg-background p-3 text-sm-800-950 sm:grid-cols-4"
      }
    >
      {quotes.map((quote) => {
        const downLabel =
          quote.down === undefined
            ? quote.path === "auction"
              ? "Cash due"
              : quote.path === "private"
                ? "Cash"
                : "—"
            : formatUsd(quote.down);
        return (
          <div
            key={quote.path}
            data-testid={`down-${quote.path}`}
            className="flex flex-col gap-0.5"
          >
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {PATH_LABEL[quote.path]} down
            </dt>
            <dd className="text-sm font-semibold text-foreground">
              {downLabel}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

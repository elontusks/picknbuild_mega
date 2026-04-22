import { getDisclaimer, type DisclaimerKey } from "@/lib/legal/disclaimers";

type DisclaimerProps = {
  context: DisclaimerKey;
  className?: string;
};

export function Disclaimer({ context, className }: DisclaimerProps) {
  return (
    <p
      data-disclaimer={context}
      className={
        className ??
        "text-xs leading-5 text-zinc-500 dark:text-zinc-400"
      }
    >
      {getDisclaimer(context)}
    </p>
  );
}

/**
 * Single source of breakpoint widths used across the app shell. Tailwind v4
 * is configured with these same values via the `--breakpoint-*` tokens in
 * globals.css; keeping the JS copy in sync lets components branch on the
 * current breakpoint without parsing CSS at runtime.
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

const ORDER: Breakpoint[] = ["xs", "sm", "md", "lg", "xl"];

export function resolveBreakpoint(width: number): Breakpoint {
  let current: Breakpoint = "xs";
  for (const name of ORDER) {
    if (width >= BREAKPOINTS[name]) current = name;
  }
  return current;
}

export function isMobileWidth(width: number): boolean {
  return width < BREAKPOINTS.md;
}

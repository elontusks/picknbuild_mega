'use client';

import { useEffect, useState } from 'react';

const ADAPTERS = ['Copart', 'IAAI', 'cars.com', 'Firecrawl-driven sites'];
const ADAPTER_ROTATION_MS = 3500;

/**
 * Visual indicator for the auction live-scrape pending state. The
 * orchestrator's /search is fire-and-wait (no progress events), so the
 * bar is intentionally indeterminate — a moving stripe + an elapsed
 * counter + a rotating adapter label. Honest about not knowing the
 * exact percent done while still confirming work is in flight.
 */
export default function LiveScrapeProgress() {
  const [elapsed, setElapsed] = useState(0);
  const [adapterIdx, setAdapterIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setAdapterIdx((i) => (i + 1) % ADAPTERS.length),
      ADAPTER_ROTATION_MS,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div
      data-testid="live-scrape-progress"
      role="status"
      aria-live="polite"
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: '12px',
          color: 'var(--foreground)',
        }}
      >
        <span>
          Searching <span data-testid="live-scrape-adapter">{ADAPTERS[adapterIdx]}</span>…
        </span>
        <span
          data-testid="live-scrape-elapsed"
          style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}
        >
          {elapsed}s
        </span>
      </div>
      <div className="scrape-progress-track" aria-hidden>
        <div className="scrape-progress-stripe" />
      </div>
      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
        Fanning out across Copart, IAAI, and Firecrawl-driven sources. This
        usually takes 20–60 seconds.
      </div>
    </div>
  );
}

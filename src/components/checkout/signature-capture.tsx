"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (image: string) => void;
};

// Minimal typed-signature capture: user types their name, we encode it into a
// data URL. A real build can swap this for a canvas component; the surface
// contract stays {value:string, onChange(img)} so AgreementDocument's
// signaturePayload.image stores whatever is produced here.
export function SignatureCapture({ value, onChange }: Props) {
  const [typed, setTyped] = useState("");

  const commit = (text: string) => {
    setTyped(text);
    if (!text.trim()) {
      onChange("");
      return;
    }
    const payload = `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='80'><text x='10' y='50' font-family='cursive' font-size='32'>${text.trim()}</text></svg>`,
    )}`;
    onChange(payload);
  };

  return (
    <div data-testid="signature-capture" className="space-y-2">
      <label className="block text-xs text-zinc-500">
        Type your full legal name to sign
        <input
          data-testid="signature-input"
          value={typed}
          onChange={(e) => commit(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      {value ? (
        <p className="text-[11px] text-zinc-500">
          Signature captured. This will be timestamped + IP-stamped on submit.
        </p>
      ) : null}
    </div>
  );
}

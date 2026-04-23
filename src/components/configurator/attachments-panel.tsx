"use client";

import { useState } from "react";
import type { BuildAttachment } from "@/contracts";

type Props = {
  value: BuildAttachment[];
  onChange: (next: BuildAttachment[]) => void;
};

const TYPES: BuildAttachment["type"][] = ["link", "file", "image", "note"];

export function AttachmentsPanel({ value, onChange }: Props) {
  const [type, setType] = useState<BuildAttachment["type"]>("link");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");

  const add = () => {
    const trimmed = ref.trim();
    if (!trimmed) return;
    const attachment: BuildAttachment = { type, ref: trimmed };
    const trimmedNote = note.trim();
    if (trimmedNote) attachment.note = trimmedNote;
    onChange([...value, attachment]);
    setRef("");
    setNote("");
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div data-testid="attachments-panel" className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          data-testid="attachment-type"
          value={type}
          onChange={(e) => setType(e.target.value as BuildAttachment["type"])}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          data-testid="attachment-ref"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder={type === "note" ? "short note…" : "url or filename"}
          className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          data-testid="attachment-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="optional note"
          className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          data-testid="attachment-add"
          onClick={add}
          className="rounded bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-white dark:text-zinc-900"
        >
          Add
        </button>
      </div>
      {value.length === 0 ? (
        <p className="text-xs text-zinc-500">No attachments yet.</p>
      ) : (
        <ul className="space-y-2">
          {value.map((a, i) => (
            <li
              key={`${a.type}-${a.ref}-${i}`}
              data-testid={`attachment-item-${i}`}
              className="flex items-center gap-2 rounded border border-zinc-200 p-2 text-xs dark:border-zinc-800"
            >
              <span className="rounded bg-zinc-100 px-2 py-0.5 uppercase dark:bg-zinc-800">
                {a.type}
              </span>
              <span className="flex-1 break-all font-mono">{a.ref}</span>
              {a.note ? (
                <span className="italic opacity-80">{a.note}</span>
              ) : null}
              <button
                type="button"
                data-testid={`attachment-remove-${i}`}
                onClick={() => remove(i)}
                className="text-zinc-500 hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

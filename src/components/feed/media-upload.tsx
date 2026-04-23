"use client";

import { useRef, useState } from "react";

// Media Upload Interface. For v1, stores each file as a base64 data URL
// (kept inline in the post payload). A real pipeline would push to a
// Supabase Storage bucket and return refs; that requires shared-infra
// coordination so we defer. Callers receive string refs (data URLs here)
// and pass them through unchanged.
//
// Size cap per file is enforced client-side — base64 in jsonb doesn't
// scale, so the UI hard-blocks huge files rather than silently failing.

const MAX_SINGLE_BYTES = 1_500_000;
const MAX_FILES = 4;

type MediaUploadProps = {
  name?: string;
  refs: string[];
  onChange: (refs: string[]) => void;
  testId?: string;
};

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });

export function MediaUploadInterface({
  name,
  refs,
  onChange,
  testId = "media-upload",
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    if (refs.length + incoming.length > MAX_FILES) {
      setError(`At most ${MAX_FILES} media items per post.`);
      return;
    }
    for (const f of incoming) {
      if (f.size > MAX_SINGLE_BYTES) {
        setError(
          `${f.name} is too large (max ${Math.round(MAX_SINGLE_BYTES / 1000)}KB per file in v1).`,
        );
        return;
      }
    }
    try {
      const next = await Promise.all(incoming.map(readAsDataUrl));
      onChange([...refs, ...next]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file.");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (i: number) => {
    onChange(refs.filter((_, idx) => idx !== i));
  };

  return (
    <div
      data-testid={testId}
      className="flex flex-col gap-2 rounded-md border border-dashed border-zinc-300 p-2 dark:border-zinc-700"
    >
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          data-testid={`${testId}-input`}
          {...(name ? { name } : {})}
          onChange={(e) => handleFiles(e.target.files)}
          className="text-xs"
        />
        <span className="text-[11px] text-zinc-500">
          {refs.length}/{MAX_FILES}
        </span>
      </div>
      {refs.length > 0 ? (
        <ul className="flex flex-wrap gap-2" data-testid={`${testId}-preview`}>
          {refs.map((src, i) => (
            <li key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Upload ${i + 1}`}
                className="h-16 w-16 rounded object-cover"
              />
              <button
                type="button"
                data-testid={`${testId}-remove-${i}`}
                onClick={() => removeAt(i)}
                className="absolute -right-1 -top-1 rounded-full bg-zinc-900 px-1 text-[10px] text-white"
                aria-label={`Remove media ${i + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/common/Icon";
import type { MessageMetadata } from "@/types/message";

export function ImageMessage({
  metadata,
  onOpen,
}: {
  metadata: MessageMetadata | null;
  onOpen: () => void;
}) {
  // Storage isn't wired up yet (see docs/ARCHITECTURE.md), so this renders a
  // placeholder instead of a real fetched image, briefly showing a loading
  // state the way a real fetch from Storage would.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(t);
  }, []);

  const ratio = metadata?.width && metadata?.height ? metadata.width / metadata.height : 4 / 3;

  return (
    <button
      onClick={onOpen}
      aria-label="Open image"
      className="focus-ring relative block w-56 overflow-hidden rounded-xl bg-surface-sunken sm:w-64"
      style={{ aspectRatio: String(ratio) }}
    >
      {!loaded && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Icon name="image" size={22} className="animate-pulse text-ink-faint" />
        </span>
      )}
      <span
        role="img"
        aria-label="Photo message"
        className={`absolute inset-0 bg-gradient-to-br from-accent/30 to-accent/10 transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
}

export function FileMessage({ metadata, text }: { metadata: MessageMetadata | null; text: string | null }) {
  const sizeLabel = metadata?.size ? `${Math.round(metadata.size / 1024)} KB` : "";
  return (
    <div className="flex w-56 items-center gap-3 rounded-xl bg-surface p-3 sm:w-64">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Icon name="file" size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{metadata?.fileName ?? text ?? "File"}</span>
        <span className="block text-xs text-ink-faint">{sizeLabel}</span>
      </span>
    </div>
  );
}

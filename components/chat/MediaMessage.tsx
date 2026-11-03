"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { Icon } from "@/components/common/Icon";
import { storage } from "@/firebase/client";
import type { MessageMetadata } from "@/types/message";

export function ImageMessage({
  metadata,
  onOpen,
}: {
  metadata: MessageMetadata | null;
  onOpen: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const ratio = metadata?.width && metadata?.height ? metadata.width / metadata.height : 4 / 3;

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (!metadata?.storagePath) {
      setFailed(true);
      return;
    }

    void getDownloadURL(ref(storage, metadata.storagePath))
      .then((downloadUrl) => {
        if (active) setUrl(downloadUrl);
      })
      .catch((error: unknown) => {
        console.error("Could not load image from Firebase Storage:", error);
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [metadata?.storagePath]);

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!url}
      aria-label={url ? "Open image" : "Image preview unavailable"}
      className="focus-ring relative block w-56 overflow-hidden rounded-xl bg-surface-sunken disabled:cursor-not-allowed sm:w-64"
      style={{ aspectRatio: String(ratio) }}
    >
      {url ? (
        <Image src={url} alt={metadata?.fileName ?? "Shared image"} fill sizes="(max-width: 640px) 224px, 256px" unoptimized className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-faint">
          <Icon name="image" size={24} className={failed ? "" : "animate-pulse"} />
          <span className="text-xs">{failed ? "Preview unavailable" : "Loading image…"}</span>
        </span>
      )}
    </button>
  );
}

export function FileMessage({ metadata, text }: { metadata: MessageMetadata | null; text: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const sizeLabel = metadata?.size ? `${Math.round(metadata.size / 1024)} KB` : "";

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (!metadata?.storagePath) {
      setFailed(true);
      return;
    }

    void getDownloadURL(ref(storage, metadata.storagePath))
      .then((downloadUrl) => {
        if (active) setUrl(downloadUrl);
      })
      .catch((error: unknown) => {
        console.error("Could not load file from Firebase Storage:", error);
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [metadata?.storagePath]);

  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Icon name="file" size={18} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-ink">{metadata?.fileName ?? text ?? "File"}</span>
        <span className="block text-xs text-ink-faint">
          {failed ? "Download unavailable" : sizeLabel || "Shared file"}
        </span>
      </span>
      {url && <Icon name="storage" size={16} className="shrink-0 text-ink-faint" />}
    </>
  );

  return url ? (
    <a
      href={url}
      download={metadata?.fileName ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="flex w-56 items-center gap-3 rounded-xl bg-surface p-3 hover:bg-surface-raised sm:w-64"
    >
      {content}
    </a>
  ) : (
    <div className="flex w-56 items-center gap-3 rounded-xl bg-surface p-3 sm:w-64">{content}</div>
  );
}

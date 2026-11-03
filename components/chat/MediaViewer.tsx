"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { storage } from "@/firebase/client";
import type { MockMessage } from "@/lib/mock/mockMessages";

export function MediaViewer({ message, onClose }: { message: MockMessage; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setUrl(null);
    setError(false);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    let active = true;
    const storagePath = message.metadata?.storagePath;
    if (!storagePath) {
      setError(true);
    } else {
      void getDownloadURL(ref(storage, storagePath))
        .then((downloadUrl) => {
          if (active) setUrl(downloadUrl);
        })
        .catch((downloadError: unknown) => {
          console.error("Could not load media from Firebase Storage:", downloadError);
          if (active) setError(true);
        });
    }

    return () => {
      active = false;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [message.metadata?.storagePath, onClose]);

  const ratio =
    message.metadata?.width && message.metadata?.height
      ? message.metadata.width / message.metadata.height
      : 4 / 3;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between p-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <IconButton
          aria-label="Close"
          onClick={onClose}
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <Icon name="x" size={22} />
        </IconButton>
        {url && (
          <a
            href={url}
            download={message.metadata?.fileName ?? "image"}
            target="_blank"
            rel="noreferrer"
            aria-label="Download image"
            onClick={(event) => event.stopPropagation()}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <Icon name="archive" size={20} />
          </a>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center p-4" onClick={(event) => event.stopPropagation()}>
        {url ? (
          <div
            className="relative max-h-full max-w-full overflow-hidden rounded-lg"
            style={{
              width: Math.min(message.metadata?.width ?? 800, 1100),
              maxWidth: "90vw",
              aspectRatio: String(ratio),
            }}
          >
            <Image src={url} alt={message.metadata?.fileName ?? "Shared image"} fill unoptimized className="object-contain" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Icon name={error ? "alertTriangle" : "image"} size={40} className={error ? "text-danger" : "animate-pulse"} />
            <p className="text-sm">{error ? "This media could not be loaded." : "Loading media…"}</p>
          </div>
        )}
      </div>

      {message.text && (
        <p className="p-4 text-center text-sm text-white/80" onClick={(event) => event.stopPropagation()}>
          {message.text}
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { Icon } from "@/components/common/Icon";
import { storage } from "@/firebase/client";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function VoiceMessagePlayer({
  durationSeconds = 0,
  storagePath,
}: {
  durationSeconds?: number;
  storagePath?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (!storagePath) {
      setFailed(true);
      return;
    }

    void getDownloadURL(ref(storage, storagePath))
      .then((downloadUrl) => {
        if (active) setUrl(downloadUrl);
      })
      .catch((error: unknown) => {
        console.error("Could not load audio from Firebase Storage:", error);
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [storagePath]);

  if (!url) {
    return (
      <div className="flex w-52 items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-ink-faint sm:w-60">
        <Icon name="mic" size={16} />
        {failed ? "Audio unavailable" : "Loading audio…"}
        {durationSeconds > 0 && <span className="ml-auto">{formatDuration(durationSeconds)}</span>}
      </div>
    );
  }

  return (
    <audio
      controls
      preload="metadata"
      src={url}
      aria-label={`Voice message${durationSeconds > 0 ? `, ${formatDuration(durationSeconds)}` : ""}`}
      className="max-w-full"
    />
  );
}

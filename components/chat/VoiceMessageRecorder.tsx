"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/common/Icon";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function VoiceMessageRecorder({
  onCancel,
  onSend,
}: {
  onCancel: () => void;
  onSend: (durationSeconds: number) => void;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <button
        onClick={onCancel}
        aria-label="Cancel recording"
        className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-danger hover:bg-danger/10"
      >
        <Icon name="trash" size={18} />
      </button>

      <div className="flex flex-1 items-center gap-2 rounded-full bg-surface-sunken px-3 py-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" aria-hidden="true" />
        <span className="text-sm tabular-nums text-ink">{formatDuration(seconds)}</span>
        <span className="flex flex-1 items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="w-0.5 rounded-full bg-ink-faint"
              style={{ height: `${6 + ((i * 37) % 14)}px` }}
            />
          ))}
        </span>
        <span className="text-xs text-ink-faint">Recording…</span>
      </div>

      <button
        onClick={() => onSend(seconds)}
        aria-label="Send voice message"
        className="focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-ink"
      >
        <Icon name="send" size={16} />
      </button>
    </div>
  );
}

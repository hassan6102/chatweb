"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/common/Icon";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function VoiceMessagePlayer({ durationSeconds = 0 }: { durationSeconds?: number }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 0.2 >= durationSeconds) {
          setPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev + 0.2;
      });
    }, 200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, durationSeconds]);

  const progress = durationSeconds > 0 ? elapsed / durationSeconds : 0;

  return (
    <div className="flex w-52 items-center gap-2.5 sm:w-60">
      <button
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink"
      >
        <Icon name={playing ? "pause" : "play"} size={16} />
      </button>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/15" role="presentation">
          <div className="h-full rounded-full bg-current" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="w-9 shrink-0 text-right text-xs tabular-nums opacity-75">
          {formatDuration(playing || elapsed > 0 ? durationSeconds - elapsed : durationSeconds)}
        </span>
      </div>
    </div>
  );
}

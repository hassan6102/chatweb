"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import type { MockMessage } from "@/lib/mock/mockMessages";

export function MediaViewer({ message, onClose }: { message: MockMessage; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const t = setTimeout(() => setLoaded(true), 350);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(t);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <IconButton aria-label="Close" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white">
          <Icon name="x" size={22} />
        </IconButton>
        <IconButton
          aria-label="Download"
          onClick={(e) => e.stopPropagation()}
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <Icon name="archive" size={20} />
        </IconButton>
      </div>

      <div className="flex flex-1 items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {!loaded ? (
          <Icon name="image" size={40} className="animate-pulse text-white/50" />
        ) : (
          <div
            role="img"
            aria-label="Full-size photo"
            className="max-h-full max-w-full rounded-lg bg-gradient-to-br from-accent/50 to-accent/20"
            style={{
              width: Math.min(message.metadata?.width ?? 800, 800),
              maxWidth: "90vw",
              aspectRatio: String(
                message.metadata?.width && message.metadata?.height
                  ? message.metadata.width / message.metadata.height
                  : 4 / 3
              ),
            }}
          />
        )}
      </div>

      {message.text && (
        <p className="p-4 text-center text-sm text-white/80" onClick={(e) => e.stopPropagation()}>
          {message.text}
        </p>
      )}
    </div>
  );
}

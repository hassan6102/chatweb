"use client";

import { REACTION_EMOJIS, type ReactionEmoji } from "@/types/ui";

export function ReactionPicker({
  current,
  onPick,
  align = "start",
}: {
  current?: ReactionEmoji;
  onPick: (emoji: ReactionEmoji) => void;
  align?: "start" | "end";
}) {
  return (
    <div
      role="menu"
      aria-label="Add reaction"
      className={`absolute bottom-full z-20 mb-1 flex gap-0.5 rounded-full border border-border bg-surface-raised p-1 shadow-lg ${
        align === "end" ? "right-0" : "left-0"
      }`}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          role="menuitemradio"
          aria-checked={current === emoji}
          onClick={() => onPick(emoji)}
          className={`focus-ring flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:scale-110 hover:bg-surface-sunken ${
            current === emoji ? "bg-surface-sunken" : ""
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

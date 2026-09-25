import type { MessageReactions } from "@/types/ui";

export function ReactionsRow({
  reactions,
  currentUid,
  align,
}: {
  reactions: MessageReactions;
  currentUid: string;
  align: "start" | "end";
}) {
  const entries = Object.entries(reactions);
  if (entries.length === 0) return null;

  const counts = entries.reduce<Record<string, number>>((acc, [, emoji]) => {
    acc[emoji] = (acc[emoji] ?? 0) + 1;
    return acc;
  }, {});
  const mine = reactions[currentUid];

  return (
    <div className={`-mt-2 flex gap-1 ${align === "end" ? "self-end" : "self-start"}`}>
      {Object.entries(counts).map(([emoji, count]) => (
        <span
          key={emoji}
          className={`flex items-center gap-1 rounded-full border bg-surface px-1.5 py-0.5 text-xs shadow-sm ${
            mine === emoji ? "border-accent" : "border-border"
          }`}
        >
          {emoji}
          {count > 1 && <span className="text-ink-muted">{count}</span>}
        </span>
      ))}
    </div>
  );
}

import { Icon } from "@/components/common/Icon";
import type { MockMessage } from "@/lib/mock/mockMessages";
import { getMockUserByUid, CURRENT_USER } from "@/lib/mock/mockUsers";

function labelFor(message: MockMessage) {
  if (message.deleted) return "This message was deleted";
  if (message.type === "text") return message.text ?? "";
  if (message.type === "image") return "📷 Photo";
  if (message.type === "audio") return "🎤 Voice message";
  if (message.type === "file") return `📄 ${message.metadata?.fileName ?? "File"}`;
  return "Message";
}

export function ReplyQuote({ message, compact }: { message: MockMessage; compact?: boolean }) {
  const sender = message.senderId === CURRENT_USER.uid ? CURRENT_USER : getMockUserByUid(message.senderId);
  return (
    <div
      className={`mb-1.5 rounded-lg border-l-2 border-accent bg-black/5 px-2.5 py-1.5 dark:bg-white/5 ${
        compact ? "" : ""
      }`}
    >
      <p className="text-xs font-medium text-accent">{sender?.displayName ?? sender?.userId ?? "Unknown"}</p>
      <p dir="auto" className="truncate text-xs text-ink-muted">
        {labelFor(message)}
      </p>
    </div>
  );
}

export function ComposerReplyBar({ message, onCancel }: { message: MockMessage; onCancel: () => void }) {
  const sender = message.senderId === CURRENT_USER.uid ? CURRENT_USER : getMockUserByUid(message.senderId);
  return (
    <div className="flex items-center gap-2 border-t border-border bg-surface-sunken px-3 py-2">
      <Icon name="reply" size={16} className="shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-accent">
          Replying to {sender?.displayName ?? sender?.userId ?? "Unknown"}
        </p>
        <p dir="auto" className="truncate text-xs text-ink-muted">
          {labelFor(message)}
        </p>
      </div>
      <button
        aria-label="Cancel reply"
        onClick={onCancel}
        className="focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-surface hover:text-ink"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

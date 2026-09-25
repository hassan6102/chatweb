import { Icon } from "@/components/common/Icon";
import { formatRelativeTime } from "@/lib/mock/timestamp";
import type { NotificationItem as NotificationItemType } from "@/types/ui";

const KIND_ICON: Record<NotificationItemType["kind"], Parameters<typeof Icon>[0]["name"]> = {
  message: "send",
  reaction: "smile",
  system: "info",
};

export function NotificationItem({
  notification,
  onClick,
}: {
  notification: NotificationItemType;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="focus-ring flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left last:border-b-0 hover:bg-surface-sunken"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon name={KIND_ICON[notification.kind]} size={16} />
        {!notification.read && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${notification.read ? "text-ink-muted" : "font-medium text-ink"}`}>
            {notification.title}
          </span>
          <span className="shrink-0 text-xs text-ink-faint">{formatRelativeTime(notification.createdAt)}</span>
        </span>
        <span className="block truncate text-xs text-ink-faint">{notification.body}</span>
      </span>
    </button>
  );
}

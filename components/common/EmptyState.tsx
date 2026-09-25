import type { ReactNode } from "react";
import { Icon } from "./Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken text-ink-faint">
        <Icon name={icon} size={26} />
      </span>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="mt-1 max-w-xs text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

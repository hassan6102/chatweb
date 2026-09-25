import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/common/Icon";

export function SettingsSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      {title && (
        <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-ink-faint">{title}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">{children}</div>
    </div>
  );
}

export function SettingsRow({
  icon,
  label,
  description,
  trailing,
  onClick,
  danger,
  href,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  description?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  href?: string;
}) {
  const content = (
    <>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          danger ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"
        }`}
      >
        <Icon name={icon} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${danger ? "text-danger" : "text-ink"}`}>{label}</span>
        {description && <span className="block text-xs text-ink-faint">{description}</span>}
      </span>
      {trailing ?? (onClick || href ? <Icon name="chevronRight" size={16} className="text-ink-faint" /> : null)}
    </>
  );

  const className =
    "flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left last:border-b-0";

  if (href) {
    return (
      <Link href={href} className={`focus-ring hover:bg-surface-sunken ${className}`}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={`focus-ring hover:bg-surface-sunken ${className}`}>
        {content}
      </button>
    );
  }

  // No onClick/href: `trailing` is the interactive element (e.g. a Switch).
  // Rendering this as a <button> would nest an interactive control inside
  // another one, which is invalid HTML and breaks the trailing control.
  return <div className={className}>{content}</div>;
}

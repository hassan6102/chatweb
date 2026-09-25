import type { ReactNode } from "react";
import { AlertIcon } from "@/components/admin/icons";

export function LoadingRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-admin-border">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-6 px-4 py-3.5">
          {Array.from({ length: cols }, (_, c) => (
            <div
              key={c}
              className="h-3.5 animate-pulse rounded bg-admin-canvas"
              style={{ width: c === 0 ? "18%" : `${100 / cols - 6}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-admin-border bg-admin-surface p-4">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-3.5 animate-pulse rounded bg-admin-canvas" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-admin-borderStrong text-admin-textFaint">
        &ndash;
      </div>
      <p className="text-[14px] font-medium text-admin-text">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-admin-textMuted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="text-admin-danger">
        <AlertIcon width={28} height={28} />
      </span>
      <p className="text-[14px] font-medium text-admin-text">Something went wrong</p>
      <p className="max-w-sm text-[13px] text-admin-textMuted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-md border border-admin-border bg-admin-surface px-3.5 py-1.5 text-[13px] font-medium text-admin-text hover:bg-admin-canvas"
        >
          Try again
        </button>
      )}
    </div>
  );
}

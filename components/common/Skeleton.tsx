import type { CSSProperties } from "react";

export function SkeletonBar({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`animate-pulse rounded bg-surface-sunken ${className}`} style={style} />;
}

export function SkeletonAvatar({ className = "h-10 w-10" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-surface-sunken ${className}`} />;
}

export function ConversationListSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-1 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
          <SkeletonAvatar />
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-3 w-2/5" />
            <SkeletonBar className="h-2.5 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-1 flex-col justify-end gap-3 p-4">
      {[40, 60, 30, 70, 45].map((w, i) => (
        <SkeletonBar
          key={i}
          className={`h-9 rounded-2xl ${i % 2 === 0 ? "self-start" : "self-end"}`}
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

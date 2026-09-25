import type { ReactNode } from "react";

export function PageHeading({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-[20px] font-semibold tracking-tight text-admin-text">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-[13.5px] text-admin-textMuted">{description}</p>}
      </div>
      {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({ title, actions, children, className = "" }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-admin-border bg-admin-surface ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-admin-border px-4 py-3">
          {title && <h3 className="text-[13.5px] font-semibold text-admin-text">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

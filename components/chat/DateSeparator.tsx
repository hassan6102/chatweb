export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-medium text-ink-muted">
        {label}
      </span>
    </div>
  );
}

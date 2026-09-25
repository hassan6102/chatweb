"use client";

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2.5">
      <span>
        <span className="block text-[13px] font-medium text-admin-text">{label}</span>
        {description && <span className="block text-[12px] text-admin-textMuted">{description}</span>}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors ${checked ? "bg-admin-accent" : "bg-admin-borderStrong"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
      </span>
    </label>
  );
}

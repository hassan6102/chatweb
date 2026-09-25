"use client";

import { SearchIcon, CloseIcon } from "@/components/admin/icons";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search\u2026",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 min-w-[180px] max-w-sm">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-textFaint">
        <SearchIcon width={15} height={15} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-admin-border bg-admin-surface py-1.5 pl-8 pr-8 text-[13px] text-admin-text placeholder:text-admin-textFaint focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-admin-textFaint hover:text-admin-text"
        >
          <CloseIcon width={13} height={13} />
        </button>
      )}
    </div>
  );
}

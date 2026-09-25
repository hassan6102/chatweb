"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreIcon } from "@/components/admin/icons";

export interface RowMenuItem {
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  icon?: ReactNode;
}

export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
        className="flex h-7 w-7 items-center justify-center rounded-md text-admin-textMuted hover:bg-admin-canvas"
      >
        <MoreIcon width={16} height={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border border-admin-border bg-admin-surface py-1 shadow-[0_8px_24px_rgba(18,20,28,0.14)]">
          {items.map((item) => (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-40 ${
                item.tone === "danger" ? "text-admin-danger hover:bg-admin-dangerSoft" : "text-admin-text hover:bg-admin-canvas"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

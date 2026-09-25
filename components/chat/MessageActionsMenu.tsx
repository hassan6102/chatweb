"use client";

import { Icon } from "@/components/common/Icon";

export interface MessageAction {
  key: string;
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  danger?: boolean;
  onSelect: () => void;
}

export function MessageActionsMenu({
  actions,
  onClose,
  align,
}: {
  actions: MessageAction[];
  onClose: () => void;
  align: "start" | "end";
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        role="menu"
        className={`absolute top-full z-40 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface-raised py-1 shadow-lg ${
          align === "end" ? "right-0" : "left-0"
        }`}
      >
        {actions.map((action) => (
          <button
            key={action.key}
            role="menuitem"
            onClick={() => {
              action.onSelect();
              onClose();
            }}
            className={`focus-ring flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-sunken ${
              action.danger ? "text-danger" : "text-ink"
            }`}
          >
            <Icon name={action.icon} size={16} />
            {action.label}
          </button>
        ))}
      </div>
    </>
  );
}

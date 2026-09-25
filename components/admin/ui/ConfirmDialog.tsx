"use client";

import { useEffect } from "react";
import { AlertIcon } from "@/components/admin/icons";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-admin-ink/40 p-4" role="presentation" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-lg border border-admin-border bg-admin-surface p-5 shadow-[0_12px_32px_rgba(18,20,28,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {tone === "danger" && (
            <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-admin-dangerSoft text-admin-danger">
              <AlertIcon width={16} height={16} />
            </span>
          )}
          <div>
            <h2 id="confirm-dialog-title" className="text-[15px] font-semibold text-admin-text">
              {title}
            </h2>
            <p className="mt-1.5 text-[13px] leading-5 text-admin-textMuted">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-admin-border px-3.5 py-1.5 text-[13px] font-medium text-admin-text hover:bg-admin-canvas disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium text-white disabled:opacity-60 ${
              tone === "danger" ? "bg-admin-danger hover:bg-admin-dangerHover" : "bg-admin-accent hover:bg-admin-accentHover"
            }`}
          >
            {loading ? "Working\u2026" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckIcon, AlertIcon, CloseIcon } from "@/components/admin/icons";

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error";
}

interface ToastContextValue {
  notify: (message: string, tone?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, tone: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 shadow-[0_4px_16px_rgba(18,20,28,0.12)] ${
              t.tone === "success"
                ? "border-admin-success/20 bg-admin-ink text-admin-textInverse"
                : "border-admin-danger/30 bg-admin-ink text-admin-textInverse"
            }`}
          >
            <span className={t.tone === "success" ? "mt-0.5 text-admin-success" : "mt-0.5 text-admin-danger"}>
              {t.tone === "success" ? <CheckIcon width={16} height={16} /> : <AlertIcon width={16} height={16} />}
            </span>
            <p className="flex-1 text-[13px] leading-5">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-admin-textInverseMuted hover:text-admin-textInverse">
              <CloseIcon width={14} height={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useAdminToast must be used within AdminToastProvider");
  return ctx;
}

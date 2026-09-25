import type { ReactNode } from "react";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "@/components/admin/icons";

export interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: { direction: "up" | "down"; label: string } | undefined;
  hint?: string;
}

export function StatCard({ label, value, icon, trend, hint }: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-admin-border bg-admin-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[13px] font-medium text-admin-textMuted">{label}</span>
        <span className="flex-none text-admin-textFaint">{icon}</span>
      </div>
      <div className="flex min-w-0 items-end justify-between gap-2">
        <span className="min-w-0 truncate font-adminMono text-[22px] leading-none tracking-tight text-admin-text sm:text-[26px]">{value}</span>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-[12px] font-medium ${
              trend.direction === "up" ? "text-admin-success" : "text-admin-danger"
            }`}
          >
            {trend.direction === "up" ? <ArrowUpRightIcon width={13} height={13} /> : <ArrowDownRightIcon width={13} height={13} />}
            {trend.label}
          </span>
        )}
      </div>
      {hint && <span className="text-[12px] text-admin-textFaint">{hint}</span>}
    </div>
  );
}

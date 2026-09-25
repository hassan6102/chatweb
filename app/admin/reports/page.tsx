"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/DataTable";
import { Pagination } from "@/components/admin/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/admin/ui/States";
import { ReportStatusBadge } from "@/components/admin/ui/Badge";
import { ReportDetailModal } from "@/components/admin/ReportDetailModal";
import { fetchReports } from "@/lib/admin/api";
import type { ReportDocument, ReportStatus } from "@/types/admin";
import { formatDate, formatRelativeTime } from "@/lib/admin/format";
import { FlagIcon } from "@/components/admin/icons";

const STATUS_TABS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const PAGE_SIZE = 10;

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ReportDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReportDocument | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchReports({ status, page, pageSize: PAGE_SIZE });
      setRows(result.items);
      setTotal(result.total);
    } catch {
      setError("Couldn't load reports.");
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  function handleUpdated(updated: ReportDocument) {
    setRows((prev) => prev.map((r) => (r.reportId === updated.reportId ? updated : r)));
    setSelected(updated);
  }

  const columns: DataTableColumn<ReportDocument>[] = [
    {
      key: "reason",
      header: "Report",
      render: (r) => (
        <div className="flex items-center gap-2">
          <FlagIcon width={15} height={15} className="flex-none text-admin-textFaint" />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-admin-text">{r.reason}</span>
            <span className="block font-adminMono text-[11.5px] text-admin-textFaint">{r.reportId}</span>
          </span>
        </div>
      ),
    },
    { key: "reporter", header: "Reporter", render: (r) => <span className="font-adminMono text-[12.5px] text-admin-textMuted">{r.reportedBy}</span> },
    { key: "reported", header: "Reported user", render: (r) => <span className="font-adminMono text-[12.5px] text-admin-textMuted">{r.reportedUser}</span> },
    { key: "status", header: "Status", render: (r) => <ReportStatusBadge status={r.status} /> },
    { key: "created", header: "Filed", render: (r) => <span className="text-admin-textMuted">{formatDate(r.createdAt)}</span> },
    { key: "updated", header: "Updated", render: (r) => <span className="text-admin-textMuted">{formatRelativeTime(r.updatedAt)}</span> },
  ];

  return (
    <div>
      <PageHeading title="Reports" description="User-submitted reports awaiting or under moderation review." />

      <SectionCard>
        <div className="flex flex-wrap gap-1 border-b border-admin-border p-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                status === tab.value ? "bg-admin-accentSoft text-admin-accent" : "text-admin-textMuted hover:bg-admin-canvas"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.reportId}
            loading={loading}
            onRowClick={setSelected}
            mobileTitle={(r) => columns[0]!.render(r)}
            emptyState={<EmptyState title="No reports found" description={status !== "all" ? "Try a different status filter." : "No reports have been filed yet."} />}
          />
        )}

        {!error && !loading && rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
      </SectionCard>

      {selected && <ReportDetailModal report={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/DataTable";
import { Pagination } from "@/components/admin/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/admin/ui/States";
import { RoleBadge } from "@/components/admin/ui/Badge";
import { fetchAdminLogs } from "@/lib/admin/api";
import { ADMIN_ACTION_LABEL, type AdminLogDocument } from "@/types/admin";
import { formatDateTime } from "@/lib/admin/format";
import { ClipboardIcon } from "@/components/admin/icons";

const PAGE_SIZE = 15;

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminLogDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminLogs({ page, pageSize: PAGE_SIZE });
      setRows(result.items);
      setTotal(result.total);
    } catch {
      setError("Couldn't load activity logs.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: DataTableColumn<AdminLogDocument>[] = [
    {
      key: "admin",
      header: "Admin",
      render: (l) => (
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-admin-text">{l.adminDisplayName ?? "Unknown"}</span>
          <RoleBadge role={l.adminRole} />
        </div>
      ),
    },
    { key: "action", header: "Action", render: (l) => <span className="text-admin-text">{ADMIN_ACTION_LABEL[l.action]}</span> },
    {
      key: "target",
      header: "Target",
      render: (l) => (
        <span className="font-adminMono text-[12.5px] text-admin-textMuted">
          {l.targetLabel ?? l.targetId} <span className="text-admin-textFaint">({l.targetType})</span>
        </span>
      ),
    },
    { key: "when", header: "When", render: (l) => <span className="text-admin-textMuted">{formatDateTime(l.createdAt)}</span> },
  ];

  return (
    <div>
      <PageHeading title="Activity logs" description="An internal audit trail of privileged admin actions." />

      <SectionCard>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(l) => l.logId}
            loading={loading}
            mobileTitle={(l) => (
              <span className="text-[13px] font-medium text-admin-text">
                {l.adminDisplayName ?? "Unknown"} \u2014 {ADMIN_ACTION_LABEL[l.action]}
              </span>
            )}
            emptyState={<EmptyState title="No activity yet" description="Admin actions will appear here as they happen." />}
          />
        )}
        {!error && !loading && rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
      </SectionCard>

      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-admin-textFaint">
        <ClipboardIcon width={13} height={13} />
        Real audit writes must happen server-side, inside the same privileged operation \u2014 see lib/admin/auditLog.ts.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { CloseIcon } from "@/components/admin/icons";
import { ReportStatusBadge } from "@/components/admin/ui/Badge";
import { useAdminToast } from "@/components/admin/ui/Toast";
import { useAdminAuth } from "@/lib/admin/adminAuth";
import { hasPermission, type AdminRole, type ReportDocument, type ReportStatus } from "@/types/admin";
import { setReportStatus } from "@/lib/admin/api";
import { recordAdminAction } from "@/lib/admin/auditLog";
import { formatDateTime } from "@/lib/admin/format";

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

export function ReportDetailModal({
  report,
  onClose,
  onUpdated,
}: {
  report: ReportDocument;
  onClose: () => void;
  onUpdated: (report: ReportDocument) => void;
}) {
  const { notify } = useAdminToast();
  const { role, uid, displayName } = useAdminAuth();
  const canManage = hasPermission(role as any, "reports:manage");
  const [notes, setNotes] = useState(report.resolutionNotes ?? "");
  const [working, setWorking] = useState(false);
  const safeAdminRole = (role ?? "moderator") as AdminRole;

  async function updateStatus(status: ReportStatus) {
    setWorking(true);
    try {
      const updated = await setReportStatus(report.reportId, status, notes || undefined);
      if (updated) {
        onUpdated(updated);
        recordAdminAction({
          adminUid: uid ?? "unknown",
          adminDisplayName: displayName,
          adminRole: safeAdminRole,
          action: "reviewed_report",
          targetType: "report",
          targetId: report.reportId,
          targetLabel: report.reason,
        });
        notify(`Report marked as ${status}.`);
      }
    } catch {
      notify("Couldn't update the report. Please try again.", "error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-admin-ink/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-admin-border bg-admin-surface shadow-[0_16px_40px_rgba(18,20,28,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-admin-border px-4 py-3">
          <div>
            <p className="font-adminMono text-[11.5px] text-admin-textFaint">{report.reportId}</p>
            <h2 className="text-[15px] font-semibold text-admin-text">{report.reason}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-admin-textFaint hover:text-admin-text">
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <ReportStatusBadge status={report.status} />
          </div>

          <dl className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
            <MetaRow label="Reported by" value={<Link href={`/admin/users/${report.reportedBy}`} className="text-admin-accent hover:underline">{report.reportedBy}</Link>} />
            <MetaRow label="Reported user" value={<Link href={`/admin/users/${report.reportedUser}`} className="text-admin-accent hover:underline">{report.reportedUser}</Link>} />
            <MetaRow label="Filed" value={formatDateTime(report.createdAt)} />
            <MetaRow label="Last updated" value={formatDateTime(report.updatedAt)} />
            {report.conversationId && (
              <MetaRow
                label="Related conversation"
                value={
                  <Link href={`/admin/conversations/${report.conversationId}`} className="text-admin-accent hover:underline">
                    {report.conversationId}
                  </Link>
                }
              />
            )}
          </dl>

          {report.details && (
            <div className="mt-4 rounded-md border border-admin-border bg-admin-canvas p-3 text-[13px] text-admin-textMuted">{report.details}</div>
          )}

          {canManage && (
            <div className="mt-5">
              <label htmlFor="resolution-notes" className="mb-1.5 block text-[12.5px] font-medium text-admin-text">
                Resolution notes
              </label>
              <textarea
                id="resolution-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What action was taken, for the record\u2026"
                className="w-full rounded-md border border-admin-border bg-admin-surface p-2.5 text-[13px] text-admin-text placeholder:text-admin-textFaint focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
              />
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2 border-t border-admin-border p-3">
            {STATUS_OPTIONS.filter((s) => s.value !== report.status).map((s) => (
              <button
                key={s.value}
                disabled={working}
                onClick={() => updateStatus(s.value)}
                className="rounded-md border border-admin-border px-3 py-1.5 text-[12.5px] font-medium text-admin-text hover:bg-admin-canvas disabled:opacity-50"
              >
                Mark {s.label.toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11.5px] text-admin-textFaint">{label}</dt>
      <dd className="mt-0.5 truncate text-admin-text">{value}</dd>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { StatCard } from "@/components/admin/ui/StatCard";
import { LoadingCard, ErrorState } from "@/components/admin/ui/States";
import { LineChart } from "@/components/admin/charts/LineChart";
import type { AdminLogDocument, AdminOverviewStats, ReportDocument, TimeSeriesPoint } from "@/types/admin";
import { formatBytes, formatCompactNumber, formatNumber, formatRelativeTime } from "@/lib/admin/format";
import { ADMIN_ACTION_LABEL } from "@/types/admin";
import { ReportStatusBadge } from "@/components/admin/ui/Badge";
import {
  UsersIcon,
  ChatIcon,
  BellIcon as MessageStatIcon,
  FlagIcon,
  ShieldIcon,
  ClockIcon,
  BuildingIcon,
} from "@/components/admin/icons";
import { db } from "@/firebase/client";
import {
  collection,
  collectionGroup,
  getCountFromServer,
  getDocs,
  limit,
  query,
  Timestamp,
  where,
  orderBy,
} from "firebase/firestore";

function dayStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [series, setSeries] = useState<{ messageVolume: TimeSeriesPoint[]; activeUsers: TimeSeriesPoint[] } | null>(null);
  const [logs, setLogs] = useState<AdminLogDocument[]>([]);
  const [reports, setReports] = useState<ReportDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    setSeriesError(null);
    try {
      const usersRef = collection(db, "users");
      const conversationsRef = collection(db, "conversations");
      const messagesRef = collectionGroup(db, "messages");
      const reportsRef = collection(db, "reports");
      const logsRef = collection(db, "adminLogs");
      const today = dayStart(new Date());
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        return date;
      });

      const [
        totalUsersSnapshot,
        onlineUsersSnapshot,
        totalConversationsSnapshot,
        totalMessagesSnapshot,
        disabledUsersSnapshot,
        openReportsSnapshot,
        reportsSnapshot,
        logsSnapshot,
        dailyCounts,
      ] = await Promise.all([
        getCountFromServer(usersRef),
        getCountFromServer(query(usersRef, where("status", "in", ["online", "active"]))),
        getCountFromServer(conversationsRef),
        getCountFromServer(messagesRef),
        getCountFromServer(query(usersRef, where("isDisabled", "==", true))),
        getCountFromServer(query(reportsRef, where("status", "==", "open"))),
        getDocs(query(reportsRef, where("status", "==", "open"), orderBy("createdAt", "desc"), limit(5))),
        getDocs(query(logsRef, orderBy("createdAt", "desc"), limit(5))),
        Promise.all(days.map(async (date) => {
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);
          const start = Timestamp.fromDate(date);
          const end = Timestamp.fromDate(nextDate);
          const [messages, activeUsers] = await Promise.all([
            getCountFromServer(query(messagesRef, where("createdAt", ">=", start), where("createdAt", "<", end))),
            getCountFromServer(query(usersRef, where("lastSeenAt", ">=", start), where("lastSeenAt", "<", end))),
          ]);
          return {
            label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            messageVolume: messages.data().count,
            activeUsers: activeUsers.data().count,
          };
        })).catch((dailyError: unknown) => {
          console.error("Could not load dashboard daily metrics:", dailyError);
          setSeriesError("Daily charts are temporarily unavailable while the Firestore index is building.");
          return null;
        }),
      ]);

      const totalUsers = totalUsersSnapshot.data().count;
      const totalMessages = totalMessagesSnapshot.data().count;
      const messageVolume = dailyCounts?.map(({ label, messageVolume }) => ({ label, value: messageVolume })) ?? [];
      const activeUsers = dailyCounts?.map(({ label, activeUsers }) => ({ label, value: activeUsers })) ?? [];

      setStats({
        totalUsers,
        activeUsers: Math.max(0, totalUsers - disabledUsersSnapshot.data().count),
        onlineUsers: onlineUsersSnapshot.data().count,
        totalConversations: totalConversationsSnapshot.data().count,
        totalMessages,
        messagesToday: dailyCounts ? messageVolume[messageVolume.length - 1]?.value ?? 0 : null,
        messagesThisWeek: dailyCounts ? messageVolume.reduce((total, point) => total + point.value, 0) : null,
        openReports: openReportsSnapshot.data().count,
        blockedUsers: disabledUsersSnapshot.data().count,
        storageUsageBytes: null,
        storageQuotaBytes: null,
      });

      setSeries({ messageVolume, activeUsers });
      setLogs(logsSnapshot.docs.map((snapshot) => ({
        ...snapshot.data(),
        logId: snapshot.id,
      })) as AdminLogDocument[]);
      setReports(reportsSnapshot.docs.map((snapshot) => ({
        ...snapshot.data(),
        reportId: snapshot.id,
      })) as ReportDocument[]);
    } catch (err) {
      console.error("Dashboard error:", err);
      if (err instanceof Error) {
        console.error("Dashboard error details:", {
          name: err.name,
          message: err.message,
          code: "code" in err ? err.code : undefined,
        });
      }
      setError("حدث خطأ أثناء جلب البيانات الحقيقية من فايربيز.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeading title="Overview" description="A snapshot of activity across the messaging app." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loading || !stats ? (
          Array.from({ length: 10 }, (_, i) => <LoadingCard key={i} lines={2} />)
        ) : (
          <>
            <StatCard label="Total users" value={formatNumber(stats.totalUsers)} icon={<UsersIcon />} />
            <StatCard label="Active users" value={formatNumber(stats.activeUsers)} icon={<UsersIcon />} />
            <StatCard label="Online now" value={formatNumber(stats.onlineUsers)} icon={<UsersIcon />} />
            <StatCard label="Conversations" value={formatNumber(stats.totalConversations)} icon={<ChatIcon />} />
            <StatCard label="Total messages" value={formatCompactNumber(stats.totalMessages)} icon={<MessageStatIcon />} />
            <StatCard label="Messages today" value={stats.messagesToday === null ? "—" : formatNumber(stats.messagesToday)} icon={<ClockIcon />} />
            <StatCard label="Messages this week" value={stats.messagesThisWeek === null ? "—" : formatNumber(stats.messagesThisWeek)} icon={<ClockIcon />} />
            <StatCard
              label="Open reports"
              value={formatNumber(stats.openReports)}
              icon={<FlagIcon />}
              hint={stats.openReports > 0 ? "Needs review" : undefined}
            />
            <StatCard label="Blocked users" value={formatNumber(stats.blockedUsers)} icon={<ShieldIcon />} />
            <StatCard label="Storage used" value={stats.storageUsageBytes === null ? "—" : formatBytes(stats.storageUsageBytes)} icon={<BuildingIcon />} hint="Storage metrics are not available in the client dashboard." />
          </>
        )}
      </div>

      {/* باقي الكود الخاص بالرسوم البيانية والسجلات كما هو بدون تغيير */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Message volume, last 7 days">
          <div className="p-4">
            {loading || !series ? <LoadingCard lines={4} /> : seriesError ? <p className="text-sm text-admin-textMuted">{seriesError}</p> : <LineChart data={series.messageVolume} color="#3854E0" />}
          </div>
        </SectionCard>
        <SectionCard title="Active users, last 7 days">
          <div className="p-4">
            {loading || !series ? <LoadingCard lines={4} /> : seriesError ? <p className="text-sm text-admin-textMuted">{seriesError}</p> : <LineChart data={series.activeUsers} color="#1E8F5F" />}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Recent admin activity" actions={<Link href="/admin/logs" className="text-[12.5px] font-medium text-admin-accent hover:underline">View all</Link>}>
          {loading ? (
            <div className="p-4">
              <LoadingCard lines={4} />
            </div>
          ) : logs.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-admin-textMuted">No admin activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-admin-border">
              {logs.map((log) => (
                <li key={log.logId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-admin-text">
                      <span className="font-medium">{log.adminDisplayName ?? "Admin"}</span> {ADMIN_ACTION_LABEL[log.action].toLowerCase()}
                      {log.targetLabel ? <span className="text-admin-textMuted"> — {log.targetLabel}</span> : null}
                    </p>
                  </div>
                  <span className="flex-none font-adminMono text-[12px] text-admin-textFaint">{formatRelativeTime(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Open reports" actions={<Link href="/admin/reports" className="text-[12.5px] font-medium text-admin-accent hover:underline">View all</Link>}>
          {loading ? (
            <div className="p-4">
              <LoadingCard lines={4} />
            </div>
          ) : reports.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-admin-textMuted">No open reports right now.</p>
          ) : (
            <ul className="divide-y divide-admin-border">
              {reports.map((report) => (
                <li key={report.reportId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-admin-text">{report.reason}</p>
                    <p className="font-adminMono text-[11.5px] text-admin-textFaint">{report.reportId}</p>
                  </div>
                  <ReportStatusBadge status={report.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
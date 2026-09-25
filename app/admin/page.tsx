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

// استيراد أدوات فايربيز الحقيقية (ضفنا collectionGroup)
import { db } from "@/firebase/client";
import { collection, collectionGroup, getCountFromServer, query, where } from "firebase/firestore";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [series, setSeries] = useState<{ messageVolume: TimeSeriesPoint[]; activeUsers: TimeSeriesPoint[] } | null>(null);
  const [logs, setLogs] = useState<AdminLogDocument[]>([]);
  const [reports, setReports] = useState<ReportDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // 1. جلب عدد المستخدمين الحقيقي
      const usersRef = collection(db, "users");
      const totalUsersSnap = await getCountFromServer(usersRef);
      const totalUsers = totalUsersSnap.data().count;

      // 2. جلب عدد المتصلين الآن
      let onlineUsers = 0;
      try {
        const onlineQ = query(usersRef, where("status", "in", ["online", "active"]));
        const onlineSnap = await getCountFromServer(onlineQ);
        onlineUsers = onlineSnap.data().count;
      } catch (e) {
        // نتجاهل الخطأ في حال عدم وجود Index
      }

      // 3. جلب إجمالي المحادثات الحقيقية
      const convRef = collection(db, "conversations");
      const totalConvSnap = await getCountFromServer(convRef);
      const totalConversations = totalConvSnap.data().count;

      // 4. جلب إجمالي عدد الرسائل الفعلية (التي سألت عنها)
      let totalMessages = 0;
      try {
        const msgRef = collectionGroup(db, "messages");
        const totalMsgSnap = await getCountFromServer(msgRef);
        totalMessages = totalMsgSnap.data().count;
      } catch (e) {
        console.error("Error fetching messages count:", e);
      }

      setStats({
        totalUsers: totalUsers,
        activeUsers: totalUsers,
        onlineUsers: onlineUsers,
        totalConversations: totalConversations,
        totalMessages: totalMessages, // الآن سيقرأ الـ 8 رسائل وكل الرسائل القادمة
        messagesToday: 0, 
        messagesThisWeek: 0,
        openReports: 0,
        blockedUsers: 0,
        // المساحة تُترك كقيمة جمالية لأن قراءتها تتطلب Firebase Console
        storageUsageBytes: 0,
        storageQuotaBytes: 10 * 1024 * 1024 * 1024, 
      });

      setSeries({ messageVolume: [], activeUsers: [] });
      setLogs([]);
      setReports([]);

    } catch (err) {
      console.error("Dashboard error:", err);
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
            <StatCard label="Messages today" value={formatNumber(stats.messagesToday)} icon={<ClockIcon />} />
            <StatCard label="Messages this week" value={formatNumber(stats.messagesThisWeek)} icon={<ClockIcon />} />
            <StatCard
              label="Open reports"
              value={formatNumber(stats.openReports)}
              icon={<FlagIcon />}
              hint={stats.openReports > 0 ? "Needs review" : undefined}
            />
            <StatCard label="Blocked users" value={formatNumber(stats.blockedUsers)} icon={<ShieldIcon />} />
            <StatCard
              label="Storage used"
              value={formatBytes(stats.storageUsageBytes)}
              icon={<BuildingIcon />}
              hint={`of ${formatBytes(stats.storageQuotaBytes)}`}
            />
          </>
        )}
      </div>

      {/* باقي الكود الخاص بالرسوم البيانية والسجلات كما هو بدون تغيير */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Message volume, last 7 days">
          <div className="p-4">
            {loading || !series ? <LoadingCard lines={4} /> : <LineChart data={series.messageVolume} color="#3854E0" />}
          </div>
        </SectionCard>
        <SectionCard title="Active users, last 7 days">
          <div className="p-4">
            {loading || !series ? <LoadingCard lines={4} /> : <LineChart data={series.activeUsers} color="#1E8F5F" />}
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
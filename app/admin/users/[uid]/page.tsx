"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { LoadingCard, ErrorState, EmptyState } from "@/components/admin/ui/States";
import { AccountStatusBadge, ReportStatusBadge } from "@/components/admin/ui/Badge";
import { UserActionsMenu } from "@/components/admin/UserActionsMenu";
import { PermissionGate } from "@/components/admin/ui/PermissionGate";
import { useAdminAuth } from "@/lib/admin/adminAuth";
import { hasPermission, type AdminRole, type AdminConversationRow, type AdminLogDocument, type AdminUserRow, type ReportDocument, ADMIN_ACTION_LABEL } from "@/types/admin";
import { formatDateTime, formatRelativeTime, maskEmail, maskPhoneNumber } from "@/lib/admin/format";
import { ChevronLeftIcon, ChatIcon, ClockIcon } from "@/components/admin/icons";

// استيراد أدوات فايربيز الحقيقية
import { db } from "@/firebase/client";
import { doc, getDoc, collection, getDocs, query, where, getCountFromServer, collectionGroup } from "firebase/firestore";

type Tab = "overview" | "conversations" | "reports" | "audit";

// دالة الوقت الذكية
function getTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  return 0;
}

export default function UserDetailPage() {
  const params = useParams();
  // التأكد من استخراج الـ ID بشكل صحيح من الرابط
  const rawId = params?.uid || params?.id;
  const uid = rawId ? decodeURIComponent(rawId as string) : "";
  const router = useRouter();
  const { role } = useAdminAuth();

  const canViewPrivate = hasPermission(role as AdminRole | null, "users:view_private");

  const [user, setUser] = useState<AdminUserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const [conversations, setConversations] = useState<AdminConversationRow[] | null>(null);
  const [reports, setReports] = useState<ReportDocument[] | null>(null);
  const [auditHistory, setAuditHistory] = useState<AdminLogDocument[] | null>(null);

  // جلب بيانات المستخدم الأساسية والإحصائيات
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadRealUser = async () => {
      try {
        const uSnap = await getDoc(doc(db, "users", uid));
        if (!uSnap.exists()) {
          if (!cancelled) setError("This user doesn't exist or may have been removed.");
          return;
        }

        const data = uSnap.data();
        let cCount = 0;
        let mCount = 0;

        // حساب عدد المحادثات الفعلي
        try {
          const convQ = query(collection(db, "conversations"), where("participants", "array-contains", uid));
          const cSnap = await getCountFromServer(convQ);
          cCount = cSnap.data().count;
        } catch (e) {
          console.error("Error counting convs:", e);
        }

        // حساب عدد الرسائل الفعلي
        try {
          const msgQ = query(collectionGroup(db, "messages"), where("senderId", "==", uid));
          const mSnap = await getCountFromServer(msgQ);
          mCount = mSnap.data().count;
        } catch (e) {
          console.error("Error counting msgs:", e);
        }

        if (!cancelled) {
          setUser({
            uid: uSnap.id,
            userId: data.userId || uSnap.id,
            displayName: data.displayName || "No name",
            email: data.email || "",
            phoneNumber: data.phoneNumber || "",
            accountStatus: (data.accountStatus || data.status || "active") as any,
            role: data.role || "user",
            conversationCount: cCount,
            messageCount: mCount,
            createdAt: getTimestampMs(data.createdAt || data.timestamp),
            lastLoginAt: getTimestampMs(data.lastLoginAt),
            lastSeenAt: getTimestampMs(data.lastSeenAt || data.updatedAt),
            isOnline: data.status === "online" || data.status === "active",
          } as any);
        }
      } catch (err) {
        console.error("Error loading user:", err);
        if (!cancelled) setError("Couldn't load this user.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRealUser();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // جلب محادثات المستخدم عند الضغط على تبويب Conversations
  useEffect(() => {
    if (tab === "conversations" && conversations === null && uid) {
      const loadUserConvs = async () => {
        try {
          const convQ = query(collection(db, "conversations"), where("participants", "array-contains", uid));
          const snap = await getDocs(convQ);
          const userConvs = snap.docs.map(doc => {
            const data = doc.data();
            return {
              conversationId: doc.id,
              participantUserIds: data.participants || [],
              lastMessage: data.lastMessage || "",
              createdAt: getTimestampMs(data.createdAt),
            } as any;
          });
          setConversations(userConvs);
        } catch (e) {
          console.error("Error loading conversations", e);
          setConversations([]);
        }
      };
      loadUserConvs();
    }
    
    // تصفير التقارير والأرشيف لأننا لم نبنها في فايربيز بعد
    if (tab === "reports" && reports === null) {
      setReports([]);
    }
    if (tab === "audit" && auditHistory === null) {
      setAuditHistory([]);
    }
  }, [tab, uid, conversations, reports, auditHistory]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <LoadingCard lines={3} />
        <LoadingCard lines={5} />
      </div>
    );
  }

  if (error || !user) {
    return <ErrorState message={error ?? "User not found."} />;
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/users")}
        className="mb-3 flex items-center gap-1 text-[13px] font-medium text-admin-textMuted hover:text-admin-text"
      >
        <ChevronLeftIcon width={15} height={15} />
        Back to users
      </button>

      <div className="flex flex-col gap-4 lg:flex-row">
        <SectionCard className="lg:w-80 lg:flex-none">
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-admin-text">{user.email || "بدون إيميل"}</p>
                <p className="truncate text-[13px] text-admin-accent mt-0.5" dir="ltr">{user.phoneNumber || "بدون رقم هاتف"}</p>
                <p className="font-adminMono text-[11px] text-admin-textFaint mt-1">ID: {user.userId}</p>
              </div>
            </div>

            <div className="mt-4">
              <AccountStatusBadge status={user.accountStatus} />
            </div>

            <dl className="mt-4 flex flex-col gap-2.5 text-[13px]">
              <Row label="Email" value={canViewPrivate ? user.email || "—" : maskEmail(user.email || "")} />
              <Row label="Phone" value={user.phoneNumber ? (canViewPrivate ? user.phoneNumber : maskPhoneNumber(user.phoneNumber)) : "Not provided"} />
              <Row label="UID" value={<span className="font-adminMono text-[12px]">{user.uid}</span>} />
              <Row label="Joined" value={(user.createdAt as any) > 0 ? formatDateTime(user.createdAt as any) : "—"} />
              <Row label="Last login" value={(user.lastLoginAt as any) > 0 ? formatDateTime(user.lastLoginAt as any) : "—"} />
              <Row label="Last seen" value={user.isOnline ? "Online now" : ((user.lastSeenAt as any) > 0 ? formatRelativeTime(user.lastSeenAt as any) : "—")} />
              <Row label="Conversations" value={String(user.conversationCount)} />
              <Row label="Messages sent" value={String(user.messageCount)} />
            </dl>

            <PermissionGate permission="users:manage">
              <div className="mt-5 border-t border-admin-border pt-4">
                <p className="mb-2 text-[12px] font-medium text-admin-textMuted">Account actions</p>
                <UserActionsMenuInline user={user} onUpdated={setUser} />
              </div>
            </PermissionGate>
          </div>
        </SectionCard>

        <SectionCard className="flex-1">
          <div className="flex gap-1 overflow-x-auto border-b border-admin-border px-3 pt-2">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
              Overview
            </TabButton>
            <TabButton active={tab === "conversations"} onClick={() => setTab("conversations")}>
              Conversations
            </TabButton>
            <TabButton active={tab === "reports"} onClick={() => setTab("reports")}>
              Reports
            </TabButton>
            <TabButton active={tab === "audit"} onClick={() => setTab("audit")}>
              Audit history
            </TabButton>
          </div>

          <div className="p-4">
            {tab === "overview" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MiniStat label="Conversations" value={String(user.conversationCount)} />
                <MiniStat label="Messages sent" value={String(user.messageCount)} />
                <MiniStat label="Account status" value={user.accountStatus} />
                <MiniStat label="Currently online" value={user.isOnline ? "Yes" : "No"} />
              </div>
            )}

            {tab === "conversations" &&
              (conversations === null ? (
                <LoadingCard lines={4} />
              ) : conversations.length === 0 ? (
                <EmptyState title="No conversations" description="This user hasn't started any conversations yet." />
              ) : (
                <ul className="flex flex-col divide-y divide-admin-border">
                  {conversations.map((c) => (
                    <li key={c.conversationId} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <ChatIcon width={15} height={15} className="flex-none text-admin-textFaint" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] text-admin-text">{c.participantUserIds.join(" ↔ ")}</p>
                          <p className="truncate text-[12px] text-admin-textFaint">{c.lastMessage ?? "No messages yet"}</p>
                        </div>
                      </div>
                      <Link href={`/admin/conversations/${c.conversationId}`} className="flex-none text-[12.5px] font-medium text-admin-accent hover:underline">
                        Review
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}

            {tab === "reports" &&
              (reports === null ? (
                <LoadingCard lines={4} />
              ) : reports.length === 0 ? (
                <EmptyState title="No reports" description="No reports filed by or against this user." />
              ) : (
                <ul className="flex flex-col divide-y divide-admin-border">
                  {reports.map((r) => (
                    <li key={r.reportId} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] text-admin-text">{r.reason}</p>
                        <p className="font-adminMono text-[11.5px] text-admin-textFaint">
                          {r.reportedUser === user.uid ? "Reported by another user" : "Filed by this user"}
                        </p>
                      </div>
                      <ReportStatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              ))}

            {tab === "audit" &&
              (auditHistory === null ? (
                <LoadingCard lines={4} />
              ) : auditHistory.length === 0 ? (
                <EmptyState title="No audit history" description="No admin actions recorded for this user yet." />
              ) : (
                <ul className="flex flex-col divide-y divide-admin-border">
                  {auditHistory.map((log) => (
                    <li key={log.logId} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] text-admin-text">
                          {ADMIN_ACTION_LABEL[log.action]} <span className="text-admin-textMuted">by {log.adminDisplayName ?? "an admin"}</span>
                        </p>
                      </div>
                      <span className="flex flex-none items-center gap-1 font-adminMono text-[11.5px] text-admin-textFaint">
                        <ClockIcon width={12} height={12} />
                        {formatRelativeTime(log.createdAt as any)}
                      </span>
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-admin-textFaint">{label}</dt>
      <dd className="truncate text-right text-admin-text">{value}</dd>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-admin-border p-3">
      <p className="text-[11.5px] text-admin-textFaint">{label}</p>
      <p className="mt-0.5 text-[15px] font-medium capitalize text-admin-text">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-none whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${active ? "border-admin-accent text-admin-accent" : "border-transparent text-admin-textMuted hover:text-admin-text"
        }`}
    >
      {children}
    </button>
  );
}

function UserActionsMenuInline({ user, onUpdated }: { user: AdminUserRow; onUpdated: (u: AdminUserRow) => void }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-admin-border px-2.5 py-1.5">
      <span className="text-[13px] text-admin-text">Manage account</span>
      <UserActionsMenu user={user} onUpdated={onUpdated} showView={false} />
    </div>
  );
}
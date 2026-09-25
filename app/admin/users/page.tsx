"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { SearchInput } from "@/components/admin/ui/SearchInput";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/DataTable";
import { Pagination } from "@/components/admin/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/admin/ui/States";
import { AccountStatusBadge } from "@/components/admin/ui/Badge";
import { UserActionsMenu } from "@/components/admin/UserActionsMenu";
import { PermissionGate } from "@/components/admin/ui/PermissionGate";
import { useAdminAuth } from "@/lib/admin/adminAuth";
import { hasPermission, type AdminAccountStatus, type AdminUserRow } from "@/types/admin";
import { formatDate, formatRelativeTime, initialsFromName, maskEmail, maskPhoneNumber } from "@/lib/admin/format";
import { UsersIcon } from "@/components/admin/icons";

import { db } from "@/firebase/client";
import { collection, getDocs, query, where, getCountFromServer, collectionGroup } from "firebase/firestore";

const STATUS_TABS: { value: AdminAccountStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
  { value: "blocked", label: "Blocked" },
];

const PAGE_SIZE = 10;

function getTimestampMs(val: any): number {
  if (!val) return 0; 
  if (typeof val === "number") return val;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  return 0;
}

export default function AdminUsersPage() {
  const { role } = useAdminAuth();
  const canViewPrivate = hasPermission(role as Parameters<typeof hasPermission>[0], "users:view_private");

  const [queryInput, setQueryInput] = useState("");
  const [status, setStatus] = useState<AdminAccountStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      
      let allUsers = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          userId: data.userId || doc.id,
          displayName: data.displayName || "No name",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          accountStatus: (data.accountStatus || data.status || "active") as AdminAccountStatus,
          role: data.role || "user",
          conversationCount: 0,
          messageCount: 0,     
          createdAt: getTimestampMs(data.createdAt || data.timestamp),
          lastSeenAt: getTimestampMs(data.lastSeenAt || data.updatedAt),
          isOnline: data.status === "online" || data.status === "active",
        } as any;
      });

      if (status !== "all") {
        allUsers = allUsers.filter((u) => u.accountStatus === status);
      }

      if (queryInput) {
        const qStr = queryInput.toLowerCase();
        allUsers = allUsers.filter((u) => 
          (u.displayName && u.displayName.toLowerCase().includes(qStr)) ||
          (u.email && u.email.toLowerCase().includes(qStr)) ||
          (u.phoneNumber && u.phoneNumber.toLowerCase().includes(qStr)) ||
          (u.userId && u.userId.toLowerCase().includes(qStr)) ||
          (u.uid && u.uid.toLowerCase().includes(qStr))
        );
      }

      allUsers.sort((a, b) => (b.createdAt as number) - (a.createdAt as number));
      setTotal(allUsers.length);

      const paginatedUsers = allUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      
      const finalRows: AdminUserRow[] = await Promise.all(paginatedUsers.map(async (u) => {
        let cCount = 0;
        let mCount = 0;
        try {
          const convQ = query(collection(db, "conversations"), where("participants", "array-contains", u.uid));
          const cSnap = await getCountFromServer(convQ);
          cCount = cSnap.data().count;

          const msgQ = query(collectionGroup(db, "messages"), where("senderId", "==", u.uid));
          const mSnap = await getCountFromServer(msgQ);
          mCount = mSnap.data().count;
        } catch (e) {
          console.error(`خطأ في جلب إحصائيات ${u.uid}:`, e);
        }

        return { ...u, conversationCount: cCount, messageCount: mCount } as AdminUserRow;
      }));

      setRows(finalRows);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Couldn't load users.");
    } finally {
      setLoading(false);
    }
  }, [queryInput, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [queryInput, status]);

  function updateRow(updated: AdminUserRow) {
    setRows((prev) => prev.map((r) => (r.uid === updated.uid ? updated : r)));
  }

  const columns: DataTableColumn<AdminUserRow>[] = [
    {
      key: "user",
      header: "User",
      render: (u) => (
        <Link href={`/admin/users/${u.uid}`} className="flex items-center gap-2.5 hover:underline">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-admin-accentSoft text-[11px] font-semibold text-admin-accent">
            {initialsFromName(u.displayName, u.userId)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-admin-text">{u.displayName ?? "No name"}</span>
            <span className="block font-adminMono text-[11.5px] text-admin-textFaint">{u.userId}</span>
          </span>
        </Link>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (u) => <span className="text-admin-textMuted">{canViewPrivate ? (u.email || "—") : maskEmail(u.email || "")}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      render: (u) => (
        <span className="font-adminMono text-[12.5px] text-admin-textMuted">
          {u.phoneNumber ? (canViewPrivate ? u.phoneNumber : maskPhoneNumber(u.phoneNumber)) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <AccountStatusBadge status={u.accountStatus} />,
    },
    {
      key: "counts",
      header: "Activity",
      render: (u) => (
        <span className="text-admin-textMuted">
          {u.conversationCount} chats · {u.messageCount} msgs
        </span>
      ),
    },
    {
      key: "created",
      header: "Joined",
      render: (u) => <span className="text-admin-textMuted">{(u.createdAt as any) > 0 ? formatDate(u.createdAt as any) : "—"}</span>,
    },
    {
      key: "lastSeen",
      header: "Last seen",
      render: (u) => (
        <span className="text-admin-textMuted">
          {u.isOnline ? "Online now" : ((u.lastSeenAt as any) > 0 ? formatRelativeTime(u.lastSeenAt as any) : "—")}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeading title="Users" description="Search, review, and manage user accounts." />

      <SectionCard>
        <div className="flex flex-col gap-3 border-b border-admin-border p-3 sm:flex-row sm:items-center">
          <SearchInput value={queryInput} onChange={setQueryInput} placeholder="Search by user ID, email, phone, or name…" />
          <div className="flex flex-wrap gap-1">
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
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(u) => u.uid}
            loading={loading}
            onRowClick={(u) => (window.location.href = `/admin/users/${u.uid}`)}
            mobileTitle={(u) => columns[0]!.render(u)}
            rowActions={(u) => <UserActionsMenu user={u} onUpdated={updateRow} showView={false} />}
            emptyState={
              <EmptyState
                title="No users found"
                description={queryInput || status !== "all" ? "Try a different search term or filter." : "No users have signed up yet."}
              />
            }
          />
        )}

        {!error && !loading && rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
      </SectionCard>

      <PermissionGate permission="users:view_private" fallback={<PrivacyNote />}>
        <div />
      </PermissionGate>
    </div>
  );
}

function PrivacyNote() {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-[12px] text-admin-textFaint">
      <UsersIcon width={13} height={13} />
      Email and phone number are masked for your role. Contact a super admin if you need full access.
    </p>
  );
}
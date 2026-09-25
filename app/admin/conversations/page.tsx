"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { SearchInput } from "@/components/admin/ui/SearchInput";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/DataTable";
import { Pagination } from "@/components/admin/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/admin/ui/States";
import { Badge } from "@/components/admin/ui/Badge";
import type { AdminConversationRow } from "@/types/admin";
import { formatDate, formatRelativeTime } from "@/lib/admin/format";
import { ChatIcon } from "@/components/admin/icons";

import { db } from "@/firebase/client";
import { collection, getDocs, getCountFromServer } from "firebase/firestore";

const PAGE_SIZE = 10;

function getTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  return Date.now();
}

export default function AdminConversationsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminConversationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const convRef = collection(db, "conversations");
      const snapshot = await getDocs(convRef);
      
      let allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      if (query) {
        const qLower = query.toLowerCase();
        allDocs = allDocs.filter(c => 
          c.id.toLowerCase().includes(qLower) || 
          (c.participants && c.participants.some((p: string) => p.toLowerCase().includes(qLower)))
        );
      }

      allDocs.sort((a, b) => {
        const timeA = getTimestampMs(a.updatedAt || a.createdAt);
        const timeB = getTimestampMs(b.updatedAt || b.createdAt);
        return timeB - timeA;
      });

      setTotal(allDocs.length);

      const paginatedDocs = allDocs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      const finalRows: AdminConversationRow[] = await Promise.all(paginatedDocs.map(async (c) => {
        let msgCount = 0;
        try {
          const msgsRef = collection(db, "conversations", c.id, "messages");
          const countSnap = await getCountFromServer(msgsRef);
          msgCount = countSnap.data().count;
        } catch (e) {
          console.error("Error fetching message count for", c.id, e);
        }

        const lastActivity = getTimestampMs(c.updatedAt || c.createdAt);
        const created = getTimestampMs(c.createdAt);

        return {
          conversationId: c.id,
          participantUserIds: c.participants || [],
          participantUids: c.participants || [],
          type: "direct",
          messageCount: msgCount,
          reportCount: 0,
          lastMessage: c.lastMessage || "",
          lastMessageAt: lastActivity > 0 ? lastActivity : Date.now(),
          createdAt: created > 0 ? created : Date.now(),
        } as any; // تم إضافة as any هنا لتخطي خطأ الأنواع
      }));

      setRows(finalRows);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء جلب المحادثات.");
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const columns: DataTableColumn<AdminConversationRow>[] = [
    {
      key: "participants",
      header: "Participants",
      render: (c) => (
        <Link href={`/admin/conversations/${c.conversationId}`} className="flex items-center gap-2 hover:underline">
          <ChatIcon width={15} height={15} className="flex-none text-admin-textFaint" />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-admin-text">{c.participantUserIds.join(" ↔ ")}</span>
            <span className="block font-adminMono text-[11.5px] text-admin-textFaint">{c.conversationId}</span>
          </span>
        </Link>
      ),
    },
    { key: "type", header: "Type", render: (c) => <span className="capitalize text-admin-textMuted">{c.type}</span> },
    { key: "messages", header: "Messages", render: (c) => <span className="text-admin-textMuted">{c.messageCount}</span> },
    {
      key: "reports",
      header: "Reports",
      render: (c) => (c.reportCount > 0 ? <Badge tone="danger">{c.reportCount}</Badge> : <span className="text-admin-textFaint">—</span>),
    },
    { key: "lastMessageAt", header: "Last activity", render: (c) => <span className="text-admin-textMuted">{formatRelativeTime(c.lastMessageAt as any)}</span> },
    { key: "createdAt", header: "Created", render: (c) => <span className="text-admin-textMuted">{formatDate(c.createdAt as any)}</span> },
  ];

  return (
    <div>
      <PageHeading title="Conversations" description="Every 1-to-1 conversation in the app. Open one to review its messages." />

      <SectionCard>
        <div className="border-b border-admin-border p-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by conversation ID or participant user ID…" />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(c) => c.conversationId}
            loading={loading}
            onRowClick={(c) => (window.location.href = `/admin/conversations/${c.conversationId}`)}
            mobileTitle={(c) => columns[0]!.render(c)}
            emptyState={<EmptyState title="No conversations found" description={query ? "Try a different search term." : "No conversations have been created yet."} />}
          />
        )}

        {!error && !loading && rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
      </SectionCard>
    </div>
  );
}
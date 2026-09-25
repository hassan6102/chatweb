"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConversationItem } from "./ConversationItem";
import { ConversationListSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Icon } from "@/components/common/Icon";
import { db, auth } from "@/firebase/client";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

export function ConversationList({ activeConversationId }: { activeConversationId?: string }) {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // جلب المحادثات الحقيقية التي يشارك فيها المستخدم الحالي من مجموعة conversations العامة
  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "conversations"), where("participants", "array-contains", currentUserId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const convPromises = snapshot.docs.map(async (convDoc) => {
          const data = convDoc.data();
          const participants = data.participants || [];
          const otherUid = participants.find((uid: string) => uid !== currentUserId);

          let otherUser = null;
          if (otherUid) {
            const userSnap = await getDoc(doc(db, "users", otherUid));
            if (userSnap.exists()) {
              otherUser = { uid: userSnap.id, ...userSnap.data() };
            }
          }

          return {
            conversationId: convDoc.id,
            ...data,
            otherUser,
          };
        });

        const resolvedConversations = await Promise.all(convPromises);
        
        // ترتيب المحادثات حسب تاريخ التحديث (الأحدث أولاً)
        resolvedConversations.sort((a: any, b: any) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
          return timeB - timeA;
        });

        setConversations(resolvedConversations);
      } catch (error) {
        console.error("Error fetching conversations list:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // دوال التحكم في المحادثات (تثبيت، كاتم، أرشيف، حذف)
  async function handleTogglePin(convId: string, currentVal: boolean) {
    try {
      await updateDoc(doc(db, "conversations", convId), { pinned: !currentVal });
    } catch (e) { console.error(e); }
  }

  async function handleToggleMute(convId: string, currentVal: boolean) {
    try {
      await updateDoc(doc(db, "conversations", convId), { muted: !currentVal });
    } catch (e) { console.error(e); }
  }

  async function handleToggleArchive(convId: string, currentVal: boolean) {
    try {
      await updateDoc(doc(db, "conversations", convId), { archived: !currentVal });
    } catch (e) { console.error(e); }
  }

  async function handleDelete(convId: string) {
    try {
      await deleteDoc(doc(db, "conversations", convId));
    } catch (e) { console.error(e); }
  }

  const filtered = useMemo(() => {
    const base = conversations.filter((c) => !!c.archived === showArchived);
    if (!queryText.trim()) return base;
    const q = queryText.trim().toLowerCase();
    return base.filter((c) => {
      const user = c.otherUser;
      const name = (c.customName ?? user?.displayName ?? "").toLowerCase();
      const userId = (user?.userId ?? "").toLowerCase();
      return name.includes(q) || userId.includes(q);
    });
  }, [conversations, queryText, showArchived]);

  const pinned = filtered.filter((c) => c.pinned);
  const rest = filtered.filter((c) => !c.pinned);
  const archivedCount = conversations.filter((c) => c.archived).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <div className="relative flex-1">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search name or User ID"
            aria-label="Search conversations"
            className="focus-ring w-full rounded-full border border-border bg-surface-sunken py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>
      </div>

      {!showArchived && archivedCount > 0 && (
        <button
          onClick={() => setShowArchived(true)}
          className="focus-ring mx-3 mb-1 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-ink-muted hover:bg-surface-sunken"
        >
          <Icon name="archive" size={16} />
          Archived ({archivedCount})
        </button>
      )}
      {showArchived && (
        <button
          onClick={() => setShowArchived(false)}
          className="focus-ring mx-3 mb-1 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-ink-muted hover:bg-surface-sunken"
        >
          <Icon name="back" size={16} />
          Back to chats
        </button>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <ConversationListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title={queryText ? "No matches" : showArchived ? "No archived chats" : "No conversations yet"}
            description={
              queryText
                ? "Try a different name or User ID."
                : showArchived
                ? "Chats you archive will show up here."
                : "Start a new chat by entering someone's User ID."
            }
          />
        ) : (
          <div className="flex flex-col gap-0.5">
            {pinned.length > 0 && (
              <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                Pinned
              </p>
            )}
            {pinned.map((c) => (
              <ConversationItem
                key={c.conversationId}
                conversation={c}
                otherUser={c.otherUser}
                active={c.conversationId === activeConversationId}
                onOpen={() => router.push(`/chat/${c.conversationId}`)}
                onTogglePin={() => handleTogglePin(c.conversationId, c.pinned)}
                onToggleMute={() => handleToggleMute(c.conversationId, c.muted)}
                onToggleArchive={() => handleToggleArchive(c.conversationId, c.archived)}
                onDelete={() => handleDelete(c.conversationId)}
              />
            ))}
            {pinned.length > 0 && rest.length > 0 && (
              <p className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                All chats
              </p>
            )}
            {rest.map((c) => (
              <ConversationItem
                key={c.conversationId}
                conversation={c}
                otherUser={c.otherUser}
                active={c.conversationId === activeConversationId}
                onOpen={() => router.push(`/chat/${c.conversationId}`)}
                onTogglePin={() => handleTogglePin(c.conversationId, c.pinned)}
                onToggleMute={() => handleToggleMute(c.conversationId, c.muted)}
                onToggleArchive={() => handleToggleArchive(c.conversationId, c.archived)}
                onDelete={() => handleDelete(c.conversationId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
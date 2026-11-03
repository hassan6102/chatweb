"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConversationItem } from "./ConversationItem";
import { ConversationListSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Icon } from "@/components/common/Icon";
import { Toast } from "@/components/common/Toast";
import { useConversations } from "@/hooks/useConversations";

export function ConversationList({ activeConversationId }: { activeConversationId?: string }) {
  const router = useRouter();
  const { conversations, loading, error, togglePin, toggleMute, toggleArchive, deleteLocally } = useConversations();
  const [queryText, setQueryText] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const base = conversations.filter((conversation) => conversation.archived === showArchived);
    if (!queryText.trim()) return base;
    const query = queryText.trim().toLowerCase();
    return base.filter((conversation) => conversation.customName?.toLowerCase().includes(query));
  }, [conversations, queryText, showArchived]);

  const pinned = filtered.filter((conversation) => conversation.pinned);
  const rest = filtered.filter((conversation) => !conversation.pinned);
  const archivedCount = conversations.filter((conversation) => conversation.archived).length;

  async function runAction(action: () => Promise<void>) {
    try {
      await action();
    } catch (actionError) {
      console.error("Could not update conversation:", actionError);
      setToast("Could not update this conversation. Please try again.");
    }
  }

  function renderConversation(conversation: (typeof conversations)[number]) {
    return (
      <ConversationItem
        key={conversation.conversationId}
        conversation={conversation}
        otherUser={null}
        active={conversation.conversationId === activeConversationId}
        onOpen={() => router.push(`/chat/${conversation.conversationId}`)}
        onTogglePin={() => void runAction(() => togglePin(conversation.conversationId))}
        onToggleMute={() => void runAction(() => toggleMute(conversation.conversationId))}
        onToggleArchive={() => void runAction(() => toggleArchive(conversation.conversationId))}
        onDelete={() => void runAction(() => deleteLocally(conversation.conversationId))}
      />
    );
  }

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
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Search saved contact names"
            aria-label="Search conversations"
            className="focus-ring w-full rounded-xl border border-border bg-surface-sunken py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
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

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <ConversationListSkeleton />
        ) : error ? (
          <p role="alert" className="mx-3 mt-4 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
            Your conversations could not be loaded.
          </p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title={queryText ? "No saved names match" : showArchived ? "No archived chats" : "No conversations yet"}
            description={
              queryText
                ? "Search by a contact name you have saved."
                : showArchived
                  ? "Chats you archive will show up here."
                  : "Start a new chat by entering someone's User ID."
            }
          />
        ) : (
          <div className="flex flex-col gap-1">
            {pinned.length > 0 && (
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Pinned
              </p>
            )}
            {pinned.map(renderConversation)}
            {pinned.length > 0 && rest.length > 0 && (
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                All chats
              </p>
            )}
            {rest.map(renderConversation)}
          </div>
        )}
      </div>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

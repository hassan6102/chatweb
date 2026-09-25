"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { MOCK_MESSAGES } from "@/lib/mock/mockMessages";
import { getMockUserByUid, CURRENT_USER } from "@/lib/mock/mockUsers";
import { MOCK_CONVERSATIONS } from "@/lib/mock/mockConversations";
import { formatRelativeTime } from "@/lib/mock/timestamp";

function SearchMessagesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedConversationId = searchParams.get("conversation");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const pools = scopedConversationId
      ? [[scopedConversationId, MOCK_MESSAGES[scopedConversationId] ?? []] as const]
      : Object.entries(MOCK_MESSAGES);

    return pools.flatMap(([conversationId, messages]) =>
      messages
        .filter((m) => !m.deleted && m.type === "text" && m.text?.toLowerCase().includes(q))
        .map((m) => ({ conversationId, message: m }))
    );
  }, [query, scopedConversationId]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <IconButton aria-label="Back" onClick={() => router.back()}>
          <Icon name="back" size={20} />
        </IconButton>
        <div className="relative flex-1">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={scopedConversationId ? "Search in this chat" : "Search all messages"}
            aria-label="Search messages"
            className="focus-ring w-full rounded-full border border-border bg-surface-sunken py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {!query.trim() ? (
          <EmptyState icon="search" title="Search messages" description="Type to search text messages by content." />
        ) : results.length === 0 ? (
          <EmptyState icon="search" title="No results" description={`No messages match "${query}".`} />
        ) : (
          <ul className="divide-y divide-border">
            {results.map(({ conversationId, message }) => {
              const conversation = MOCK_CONVERSATIONS.find((c) => c.conversationId === conversationId);
              const sender =
                message.senderId === CURRENT_USER.uid ? CURRENT_USER : getMockUserByUid(message.senderId);
              const name = conversation?.customName ?? sender?.displayName ?? sender?.userId ?? "Unknown";
              return (
                <li key={message.messageId}>
                  <button
                    onClick={() => router.push(`/chat/${conversationId}`)}
                    className="focus-ring flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-surface-sunken"
                  >
                    <Avatar name={name} userId={sender?.userId ?? ""} photoURL={sender?.photoURL} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span dir="auto" className="truncate text-sm font-medium text-ink">
                          {name}
                        </span>
                        <span className="shrink-0 text-xs text-ink-faint">
                          {formatRelativeTime(message.createdAt)}
                        </span>
                      </span>
                      <span dir="auto" className="block truncate text-xs text-ink-muted">
                        {message.text}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function SearchMessagesPage() {
  return (
    <Suspense fallback={null}>
      <SearchMessagesInner />
    </Suspense>
  );
}

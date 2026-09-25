"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/conversations/ConversationList";
import { EmptyState } from "@/components/common/EmptyState";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <div className="flex h-full flex-col md:hidden">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h1 className="text-xl font-semibold text-ink">Chats</h1>
          <div className="flex items-center gap-1">
            <IconButton aria-label="Search messages" onClick={() => router.push("/search-messages")}>
              <Icon name="search" size={20} />
            </IconButton>
            <IconButton aria-label="New chat" onClick={() => router.push("/new-chat")}>
              <Icon name="plus" size={20} />
            </IconButton>
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <ConversationList />
        </div>
      </div>

      <div className="hidden h-full md:flex">
        <EmptyState
          icon="send"
          title="Select a conversation"
          description="Choose a chat from the list, or start a new one with someone's User ID."
          action={
            <Link
              href="/new-chat"
              className="focus-ring inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink hover:opacity-90"
            >
              <Icon name="plus" size={16} />
              New chat
            </Link>
          }
        />
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/conversations/ConversationList";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <div className="flex h-full flex-col md:hidden">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Chats</h1>
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

      <div className="relative hidden h-full min-w-0 overflow-hidden bg-surface md:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-40 h-[30rem] w-[30rem] rounded-full bg-accent/5 blur-3xl"
        />
        <section className="relative m-auto flex max-w-xl flex-col items-center px-8 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-accent/20 bg-accent/10 text-accent shadow-lg shadow-accent/5">
            <Icon name="send" size={28} />
          </span>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Your space to connect</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">A good conversation starts here.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
            Choose a conversation from your inbox or find someone with their unique User ID.
          </p>
          <Link
            href="/new-chat"
            className="focus-ring mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink shadow-lg shadow-accent/10 hover:bg-accent/90"
          >
            <Icon name="plus" size={17} />
            Start a conversation
          </Link>
          <div className="mt-10 flex items-center gap-2 text-xs text-ink-faint">
            <Icon name="shield" size={14} />
            Private, direct conversations
          </div>
        </section>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { Avatar } from "@/components/common/Avatar";
import { formatRelativeTime } from "@/lib/mock/timestamp";

export function ConversationItem({
  conversation,
  otherUser,
  active,
  onOpen,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  onDelete,
}: {
  conversation: any;
  otherUser: any;
  active?: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  onToggleMute: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = conversation.customName || otherUser?.displayName || otherUser?.userId || "Contact";
  const isMuted = conversation.muted === true;
  const timeMs = conversation.lastMessageAt?.toMillis?.() ?? null;

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-xl border px-3 py-3 transition ${
        active ? "border-accent/20 bg-accent/10" : "border-transparent hover:bg-surface-sunken"
      }`}
    >
      <button
        onClick={onOpen}
        className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left"
      >
        <Avatar name={displayName} userId={conversation.conversationId} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span dir="auto" className="truncate text-sm font-medium text-ink">
                {displayName}
              </span>
              {conversation.pinned && (
                <Icon name="pin" size={12} className="shrink-0 text-ink-faint" />
              )}
              {isMuted && (
                <Icon name="mute" size={12} className="shrink-0 text-ink-faint" />
              )}
            </span>
            {timeMs !== null && <span className="shrink-0 text-[11px] text-ink-faint">{formatRelativeTime(timeMs)}</span>}
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span dir="auto" className="truncate text-xs text-ink-muted">
              {conversation.lastMessage ?? "No messages yet"}
            </span>
            {conversation.unreadCount > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
                {conversation.unreadCount}
              </span>
            )}
          </span>
        </span>
      </button>

      <div className="relative">
        <button
          aria-label="Conversation options"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-ink-faint opacity-0 transition hover:bg-surface hover:text-ink group-hover:opacity-100 aria-expanded:opacity-100"
        >
          <Icon name="more" size={18} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-border bg-surface-raised py-1 shadow-lg">
              <MenuAction icon="pin" label={conversation.pinned ? "Unpin" : "Pin"} onClick={() => { onTogglePin(); setMenuOpen(false); }} />
              <MenuAction icon="mute" label={isMuted ? "Unmute" : "Mute"} onClick={() => { onToggleMute(); setMenuOpen(false); }} />
              <MenuAction icon="archive" label={conversation.archived ? "Unarchive" : "Archive"} onClick={() => { onToggleArchive(); setMenuOpen(false); }} />
              <MenuAction
                icon="trash"
                label="Remove from inbox"
                danger
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MenuAction({ icon, label, onClick, danger }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; onClick: () => void; danger?: boolean; }) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-sunken ${danger ? "text-danger" : "text-ink"}`}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}
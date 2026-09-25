"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { formatLastSeen } from "@/lib/mock/timestamp";

export function ChatHeader({
  user,
  displayName,
  isTyping,
  onRename,
  onToggleMute,
  muted,
  onSearchInChat,
  onOpenProfile,
  onBlock,
  onUnblock,
  isBlocked,
}: {
  user: any; // تم تحويلها لـ any لتقبل بيانات فايربيز الحقيقية
  displayName: string;
  isTyping?: boolean;
  onRename: () => void;
  onToggleMute: () => void;
  muted: boolean;
  onSearchInChat: () => void;
  onOpenProfile: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  isBlocked: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const subtitle = isTyping
    ? "typing..."
    : user?.status === "active"
    ? "Online"
    : formatLastSeen(user?.lastSeenAt || Date.now());

  return (
    <header className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2.5">
      <Link
        href="/"
        aria-label="Back to chats"
        className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-ink md:hidden"
      >
        <Icon name="back" size={20} />
      </Link>

      <button onClick={onOpenProfile} className="focus-ring flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 text-left">
        <Avatar name={displayName} userId={user?.userId} photoURL={user?.photoURL} status={user?.status} showStatus size="md" />
        <span className="min-w-0">
          <span dir="auto" className="block truncate text-sm font-semibold text-ink">
            {displayName}
          </span>
          <span className={`block truncate text-xs ${isTyping ? "text-accent" : "text-ink-muted"}`}>
            {user?.userId} · {subtitle}
          </span>
        </span>
      </button>

      <IconButton aria-label="Search in conversation" onClick={onSearchInChat}>
        <Icon name="search" size={18} />
      </IconButton>

      <div className="relative">
        <IconButton
          aria-label="Conversation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Icon name="more" size={18} />
        </IconButton>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-border bg-surface-raised py-1 shadow-lg">
              <MenuItem icon="edit" label="Rename contact" onClick={() => { onRename(); setMenuOpen(false); }} />
              <MenuItem icon="mute" label={muted ? "Unmute" : "Mute"} onClick={() => { onToggleMute(); setMenuOpen(false); }} />
              <MenuItem icon="user" label="View profile" onClick={() => { onOpenProfile(); setMenuOpen(false); }} />
              <MenuItem 
                icon="block" 
                label={isBlocked ? "Unblock user" : "Block user"} 
                danger={!isBlocked} 
                onClick={() => { 
                  isBlocked ? onUnblock() : onBlock(); 
                  setMenuOpen(false); 
                }} 
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-sunken ${
        danger ? "text-danger" : "text-ink"
      }`}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}
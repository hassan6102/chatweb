"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";
import { CURRENT_USER } from "@/lib/mock/mockUsers";
import { MOCK_NOTIFICATIONS } from "@/lib/mock/mockNotifications";

const ITEMS: { href: string; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { href: "/", label: "Chats", icon: "home" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function SideRail() {
  const pathname = usePathname();
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <nav
      aria-label="Primary"
      className="hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-border bg-surface py-4 md:flex"
    >
      <Link
        href="/new-chat"
        aria-label="New chat"
        className="focus-ring mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-ink hover:opacity-90"
      >
        <Icon name="plus" size={20} />
      </Link>

      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`focus-ring relative flex h-11 w-11 items-center justify-center rounded-xl ${
              active ? "bg-accent/15 text-accent" : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
            }`}
          >
            <Icon name={item.icon} size={20} />
            {item.href === "/notifications" && unread > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
            )}
          </Link>
        );
      })}

      <div className="flex-1" />

      <Link href="/profile" aria-label="Your profile" className="focus-ring rounded-full">
        <Avatar name={CURRENT_USER.displayName} userId={CURRENT_USER.userId} />
      </Link>
    </nav>
  );
}

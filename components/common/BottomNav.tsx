"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { CURRENT_USER } from "@/lib/mock/mockUsers";
import { MOCK_NOTIFICATIONS } from "@/lib/mock/mockNotifications";
import { Avatar } from "./Avatar";

const TAB_ROUTES = ["/", "/notifications", "/settings", "/profile"];

const TABS: { href: string; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { href: "/", label: "Chats", icon: "home" },
  { href: "/notifications", label: "Alerts", icon: "bell" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  if (!TAB_ROUTES.includes(pathname)) return null;

  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`focus-ring relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
              active ? "text-accent" : "text-ink-faint"
            }`}
          >
            <span className="relative">
              <Icon name={tab.icon} size={22} />
              {tab.href === "/notifications" && unread > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
      <Link
        href="/profile"
        aria-current={pathname === "/profile" ? "page" : undefined}
        className="focus-ring flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-ink-faint"
      >
        <Avatar name={CURRENT_USER.displayName} userId={CURRENT_USER.userId} size="sm" />
        You
      </Link>
    </nav>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/components/admin/navConfig";
import { MenuIcon, ChevronDownIcon, LogoutIcon } from "@/components/admin/icons";
import { RoleBadge } from "@/components/admin/ui/Badge";
import { initialsFromName } from "@/lib/admin/format";
import { logout } from "@/lib/auth/authService";
import type { AdminRole } from "@/types/admin";

function currentSectionLabel(pathname: string): string {
  const match = [...ADMIN_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? "Admin";
}

export function AdminHeader({
  role,
  displayName,
  email,
  onOpenMobileNav,
  isDevOverride,
}: {
  role: AdminRole | null;
  displayName: string | null;
  email: string | null;
  onOpenMobileNav: () => void;
  isDevOverride: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    if (!isDevOverride) {
      await logout();
    }
    router.replace("/login");
  }

  return (
    <header className="flex h-14 flex-none items-center gap-3 border-b border-admin-border bg-admin-surface px-4 sm:px-6">
      <button
        onClick={onOpenMobileNav}
        aria-label="Open menu"
        className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-admin-textMuted hover:bg-admin-canvas md:hidden"
      >
        <MenuIcon width={18} height={18} />
      </button>
      <h1 className="flex-1 truncate text-[14px] font-semibold text-admin-text">{currentSectionLabel(pathname)}</h1>

      {isDevOverride && (
        <span className="hidden rounded-md bg-admin-warningSoft px-2 py-1 text-[11px] font-medium text-admin-warning sm:inline-block">
          Dev role override
        </span>
      )}

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-admin-canvas"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-admin-accentSoft text-[12px] font-semibold text-admin-accent">
            {initialsFromName(displayName, email ?? "Admin")}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[13px] font-medium leading-tight text-admin-text">{displayName ?? "Admin"}</span>
          </span>
          <ChevronDownIcon width={14} height={14} className="hidden text-admin-textFaint sm:block" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-40 mt-1.5 w-56 rounded-lg border border-admin-border bg-admin-surface py-1.5 shadow-[0_8px_24px_rgba(18,20,28,0.12)]">
            <div className="px-3 py-2">
              <p className="truncate text-[13px] font-medium text-admin-text">{displayName ?? "Admin"}</p>
              {email && <p className="truncate text-[12px] text-admin-textMuted">{email}</p>}
              <div className="mt-1.5">{role && <RoleBadge role={role} />}</div>
            </div>
            <div className="my-1 border-t border-admin-border" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-admin-danger hover:bg-admin-dangerSoft"
            >
              <LogoutIcon width={15} height={15} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

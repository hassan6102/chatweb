"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/components/admin/navConfig";
import { hasPermission, type AdminRole } from "@/types/admin";
import { CloseIcon } from "@/components/admin/icons";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  role,
  mobileOpen,
  onCloseMobile,
}: {
  role: AdminRole | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const items = ADMIN_NAV_ITEMS.filter((item) => hasPermission(role, item.permission));

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-2.5 py-3">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onCloseMobile}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-medium transition-colors ${
              active ? "bg-admin-ink2 text-admin-textInverse" : "text-admin-textInverseMuted hover:bg-admin-ink2 hover:text-admin-textInverse"
            }`}
          >
            <Icon width={17} height={17} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop / tablet rail */}
      <aside className="hidden w-60 flex-none flex-col border-r border-admin-ink3 bg-admin-ink md:flex">
        <SidebarBrand />
        {nav}
      </aside>

      {/* Mobile off-canvas drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-admin-ink/50" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-admin-ink shadow-xl">
            <div className="flex items-center justify-between">
              <SidebarBrand />
              <button
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="mr-3 flex h-8 w-8 items-center justify-center rounded-md text-admin-textInverseMuted hover:bg-admin-ink2 hover:text-admin-textInverse"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-2 px-4 py-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-admin-accent font-adminMono text-[12px] font-bold text-white">
        GH
      </span>
      <div className="leading-tight">
        <p className="text-[13.5px] font-semibold text-admin-textInverse">Admin console</p>
        <p className="text-[11px] text-admin-textInverseMuted">Ghosn messaging</p>
      </div>
    </div>
  );
}

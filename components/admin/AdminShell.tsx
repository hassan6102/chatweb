"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin/adminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminToastProvider } from "@/components/admin/ui/Toast";
import { ShieldIcon, LockIcon } from "@/components/admin/icons";

// Uses the "adminSans" font family registered in tailwind.config.ts, which
// resolves to the --font-admin-sans CSS variable set by app/admin/layout.tsx.
const adminSansStack = "font-adminSans";

export function AdminShell({ children }: { children: ReactNode }) {
  const { loading, isAdmin, role, uid, displayName, email, isDevOverride } = useAdminAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-admin-canvas ${adminSansStack}`}>
        <div className="flex flex-col items-center gap-3 text-admin-textMuted">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-admin-border border-t-admin-accent" />
          <p className="text-[13px]">Checking admin access\u2026</p>
        </div>
      </div>
    );
  }

  if (!uid) {
    return (
      <AccessScreen
        icon={<LockIcon width={22} height={22} />}
        title="Sign in required"
        description="You need to sign in with an authorized admin account to reach the admin console."
        actionLabel="Go to sign in"
        onAction={() => router.replace("/login")}
      />
    );
  }

  if (!isAdmin || !role) {
    return (
      <AccessScreen
        icon={<ShieldIcon width={22} height={22} />}
        title="Access denied"
        description="Your account doesn't have an admin role assigned. Ask a super admin to grant you access, then reload this page."
        actionLabel="Back to app"
        onAction={() => router.replace("/")}
      />
    );
  }

  return (
    <AdminToastProvider>
      <div className={`flex min-h-screen bg-admin-canvas ${adminSansStack}`}>
        <AdminSidebar role={role as any} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />        <div className="flex min-h-screen flex-1 flex-col md:pl-0">
          <AdminHeader
            role={role as any}
            displayName={displayName}
            email={email}
            isDevOverride={isDevOverride}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
}

function AccessScreen({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-admin-canvas px-6 ${adminSansStack}`}>
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border border-admin-border bg-admin-surface p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-admin-dangerSoft text-admin-danger">{icon}</span>
        <h1 className="text-[16px] font-semibold text-admin-text">{title}</h1>
        <p className="text-[13px] leading-5 text-admin-textMuted">{description}</p>
        <button
          onClick={onAction}
          className="mt-2 rounded-md bg-admin-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-admin-accentHover"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

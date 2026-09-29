"use client";

import type { ReactNode } from "react";
import { useAdminAuth } from "@/lib/admin/adminAuth";
import { hasPermission, type AdminPermission } from "@/types/admin";

/**
 * Hides UI the current admin role cannot use. This is a UX convenience
 * only, not a security boundary — the real check must happen server-side.
 * See docs/SECURITY.md.
 */
export function PermissionGate({ permission, fallback = null, children }: { permission: AdminPermission; fallback?: ReactNode; children: ReactNode }) {
  const { role } = useAdminAuth();
if (!hasPermission(role as any, permission)) return <>{fallback}</>;
  return <>{children}</>;
}

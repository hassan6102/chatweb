import type { AdminAction, AdminLogTargetType, AdminRole } from "@/types/admin";
import { MOCK_ADMIN_LOGS } from "@/lib/admin/mockData";

/**
 * BACKEND INTEGRATION POINT
 * -------------------------
 * This currently only prepends to the in-memory mock log list so the
 * Activity Logs screen reflects actions taken during this session. Real
 * audit writes must happen server-side (inside the same Route Handler /
 * Cloud Function that performs the privileged action), never from the
 * client alone — a client-only log is trivially spoofable and cannot be
 * trusted as an audit trail. See docs/DATABASE.md (`adminLogs/{logId}`,
 * currently fully server-locked) and docs/SECURITY.md.
 */
export function recordAdminAction(entry: {
  adminUid: string;
  adminDisplayName: string | null;
  adminRole: AdminRole;
  action: AdminAction;
  targetType: AdminLogTargetType;
  targetId: string;
  targetLabel?: string | null;
}): void {
  MOCK_ADMIN_LOGS.unshift({
    logId: `log_${Math.random().toString(36).slice(2, 9)}`,
    adminUid: entry.adminUid,
    adminDisplayName: entry.adminDisplayName,
    adminRole: entry.adminRole,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    targetLabel: entry.targetLabel ?? null,
    metadata: null,
    createdAt: { toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as never,
  });
}

export const REVIEW_SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface ReviewSession {
  conversationId: string;
  startedAt: number;
  expiresAt: number;
}

/**
 * Starts a time-limited, read-only conversation review session and audit-
 * logs the access immediately (per docs/TASKS.md: "read-only review
 * experience... time-limited... internally audited").
 *
 * This is a foundation, not the finished feature: it does not yet grant or
 * check any server-side capability — the real design needs a short-lived
 * server-issued token (e.g. a custom Firebase Auth claim scoped to one
 * conversation, or a signed Route Handler session cookie) so a client
 * cannot simply keep calling this function to stay "in review" forever.
 * Never build the real version as client-side impersonation of the user's
 * own session — it must always be a separate, clearly-labeled admin view.
 */
export function startReviewSession(
  conversationId: string,
  admin: { uid: string; displayName: string | null; role: AdminRole }
): ReviewSession {
  const startedAt = Date.now();
  recordAdminAction({
    adminUid: admin.uid,
    adminDisplayName: admin.displayName,
    adminRole: admin.role,
    action: "viewed_conversation",
    targetType: "conversation",
    targetId: conversationId,
  });
  return { conversationId, startedAt, expiresAt: startedAt + REVIEW_SESSION_DURATION_MS };
}

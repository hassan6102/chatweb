import type { Timestamp } from "firebase/firestore";

/**
 * Admin roles, expected to be set as a Firebase Auth custom claim
 * (`claims.role`) by trusted server-side code once an admin account is
 * provisioned. See lib/admin/adminAuth.ts — this app never grants a role,
 * it only reads one that already exists on the ID token.
 */
export type AdminRole = "super_admin" | "admin" | "moderator";

export const ADMIN_ROLES: AdminRole[] = ["super_admin", "admin", "moderator"];

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  moderator: "Moderator",
};

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export type AdminPermission =
  | "overview:view"
  | "users:view"
  | "users:view_private" // phone number, email
  | "users:manage" // disable/enable/block/unblock/reset password/force logout
  | "conversations:view"
  | "conversations:review" // open message content
  | "reports:view"
  | "reports:manage" // change status, resolve, dismiss
  | "notifications:send"
  | "logs:view"
  | "security:view"
  | "security:manage" // manage admin allow-list / roles
  | "statistics:view"
  | "settings:view"
  | "settings:manage"; // change roles/allow-list/global settings, super admin only

/**
 * Frontend visibility is NOT security. This matrix only controls what the
 * Admin UI shows/enables; the source of truth must be Firestore Security
 * Rules + Admin SDK checks once the backend catches up (see docs/SECURITY.md
 * and docs/TASKS.md — "For Claude Code #3").
 */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  moderator: [
    "overview:view",
    "users:view",
    "conversations:view",
    "conversations:review",
    "reports:view",
    "reports:manage",
    "logs:view",
    "statistics:view",
    "settings:view",
  ],
  admin: [
    "overview:view",
    "users:view",
    "users:view_private",
    "users:manage",
    "conversations:view",
    "conversations:review",
    "reports:view",
    "reports:manage",
    "notifications:send",
    "logs:view",
    "security:view",
    "statistics:view",
    "settings:view",
  ],
  super_admin: [
    "overview:view",
    "users:view",
    "users:view_private",
    "users:manage",
    "conversations:view",
    "conversations:review",
    "reports:view",
    "reports:manage",
    "notifications:send",
    "logs:view",
    "security:view",
    "security:manage",
    "statistics:view",
    "settings:view",
    "settings:manage",
  ],
};

export function hasPermission(role: AdminRole | null, permission: AdminPermission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

// ---------------------------------------------------------------------------
// reports/{reportId} — see docs/DATABASE.md. Field names match
// firestore.rules (`reportedBy`).
// ---------------------------------------------------------------------------

export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface ReportDocument {
  reportId: string;
  /** uid of the user who filed the report. */
  reportedBy: string;
  /** uid of the user being reported. */
  reportedUser: string;
  reason: string;
  details: string | null;
  conversationId: string | null;
  messageId: string | null;
  status: ReportStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedBy: string | null;
  resolutionNotes: string | null;
}

// ---------------------------------------------------------------------------
// adminLogs/{logId} — internal audit trail, admin/server-write only.
// ---------------------------------------------------------------------------

export type AdminAction =
  | "viewed_user"
  | "viewed_conversation"
  | "reset_password"
  | "disabled_account"
  | "enabled_account"
  | "forced_logout"
  | "blocked_user"
  | "unblocked_user"
  | "reviewed_report"
  | "sent_notification";

export const ADMIN_ACTION_LABEL: Record<AdminAction, string> = {
  viewed_user: "Viewed user",
  viewed_conversation: "Viewed conversation",
  reset_password: "Reset password",
  disabled_account: "Disabled account",
  enabled_account: "Enabled account",
  forced_logout: "Forced logout",
  blocked_user: "Blocked user",
  unblocked_user: "Unblocked user",
  reviewed_report: "Reviewed report",
  sent_notification: "Sent notification",
};

export type AdminLogTargetType = "user" | "conversation" | "message" | "report" | "system";

export interface AdminLogDocument {
  logId: string;
  adminUid: string;
  adminDisplayName: string | null;
  adminRole: AdminRole;
  action: AdminAction;
  targetType: AdminLogTargetType;
  targetId: string;
  targetLabel: string | null;
  metadata: Record<string, string> | null;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Admin-facing user row/detail shapes. Built from UserDocument
// (types/user.ts) plus admin-only aggregates that don't live on the user
// doc itself (conversationCount, messageCount are computed, not stored).
// ---------------------------------------------------------------------------

export type AdminAccountStatus = "active" | "disabled" | "blocked";

export interface AdminUserRow {
  uid: string;
  userId: string;
  displayName: string | null;
  email: string;
  phoneNumber: string | null;
  photoURL: string | null;
  accountStatus: AdminAccountStatus;
  createdAt: Timestamp;
  lastLoginAt: Timestamp | null;
  lastSeenAt: Timestamp | null;
  conversationCount: number;
  messageCount: number;
  isOnline: boolean;
}

// ---------------------------------------------------------------------------
// Conversation review shapes
// ---------------------------------------------------------------------------

export interface AdminConversationRow {
  conversationId: string;
  type: "direct" | "group";
  participantUserIds: string[];
  participantUids: string[];
  messageCount: number;
  lastMessage: string | null;
  lastMessageAt: Timestamp | null;
  createdAt: Timestamp;
  reportCount: number;
}

export interface AdminMessageRow {
  messageId: string;
  senderUid: string;
  senderUserId: string;
  senderDisplayName: string | null;
  type: "text" | "image" | "audio" | "file" | "system";
  text: string | null;
  createdAt: Timestamp;
  deleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
  hasAttachment: boolean;
}

// ---------------------------------------------------------------------------
// Admin communication / notifications
// ---------------------------------------------------------------------------

export type NotificationAudience = "all_users" | "selected_users";

export interface AdminNotificationDocument {
  notificationId: string;
  title: string;
  body: string;
  audience: NotificationAudience;
  recipientUids: string[];
  sentBy: string;
  sentByDisplayName: string | null;
  createdAt: Timestamp;
  deliveredCount: number;
  readCount: number;
  recipientCount: number;
}

// ---------------------------------------------------------------------------
// Overview / statistics
// ---------------------------------------------------------------------------

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  totalConversations: number;
  totalMessages: number;
  messagesToday: number;
  messagesThisWeek: number;
  openReports: number;
  blockedUsers: number;
  storageUsageBytes: number;
  storageQuotaBytes: number;
}

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

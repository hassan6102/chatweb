import type { Timestamp } from "firebase/firestore";
import type {
  AdminAccountStatus,
  AdminAction,
  AdminConversationRow,
  AdminLogDocument,
  AdminLogTargetType,
  AdminMessageRow,
  AdminNotificationDocument,
  AdminOverviewStats,
  AdminRole,
  AdminUserRow,
  ReportDocument,
  ReportStatus,
  TimeSeriesPoint,
} from "@/types/admin";

/**
 * Everything in this file is MOCK DATA for the Admin UI foundation phase.
 * Nothing here reads or writes real Firestore/RTDB data.
 *
 * BACKEND INTEGRATION POINT: once the Admin SDK-backed Route Handlers
 * described in docs/TASKS.md ("For Claude Code #3") exist, replace the
 * functions in lib/admin/api/*.ts (which currently call into this file)
 * with real fetch() calls, and this file can be deleted.
 *
 * A fixed-seed PRNG is used (never Math.random directly) so the generated
 * data is identical on every render — avoids hydration mismatches and
 * makes the demo reproducible.
 */

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260701);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)] as T;
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy.splice(idx, 1)[0] as T);
  }
  return out;
}

function intBetween(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/** Mimics a Firestore Timestamp closely enough for display code (toDate()/seconds). */
function ts(msAgo: number): Timestamp {
  const date = new Date(Date.now() - msAgo);
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
    toMillis: () => date.getTime(),
  } as unknown as Timestamp;
}

const DAY = 24 * 60 * 60 * 1000;

const FIRST_NAMES = [
  "Amara", "Yusuf", "Lina", "Omar", "Sara", "Karim", "Nour", "Hassan",
  "Mona", "Tarek", "Farah", "Ziad", "Rana", "Adam", "Salma", "Marwan",
  "Dina", "Khaled", "Hana", "Youssef", "Laila", "Mostafa", "Aya", "Sami",
];
const LAST_NAMES = [
  "El-Sayed", "Hassan", "Fahmy", "Ibrahim", "Naguib", "Rashad", "Kamal",
  "Zaki", "Hamdy", "Aziz", "Farouk", "Nasser", "Shafik", "Gomaa", "Adel",
];

function randomDisplayName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function randomUserIdCode(): string {
  return `GH-${intBetween(10000, 99999)}`;
}

function randomUid(index: number): string {
  return `uid_${index.toString(36).padStart(6, "0")}`;
}

function randomPhone(): string {
  return `+20 1${intBetween(0, 2)} ${intBetween(1000, 9999)} ${intBetween(1000, 9999)}`;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const USER_COUNT = 64;

const ACCOUNT_STATUSES: AdminAccountStatus[] = ["active", "active", "active", "active", "disabled", "blocked"];

export const MOCK_USERS: AdminUserRow[] = Array.from({ length: USER_COUNT }, (_, i) => {
  const createdMsAgo = intBetween(2, 400) * DAY;
  const lastSeenMsAgo = intBetween(0, 20) * DAY;
  const status = pick(ACCOUNT_STATUSES);
  return {
    uid: randomUid(i + 1),
    userId: randomUserIdCode(),
    displayName: rand() > 0.06 ? randomDisplayName() : null,
    email: `user${i + 1}@example.com`,
    phoneNumber: rand() > 0.1 ? randomPhone() : null,
    photoURL: null,
    accountStatus: status,
    createdAt: ts(createdMsAgo),
    lastLoginAt: ts(intBetween(0, 30) * DAY),
    lastSeenAt: ts(lastSeenMsAgo),
    conversationCount: intBetween(0, 40),
    messageCount: intBetween(0, 3000),
    isOnline: status === "active" && lastSeenMsAgo < 5 * 60 * 1000 + rand() * DAY * 0.02,
  };
});

// Recompute isOnline with a clean, small, explicit probability instead of the
// noisy formula above (kept simple / legible).
MOCK_USERS.forEach((u, i) => {
  u.isOnline = u.accountStatus === "active" && i % 7 === 0;
});

export function findMockUser(uid: string): AdminUserRow | null {
  return MOCK_USERS.find((u) => u.uid === uid) ?? null;
}

// ---------------------------------------------------------------------------
// Conversations + messages
// ---------------------------------------------------------------------------

const CONVERSATION_COUNT = 40;

export const MOCK_CONVERSATIONS: AdminConversationRow[] = Array.from({ length: CONVERSATION_COUNT }, (_, i) => {
  const [a, b] = pickN(MOCK_USERS, 2);
  const messageCount = intBetween(1, 400);
  return {
    conversationId: `conv_${(i + 1).toString(36).padStart(6, "0")}`,
    type: "direct",
    participantUserIds: [a!.userId, b!.userId],
    participantUids: [a!.uid, b!.uid],
    messageCount,
    lastMessage: pick([
      "Sounds good, see you then.",
      "Can you send that file again?",
      "Haha, exactly!",
      "Let me check and get back to you.",
      "Thanks so much for your help.",
      "This message was deleted.",
      "Where should we meet?",
    ]),
    lastMessageAt: ts(intBetween(0, 14) * DAY),
    createdAt: ts(intBetween(15, 400) * DAY),
    reportCount: rand() > 0.85 ? intBetween(1, 3) : 0,
  };
});

export function findMockConversation(id: string): AdminConversationRow | null {
  return MOCK_CONVERSATIONS.find((c) => c.conversationId === id) ?? null;
}

const SAMPLE_TEXTS = [
  "Hey! How's it going?",
  "Did you get a chance to look at this?",
  "I'll be there in 10 minutes.",
  "Thanks, appreciate it.",
  "Can we reschedule to tomorrow?",
  "That works for me.",
  "Sorry, missed your call — what's up?",
  "Sending the file over now.",
  "Sounds like a plan.",
  "Let me know if anything changes.",
];

export function getMockMessages(conversationId: string): AdminMessageRow[] {
  const convo = findMockConversation(conversationId);
  if (!convo) return [];
  const seedOffset = conversationId.length;
  const count = Math.min(convo.messageCount, 60);
  const participants = convo.participantUids.map((uid) => findMockUser(uid)).filter(Boolean) as AdminUserRow[];
  return Array.from({ length: count }, (_, i) => {
    const sender = participants[(i + seedOffset) % participants.length] ?? participants[0]!;
    const deleted = rand() > 0.94;
    return {
      messageId: `${conversationId}_msg_${i}`,
      senderUid: sender.uid,
      senderUserId: sender.userId,
      senderDisplayName: sender.displayName,
      type: rand() > 0.92 ? "image" : "text",
      text: deleted ? null : pick(SAMPLE_TEXTS),
      createdAt: ts((count - i) * 40 * 60 * 1000),
      deleted,
      deletedAt: deleted ? ts((count - i) * 40 * 60 * 1000 - 60000) : null,
      deletedBy: deleted ? sender.uid : null,
      hasAttachment: rand() > 0.92,
    };
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

const REPORT_REASONS = [
  "Spam or unwanted messages",
  "Harassment or bullying",
  "Impersonation",
  "Inappropriate content",
  "Scam or fraud attempt",
  "Threatening behavior",
];

const REPORT_STATUSES: ReportStatus[] = ["open", "open", "reviewing", "resolved", "dismissed"];

const REPORT_COUNT = 22;

export const MOCK_REPORTS: ReportDocument[] = Array.from({ length: REPORT_COUNT }, (_, i) => {
  const [reporter, reported] = pickN(MOCK_USERS, 2);
  const convo = pick(MOCK_CONVERSATIONS);
  const status = pick(REPORT_STATUSES);
  return {
    reportId: `report_${(i + 1).toString(36).padStart(5, "0")}`,
    reportedBy: reporter!.uid,
    reportedUser: reported!.uid,
    reason: pick(REPORT_REASONS),
    details: rand() > 0.4 ? "Reported via in-app report flow." : null,
    conversationId: convo.conversationId,
    messageId: rand() > 0.3 ? `${convo.conversationId}_msg_0` : null,
    status,
    createdAt: ts(intBetween(0, 60) * DAY),
    updatedAt: ts(intBetween(0, 20) * DAY),
    resolvedBy: status === "resolved" || status === "dismissed" ? MOCK_USERS[0]!.uid : null,
    resolutionNotes: status === "resolved" ? "Reviewed and actioned per policy." : status === "dismissed" ? "No policy violation found." : null,
  };
});

export function findMockReport(id: string): ReportDocument | null {
  return MOCK_REPORTS.find((r) => r.reportId === id) ?? null;
}

// ---------------------------------------------------------------------------
// Admin activity logs
// ---------------------------------------------------------------------------

const ADMIN_ACTIONS: AdminAction[] = [
  "viewed_user",
  "viewed_conversation",
  "reset_password",
  "disabled_account",
  "enabled_account",
  "forced_logout",
  "blocked_user",
  "unblocked_user",
  "reviewed_report",
  "sent_notification",
];

const ADMIN_TARGET_TYPE_BY_ACTION: Record<AdminAction, AdminLogTargetType> = {
  viewed_user: "user",
  viewed_conversation: "conversation",
  reset_password: "user",
  disabled_account: "user",
  enabled_account: "user",
  forced_logout: "user",
  blocked_user: "user",
  unblocked_user: "user",
  reviewed_report: "report",
  sent_notification: "system",
};

const MOCK_ADMIN_IDENTITIES: { uid: string; displayName: string; role: AdminRole }[] = [
  { uid: "admin_uid_1", displayName: "Nadia Rostom", role: "super_admin" },
  { uid: "admin_uid_2", displayName: "Peter Youssef", role: "admin" },
  { uid: "admin_uid_3", displayName: "Rania Sobhy", role: "moderator" },
];

const LOG_COUNT = 80;

export const MOCK_ADMIN_LOGS: AdminLogDocument[] = Array.from({ length: LOG_COUNT }, (_, i) => {
  const action = pick(ADMIN_ACTIONS);
  const admin = pick(MOCK_ADMIN_IDENTITIES);
  const targetType = ADMIN_TARGET_TYPE_BY_ACTION[action];
  let targetId = "system";
  let targetLabel: string | null = null;
  if (targetType === "user") {
    const u = pick(MOCK_USERS);
    targetId = u.uid;
    targetLabel = u.userId;
  } else if (targetType === "conversation") {
    const c = pick(MOCK_CONVERSATIONS);
    targetId = c.conversationId;
    targetLabel = c.participantUserIds.join(" \u2194 ");
  } else if (targetType === "report") {
    const r = pick(MOCK_REPORTS);
    targetId = r.reportId;
    targetLabel = r.reason;
  }
  return {
    logId: `log_${(i + 1).toString(36).padStart(6, "0")}`,
    adminUid: admin.uid,
    adminDisplayName: admin.displayName,
    adminRole: admin.role,
    action,
    targetType,
    targetId,
    targetLabel,
    metadata: null,
    createdAt: ts(intBetween(0, 45) * DAY),
  };
}).sort((a, b) => (b.createdAt as unknown as { seconds: number }).seconds - (a.createdAt as unknown as { seconds: number }).seconds);

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const MOCK_NOTIFICATIONS: AdminNotificationDocument[] = [
  {
    notificationId: "notif_00001",
    title: "Scheduled maintenance tonight",
    body: "The app will be briefly unavailable between 2:00 and 2:15 AM UTC for maintenance.",
    audience: "all_users",
    recipientUids: [],
    sentBy: "admin_uid_1",
    sentByDisplayName: "Nadia Rostom",
    createdAt: ts(2 * DAY),
    deliveredCount: MOCK_USERS.length - 3,
    readCount: Math.floor(MOCK_USERS.length * 0.6),
    recipientCount: MOCK_USERS.length,
  },
  {
    notificationId: "notif_00002",
    title: "New privacy controls available",
    body: "You can now control who can see your last-seen status from Settings.",
    audience: "all_users",
    recipientUids: [],
    sentBy: "admin_uid_2",
    sentByDisplayName: "Peter Youssef",
    createdAt: ts(9 * DAY),
    deliveredCount: MOCK_USERS.length,
    readCount: Math.floor(MOCK_USERS.length * 0.81),
    recipientCount: MOCK_USERS.length,
  },
  {
    notificationId: "notif_00003",
    title: "Following up on your report",
    body: "Thanks for your report — we've reviewed it and taken action.",
    audience: "selected_users",
    recipientUids: pickN(MOCK_USERS, 5).map((u) => u.uid),
    sentBy: "admin_uid_3",
    sentByDisplayName: "Rania Sobhy",
    createdAt: ts(15 * DAY),
    deliveredCount: 5,
    readCount: 4,
    recipientCount: 5,
  },
];

// ---------------------------------------------------------------------------
// Overview stats + time series
// ---------------------------------------------------------------------------

export function getMockOverviewStats(): AdminOverviewStats {
  const blockedUsers = MOCK_USERS.filter((u) => u.accountStatus === "blocked").length;
  const totalMessages = MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.messageCount, 0);
  return {
    totalUsers: MOCK_USERS.length,
    activeUsers: MOCK_USERS.filter((u) => u.accountStatus === "active").length,
    onlineUsers: MOCK_USERS.filter((u) => u.isOnline).length,
    totalConversations: MOCK_CONVERSATIONS.length,
    totalMessages,
    messagesToday: intBetween(120, 480),
    messagesThisWeek: intBetween(900, 2600),
    openReports: MOCK_REPORTS.filter((r) => r.status === "open").length,
    blockedUsers,
    storageUsageBytes: 4.2 * 1024 * 1024 * 1024,
    storageQuotaBytes: 20 * 1024 * 1024 * 1024,
  };
}

function last7DaysLabels(): string[] {
  const fmt = new Intl.DateTimeFormat("en", { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * DAY);
    return fmt.format(d);
  });
}

function last8WeeksLabels(): string[] {
  return Array.from({ length: 8 }, (_, i) => `W${i + 1}`);
}

export function getMockMessageVolumeSeries(): TimeSeriesPoint[] {
  return last7DaysLabels().map((label) => ({ label, value: intBetween(150, 520) }));
}

export function getMockUserGrowthSeries(): TimeSeriesPoint[] {
  let running = 20;
  return last8WeeksLabels().map((label) => {
    running += intBetween(2, 9);
    return { label, value: running };
  });
}

export function getMockActiveUsersSeries(): TimeSeriesPoint[] {
  return last7DaysLabels().map((label) => ({ label, value: intBetween(18, 44) }));
}

export function getMockNewConversationsSeries(): TimeSeriesPoint[] {
  return last8WeeksLabels().map((label) => ({ label, value: intBetween(3, 14) }));
}

export function getMockReportsSeries(): TimeSeriesPoint[] {
  return last8WeeksLabels().map((label) => ({ label, value: intBetween(0, 6) }));
}

export function getMockBlockedUsersSeries(): TimeSeriesPoint[] {
  let running = 1;
  return last8WeeksLabels().map((label) => {
    running += rand() > 0.6 ? 1 : 0;
    return { label, value: running };
  });
}

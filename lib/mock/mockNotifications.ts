import type { NotificationItem, BlockedUserEntry } from "@/types/ui";

const now = Date.now();
const minutesAgo = (n: number) => now - n * 60_000;

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    kind: "message",
    title: "Ahmed",
    body: "See you then 🙂",
    createdAt: minutesAgo(2),
    read: false,
    conversationId: "conv-1",
  },
  {
    id: "n2",
    kind: "reaction",
    title: "Ahmed reacted to your message",
    body: "👍 on \"Let's say 6pm at the usual place\"",
    createdAt: minutesAgo(30),
    read: false,
    conversationId: "conv-1",
  },
  {
    id: "n3",
    kind: "message",
    title: "Yasmin S.",
    body: "Loved the photos from the trip!",
    createdAt: minutesAgo(15),
    read: false,
    conversationId: "conv-5",
  },
  {
    id: "n4",
    kind: "system",
    title: "Security notice",
    body: "Your account was signed in from a new device.",
    createdAt: minutesAgo(60 * 20),
    read: true,
  },
  {
    id: "n5",
    kind: "message",
    title: "Mohamed",
    body: "Looking now, thanks!",
    createdAt: minutesAgo(390),
    read: true,
    conversationId: "conv-2",
  },
];

export const MOCK_BLOCKED_USERS: BlockedUserEntry[] = [
  {
    uid: "uid-blocked-1",
    userId: "GH-10456",
    displayName: "Unknown Contact",
    photoURL: null,
    blockedAt: minutesAgo(60 * 24 * 10),
  },
];

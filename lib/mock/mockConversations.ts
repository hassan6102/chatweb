import type { UserConversationPreview } from "@/types/conversation";
import { MOCK_MESSAGES } from "./mockMessages";

/** Same shape as UserConversationPreview but lastMessageAt is epoch ms — see lib/mock/timestamp.ts. */
export type MockConversationPreview = Omit<UserConversationPreview, "lastMessageAt"> & {
  lastMessageAt: number | null;
};

function lastOf(conversationId: string) {
  const msgs = MOCK_MESSAGES[conversationId] ?? [];
  return msgs[msgs.length - 1] ?? null;
}

const c1 = lastOf("conv-1");
const c2 = lastOf("conv-2");
const c3 = lastOf("conv-3");
const c4 = lastOf("conv-4");
const c5 = lastOf("conv-5");

export const MOCK_CONVERSATIONS: MockConversationPreview[] = [
  {
    conversationId: "conv-1",
    otherUserId: "uid-1",
    lastMessage: c1?.deleted ? "This message was deleted" : c1?.text ?? "[attachment]",
    lastMessageAt: c1?.createdAt ?? null,
    unreadCount: 2,
    pinned: true,
    muted: false,
    archived: false,
    customName: null,
  },
  {
    conversationId: "conv-2",
    otherUserId: "uid-2",
    lastMessage: c2?.deleted ? "This message was deleted" : c2?.text ?? "[attachment]",
    lastMessageAt: c2?.createdAt ?? null,
    unreadCount: 0,
    pinned: false,
    muted: true,
    archived: false,
    customName: null,
  },
  {
    conversationId: "conv-3",
    otherUserId: "uid-3",
    lastMessage: c3?.text ?? null,
    lastMessageAt: c3?.createdAt ?? null,
    unreadCount: 0,
    pinned: false,
    muted: false,
    archived: false,
    customName: null,
  },
  {
    conversationId: "conv-4",
    otherUserId: "uid-4",
    lastMessage: c4?.text ?? null,
    lastMessageAt: c4?.createdAt ?? null,
    unreadCount: 0,
    pinned: false,
    muted: false,
    archived: true,
    customName: null,
  },
  {
    conversationId: "conv-5",
    otherUserId: "uid-5",
    lastMessage: c5?.text ?? null,
    lastMessageAt: c5?.createdAt ?? null,
    unreadCount: 1,
    pinned: false,
    muted: false,
    archived: false,
    customName: null,
  },
];

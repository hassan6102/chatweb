import type { Timestamp } from "firebase/firestore";

/**
 * conversations/{conversationId}
 *
 * `type` is included now so group conversations can be added later without
 * a schema migration, even though only "direct" is created in this phase.
 */
export interface ConversationDocument {
  conversationId: string;
  type: "direct" | "group";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp | null;
  lastMessage: string | null;
  createdBy: string;
  /** Deterministic key for direct chats: sorted `${uidA}_${uidB}`. Used to prevent duplicate direct conversations. Null for group chats. */
  directKey: string | null;
}

/** conversations/{conversationId}/members/{uid} */
export interface ConversationMemberDocument {
  uid: string;
  joinedAt: Timestamp;
  role: "member" | "owner";
  /** For future group support; always false for direct chats. */
  isRemoved: boolean;
}

/**
 * users/{uid}/conversations/{conversationId}
 * Denormalized preview used to render the chat list without joining
 * across collections.
 */
export interface UserConversationPreview {
  conversationId: string;
  /** Only meaningful for type "direct". */
  otherUserId: string | null;
  lastMessage: string | null;
  lastMessageAt: Timestamp | null;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  /** Private to this user only — never visible to the other participant. */
  customName: string | null;
}

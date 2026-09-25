/**
 * UI-only types.
 *
 * These describe state that either (a) isn't part of the Firestore contract
 * yet — e.g. reactions, blocked users — or (b) is genuinely local-only by
 * product design (customName). None of this redefines or duplicates the
 * shapes in `types/*.ts`; it composes them. When a backing collection is
 * added (e.g. `conversations/{id}/messages/{id}/reactions`), swap the mock
 * hook implementation, keep the component props the same.
 */

export type ThemePreference = "light" | "dark" | "system";

export const REACTION_EMOJIS = ["❤️", "😂", "👍", "😢", "😮"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** uid -> emoji the user reacted with. One reaction per user per message. */
export type MessageReactions = Record<string, ReactionEmoji>;

export type NotificationKind = "message" | "reaction" | "system";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  conversationId?: string;
}

export interface BlockedUserEntry {
  uid: string;
  userId: string;
  displayName: string | null;
  photoURL: string | null;
  blockedAt: number;
}

export type ConnectionState = "connected" | "connecting" | "offline";

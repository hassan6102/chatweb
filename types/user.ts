import type { Timestamp } from "firebase/firestore";

export type UserStatus = "active" | "away" | "offline";

/**
 * users/{uid}
 *
 * `phoneNumber` is PRIVATE. It must never be sent to the client in a
 * response for any uid other than the caller's own uid, and Firestore
 * rules must block direct reads of it by other users. See docs/SECURITY.md.
 */
export interface UserDocument {
  uid: string;
  /** Public, searchable, stable identifier. Format: GH-##### (see utils/userId.ts) */
  userId: string;
  email: string;
  displayName: string | null;
  /** PRIVATE — never exposed to other normal users. */
  phoneNumber: string | null;
  photoURL: string | null;
  status: UserStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp | null;
  lastSeenAt: Timestamp | null;
  isDisabled: boolean;
}

/**
 * Public-safe projection of a user, suitable for search results / profile
 * cards shown to other users. Never includes phoneNumber or email.
 */
export interface PublicUserProfile {
  uid: string;
  userId: string;
  displayName: string | null;
  photoURL: string | null;
  status: UserStatus;
  lastSeenAt: Timestamp | null;
}

export function toPublicUserProfile(user: UserDocument): PublicUserProfile {
  return {
    uid: user.uid,
    userId: user.userId,
    displayName: user.displayName,
    photoURL: user.photoURL,
    status: user.status,
    lastSeenAt: user.lastSeenAt,
  };
}

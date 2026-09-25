import type { PublicUserProfile } from "@/types/user";

/**
 * Realistic mock users, shaped exactly like `PublicUserProfile` so this
 * swaps for `findUserByUserId()` results with no component changes.
 * `lastSeenAt` is a plain epoch ms here instead of a Firestore Timestamp —
 * see `lib/mock/timestamp.ts` for the shim used at the call site.
 */
export interface MockUser extends Omit<PublicUserProfile, "lastSeenAt"> {
  lastSeenAt: number | null;
}

export const CURRENT_USER: MockUser = {
  uid: "uid-self",
  userId: "GH-10293",
  displayName: "Sara Ahmed",
  photoURL: null,
  status: "active",
  lastSeenAt: Date.now(),
};

export const MOCK_USERS: MockUser[] = [
  {
    uid: "uid-1",
    userId: "GH-92841",
    displayName: "Ahmed",
    photoURL: null,
    status: "active",
    lastSeenAt: Date.now(),
  },
  {
    uid: "uid-2",
    userId: "GH-38172",
    displayName: "Mohamed",
    photoURL: null,
    status: "away",
    lastSeenAt: Date.now() - 1000 * 60 * 6,
  },
  {
    uid: "uid-3",
    userId: "GH-55210",
    displayName: "Layla Noor",
    photoURL: null,
    status: "offline",
    lastSeenAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    uid: "uid-4",
    userId: "GH-77043",
    displayName: "Tarek R.",
    photoURL: null,
    status: "offline",
    lastSeenAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    uid: "uid-5",
    userId: "GH-40119",
    displayName: "Yasmin S.",
    photoURL: null,
    status: "active",
    lastSeenAt: Date.now(),
  },
];

export function findMockUserByUserId(userId: string): MockUser | null {
  const needle = userId.trim().toUpperCase();
  return MOCK_USERS.find((u) => u.userId === needle) ?? null;
}

export function getMockUserByUid(uid: string): MockUser | null {
  if (uid === CURRENT_USER.uid) return CURRENT_USER;
  return MOCK_USERS.find((u) => u.uid === uid) ?? null;
}

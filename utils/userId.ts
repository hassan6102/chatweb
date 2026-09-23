/**
 * Public User ID: a stable, searchable identifier shown to other users
 * instead of phone number or real name. Format: "GH-" + 5 digits, e.g.
 * "GH-92841".
 *
 * Uniqueness is enforced server-side via the `userIds/{userId}` reservation
 * collection (see lib/users/createUserId.server.ts) inside a Firestore
 * transaction, never relied upon client-side.
 */

const USER_ID_PREFIX = "GH-";
const USER_ID_DIGITS = 5;
const USER_ID_REGEX = /^GH-\d{5}$/;

export function isValidUserId(value: string): boolean {
  return USER_ID_REGEX.test(value);
}

/** Generates a candidate userId. Caller MUST verify uniqueness server-side before persisting. */
export function generateCandidateUserId(): string {
  const max = 10 ** USER_ID_DIGITS;
  const n = Math.floor(Math.random() * max)
    .toString()
    .padStart(USER_ID_DIGITS, "0");
  return `${USER_ID_PREFIX}${n}`;
}

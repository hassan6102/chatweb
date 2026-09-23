import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const USER_ID_PREFIX = "GH-";
const USER_ID_DIGITS = 5;
const MAX_ATTEMPTS = 10;

function generateCandidate(): string {
  const max = 10 ** USER_ID_DIGITS;
  const n = Math.floor(Math.random() * max)
    .toString()
    .padStart(USER_ID_DIGITS, "0");
  return `${USER_ID_PREFIX}${n}`;
}

/**
 * Runs automatically whenever a new Firebase Auth user is created (email
 * sign-up, or any future provider). Creates the users/{uid} document with a
 * unique, server-generated public userId. This is the single source of
 * truth for user creation — the client never writes users/{uid} directly
 * (Firestore rules block it; see firestore.rules).
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email ?? null;
  const phoneNumber = user.phoneNumber ?? null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = generateCandidate();
    const reservationRef = db.collection("userIds").doc(candidate);
    const userRef = db.collection("users").doc(uid);

    try {
      await db.runTransaction(async (tx) => {
        const reservationSnap = await tx.get(reservationRef);
        if (reservationSnap.exists) {
          throw new Error("USER_ID_TAKEN");
        }
        const now = admin.firestore.FieldValue.serverTimestamp();
        tx.set(userRef, {
          uid,
          userId: candidate,
          email,
          displayName: user.displayName ?? null,
          phoneNumber,
          photoURL: user.photoURL ?? null,
          status: "offline",
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          lastSeenAt: now,
          isDisabled: false,
        });
        tx.set(reservationRef, { uid, createdAt: now });
      });
      return;
    } catch (err) {
      if (err instanceof Error && err.message === "USER_ID_TAKEN") continue;
      throw err;
    }
  }

  throw new Error(`Failed to allocate unique userId for uid=${uid}`);
});

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { randomInt } from "node:crypto";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const USER_ID_PREFIX = "GH-";
const USER_ID_DIGITS = 5;
const MAX_ATTEMPTS = 10;

class UserIdTakenError extends Error {
  constructor() {
    super("USER_ID_TAKEN");
  }
}

function generateCandidate(): string {
  const n = randomInt(10 ** USER_ID_DIGITS)
    .toString()
    .padStart(USER_ID_DIGITS, "0");
  return `${USER_ID_PREFIX}${n}`;
}

async function ensureUserProfile(params: {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
}): Promise<string> {
  const { uid, email, displayName, phoneNumber } = params;
  const userRef = db.collection("users").doc(uid);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = generateCandidate();
    try {
      return await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        const existingUserId = userSnap.data()?.userId;
        const userId =
          typeof existingUserId === "string" && existingUserId
            ? existingUserId
            : candidate;
        const reservationRef = db.collection("userIds").doc(userId);
        const publicProfileRef = db.collection("publicProfiles").doc(uid);
        const reservationSnap = await tx.get(reservationRef);
        const publicProfileSnap = await tx.get(publicProfileRef);

        if (reservationSnap.exists && reservationSnap.data()?.uid !== uid) {
          if (userId === candidate) throw new UserIdTakenError();
          throw new Error(`Existing userId ${userId} is reserved by another account.`);
        }

        const now = admin.firestore.FieldValue.serverTimestamp();
        if (userSnap.exists) {
          if (!existingUserId) tx.update(userRef, { userId, updatedAt: now });
        } else {
          tx.set(userRef, {
            uid,
            userId,
            email,
            displayName,
            phoneNumber,
            photoURL: null,
            status: "offline",
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
            lastSeenAt: now,
            isDisabled: false,
          });
        }
        if (!reservationSnap.exists) tx.set(reservationRef, { uid, createdAt: now });
        const publicProfileData = {
          uid,
          userId,
          displayName: userSnap.data()?.displayName ?? displayName,
        };
        if (publicProfileSnap.exists) tx.update(publicProfileRef, publicProfileData);
        else tx.set(publicProfileRef, publicProfileData);
        return userId;
      });
    } catch (err) {
      if (err instanceof UserIdTakenError) continue;
      throw err;
    }
  }

  throw new Error(`Failed to allocate unique userId for uid=${uid}`);
}

/**
 * Runs automatically whenever a new Firebase Auth user is created (email
 * sign-up, or any future provider). Creates the users/{uid} document with a
 * unique public userId. Client provisioning uses the same Firestore
 * reservation contract, so this trigger can safely coexist with it.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  await ensureUserProfile({
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    phoneNumber: user.phoneNumber ?? null,
  });
});

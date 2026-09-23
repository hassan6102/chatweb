import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";
import { generateCandidateUserId } from "@/utils/userId";
import type { UserDocument } from "@/types/user";

const MAX_USER_ID_ATTEMPTS = 10;

/**
 * Creates `users/{uid}` plus a reservation in `userIds/{userId}` inside a
 * transaction, retrying on collision. Must run server-side (e.g. an
 * onCreate Auth trigger in functions/, or a Route Handler right after
 * sign-up) — never trust a client-supplied userId.
 */
export async function createUserProfile(params: {
  uid: string;
  email: string;
  phoneNumber?: string | null;
  displayName?: string | null;
}): Promise<UserDocument> {
  const { uid, email, phoneNumber = null, displayName = null } = params;

  for (let attempt = 0; attempt < MAX_USER_ID_ATTEMPTS; attempt++) {
    const candidate = generateCandidateUserId();

    try {
      const created = await adminDb.runTransaction(async (tx) => {
        const reservationRef = adminDb.collection("userIds").doc(candidate);
        const reservationSnap = await tx.get(reservationRef);
        if (reservationSnap.exists) {
          throw new Error("USER_ID_TAKEN");
        }

        const userRef = adminDb.collection("users").doc(uid);
        const now = FieldValue.serverTimestamp();

        const userData = {
          uid,
          userId: candidate,
          email,
          displayName,
          phoneNumber,
          photoURL: null,
          status: "offline" as const,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          lastSeenAt: now,
          isDisabled: false,
        };

        tx.set(userRef, userData);
        tx.set(reservationRef, { uid, createdAt: now });

        return userData;
      });

      return created as unknown as UserDocument;
    } catch (err) {
      if (err instanceof Error && err.message === "USER_ID_TAKEN") {
        continue; // try another candidate
      }
      throw err;
    }
  }

  throw new Error("Failed to allocate a unique userId after multiple attempts");
}

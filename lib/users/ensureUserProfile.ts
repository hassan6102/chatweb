import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/firebase/client";
import { generateCandidateUserId } from "@/utils/userId";

class UserIdAlreadyReservedError extends Error {}

const MAX_USER_ID_ATTEMPTS = 20;

/**
 * Creates or completes the signed-in user's private profile and safe public
 * lookup record. The reservation transaction guarantees IDs are unique.
 */
export async function ensureUserProfile(
  user: User,
  phoneNumber?: string,
  updateLastLogin = false
): Promise<string> {
  const userRef = doc(db, "users", user.uid);
  const publicProfileRef = doc(db, "publicProfiles", user.uid);

  for (let attempt = 0; attempt < MAX_USER_ID_ATTEMPTS; attempt++) {
    const candidate = generateCandidateUserId();

    try {
      return await runTransaction(db, async (transaction) => {
        const userSnapshot = await transaction.get(userRef);
        const existingUserId = userSnapshot.data()?.userId;
        const userId =
          typeof existingUserId === "string" && existingUserId
            ? existingUserId
            : candidate;
        const reservationRef = doc(db, "userIds", userId);
        const reservationSnapshot = await transaction.get(reservationRef);

        if (reservationSnapshot.exists() && reservationSnapshot.data().uid !== user.uid) {
          if (userId === candidate) throw new UserIdAlreadyReservedError();
          throw new Error("Your saved contact code is reserved by another account.");
        }

        const publicProfileSnapshot = await transaction.get(publicProfileRef);
        const now = serverTimestamp();
        if (userSnapshot.exists()) {
          const userUpdates: {
            userId?: string;
            phoneNumber?: string;
            lastLoginAt?: ReturnType<typeof serverTimestamp>;
            updatedAt?: ReturnType<typeof serverTimestamp>;
          } = {};
          if (!existingUserId) userUpdates.userId = userId;
          if (phoneNumber?.trim()) userUpdates.phoneNumber = phoneNumber.trim();
          if (updateLastLogin) {
            userUpdates.lastLoginAt = now;
            userUpdates.updatedAt = now;
          }
          if (Object.keys(userUpdates).length > 0) {
            transaction.update(userRef, userUpdates);
          }
        } else {
          const userData = {
            uid: user.uid,
            userId,
            email: user.email ?? "",
            displayName: user.displayName,
            phoneNumber: phoneNumber?.trim() || user.phoneNumber,
            photoURL: user.photoURL,
            status: "offline",
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
            lastSeenAt: now,
            isDisabled: false,
          };
          transaction.set(userRef, userData);
        }

        if (!reservationSnapshot.exists()) {
          transaction.set(reservationRef, { uid: user.uid, createdAt: now });
        }
        const publicData = {
          uid: user.uid,
          userId,
          displayName: user.displayName,
        };
        if (publicProfileSnapshot.exists()) transaction.update(publicProfileRef, publicData);
        else transaction.set(publicProfileRef, publicData);

        return userId;
      });
    } catch (error) {
      if (error instanceof UserIdAlreadyReservedError) continue;
      throw error;
    }
  }

  throw new Error("Could not allocate a unique contact code. Please try again.");
}

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { isValidUserId } from "@/utils/userId";
import type { PublicUserProfile } from "@/types/user";

/**
 * Looks up a user by their public userId (e.g. "GH-92841") for the
 * "add contact / start chat" flow. Returns only the public-safe projection —
 * The lookup resolves through a non-listable code reservation and reads a
 * separate public-only profile document, never the private user document.
 */
export async function findUserByUserId(userId: string): Promise<PublicUserProfile | null> {
  if (!isValidUserId(userId)) return null;

  const reservation = await getDoc(doc(db, "userIds", userId));
  if (!reservation.exists() || typeof reservation.data().uid !== "string") return null;

  const profile = await getDoc(doc(db, "publicProfiles", reservation.data().uid));
  if (!profile.exists()) return null;

  const data = profile.data();
  if (data.userId !== userId || typeof data.uid !== "string") return null;

  return {
    uid: data.uid,
    userId: data.userId,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
  };
}

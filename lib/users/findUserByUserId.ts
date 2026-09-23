import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/firebase/client";
import { isValidUserId } from "@/utils/userId";
import { toPublicUserProfile, type PublicUserProfile, type UserDocument } from "@/types/user";

/**
 * Looks up a user by their public userId (e.g. "GH-92841") for the
 * "add contact / start chat" flow. Returns only the public-safe projection —
 * phoneNumber and email are stripped here in addition to being blocked by
 * Firestore rules, so a bug in one layer doesn't leak private data.
 */
export async function findUserByUserId(userId: string): Promise<PublicUserProfile | null> {
  if (!isValidUserId(userId)) return null;

  const q = query(collection(db, "users"), where("userId", "==", userId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data() as UserDocument;
  if (data.isDisabled) return null;

  return toPublicUserProfile(data);
}

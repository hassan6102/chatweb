import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import type { ConversationDocument } from "@/types/conversation";

/** Deterministic key so two users can never end up with two direct conversations. */
function buildDirectKey(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

/**
 * Returns the existing 1-to-1 conversation between the two users, or
 * creates it (conversation doc + both member docs + both inbox previews)
 * atomically in a transaction.
 */
export async function createOrGetDirectConversation(
  currentUid: string,
  otherUid: string
): Promise<string> {
  if (currentUid === otherUid) {
    throw new Error("Cannot start a conversation with yourself");
  }

  const directKey = buildDirectKey(currentUid, otherUid);

  const existing = await getDocs(
    query(collection(db, "conversations"), where("directKey", "==", directKey), limit(1))
  );
  if (!existing.empty) {
    return existing.docs[0]!.id;
  }

  const conversationRef = doc(collection(db, "conversations"));
  const conversationId = conversationRef.id;

  await runTransaction(db, async (tx) => {
    const now = serverTimestamp();

    const conversationData: Omit<ConversationDocument, "conversationId"> = {
      type: "direct",
      createdAt: now as any,
      updatedAt: now as any,
      lastMessageAt: null,
      lastMessage: null,
      createdBy: currentUid,
      directKey,
    };
    tx.set(conversationRef, conversationData);

    for (const uid of [currentUid, otherUid]) {
      const memberRef = doc(db, "conversations", conversationId, "members", uid);
      tx.set(memberRef, {
        uid,
        joinedAt: now,
        role: "member",
        isRemoved: false,
      });

      const previewRef = doc(db, "users", uid, "conversations", conversationId);
      tx.set(previewRef, {
        conversationId,
        otherUserId: uid === currentUid ? otherUid : currentUid,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
        pinned: false,
        muted: false,
        archived: false,
        customName: null,
      });
    }
  });

  return conversationId;
}

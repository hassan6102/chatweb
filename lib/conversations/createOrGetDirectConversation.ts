import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import type { ConversationDocument } from "@/types/conversation";
import { isValidUserId } from "@/utils/userId";

function buildDirectKey(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

async function findExistingConversation(currentUid: string, otherUid: string) {
  return getDocs(
    query(
      collection(db, "users", currentUid, "conversations"),
      where("otherUserId", "==", otherUid),
      limit(1)
    )
  );
}

async function reopenInboxEntry(currentUid: string, otherUid: string, conversationId: string) {
  const inboxRef = doc(db, "users", currentUid, "conversations", conversationId);

  await runTransaction(db, async (transaction) => {
    const inboxSnapshot = await transaction.get(inboxRef);
    if (inboxSnapshot.exists()) {
      if (inboxSnapshot.data().archived === true) {
        transaction.update(inboxRef, { archived: false });
      }
      return;
    }

    transaction.set(inboxRef, {
      conversationId,
      otherUserId: otherUid,
      lastMessage: null,
      lastMessageAt: null,
      lastMessageId: null,
      unreadCount: 0,
      pinned: false,
      muted: false,
      archived: false,
      customName: null,
    });
  });
}

/**
 * Returns an existing direct conversation or atomically creates it with both
 * memberships and inbox previews. The stable document ID deduplicates starts.
 */
export async function createOrGetDirectConversation(
  currentUid: string,
  otherUid: string,
  otherUserId: string
): Promise<string> {
  if (currentUid === otherUid) {
    throw new Error("Cannot start a conversation with yourself");
  }
  if (!isValidUserId(otherUserId)) {
    throw new Error("The other user's contact code is invalid.");
  }

  const existing = await findExistingConversation(currentUid, otherUid);
  if (!existing.empty) {
    const conversationId = existing.docs[0]!.data().conversationId as string;
    await reopenInboxEntry(currentUid, otherUid, conversationId);
    return conversationId;
  }

  const directKey = buildDirectKey(currentUid, otherUid);
  const conversationRef = doc(db, "conversations", directKey);
  const conversationId = conversationRef.id;

  try {
    await runTransaction(db, async (transaction) => {
      const now = serverTimestamp();
      const conversationData: Omit<ConversationDocument, "conversationId"> = {
        type: "direct",
        createdAt: now as any,
        updatedAt: now as any,
        lastMessageAt: null,
        lastMessageId: null,
        lastMessage: null,
        createdBy: currentUid,
        directKey,
        memberUids: [currentUid, otherUid],
        targetUserId: otherUserId,
      };
      transaction.set(conversationRef, conversationData);

      for (const uid of [currentUid, otherUid]) {
        transaction.set(doc(db, "conversations", conversationId, "members", uid), {
          uid,
          joinedAt: now,
          role: "member",
          isRemoved: false,
        });

        transaction.set(doc(db, "users", uid, "conversations", conversationId), {
          conversationId,
          otherUserId: uid === currentUid ? otherUid : currentUid,
          lastMessage: null,
          lastMessageAt: null,
          lastMessageId: null,
          unreadCount: 0,
          pinned: false,
          muted: false,
          archived: false,
          customName: null,
        });
      }
    });
  } catch (error) {
    try {
      const concurrentResult = await findExistingConversation(currentUid, otherUid);
      if (!concurrentResult.empty) {
        const concurrentConversationId = concurrentResult.docs[0]!.data().conversationId as string;
        await reopenInboxEntry(currentUid, otherUid, concurrentConversationId);
        return concurrentConversationId;
      }

      const existingConversation = await getDoc(conversationRef);
      if (existingConversation.exists()) {
        const data = existingConversation.data();
        if (
          data.type === "direct" &&
          Array.isArray(data.memberUids) &&
          data.memberUids.includes(currentUid) &&
          data.memberUids.includes(otherUid)
        ) {
          await reopenInboxEntry(currentUid, otherUid, conversationId);
          return conversationId;
        }
      }
    } catch (recoveryError) {
      console.error("Could not recover an existing direct conversation:", recoveryError);
    }

    throw error;
  }

  return conversationId;
}

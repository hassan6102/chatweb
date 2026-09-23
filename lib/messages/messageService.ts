import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import type { MessageDocument, MessageType, MessageMetadata } from "@/types/message";

/**
 * Sends a message and, in the same transaction, updates:
 *  - conversations/{id} (lastMessage/lastMessageAt/updatedAt)
 *  - both members' users/{uid}/conversations/{id} preview (lastMessage,
 *    lastMessageAt, and unreadCount for the recipient only).
 *
 * The heavy lifting of "who are the members" is read from
 * conversations/{id}/members before writing.
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  type: MessageType;
  text?: string | null;
  replyTo?: string | null;
  metadata?: MessageMetadata | null;
}): Promise<string> {
  const { conversationId, senderId, type, text = null, replyTo = null, metadata = null } = params;

  const messageRef = doc(collection(db, "conversations", conversationId, "messages"));
  const conversationRef = doc(db, "conversations", conversationId);
  const memberIds = await getConversationMemberIds(conversationId);

  await runTransaction(db, async (tx) => {
    const now = serverTimestamp();

    const messageData: Omit<MessageDocument, "messageId"> = {
      conversationId,
      senderId,
      type,
      text,
      status: "sent",
      createdAt: now as any,
      updatedAt: now as any,
      editedAt: null,
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      replyTo,
      metadata,
      readBy: [senderId],
    };
    tx.set(messageRef, messageData);

    const previewText = type === "text" ? text : `[${type}]`;
    tx.update(conversationRef, {
      lastMessage: previewText,
      lastMessageAt: now,
      updatedAt: now,
    });

    for (const uid of memberIds) {
      const previewRef = doc(db, "users", uid, "conversations", conversationId);
      tx.set(
        previewRef,
        {
          lastMessage: previewText,
          lastMessageAt: now,
          ...(uid === senderId ? {} : { unreadCount: increment(1) }),
        },
        { merge: true }
      );
    }
  });

  return messageRef.id;
}

export async function editMessage(params: {
  conversationId: string;
  messageId: string;
  newText: string;
}): Promise<void> {
  const { conversationId, messageId, newText } = params;
  const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
  const now = serverTimestamp();
  await runTransaction(db, async (tx) => {
    tx.update(messageRef, { text: newText, editedAt: now, updatedAt: now });
  });
}

/** Soft delete only — see docs/DATABASE.md ("Soft delete") for rationale. */
export async function deleteMessage(params: {
  conversationId: string;
  messageId: string;
  deletedBy: string;
}): Promise<void> {
  const { conversationId, messageId, deletedBy } = params;
  const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
  const now = serverTimestamp();
  await runTransaction(db, async (tx) => {
    tx.update(messageRef, {
      deleted: true,
      deletedAt: now,
      deletedBy,
      updatedAt: now,
      text: null,
    });
  });
}

export async function markMessageAsRead(params: {
  conversationId: string;
  messageId: string;
  uid: string;
}): Promise<void> {
  const { conversationId, messageId, uid } = params;
  const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
  await runTransaction(db, async (tx) => {
    tx.update(messageRef, { readBy: arrayUnion(uid), status: "read" });
  });
}

/** Clears unreadCount on the caller's inbox preview for this conversation. */
export async function markConversationAsRead(params: {
  conversationId: string;
  uid: string;
}): Promise<void> {
  const { conversationId, uid } = params;
  const previewRef = doc(db, "users", uid, "conversations", conversationId);
  await runTransaction(db, async (tx) => {
    tx.set(previewRef, { unreadCount: 0 }, { merge: true });
  });
}

async function getConversationMemberIds(conversationId: string): Promise<string[]> {
  const { getDocs, collection: col } = await import("firebase/firestore");
  const snap = await getDocs(col(db, "conversations", conversationId, "members"));
  return snap.docs.map((d) => d.id);
}

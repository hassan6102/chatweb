"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import type { MessageType, MessageMetadata } from "@/types/message";
import type { ReactionEmoji } from "@/types/ui";

export interface FirestoreMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text: string | null;
  status: "sending" | "sent" | "delivered" | "read";
  createdAt: number;
  updatedAt: number;
  editedAt?: number | null;
  deleted?: boolean;
  replyTo?: string | null;
  metadata?: MessageMetadata | null;
  readBy?: string[];
  reactions?: Record<string, ReactionEmoji>;
}

export function useMessages(conversationId: string) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const { user } = useAuth();

  // جلب الرسائل حقيقياً من Firestore بناءً على الـ conversationId
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: FirestoreMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          messageId: docSnap.id,
          ...data,
        } as FirestoreMessage);
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // إرسال رسالة حقيقية إلى Firestore
  const sendMessage = useCallback(
    async (params: {
      type: MessageType;
      text?: string | null;
      replyTo?: string | null;
      metadata?: MessageMetadata | null;
    }) => {
      if (!user) return;

      try {
        const newMessage = {
          conversationId,
          senderId: user.uid,
          type: params.type,
          text: params.text ?? null,
          status: "sent",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          editedAt: null,
          deleted: false,
          replyTo: params.replyTo ?? null,
          metadata: params.metadata ?? null,
          readBy: [user.uid],
          reactions: {},
        };

        const docRef = await addDoc(collection(db, "messages"), newMessage);
        return docRef.id;
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    },
    [conversationId, user]
  );

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, {
        text: newText,
        editedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error editing message: ", error);
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, {
        deleted: true,
        text: null,
      });
    } catch (error) {
      console.error("Error deleting message: ", error);
    }
  }, []);

  const react = useCallback(async (messageId: string, emoji: ReactionEmoji | null) => {
    if (!user) return;
    try {
      const targetMessage = messages.find(m => m.messageId === messageId);
      if (!targetMessage) return;

      const reactions = { ...(targetMessage.reactions ?? {}) };
      if (emoji) {
        reactions[user.uid] = emoji;
      } else {
        delete reactions[user.uid];
      }

      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, { reactions });
    } catch (error) {
      console.error("Error reacting to message: ", error);
    }
  }, [user, messages]);

  const togglePinMessage = useCallback((messageId: string) => {
    setPinnedIds((prev) => 
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
    );
  }, []);

  const visibleMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );

  return {
    messages: visibleMessages,
    loading,
    pinnedIds,
    sendMessage,
    editMessage,
    deleteMessage,
    react,
    togglePinMessage,
  };
}
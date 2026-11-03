"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { deleteMessage as deleteMessageService, editMessage as editMessageService, sendMessage as sendMessageService } from "@/lib/messages/messageService";
import { getMessagesPage } from "@/lib/messages/getMessagesPage";
import type { MessageDocument, MessageMetadata, MessageType } from "@/types/message";
import type { MockMessage } from "@/lib/mock/mockMessages";

const PAGE_SIZE = 30;

export type FirestoreMessage = MockMessage;

function toUiMessage(message: MessageDocument): FirestoreMessage {
  return {
    ...message,
    createdAt: message.createdAt.toMillis(),
    updatedAt: message.updatedAt.toMillis(),
    editedAt: message.editedAt?.toMillis() ?? null,
    deletedAt: message.deletedAt?.toMillis() ?? null,
  } as FirestoreMessage;
}

function mergeMessages(...groups: FirestoreMessage[][]): FirestoreMessage[] {
  const messagesById = new Map<string, FirestoreMessage>();
  for (const group of groups) {
    for (const message of group) messagesById.set(message.messageId, message);
  }
  return [...messagesById.values()].sort((a, b) => a.createdAt - b.createdAt);
}

export function useMessages(conversationId: string) {
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setCursor(null);
      setHasMore(false);
      setLoading(false);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    setError(null);
    setMessages([]);
    setCursor(null);
    setHasMore(false);

    void getMessagesPage(conversationId, null, PAGE_SIZE)
      .then((page) => {
        if (!active) return;
        const firstPage = page.messages.map(toUiMessage);
        setMessages(firstPage);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setLoading(false);

        const liveQuery = query(
          collection(db, "conversations", conversationId, "messages"),
          where("conversationId", "==", conversationId),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );
        unsubscribe = onSnapshot(
          liveQuery,
          (snapshot) => {
            const latestMessages = snapshot.docs.map((messageSnap) =>
              toUiMessage({ ...messageSnap.data(), messageId: messageSnap.id } as MessageDocument)
            );
            setMessages((current) => mergeMessages(current, latestMessages));
            setError(null);
          },
          (snapshotError) => {
            console.error("Error subscribing to messages:", snapshotError);
            setError(snapshotError);
          }
        );
      })
      .catch((pageError: unknown) => {
        if (!active) return;
        const loadError =
          pageError instanceof Error ? pageError : new Error("Messages could not be loaded.");
        console.error("Error loading messages:", loadError);
        setError(loadError);
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [conversationId]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || !cursor || !hasMore || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await getMessagesPage(conversationId, cursor, PAGE_SIZE);
      const olderMessages = page.messages.map(toUiMessage);
      setMessages((current) => mergeMessages(olderMessages, current));
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (loadError) {
      const normalizedError =
        loadError instanceof Error ? loadError : new Error("Older messages could not be loaded.");
      console.error("Error loading older messages:", normalizedError);
      setError(normalizedError);
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, cursor, hasMore, loadingOlder]);

  const sendMessage = useCallback(
    async (params: {
      type: MessageType;
      text?: string | null;
      replyTo?: string | null;
      metadata?: MessageMetadata | null;
    }) => {
      if (!user) throw new Error("You must be signed in to send a message.");
      return sendMessageService({
        conversationId,
        senderId: user.uid,
        type: params.type,
        text: params.text,
        replyTo: params.replyTo,
        metadata: params.metadata,
      });
    },
    [conversationId, user]
  );

  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      await editMessageService({ conversationId, messageId, newText });
    },
    [conversationId]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!user) throw new Error("You must be signed in to delete a message.");
      await deleteMessageService({ conversationId, messageId, deletedBy: user.uid });
    },
    [conversationId, user]
  );

  const visibleMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );

  return {
    messages: visibleMessages,
    loading,
    error,
    loadingOlder,
    hasMore,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage,
  };
}

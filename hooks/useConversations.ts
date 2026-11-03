"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import type { UserConversationPreview } from "@/types/conversation";

function timestampValue(value: UserConversationPreview["lastMessageAt"]): number {
  return value?.toMillis() ?? 0;
}

export function useConversations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [conversations, setConversations] = useState<UserConversationPreview[]>([]);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user?.uid) {
      setConversations([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setConversations([]);
    setError(null);
    const inboxRef = collection(db, "users", user.uid, "conversations");

    return onSnapshot(
      inboxRef,
      (snapshot) => {
        const data = snapshot.docs.map(
          (conversationDoc) =>
            ({
              ...conversationDoc.data(),
              conversationId: conversationDoc.id,
            }) as UserConversationPreview
        );
        data.sort((a, b) => timestampValue(b.lastMessageAt) - timestampValue(a.lastMessageAt));
        setConversations(data);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        console.error("Error fetching inbox:", snapshotError);
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [authLoading, user?.uid]);

  const updateConversation = useCallback(
    async (conversationId: string, data: Partial<UserConversationPreview>) => {
      if (!user?.uid) throw new Error("You must be signed in to update a conversation.");
      const ref = doc(db, "users", user.uid, "conversations", conversationId);
      await updateDoc(ref, data);
    },
    [user?.uid]
  );

  const togglePin = useCallback(
    async (conversationId: string) => {
      const current = conversations.find((conversation) => conversation.conversationId === conversationId);
      if (current) await updateConversation(conversationId, { pinned: !current.pinned });
    },
    [conversations, updateConversation]
  );

  const toggleMute = useCallback(
    async (conversationId: string) => {
      const current = conversations.find((conversation) => conversation.conversationId === conversationId);
      if (current) await updateConversation(conversationId, { muted: !current.muted });
    },
    [conversations, updateConversation]
  );

  const toggleArchive = useCallback(
    async (conversationId: string) => {
      const current = conversations.find((conversation) => conversation.conversationId === conversationId);
      if (current) await updateConversation(conversationId, { archived: !current.archived });
    },
    [conversations, updateConversation]
  );

  const deleteLocally = useCallback(
    async (conversationId: string) => {
      if (!user?.uid) throw new Error("You must be signed in to remove a conversation.");
      await deleteDoc(doc(db, "users", user.uid, "conversations", conversationId));
    },
    [user?.uid]
  );

  const rename = useCallback(
    (conversationId: string, customName: string | null) =>
      updateConversation(conversationId, { customName }),
    [updateConversation]
  );

  const markRead = useCallback(
    (conversationId: string) => updateConversation(conversationId, { unreadCount: 0 }),
    [updateConversation]
  );

  return {
    conversations,
    loading,
    error,
    togglePin,
    toggleMute,
    toggleArchive,
    deleteLocally,
    rename,
    markRead,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "@/firebase/client"; // تأكد أن هذا المسار يطابق ملف إعداد Firebase لديك
import { useAuth } from "@/hooks/useAuth"; // خطاف المصادقة الفعلي لجلب بيانات المستخدم

export function useConversations() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const { user } = useAuth(); // الحصول على المستخدم المسجل حالياً

  useEffect(() => {
    // إذا لم يكن هناك مستخدم مسجل، قم بتفريغ القائمة
    if (!user?.uid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // الاستماع اللحظي لمسار المحادثات الخاص بالمستخدم في Firestore
    const q = query(collection(db, "users", user.uid, "conversations"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          conversationId: doc.id,
          ...doc.data(),
        }));
        
        // ترتيب المحادثات حسب وقت التحديث (الأحدث أولاً)
        data.sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
        
        setConversations(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching conversations:", error);
        setLoading(false);
      }
    );

    // إيقاف الاستماع عند إغلاق المكون
    return () => unsubscribe();
  }, [user?.uid]);

  // دالة مساعدة لتحديث الحقول في قاعدة البيانات
  const updateConversation = useCallback(
    async (conversationId: string, data: any) => {
      if (!user?.uid) return;
      try {
        const ref = doc(db, "users", user.uid, "conversations", conversationId);
        await updateDoc(ref, data);
      } catch (error) {
        console.error("Failed to update conversation:", error);
      }
    },
    [user?.uid]
  );

  const togglePin = useCallback(
    (conversationId: string) => {
      const current = conversations.find((c) => c.conversationId === conversationId);
      if (current) updateConversation(conversationId, { pinned: !current.pinned });
    },
    [conversations, updateConversation]
  );

  const toggleMute = useCallback(
    (conversationId: string) => {
      const current = conversations.find((c) => c.conversationId === conversationId);
      if (current) updateConversation(conversationId, { muted: !current.muted });
    },
    [conversations, updateConversation]
  );

  const toggleArchive = useCallback(
    (conversationId: string) => {
      const current = conversations.find((c) => c.conversationId === conversationId);
      if (current) updateConversation(conversationId, { archived: !current.archived });
    },
    [conversations, updateConversation]
  );

  const deleteLocally = useCallback(
    async (conversationId: string) => {
      if (!user?.uid) return;
      try {
        const ref = doc(db, "users", user.uid, "conversations", conversationId);
        await deleteDoc(ref);
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    },
    [user?.uid]
  );

  const rename = useCallback(
    (conversationId: string, customName: string | null) => {
      updateConversation(conversationId, { customName });
    },
    [updateConversation]
  );

  const markRead = useCallback(
    (conversationId: string) => {
      updateConversation(conversationId, { unreadCount: 0 });
    },
    [updateConversation]
  );

  return { 
    conversations, 
    loading, 
    togglePin, 
    toggleMute, 
    toggleArchive, 
    deleteLocally, 
    rename, 
    markRead 
  };
}
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FirestoreNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  type?: string;
  link?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<FirestoreNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: FirestoreNotification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notifs.push({
          id: docSnap.id,
          ...data,
        } as FirestoreNotification);
      });
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    try {
      const notifRef = doc(db, "notifications", id);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read: ", error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      // تحديث كل الإشعارات غير المقروءة دفعة واحدة أو عبر حلقة تكرارية
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifs.map(n => updateDoc(doc(db, "notifications", n.id), { read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read: ", error);
    }
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return { notifications, loading, markRead, markAllRead, unreadCount };
}
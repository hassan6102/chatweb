"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { db, auth } from "@/firebase/client";
import { doc, updateDoc, arrayRemove, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function BlockedUsersPage() {
  const router = useRouter();
  const [blockedList, setBlockedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUid, setMyUid] = useState<string | null>(null);

  // 1. مراقبة حالة تسجيل الدخول بدقة
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setMyUid(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. جلب قائمة المحظورين بمجرد التأكد من الـ UID
  useEffect(() => {
    if (!myUid) return;

    const unsubscribeSnap = onSnapshot(doc(db, "users", myUid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBlockedList(data.blockedUsers || []);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blocked users", error);
      setLoading(false);
    });

    return () => unsubscribeSnap();
  }, [myUid]);

  async function unblock(userToUnblock: any) {
    if (!myUid) return;
    try {
      await updateDoc(doc(db, "users", myUid), {
        blockedUsers: arrayRemove(userToUnblock)
      });
    } catch (error) {
      console.error("Error unblocking", error);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <IconButton aria-label="Back" onClick={() => router.back()}>
          <Icon name="back" size={20} />
        </IconButton>
        <h1 className="text-sm font-semibold text-ink">Blocked Users</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-ink-muted">جاري التحميل...</p>
        ) : blockedList.length === 0 ? (
          <EmptyState
            icon="block"
            title="No blocked users"
            description="When you block someone, they will appear here."
          />
        ) : (
          <ul className="space-y-4">
            {blockedList.map((u, i) => (
              <li key={u.uid || i} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-ink">{u.displayName || "مستخدم"}</p>
                  <p className="text-xs font-mono text-ink-faint">{u.userId}</p>
                </div>
                <Button variant="secondary" onClick={() => unblock(u)}>
                  Unblock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
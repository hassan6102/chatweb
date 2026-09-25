"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserProfilePanel } from "@/components/users/UserProfilePanel";
import { RenameContact } from "@/components/users/RenameContact";
import { EmptyState } from "@/components/common/EmptyState";
import { Toast } from "@/components/common/Toast";
import { db, auth } from "@/firebase/client";
import { doc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

export default function OtherUserProfilePage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // حالات خاصة بتغيير الاسم والمحادثة
  const [renaming, setRenaming] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserAndConv() {
      const decodedUserId = decodeURIComponent(params.userId);
      try {
        const q = query(collection(db, "users"), where("userId", "==", decodedUserId));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const firstDoc = snap.docs[0];
          if (firstDoc) {
            const userData = { uid: firstDoc.id, ...firstDoc.data() };
            setUser(userData);

            // البحث عن المحادثة بينكما لجلب الاسم المخصص إن وجد
            if (currentUser?.uid) {
              const convQ = query(collection(db, "conversations"), where("participants", "array-contains", currentUser.uid));
              const convSnap = await getDocs(convQ);
              const conv = convSnap.docs.find(d => d.data().participants.includes(userData.uid));
              
              if (conv) {
                setConvId(conv.id);
                setCustomName(conv.data().customNames?.[currentUser.uid] || null);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndConv();
  }, [params.userId, currentUser?.uid]);

  if (loading) return <div className="p-4 text-center text-sm text-ink-muted">جاري التحميل...</div>;

  if (!user) {
    return <EmptyState icon="search" title="User not found" description="This User ID doesn't match anyone." />;
  }

  async function handleBlock() {
    if (!currentUser?.uid) return;
    try {
      const myRef = doc(db, "users", currentUser.uid);
      const blockedData = {
        uid: user.uid ?? "",
        userId: user.userId ?? "",
        displayName: user.displayName ?? "مستخدم"
      };
      await updateDoc(myRef, { blockedUsers: arrayUnion(blockedData) });
      setToast(`تم حظر ${blockedData.displayName} بنجاح`);
    } catch (error) {
      console.error("Error blocking user", error);
    }
  }

  async function handleRenameSave(newName: string | null) {
    if (!convId || !currentUser?.uid) {
      setToast("يجب أن تبدأ محادثة مع هذا الشخص أولاً لتغيير اسمه.");
      setRenaming(false);
      return;
    }
    try {
      await updateDoc(doc(db, "conversations", convId), {
        [`customNames.${currentUser.uid}`]: newName
      });
      setCustomName(newName);
      setRenaming(false);
      setToast("تم حفظ الاسم بنجاح");
    } catch (error) {
      console.error("Error renaming", error);
      setToast("حدث خطأ أثناء حفظ الاسم");
    }
  }

  return (
    <>
      <UserProfilePanel
        user={user}
        isSelf={false}
        customName={customName}
        onBack={() => router.back()}
        onMessage={() => convId ? router.push(`/chat/${convId}`) : router.back()}
        onRename={() => setRenaming(true)}
        onBlock={handleBlock}
      />

      {renaming && (
        <RenameContact
          userId={user.userId}
          currentName={customName}
          onSave={handleRenameSave}
          onClose={() => setRenaming(false)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
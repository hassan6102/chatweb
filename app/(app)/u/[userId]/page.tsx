"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserProfilePanel } from "@/components/users/UserProfilePanel";
import { RenameContact } from "@/components/users/RenameContact";
import { EmptyState } from "@/components/common/EmptyState";
import { Toast } from "@/components/common/Toast";
import { db } from "@/firebase/client";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { findUserByUserId } from "@/lib/users/findUserByUserId";
import { createOrGetDirectConversation } from "@/lib/conversations/createOrGetDirectConversation";
import type { PublicUserProfile } from "@/types/user";

export default function OtherUserProfilePage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [renaming, setRenaming] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchUserAndConv() {
      const decodedUserId = decodeURIComponent(params.userId);
      setLoading(true);
      setLoadError(false);
      try {
        const profile = await findUserByUserId(decodedUserId);
        if (!active) return;
        setUser(profile);
        setConvId(null);
        setCustomName(null);

        if (profile && currentUser?.uid) {
          const inbox = await getDocs(collection(db, "users", currentUser.uid, "conversations"));
          if (!active) return;
          const conversation = inbox.docs.find((entry) => entry.data().otherUserId === profile.uid);
          if (conversation) {
            setConvId(conversation.id);
            setCustomName((conversation.data().customName as string | null | undefined) ?? null);
          }
        }
      } catch (error) {
        if (!active) return;
        console.error("Error fetching public profile:", error);
        setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void fetchUserAndConv();
    return () => {
      active = false;
    };
  }, [params.userId, currentUser?.uid]);

  if (loading) return <div className="p-4 text-center text-sm text-ink-muted">جاري التحميل...</div>;

  if (loadError) {
    return <EmptyState icon="info" title="Profile unavailable" description="This profile could not be loaded." />;
  }

  if (!user) {
    return <EmptyState icon="search" title="User not found" description="This User ID doesn't match anyone." />;
  }

  async function handleBlock() {
    setToast("Blocking is not available yet.");
  }

  async function handleRenameSave(newName: string | null) {
    if (!convId || !currentUser?.uid) {
      setToast("يجب أن تبدأ محادثة مع هذا الشخص أولاً لتغيير اسمه.");
      setRenaming(false);
      return;
    }
    try {
      await updateDoc(doc(db, "users", currentUser.uid, "conversations", convId), {
        customName: newName,
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
        onMessage={async () => {
          if (!currentUser?.uid) {
            setToast("Please sign in again to start a conversation.");
            return;
          }
          try {
            const conversationId =
              convId ?? (await createOrGetDirectConversation(currentUser.uid, user.uid, user.userId));
            router.push(`/chat/${conversationId}`);
          } catch (error) {
            console.error("Could not start conversation:", error);
            setToast("Could not start this conversation.");
          }
        }}
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
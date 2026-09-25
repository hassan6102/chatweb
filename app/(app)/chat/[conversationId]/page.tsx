"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { RenameContact } from "@/components/users/RenameContact";
import { Toast } from "@/components/common/Toast";
import { EmptyState } from "@/components/common/EmptyState";
import { useMessages } from "@/hooks/useMessages";
import { db, auth } from "@/firebase/client";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";

export default function ChatPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const router = useRouter();

  const [conversation, setConversation] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loadingConv, setLoadingConv] = useState(true);

  // حالات خاصة بالمستخدم الحالي وقائمة المحظورين
  const [myBlockedUsers, setMyBlockedUsers] = useState<any[]>([]);
  const [myUid, setMyUid] = useState<string | null>(null);

  const {
    messages,
    loading: messagesLoading,
    pinnedIds,
    sendMessage,
    editMessage,
    deleteMessage,
    react,
    togglePinMessage,
  } = useMessages(conversationId);

  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);

  // 1. جلب معرف المستخدم الحالي
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setMyUid(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // 2. مراقبة قائمة المحظورين الخاصة بك لحظياً
  useEffect(() => {
    if (!myUid) return;
    const unsubscribe = onSnapshot(doc(db, "users", myUid), (snap) => {
      if (snap.exists()) {
        setMyBlockedUsers(snap.data().blockedUsers || []);
      }
    });
    return () => unsubscribe();
  }, [myUid]);

  useEffect(() => {
    async function fetchConversationData() {
      if (!conversationId) return;
      try {
        const convRef = doc(db, "conversations", conversationId);
        const convSnap = await getDoc(convRef);

        if (convSnap.exists()) {
          const convData = convSnap.data();
          setConversation(convData);

          const currentUserId = auth.currentUser?.uid;
          const participants = convData.participants || [];
          const otherUid = participants.find((uid: string) => uid !== currentUserId);

          if (otherUid) {
            const userSnap = await getDoc(doc(db, "users", otherUid));
            if (userSnap.exists()) {
              setOtherUser({ uid: userSnap.id, ...userSnap.data() });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching conversation details:", error);
      } finally {
        setLoadingConv(false);
      }
    }

    fetchConversationData();
  }, [conversationId]);

  if (loadingConv) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-muted">جاري تحميل المحادثة...</div>;
  }

  if (!conversation || !otherUser) {
    return <EmptyState icon="search" title="Conversation not found" description="It may have been deleted, or the link is out of date." />;
  }

  const customName = myUid && conversation.customNames ? conversation.customNames[myUid] : null;
  const displayName = customName || otherUser.displayName || otherUser.userId || "مستخدم";
  const isMuted = myUid ? (conversation.mutedBy || []).includes(myUid) : false;
  
  // التحقق مما إذا كان هذا الشخص في قائمة الحظر الخاصة بك
  const isBlockedByMe = myBlockedUsers.some((u: any) => u.uid === otherUser.uid);

  function handleTypingChange(isTyping: boolean) {}

  async function handleToggleMute() {
    if (!conversationId || !myUid) return;
    try {
      const convRef = doc(db, "conversations", conversationId);
      await updateDoc(convRef, {
        mutedBy: isMuted ? arrayRemove(myUid) : arrayUnion(myUid)
      });
      setConversation((prev: any) => ({
        ...prev,
        mutedBy: isMuted 
          ? (prev.mutedBy || []).filter((id: string) => id !== myUid)
          : [...(prev.mutedBy || []), myUid]
      }));
    } catch (error) {
      console.error("Error toggling mute", error);
    }
  }

  async function handleRename(newName: string | null) {
    if (!conversationId || !myUid) return;
    try {
      const convRef = doc(db, "conversations", conversationId);
      await updateDoc(convRef, {
        [`customNames.${myUid}`]: newName
      });
      setConversation((prev: any) => ({
        ...prev,
        customNames: { ...(prev.customNames || {}), [myUid]: newName }
      }));
      setRenaming(false);
    } catch (error) {
      console.error("Error renaming", error);
    }
  }

  // دالة الحظر المباشرة من الشات
  async function handleBlock() {
    if (!myUid || !otherUser) return;
    try {
      await updateDoc(doc(db, "users", myUid), {
        blockedUsers: arrayUnion({
          uid: otherUser.uid,
          userId: otherUser.userId,
          displayName: otherUser.displayName || "مستخدم"
        })
      });
      setToast("تم الحظر بنجاح");
    } catch (error) {
      console.error(error);
    }
  }

  // دالة فك الحظر
  async function handleUnblock() {
    if (!myUid || !otherUser) return;
    try {
      const userToRemove = myBlockedUsers.find(u => u.uid === otherUser.uid);
      if (userToRemove) {
        await updateDoc(doc(db, "users", myUid), {
          blockedUsers: arrayRemove(userToRemove)
        });
        setToast("تم إلغاء الحظر");
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        user={otherUser}
        displayName={displayName}
        isTyping={otherTyping}
        muted={isMuted}
        onToggleMute={handleToggleMute}
        onRename={() => setRenaming(true)}
        onSearchInChat={() => router.push(`/search-messages?conversation=${conversationId}`)}
        onOpenProfile={() => router.push(`/u/${otherUser.userId}`)}
        
        // تمرير دوال الحظر للشريط العلوي
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        isBlocked={isBlockedByMe}
      />

      <MessageList
        messages={messages as any}
        loading={messagesLoading}
        pinnedIds={pinnedIds}
        otherUserTyping={otherTyping}
        onReply={(m: any) => { setEditingMessage(null); setReplyingTo(m); }}
        onEdit={(m: any) => { setReplyingTo(null); setEditingMessage(m); }}
        onDeleteForMe={(id: string) => deleteMessage(id)}
        onDeleteForEveryone={(id: string) => deleteMessage(id)}
        onDeleteMany={(ids: string[]) => ids.forEach((id) => deleteMessage(id))}
        onCopy={(m: any) => {
          if (m.text) navigator.clipboard?.writeText(m.text).catch(() => {});
          setToast("Copied to clipboard");
        }}
        onForward={() => {}}
        onForwardMany={() => {}}
        onTogglePinMessage={togglePinMessage}
        onReact={react}
        onOpenImage={() => {}}
      />

      {/* إخفاء مكان الكتابة إذا كان المستخدم محظوراً وعرض رسالة الحظر */}
      {isBlockedByMe ? (
        <div className="flex flex-col items-center justify-center border-t border-border bg-surface-sunken px-4 py-6 text-center">
          <p className="text-sm font-medium text-ink-muted mb-2">
            لقد قمت بحظر هذا المستخدم
          </p>
          <button
            onClick={handleUnblock}
            className="focus-ring rounded-lg bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-sm border border-border hover:bg-surface-raised transition"
          >
            إلغاء الحظر
          </button>
        </div>
      ) : (
        <MessageInput
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onSend={(text: string) => {
            sendMessage({ type: "text", text, replyTo: replyingTo?.messageId ?? null });
            setReplyingTo(null);
          }}
          onSaveEdit={(text: string) => {
            if (editingMessage) editMessage(editingMessage.messageId, text);
            setEditingMessage(null);
          }}
          onTypingChange={handleTypingChange}
        />
      )}

      {renaming && (
        <RenameContact
          userId={otherUser.userId}
          currentName={customName}
          onSave={handleRename}
          onClose={() => setRenaming(false)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
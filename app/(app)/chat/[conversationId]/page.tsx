"use client";

import { useEffect, useRef, useState } from "react";
import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { MediaViewer } from "@/components/chat/MediaViewer";
import { RenameContact } from "@/components/users/RenameContact";
import { Toast } from "@/components/common/Toast";
import { EmptyState } from "@/components/common/EmptyState";
import { useMessages, type FirestoreMessage } from "@/hooks/useMessages";
import { db, auth, storage } from "@/firebase/client";
import { deleteObject, ref as storageRef, uploadBytes } from "firebase/storage";
import { doc, getDoc, getDocs, collection, updateDoc, onSnapshot } from "firebase/firestore";
import { setTyping, subscribeToTyping } from "@/lib/realtime/presence";
import { markConversationAsRead, markMessageAsRead } from "@/lib/messages/messageService";

export default function ChatPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const router = useRouter();

  const [conversation, setConversation] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loadingConv, setLoadingConv] = useState(true);
  const [myPreview, setMyPreview] = useState<any>(null);

  // حالات خاصة بالمستخدم الحالي وقائمة المحظورين
  const [myBlockedUsers, setMyBlockedUsers] = useState<any[]>([]);
  const [myUid, setMyUid] = useState<string | null>(null);

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    hasMore: hasMoreMessages,
    loadingOlder: loadingOlderMessages,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useMessages(conversationId);

  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const readAttemptedRef = useRef(new Set<string>());
  const [imageMessage, setImageMessage] = useState<FirestoreMessage | null>(null);
  const closeMediaViewer = useCallback(() => setImageMessage(null), []);

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
    if (!myUid || !conversationId) return;
    setMyPreview(null);
    return onSnapshot(
      doc(db, "users", myUid, "conversations", conversationId),
      (snapshot) => setMyPreview(snapshot.exists() ? snapshot.data() : null),
      (error) => {
        console.error("Error fetching inbox preview:", error);
        setToast("Conversation settings could not be loaded.");
      }
    );
  }, [conversationId, myUid]);

  useEffect(() => {
    if (!myUid || !conversationId) return;
    const unsubscribe = subscribeToTyping(conversationId, (typingUids) => {
      setOtherTyping(typingUids.some((uid) => uid !== myUid));
    });
    return () => {
      unsubscribe();
      void setTyping(conversationId, myUid, false).catch((error) => {
        console.error("Failed to clear typing status:", error);
      });
    };
  }, [conversationId, myUid]);

  useEffect(() => {
    readAttemptedRef.current.clear();
    if (!myUid || !conversationId) return;
    void markConversationAsRead({ conversationId, uid: myUid }).catch((error) => {
      console.error("Failed to mark conversation as read:", error);
      setToast("Read status could not be updated.");
    });
  }, [conversationId, myUid]);

  useEffect(() => {
    if (!myUid || !conversationId) return;
    const unreadMessages = messages.filter(
      (message) =>
        message.senderId !== myUid &&
        !message.readBy.includes(myUid) &&
        !readAttemptedRef.current.has(message.messageId)
    );
    if (unreadMessages.length === 0) return;

    for (const message of unreadMessages) readAttemptedRef.current.add(message.messageId);
    void Promise.all(
      unreadMessages.map((message) =>
        markMessageAsRead({ conversationId, messageId: message.messageId, uid: myUid })
      )
    ).catch((error) => {
      console.error("Failed to mark messages as read:", error);
      setToast("Message read receipts could not be updated.");
    });
  }, [conversationId, messages, myUid]);

  useEffect(() => {
    setImageMessage(null);
    let active = true;
    async function fetchConversationData() {
      if (!conversationId) return;
      setLoadingConv(true);
      setConversation(null);
      setOtherUser(null);
      try {
        const convRef = doc(db, "conversations", conversationId);
        const convSnap = await getDoc(convRef);

        if (convSnap.exists()) {
          const convData = convSnap.data();
          if (!active) return;
          setConversation(convData);

          const currentUserId = auth.currentUser?.uid;
          const members = await getDocs(collection(db, "conversations", conversationId, "members"));
          if (!active) return;
          const otherUid = members.docs.map((member) => member.id).find((uid) => uid !== currentUserId);
          if (!otherUid) {
            setOtherUser(null);
            return;
          }

          const publicProfile = await getDoc(doc(db, "publicProfiles", otherUid));
          if (!active) return;
          const publicData = publicProfile.data();
          setOtherUser({
            uid: otherUid,
            displayName: typeof publicData?.displayName === "string" ? publicData.displayName : null,
            userId: typeof publicData?.userId === "string" ? publicData.userId : null,
            status: "offline",
          });
        } else {
          if (!active) return;
          setConversation(null);
          setOtherUser(null);
        }
      } catch (error) {
        if (!active) return;
        console.error("Error fetching conversation details:", error);
        setConversation(null);
        setOtherUser(null);
      } finally {
        if (active) setLoadingConv(false);
      }
    }

    void fetchConversationData();
    return () => {
      active = false;
    };
  }, [conversationId]);

  async function handleSendAttachment(file: File, caption: string, replyTo: string | null) {
    if (!myUid) throw new Error("You must be signed in to send an attachment.");
    if (file.size >= 25 * 1024 * 1024) {
      throw new Error("Attachments must be smaller than 25 MB.");
    }

    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("audio/")
        ? "audio"
        : "file";
    const path = `conversations/${conversationId}/media/${crypto.randomUUID()}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file, {
      contentType: file.type || "application/octet-stream",
    });

    try {
      await sendMessage({
        type,
        text: caption || null,
        replyTo,
        metadata: {
          storagePath: path,
          fileName: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
        },
      });
    } catch (error) {
      try {
        await deleteObject(fileRef);
      } catch (cleanupError) {
        console.error("Could not clean up an unsent attachment:", cleanupError);
      }
      throw error;
    }
  }

  if (loadingConv) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-muted">جاري تحميل المحادثة...</div>;
  }

  if (!conversation || !otherUser) {
    return <EmptyState icon="search" title="Conversation not found" description="It may have been deleted, or the link is out of date." />;
  }

  const customName = myPreview?.customName ?? null;
  const displayName = customName || otherUser.displayName || otherUser.userId || "مستخدم";
  const isMuted = myPreview?.muted === true;
  
  // التحقق مما إذا كان هذا الشخص في قائمة الحظر الخاصة بك
  const isBlockedByMe = myBlockedUsers.some((u: any) => u.uid === otherUser.uid);

  function handleTypingChange(isTyping: boolean) {
    if (!myUid) return;
    void setTyping(conversationId, myUid, isTyping).catch((error) => {
      console.error("Failed to update typing status:", error);
    });
  }

  async function handleToggleMute() {
    if (!conversationId || !myUid) return;
    try {
      await updateDoc(doc(db, "users", myUid, "conversations", conversationId), {
        muted: !isMuted,
      });
    } catch (error) {
      console.error("Error toggling mute:", error);
      setToast("Could not update conversation settings.");
    }
  }

  async function handleRename(newName: string | null) {
    if (!conversationId || !myUid) return;
    try {
      await updateDoc(doc(db, "users", myUid, "conversations", conversationId), {
        customName: newName,
      });
      setRenaming(false);
    } catch (error) {
      console.error("Error renaming contact:", error);
      setToast("Could not rename this contact.");
    }
  }

  async function handleBlock() {
    setToast("Blocking is not available yet.");
  }

  async function handleUnblock() {
    setToast("Blocking is not available yet.");
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
        onOpenProfile={() => {
          if (otherUser.userId) router.push(`/u/${otherUser.userId}`);
          else setToast("This contact has not set up a public profile yet.");
        }}
        
        // تمرير دوال الحظر للشريط العلوي
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        isBlocked={isBlockedByMe}
      />

      <MessageList
        messages={messages}
        loading={messagesLoading}
        error={messagesError}
        hasMore={hasMoreMessages}
        loadingOlder={loadingOlderMessages}
        onLoadOlder={() => void loadOlderMessages()}
        currentUserId={myUid}
        otherUserTyping={otherTyping}
        onReply={(m: any) => { setEditingMessage(null); setReplyingTo(m); }}
        onEdit={(m: any) => { setReplyingTo(null); setEditingMessage(m); }}
        onDeleteForEveryone={(id: string) => {
          void deleteMessage(id).catch((error) => {
            console.error("Could not delete message:", error);
            setToast("Could not delete this message.");
          });
        }}
        onDeleteMany={(ids: string[]) => {
          if (ids.some((id) => messages.find((message) => message.messageId === id)?.senderId !== myUid)) {
            setToast("You can only delete your own messages.");
            return;
          }
          void Promise.all(ids.map((id) => deleteMessage(id))).catch((error) => {
            console.error("Could not delete selected messages:", error);
            setToast("Could not delete the selected messages.");
          });
        }}
        onCopy={async (message: any) => {
          if (!message.text || !navigator.clipboard) {
            setToast("Copy is not available in this browser.");
            return;
          }
          try {
            await navigator.clipboard.writeText(message.text);
            setToast("Copied to clipboard");
          } catch (error) {
            console.error("Could not copy message:", error);
            setToast("Could not copy this message.");
          }
        }}
        onOpenImage={(message: FirestoreMessage) => {
          if (message.type === "image") setImageMessage(message);
        }}
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
          onSend={async (text: string) => {
            await sendMessage({ type: "text", text, replyTo: replyingTo?.messageId ?? null });
            setReplyingTo(null);
          }}
          onSendAttachment={async (file, caption, replyTo) => {
            await handleSendAttachment(file, caption, replyTo);
            setReplyingTo(null);
          }}
          onSaveEdit={async (text: string) => {
            if (editingMessage) await editMessage(editingMessage.messageId, text);
            setEditingMessage(null);
          }}
          onTypingChange={handleTypingChange}
        />
      )}

      {renaming && (
        <RenameContact
          userId={otherUser.userId ?? "contact"}
          currentName={customName}
          onSave={handleRename}
          onClose={() => setRenaming(false)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      {imageMessage && <MediaViewer message={imageMessage} onClose={closeMediaViewer} />}
    </div>
  );
}
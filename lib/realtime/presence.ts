import { ref, onValue, onDisconnect, set, serverTimestamp, off } from "firebase/database";
import { rtdb } from "@/firebase/client";

/**
 * Presence and last-seen live in Realtime Database, not Firestore, because
 * they change constantly and RTDB's onDisconnect() gives reliable
 * "went offline" detection that Firestore can't do on its own.
 */
export function startPresence(uid: string): () => void {
  const statusRef = ref(rtdb, `status/${uid}`);
  const connectedRef = ref(rtdb, ".info/connected");

  const unsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() !== true) return;

    onDisconnect(statusRef)
      .set({ state: "offline", lastSeenAt: serverTimestamp() })
      .then(() => {
        set(statusRef, { state: "online", lastSeenAt: serverTimestamp() });
      });
  });

  return () => {
    unsubscribe();
    off(connectedRef);
  };
}

/**
 * Typing indicators also live in RTDB — never write per-keystroke data to
 * Firestore. Callers should debounce setTyping(true) and always clear it
 * (setTyping(false)) on blur/send/unmount.
 */
export function setTyping(conversationId: string, uid: string, isTyping: boolean): Promise<void> {
  const typingRef = ref(rtdb, `typing/${conversationId}/${uid}`);
  return isTyping
    ? set(typingRef, { isTyping: true, updatedAt: serverTimestamp() })
    : set(typingRef, null);
}

export function subscribeToTyping(
  conversationId: string,
  onChange: (typingUids: string[]) => void
): () => void {
  const typingRef = ref(rtdb, `typing/${conversationId}`);
  const unsubscribe = onValue(typingRef, (snap) => {
    const val = (snap.val() ?? {}) as Record<string, { isTyping: boolean }>;
    onChange(Object.keys(val).filter((uid) => val[uid]?.isTyping));
  });
  return () => unsubscribe();
}

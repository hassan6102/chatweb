import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import type { MessageDocument } from "@/types/message";

const DEFAULT_PAGE_SIZE = 30; // within the 20–50 target range

export interface MessagesPage {
  messages: MessageDocument[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Loads the most recent page of messages, or the page before `cursor`
 * when paginating backwards into history. Never loads a whole
 * conversation at once — see docs/ARCHITECTURE.md ("Performance").
 */
export async function getMessagesPage(
  conversationId: string,
  cursor: QueryDocumentSnapshot | null = null,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<MessagesPage> {
  const base = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "desc"),
    limit(pageSize + 1)
  );

  const q = cursor ? query(base, startAfter(cursor)) : base;
  const snap = await getDocs(q);

  const docs = snap.docs.slice(0, pageSize);
  const hasMore = snap.docs.length > pageSize;

  return {
    messages: docs.map((d) => d.data() as MessageDocument),
    cursor: docs.length ? docs[docs.length - 1] : null,
    hasMore,
  };
}

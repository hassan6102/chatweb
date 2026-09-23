import type { Timestamp } from "firebase/firestore";

export type MessageType = "text" | "image" | "audio" | "file" | "system";

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface MessageMetadata {
  /** Bytes, for image/audio/file types. */
  size?: number;
  /** MIME type, for image/audio/file types. */
  mimeType?: string;
  /** Seconds, for audio (voice messages). */
  durationSeconds?: number;
  /** Pixel dimensions, for images. */
  width?: number;
  height?: number;
  /** Storage path in Firebase Storage, e.g. conversations/{id}/media/{file}. */
  storagePath?: string;
  fileName?: string;
}

/** conversations/{conversationId}/messages/{messageId} */
export interface MessageDocument {
  messageId: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  /** Text body; caption for media messages. Null for pure media with no caption. */
  text: string | null;
  status: MessageStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  editedAt: Timestamp | null;
  deleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
  /** messageId of the message being replied to, or null. */
  replyTo: string | null;
  metadata: MessageMetadata | null;
  /** uids that have read this message — used to compute per-member read state. */
  readBy: string[];
}

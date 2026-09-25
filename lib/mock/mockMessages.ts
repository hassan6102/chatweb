import type { MessageDocument } from "@/types/message";
import type { MessageReactions } from "@/types/ui";
import { CURRENT_USER } from "./mockUsers";

/** Same shape as MessageDocument but createdAt/updatedAt/etc. are epoch ms — see lib/mock/timestamp.ts. */
export type MockMessage = Omit<
  MessageDocument,
  "createdAt" | "updatedAt" | "editedAt" | "deletedAt"
> & {
  createdAt: number;
  updatedAt: number;
  editedAt: number | null;
  deletedAt: number | null;
  reactions?: MessageReactions;
};

const now = Date.now();
const minutesAgo = (n: number) => now - n * 60_000;

function textMessage(
  partial: Partial<MockMessage> & Pick<MockMessage, "messageId" | "conversationId" | "senderId" | "text" | "createdAt">
): MockMessage {
  return {
    type: "text",
    status: "read",
    updatedAt: partial.createdAt,
    editedAt: null,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
    replyTo: null,
    metadata: null,
    readBy: [CURRENT_USER.uid],
    ...partial,
  };
}

export const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  "conv-1": [
    textMessage({
      messageId: "m1",
      conversationId: "conv-1",
      senderId: "uid-1",
      text: "Hey! Are you coming tomorrow?",
      createdAt: minutesAgo(180),
    }),
    textMessage({
      messageId: "m2",
      conversationId: "conv-1",
      senderId: CURRENT_USER.uid,
      text: "Yes, I'll come. What time works?",
      createdAt: minutesAgo(178),
      replyTo: "m1",
    }),
    textMessage({
      messageId: "m3",
      conversationId: "conv-1",
      senderId: "uid-1",
      text: "Let's say 6pm at the usual place",
      createdAt: minutesAgo(175),
      reactions: { [CURRENT_USER.uid]: "👍" },
    }),
    {
      messageId: "m4",
      conversationId: "conv-1",
      senderId: CURRENT_USER.uid,
      type: "image",
      text: null,
      status: "delivered",
      createdAt: minutesAgo(60),
      updatedAt: minutesAgo(60),
      editedAt: null,
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      replyTo: null,
      metadata: {
        width: 800,
        height: 600,
        mimeType: "image/jpeg",
        storagePath: "conversations/conv-1/media/sample.jpg",
        fileName: "sample.jpg",
      },
      readBy: [CURRENT_USER.uid],
    },
    {
      messageId: "m5",
      conversationId: "conv-1",
      senderId: "uid-1",
      type: "audio",
      text: null,
      status: "read",
      createdAt: minutesAgo(45),
      updatedAt: minutesAgo(45),
      editedAt: null,
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      replyTo: null,
      metadata: { durationSeconds: 14, mimeType: "audio/webm" },
      readBy: [CURRENT_USER.uid, "uid-1"],
    },
    textMessage({
      messageId: "m6",
      conversationId: "conv-1",
      senderId: "uid-1",
      text: "See you then 🙂",
      createdAt: minutesAgo(2),
      status: "delivered",
    }),
  ],
  "conv-2": [
    textMessage({
      messageId: "m7",
      conversationId: "conv-2",
      senderId: "uid-2",
      text: "Did you check the report I sent?",
      createdAt: minutesAgo(400),
    }),
    {
      messageId: "m8",
      conversationId: "conv-2",
      senderId: "uid-2",
      type: "file",
      text: "Q3 numbers",
      status: "read",
      createdAt: minutesAgo(398),
      updatedAt: minutesAgo(398),
      editedAt: null,
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      replyTo: null,
      metadata: { fileName: "q3-report.pdf", size: 482_000, mimeType: "application/pdf" },
      readBy: [CURRENT_USER.uid, "uid-2"],
    },
    textMessage({
      messageId: "m9",
      conversationId: "conv-2",
      senderId: CURRENT_USER.uid,
      text: "Looking now, thanks!",
      createdAt: minutesAgo(390),
    }),
    {
      messageId: "m10",
      conversationId: "conv-2",
      senderId: "uid-2",
      type: "text",
      text: null,
      status: "read",
      createdAt: minutesAgo(20),
      updatedAt: minutesAgo(19),
      editedAt: null,
      deleted: true,
      deletedAt: minutesAgo(19),
      deletedBy: "uid-2",
      replyTo: null,
      metadata: null,
      readBy: [CURRENT_USER.uid, "uid-2"],
    },
  ],
  "conv-3": [
    textMessage({
      messageId: "m11",
      conversationId: "conv-3",
      senderId: "uid-3",
      text: "Welcome to the neighborhood 👋",
      createdAt: minutesAgo(60 * 24 * 3),
    }),
    textMessage({
      messageId: "m12",
      conversationId: "conv-3",
      senderId: CURRENT_USER.uid,
      text: "Thank you! Excited to be here.",
      createdAt: minutesAgo(60 * 24 * 3 - 5),
      status: "delivered",
    }),
  ],
  "conv-4": [
    textMessage({
      messageId: "m13",
      conversationId: "conv-4",
      senderId: CURRENT_USER.uid,
      text: "Reminder: rent is due Friday",
      createdAt: minutesAgo(60 * 24),
      status: "sent",
    }),
  ],
  "conv-5": [
    textMessage({
      messageId: "m14",
      conversationId: "conv-5",
      senderId: "uid-5",
      text: "Loved the photos from the trip!",
      createdAt: minutesAgo(15),
    }),
  ],
};

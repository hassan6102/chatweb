"use client";

import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { ReplyQuote } from "./ReplyPreview";
import { ReactionPicker } from "./ReactionPicker";
import { ReactionsRow } from "./ReactionsRow";
import { MessageActionsMenu, type MessageAction } from "./MessageActionsMenu";
import { ImageMessage, FileMessage } from "./MediaMessage";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { formatClockTime } from "@/lib/mock/timestamp";
import type { ReactionEmoji } from "@/types/ui";
import { auth } from "@/firebase/client";

export function MessageBubble({
  message,
  isOwn,
  replyToMessage,
  isPinned,
  selectionMode,
  selected,
  onToggleSelect,
  onReply,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onCopy,
  onForward,
  onTogglePin,
  onReact,
  onOpenImage,
}: {
  message: any;
  isOwn: boolean;
  replyToMessage: any | null;
  isPinned: boolean;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onCopy: () => void;
  onForward: () => void;
  onTogglePin: () => void;
  onReact: (emoji: ReactionEmoji | null) => void;
  onOpenImage: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  
  const currentUid = auth.currentUser?.uid || "";

  // السطر ده بيعالج مشكلة الوقت بيقراه مهما كانت صيغته
  const msgTime = typeof message.createdAt === "number" 
    ? message.createdAt 
    : (message.createdAt?.toMillis ? message.createdAt.toMillis() : Date.now());

  if (message.deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="flex items-center gap-1.5 rounded-2xl bg-surface-sunken px-3.5 py-2 text-sm italic text-ink-faint">
          <Icon name="trash" size={13} />
          This message was deleted
        </div>
      </div>
    );
  }

  const myReaction = message.reactions?.[currentUid];

  const actions: MessageAction[] = [
    { key: "reply", icon: "reply", label: "Reply", onSelect: onReply },
    ...(isOwn && message.type === "text"
      ? [{ key: "edit", icon: "edit" as const, label: "Edit", onSelect: onEdit }]
      : []),
    ...(message.type === "text"
      ? [{ key: "copy", icon: "copy" as const, label: "Copy", onSelect: onCopy }]
      : []),
    { key: "forward", icon: "forward", label: "Forward", onSelect: onForward },
    { key: "pin", icon: "pin", label: isPinned ? "Unpin" : "Pin", onSelect: onTogglePin },
    { key: "select", icon: "checkCheck", label: "Select", onSelect: onToggleSelect },
    { key: "deleteMe", icon: "trash", label: "Delete for me", danger: true, onSelect: onDeleteForMe },
    ...(isOwn
      ? [
          {
            key: "deleteAll",
            icon: "trash" as const,
            label: "Delete for everyone",
            danger: true,
            onSelect: onDeleteForEveryone,
          },
        ]
      : []),
  ];

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {selectionMode && (
        <button
          onClick={onToggleSelect}
          aria-label={selected ? "Deselect message" : "Select message"}
          aria-pressed={selected}
          className={`focus-ring mb-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-accent bg-accent text-accent-ink" : "border-border text-transparent"
          }`}
        >
          <Icon name="check" size={12} />
        </button>
      )}

      <div className={`group relative flex max-w-[78%] flex-col sm:max-w-[65%] -m-2 p-2 ${isOwn ? "items-end" : "items-start"}`}>
        
        <div
          dir="auto"
          className={`relative rounded-2xl px-3.5 py-2 text-sm ${
            isOwn
              ? "rounded-br-md bg-bubble-out text-bubble-out-ink"
              : "rounded-bl-md bg-bubble-in text-ink"
          } ${message.type === "text" ? "" : "p-1.5"}`}
        >
          {replyToMessage && <ReplyQuote message={replyToMessage} />}

          {message.type === "text" && (
            <span className="whitespace-pre-wrap break-words">{message.text}</span>
          )}
          {message.type === "image" && (
            <ImageMessage metadata={message.metadata} onOpen={onOpenImage} />
          )}
          {message.type === "audio" && (
            <VoiceMessagePlayer durationSeconds={message.metadata?.durationSeconds ?? 0} />
          )}
          {message.type === "file" && (
            <FileMessage metadata={message.metadata} text={message.text} />
          )}

          <span
            className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
              isOwn ? "text-bubble-out-ink/75" : "text-ink-faint"
            } ${message.type === "text" ? "" : "px-1.5"}`}
          >
            {isPinned && <Icon name="pin" size={10} />}
            {message.editedAt && <span>edited</span>}
            {/* قراءة الوقت المظبوط هنا */}
            {formatClockTime(msgTime)}
            {isOwn && <StatusTick status={message.status} />}
          </span>
        </div>

        {!selectionMode && (
          <div
            className={`pointer-events-none absolute top-0 bottom-0 flex items-center opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 ${
              isOwn ? "right-full pr-2" : "left-full pl-2"
            }`}
          >
            <div className="relative flex items-center gap-0.5">
              <button
                aria-label="React"
                onClick={() => setPickerOpen((v) => !v)}
                className="focus-ring flex h-7 w-7 items-center justify-center rounded-full bg-surface text-ink-muted shadow-sm hover:text-ink"
              >
                <Icon name="smile" size={14} />
              </button>
              <button
                aria-label="More actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="focus-ring flex h-7 w-7 items-center justify-center rounded-full bg-surface text-ink-muted shadow-sm hover:text-ink"
              >
                <Icon name="more" size={14} />
              </button>
              
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
                  <div className="relative">
                    <ReactionPicker
                      current={myReaction}
                      align={isOwn ? "end" : "start"}
                      onPick={(emoji) => {
                        onReact(myReaction === emoji ? null : emoji);
                        setPickerOpen(false);
                      }}
                    />
                  </div>
                </>
              )}
              {menuOpen && (
                <MessageActionsMenu actions={actions} onClose={() => setMenuOpen(false)} align={isOwn ? "end" : "start"} />
              )}
            </div>
          </div>
        )}

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <ReactionsRow reactions={message.reactions} currentUid={currentUid} align={isOwn ? "end" : "start"} />
        )}
      </div>
    </div>
  );
}

function StatusTick({ status }: { status: string }) {
  if (status === "sending") return <Icon name="clock" size={12} />;
  if (status === "failed") return <Icon name="alertTriangle" size={12} className="text-danger" />;
  if (status === "sent") return <Icon name="check" size={13} />;
  if (status === "delivered") return <Icon name="checkCheck" size={13} />;
  if (status === "read") return <Icon name="checkCheck" size={13} className="text-sky-300" />;
  return null;
}
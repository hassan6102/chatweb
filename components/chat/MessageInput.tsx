"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { ComposerReplyBar } from "./ReplyPreview";
import type { MockMessage } from "@/lib/mock/mockMessages";

const QUICK_EMOJIS = ["😀", "😂", "😍", "👍", "🙏", "🎉", "🔥", "😢", "❤️", "😮", "🤔", "👏"];

export function MessageInput({
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSend,
  onSaveEdit,
  onTypingChange,
}: {
  replyingTo: MockMessage | null;
  onCancelReply: () => void;
  editingMessage: MockMessage | null;
  onCancelEdit: () => void;
  onSend: (text: string) => void;
  onSaveEdit: (text: string) => void;
  onTypingChange: (isTyping: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text ?? "");
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  function handleChange(value: string) {
    setText(value);
    onTypingChange(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTypingChange(false), 1500);
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (editingMessage) onSaveEdit(trimmed);
    else onSend(trimmed);
    setText("");
    onTypingChange(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape" && editingMessage) onCancelEdit();
  }

  return (
    <div className="border-t border-border bg-surface">
      {editingMessage && (
        <div className="flex items-center gap-2 bg-surface-sunken px-3 py-2">
          <Icon name="edit" size={16} className="shrink-0 text-accent" />
          <p className="flex-1 text-xs font-medium text-accent">Editing message</p>
          <button
            aria-label="Cancel edit"
            onClick={onCancelEdit}
            className="focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-surface hover:text-ink"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {!editingMessage && replyingTo && <ComposerReplyBar message={replyingTo} onCancel={onCancelReply} />}

      <div className="flex items-end gap-2 px-3 py-2">
        <div className="relative flex flex-1 items-end rounded-2xl bg-surface-sunken px-2 py-1">
          <div className="relative">
            <IconButton aria-label="Emoji" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((v) => !v)}>
              <Icon name="smile" size={19} />
            </IconButton>
            {emojiOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setEmojiOpen(false)} />
                <div className="absolute bottom-full left-0 z-20 mb-1 grid w-56 grid-cols-6 gap-1 rounded-xl border border-border bg-surface-raised p-2 shadow-lg">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleChange(text + emoji);
                        setEmojiOpen(false);
                        textareaRef.current?.focus();
                      }}
                      className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-surface-sunken"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            aria-label="Message"
            className="focus-ring max-h-[120px] flex-1 resize-none bg-transparent py-2 px-1 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>

        <IconButton
          aria-label={editingMessage ? "Save edit" : "Send message"}
          onClick={submit}
          disabled={!text.trim()}
          className={
            text.trim()
              ? "bg-accent text-accent-ink hover:bg-accent hover:opacity-90"
              : "bg-surface-raised text-ink-faint cursor-not-allowed"
          }
        >
          <Icon name={editingMessage ? "check" : "send"} size={18} />
        </IconButton>
      </div>
    </div>
  );
}
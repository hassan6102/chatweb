"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
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
  onSendAttachment,
  onSaveEdit,
  onTypingChange,
}: {
  replyingTo: MockMessage | null;
  onCancelReply: () => void;
  editingMessage: MockMessage | null;
  onCancelEdit: () => void;
  onSend: (text: string) => void | Promise<void>;
  onSendAttachment: (file: File, caption: string, replyTo: string | null) => Promise<void>;
  onSaveEdit: (text: string) => void | Promise<void>;
  onTypingChange: (isTyping: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const imagePreviewUrl = useMemo(
    () => (selectedFile?.type.startsWith("image/") ? URL.createObjectURL(selectedFile) : null),
    [selectedFile]
  );

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text ?? "");
      setSelectedFile(null);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(
    () => () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    },
    [imagePreviewUrl]
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    },
    []
  );

  function handleChange(value: string) {
    setText(value);
    setSubmitError(null);
    onTypingChange(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTypingChange(false), 1500);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setSubmitError(null);
    event.target.value = "";
  }

  function cancelEdit() {
    onCancelEdit();
    setText("");
    setSubmitError(null);
  }

  async function submit() {
    const trimmed = text.trim();
    if ((!trimmed && !selectedFile) || sending) return;
    setSending(true);
    setSubmitError(null);
    try {
      if (editingMessage) await onSaveEdit(trimmed);
      else if (selectedFile) {
        await onSendAttachment(selectedFile, trimmed, replyingTo?.messageId ?? null);
      }
      else await onSend(trimmed);
      setText("");
      setSelectedFile(null);
      onTypingChange(false);
    } catch (error) {
      console.error("Failed to submit message:", error);
      setSubmitError(
        error instanceof Error && error.message === "Attachments must be smaller than 25 MB."
          ? error.message
          : error instanceof Error && error.message.includes("permission")
            ? "Firebase denied this message. Refresh the chat and try again."
            : "Message could not be saved. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
    if (e.key === "Escape" && editingMessage) cancelEdit();
  }

  return (
    <div className="border-t border-border bg-surface">
      {editingMessage && (
        <div className="flex items-center gap-2 bg-surface-sunken px-3 py-2">
          <Icon name="edit" size={16} className="shrink-0 text-accent" />
          <p className="flex-1 text-xs font-medium text-accent">Editing message</p>
          <button
            aria-label="Cancel edit"
            onClick={cancelEdit}
            className="focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-surface hover:text-ink"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {!editingMessage && replyingTo && <ComposerReplyBar message={replyingTo} onCancel={onCancelReply} />}

      {selectedFile && !editingMessage && (
        <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-2.5">
          {imagePreviewUrl ? (
            <Image
              src={imagePreviewUrl}
              alt="Selected image preview"
              width={44}
              height={44}
              unoptimized
              className="h-11 w-11 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Icon name={selectedFile.type.startsWith("audio/") ? "mic" : "file"} size={19} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-ink">{selectedFile.name}</span>
            <span className="block text-[11px] text-ink-faint">
              {Math.max(1, Math.ceil(selectedFile.size / 1024))} KB · Ready to send
            </span>
          </span>
          <IconButton
            aria-label="Remove attachment"
            onClick={() => setSelectedFile(null)}
            disabled={sending}
          >
            <Icon name="x" size={16} />
          </IconButton>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2">
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          onChange={handleFileChange}
          aria-label="Choose an attachment"
        />
        {!editingMessage && (
          <IconButton
            aria-label="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Icon name="paperclip" size={19} />
          </IconButton>
        )}
        <div className="relative flex flex-1 items-end rounded-2xl bg-surface-sunken px-2 py-1">
          <div className="relative">
            <IconButton aria-label="Emoji" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((v) => !v)} disabled={sending}>
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
            disabled={sending}
            placeholder="Message"
            aria-label="Message"
            className="focus-ring max-h-[120px] flex-1 resize-none bg-transparent py-2 px-1 text-sm text-ink placeholder:text-ink-faint"
          />
        </div>

        <IconButton
          aria-label={editingMessage ? "Save edit" : "Send message"}
          onClick={() => void submit()}
          disabled={(!text.trim() && !selectedFile) || sending}
          aria-busy={sending}
          className={
            text.trim() || selectedFile
              ? "bg-accent text-accent-ink hover:bg-accent hover:opacity-90"
              : "bg-surface-raised text-ink-faint cursor-not-allowed"
          }
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : (
            <Icon name={editingMessage ? "check" : "send"} size={18} />
          )}
        </IconButton>
      </div>
      {submitError && (
        <p role="alert" className="px-4 pb-2 text-xs text-danger">
          {submitError}
        </p>
      )}
    </div>
  );
}
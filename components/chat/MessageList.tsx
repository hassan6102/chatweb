"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { EmptyState } from "@/components/common/EmptyState";
import { MessageListSkeleton } from "@/components/common/Skeleton";
import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { TypingIndicator } from "./TypingIndicator";
import { formatDateSeparator } from "@/lib/mock/timestamp";

export function MessageList({
  messages,
  loading,
  error,
  hasMore,
  loadingOlder,
  onLoadOlder,
  currentUserId,
  otherUserTyping,
  onReply,
  onEdit,
  onDeleteForEveryone,
  onDeleteMany,
  onCopy,
  onOpenImage,
}: {
  messages: any[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  currentUserId: string | null;
  otherUserTyping?: boolean;
  onReply: (message: any) => void;
  onEdit: (message: any) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onDeleteMany: (messageIds: string[]) => void;
  onCopy: (message: any) => void;
  onOpenImage: (message: any) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const lastMessageId = messages[messages.length - 1]?.messageId ?? null;
    if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
    lastMessageIdRef.current = lastMessageId;
  }, [messages]);

  useEffect(() => {
    if (!selectionMode) setSelectedIds([]);
  }, [selectionMode]);

  const messageById = useMemo(() => {
    const map = new Map<string, any>();
    for (const m of messages) map.set(m.messageId, m);
    return map;
  }, [messages]);

  const groups = useMemo(() => {
    const out: { label: string; items: any[] }[] = [];
    for (const message of messages) {
      // قراءة تاريخ فايربيز بشكل صحيح
      const timestamp = typeof message.createdAt === "number" 
        ? message.createdAt 
        : (message.createdAt?.toMillis ? message.createdAt.toMillis() : Date.now());
        
      const label = formatDateSeparator(timestamp);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(message);
      else out.push({ label, items: [message] });
    }
    return out;
  }, [messages]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (loading) return <MessageListSkeleton />;

  if (messages.length === 0) {
    if (error) {
      return (
        <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
          <p role="alert" className="max-w-sm text-sm text-danger">
            Messages could not be loaded. Check your connection and try again.
          </p>
        </div>
      );
    }
    return (
      <EmptyState
        icon="send"
        title="No messages yet"
        description="Say hello — messages you send will appear here."
      />
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto">
      {selectionMode && (
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface-raised px-3 py-2">
          <div className="flex items-center gap-2">
            <IconButton aria-label="Exit selection" onClick={() => setSelectionMode(false)}>
              <Icon name="x" size={18} />
            </IconButton>
            <span className="text-sm font-medium text-ink">{selectedIds.length} selected</span>
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              aria-label="Delete selected"
              disabled={selectedIds.length === 0}
              onClick={() => {
                onDeleteMany(selectedIds);
                setSelectionMode(false);
              }}
            >
              <Icon name="trash" size={18} className="text-danger" />
            </IconButton>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 px-3 py-3 sm:px-5">
        {error && (
          <p role="alert" className="mx-auto mb-2 max-w-lg rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-center text-xs text-danger">
            Some conversation updates could not be loaded.
          </p>
        )}
        {hasMore && (
          <button
            type="button"
            disabled={loadingOlder}
            onClick={onLoadOlder}
            className="focus-ring mx-auto mb-2 rounded-full border border-border bg-surface-raised px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-60"
          >
            {loadingOlder ? "Loading older messages…" : "Load older messages"}
          </button>
        )}
        {groups.map((group) => (
          <div key={group.label}>
            <DateSeparator label={group.label} />
            <div className="flex flex-col gap-1.5">
              {group.items.map((message) => (
                <MessageBubble
                  key={message.messageId}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  replyToMessage={message.replyTo ? messageById.get(message.replyTo) ?? null : null}
                  selectionMode={selectionMode}
                  selected={selectedIds.includes(message.messageId)}
                  onToggleSelect={() => {
                    if (!selectionMode) setSelectionMode(true);
                    toggleSelect(message.messageId);
                  }}
                  onReply={() => onReply(message)}
                  onEdit={() => onEdit(message)}
                  onDeleteForEveryone={() => onDeleteForEveryone(message.messageId)}
                  onCopy={() => onCopy(message)}
                  onOpenImage={() => onOpenImage(message)}
                />
              ))}
            </div>
          </div>
        ))}
        {otherUserTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
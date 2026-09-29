"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { useConversations } from "@/hooks/useConversations";
import { getMockUserByUid } from "@/lib/mock/mockUsers";

export function ForwardModal({
  count,
  onClose,
  onForwarded,
}: {
  count: number;
  onClose: () => void;
  onForwarded: (conversationId: string) => void;
}) {
  const { conversations } = useConversations();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Modal title={`Forward ${count > 1 ? `${count} messages` : "message"}`} onClose={onClose}>
      <div className="-mx-5 max-h-72 overflow-y-auto px-5">
        {conversations.map((c) => {
          const user = getMockUserByUid(c.otherUserId ?? "");
          if (!user) return null;
          const name = c.customName ?? user.displayName ?? user.userId;
          return (
            <button
              key={c.conversationId}
              onClick={() => setSelected(c.conversationId)}
              className={`focus-ring flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left ${selected === c.conversationId ? "bg-accent/10" : "hover:bg-surface-sunken"
                }`}
            >
              <Avatar name={name} userId={user.userId} photoURL={(user as any).photoURL} />              <span dir="auto" className="min-w-0 flex-1 truncate text-sm text-ink">
                {name}
              </span>
              <span
                className={`h-4 w-4 shrink-0 rounded-full border ${selected === c.conversationId ? "border-accent bg-accent" : "border-border"
                  }`}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!selected} onClick={() => selected && onForwarded(selected)}>
          Send
        </Button>
      </div>
    </Modal>
  );
}

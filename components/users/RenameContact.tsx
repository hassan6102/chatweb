"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

export function RenameContact({
  userId,
  currentName,
  onSave,
  onClose,
}: {
  userId: string;
  currentName: string | null;
  onSave: (name: string | null) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName ?? "");

  return (
    <Modal title="Rename contact" onClose={onClose} size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name.trim() ? name.trim() : null);
          onClose();
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-ink">
            Name for {userId}
          </label>
          <input
            id="contact-name"
            autoFocus
            dir="auto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a name only you will see"
            className="focus-ring w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint"
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            Private to your account — the other person keeps their own User ID and won&apos;t see
            this name.
          </p>
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}

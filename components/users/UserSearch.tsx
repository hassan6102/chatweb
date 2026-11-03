"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { auth } from "@/firebase/client";
import { createOrGetDirectConversation } from "@/lib/conversations/createOrGetDirectConversation";
import { findUserByUserId } from "@/lib/users/findUserByUserId";
import { isValidUserId } from "@/utils/userId";
import type { PublicUserProfile } from "@/types/user";

export function UserSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "found" | "not-found" | "invalid" | "error">("idle");
  const [result, setResult] = useState<PublicUserProfile | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestId = useRef(0);

  async function handleChange(next: string) {
    const cleaned = next.trim().toUpperCase();
    const currentRequestId = ++requestId.current;
    setValue(cleaned);
    setResult(null);
    setActionError(null);

    if (!cleaned) {
      setStatus("idle");
      return;
    }

    if (cleaned.length < 8) {
      setStatus("idle");
      return;
    }

    if (!isValidUserId(cleaned)) {
      setStatus("invalid");
      return;
    }

    setStatus("searching");

    try {
      const user = await findUserByUserId(cleaned);
      if (currentRequestId !== requestId.current) return;
      if (!user) {
        setStatus("not-found");
      } else {
        setResult(user);
        setStatus("found");
      }
    } catch (error) {
      console.error("Search error:", error);
      if (currentRequestId === requestId.current) setStatus("error");
    }
  }

  async function startChat(otherUid: string, otherUserId: string) {
    const myUid = auth.currentUser?.uid;
    if (!myUid) {
      setActionError("Please sign in again to start a conversation.");
      return;
    }

    setIsStartingChat(true);
    setActionError(null);

    try {
      const conversationId = await createOrGetDirectConversation(myUid, otherUid, otherUserId);
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : null;
      setActionError(
        code
          ? `Could not start this conversation (Firebase: ${code}). Please try again.`
          : "Could not start this conversation. Please try again."
      );
    } finally {
      setIsStartingChat(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label htmlFor="user-id-search" className="mb-1.5 block text-sm font-medium text-ink">
          User ID
        </label>
        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            id="user-id-search"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="e.g. GH-92841"
            autoComplete="off"
            aria-describedby="user-id-hint"
            className="focus-ring w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 font-mono text-sm uppercase tracking-wide text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-faint"
          />
        </div>
        <p id="user-id-hint" className="mt-1.5 text-xs text-ink-faint">
          Every person has a unique ID like GH-92841. Ask them for theirs.
        </p>
      </div>

      {status === "invalid" && (
        <p className="text-sm text-danger">That doesn&apos;t look like a valid User ID (format: GH-#####).</p>
      )}

      {status === "searching" && (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface-sunken" />
            <div className="h-2.5 w-1/4 animate-pulse rounded bg-surface-sunken" />
          </div>
        </div>
      )}

      {status === "not-found" && (
        <p className="text-sm text-ink-muted">No user found with ID &ldquo;{value}&rdquo;.</p>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-danger">
          User search is unavailable. Please try again later.
        </p>
      )}

      {status === "found" && result && (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="min-w-0 flex-1">
            {/* إخفاء الإيميل وعرض كلمة مستخدم أو اسم العرض */}
            <p dir="auto" className="truncate text-sm font-medium text-ink">
              {result.displayName || "User"}
            </p>
            <p className="font-mono text-xs text-ink-faint">{result.userId}</p>
          </div>
          {result.uid === auth.currentUser?.uid ? (
            <p className="text-xs text-ink-faint">This is you</p>
          ) : (
            <Button onClick={() => startChat(result.uid, result.userId)} disabled={isStartingChat}>
              {isStartingChat ? "جاري..." : "Message"}
            </Button>
          )}
        </div>
      )}
      {actionError && (
        <p role="alert" className="text-sm text-danger">
          {actionError}
        </p>
      )}
    </div>
  );
}
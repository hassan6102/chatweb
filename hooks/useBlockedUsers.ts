"use client";

import { useCallback, useMemo } from "react";
import { MOCK_BLOCKED_USERS } from "@/lib/mock/mockNotifications";
import { useLocalStorage } from "./useLocalStorage";
import type { BlockedUserEntry } from "@/types/ui";

const STORAGE_KEY = "blocked-users-overrides";

interface OverrideState {
  added: BlockedUserEntry[];
  unblockedUids: string[];
}

const EMPTY: OverrideState = { added: [], unblockedUids: [] };

export function useBlockedUsers() {
  const [state, setState] = useLocalStorage<OverrideState>(STORAGE_KEY, EMPTY);

  const blockedUsers = useMemo(() => {
    const base = MOCK_BLOCKED_USERS.filter((u) => !state.unblockedUids.includes(u.uid));
    return [...state.added, ...base];
  }, [state]);

  const isBlocked = useCallback(
    (uid: string) => blockedUsers.some((u) => u.uid === uid),
    [blockedUsers]
  );

  const block = useCallback(
    (entry: Omit<BlockedUserEntry, "blockedAt">) => {
      setState((prev) => ({
        added: [{ ...entry, blockedAt: Date.now() }, ...prev.added.filter((u) => u.uid !== entry.uid)],
        unblockedUids: prev.unblockedUids.filter((uid) => uid !== entry.uid),
      }));
    },
    [setState]
  );

  const unblock = useCallback(
    (uid: string) => {
      setState((prev) => ({
        added: prev.added.filter((u) => u.uid !== uid),
        unblockedUids: [...prev.unblockedUids, uid],
      }));
    },
    [setState]
  );

  return { blockedUsers, isBlocked, block, unblock };
}

"use client";

import { useLocalStorage } from "./useLocalStorage";

export interface AppPreferences {
  messageNotifications: boolean;
  reactionNotifications: boolean;
  notificationSound: boolean;
  readReceipts: boolean;
  showLastSeen: boolean;
}

const DEFAULTS: AppPreferences = {
  messageNotifications: true,
  reactionNotifications: true,
  notificationSound: true,
  readReceipts: true,
  showLastSeen: true,
};

const STORAGE_KEY = "app-preferences";

export function usePreferences() {
  const [preferences, setPreferences] = useLocalStorage<AppPreferences>(STORAGE_KEY, DEFAULTS);

  function update<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  return { preferences, update };
}

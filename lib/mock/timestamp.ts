import type { Timestamp } from "firebase/firestore";

/** Mock data uses plain epoch ms; real data uses Firestore Timestamp. Accept either. */
export type TimeLike = number | Timestamp | null | undefined;

export function toMillis(value: TimeLike): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof (value as Timestamp).toMillis === "function") {
    return (value as Timestamp).toMillis();
  }
  return null;
}

export function formatRelativeTime(value: TimeLike): string {
  const ms = toMillis(value);
  if (ms == null) return "";
  const diff = Date.now() - ms;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "now";
  if (diff < hour) return `${Math.floor(diff / minute)}m`;
  if (diff < day) return `${Math.floor(diff / hour)}h`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d`;

  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatClockTime(value: TimeLike): string {
  const ms = toMillis(value);
  if (ms == null) return "";
  return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatLastSeen(value: TimeLike): string {
  const ms = toMillis(value);
  if (ms == null) return "a while ago";
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  return `last seen ${formatRelativeTime(value)} ago`;
}

export function formatDateSeparator(value: TimeLike): string {
  const ms = toMillis(value);
  if (ms == null) return "";
  const date = new Date(ms);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

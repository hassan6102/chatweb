import type { Timestamp } from "firebase/firestore";

function toDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as Timestamp).toDate === "function") return (value as Timestamp).toDate();
  return null;
}

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const timeFmt = new Intl.DateTimeFormat("en", { timeStyle: "short" });

export function formatDate(value: Timestamp | Date | null | undefined): string {
  const d = toDate(value);
  return d ? dateFmt.format(d) : "\u2014";
}

export function formatDateTime(value: Timestamp | Date | null | undefined): string {
  const d = toDate(value);
  return d ? dateTimeFmt.format(d) : "\u2014";
}

export function formatTime(value: Timestamp | Date | null | undefined): string {
  const d = toDate(value);
  return d ? timeFmt.format(d) : "\u2014";
}

export function formatRelativeTime(value: Timestamp | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "\u2014";
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(value);
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, exp);
  return `${val.toFixed(exp === 0 ? 0 : 1)} ${units[exp]}`;
}

export function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en").format(n);
}

/** Masks all but the last 2 digits, e.g. "+20 10 1234 5678" -> "+•• •• •••• ••78". */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 2) return "\u2022\u2022\u2022\u2022";
  const last2 = digits.slice(-2);
  return `\u2022\u2022\u2022\u2022${last2}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "\u2022\u2022\u2022";
  const visible = local.slice(0, 1);
  return `${visible}${"\u2022".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export function initialsFromName(name: string | null, fallback: string): string {
  const source = name?.trim() || fallback;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

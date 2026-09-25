import type { UserStatus } from "@/types/user";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
} as const;

const PALETTE = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-fuchsia-500",
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(name: string | null, userId: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (first + second).toUpperCase();
  }
  return userId.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
}

export function Avatar({
  name,
  userId,
  photoURL,
  size = "md",
  status,
  showStatus = false,
}: {
  name: string | null;
  userId: string;
  photoURL?: string | null;
  size?: keyof typeof SIZES;
  status?: UserStatus;
  showStatus?: boolean;
}) {
  const dimension = SIZES[size];

  return (
    <span className="relative inline-flex shrink-0">
      {photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoURL}
          alt={name ?? userId}
          className={`${dimension} rounded-full object-cover`}
        />
      ) : (
        <span
          className={`${dimension} ${colorFor(userId)} flex items-center justify-center rounded-full font-medium text-white`}
          aria-hidden="true"
        >
          {initialsFor(name, userId)}
        </span>
      )}
      {showStatus && status === "active" && (
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-online"
          role="img"
          aria-label="Online"
        />
      )}
    </span>
  );
}

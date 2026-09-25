"use client";

import { Button } from "@/components/common/Button";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { formatLastSeen } from "@/lib/mock/timestamp";

export function UserProfilePanel({
  user,
  isSelf,
  customName,
  onBack,
  onMessage,
  onRename,
  onBlock,
  onEditProfile,
}: {
  user: any;
  isSelf: boolean;
  customName?: string | null;
  onBack: () => void;
  onMessage?: () => void;
  onRename?: () => void;
  onBlock?: () => void;
  onEditProfile?: () => void;
}) {
  // تم إزالة الإيميل تماماً من هنا واستخدام "مستخدم" كبديل نهائي
  const displayName = customName || user.displayName || user.name || user.userId || "مستخدم";

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <IconButton aria-label="Back" onClick={onBack}>
          <Icon name="back" size={20} />
        </IconButton>
        <h1 className="text-sm font-semibold text-ink">{isSelf ? "Your profile" : "Profile"}</h1>
      </header>

      <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-6 py-8 text-center">
        <h2 dir="auto" className="mt-4 text-lg font-semibold text-ink">
          {displayName}
        </h2>
        {customName && (
          <p className="text-xs text-ink-faint">
            {user.displayName || "مستخدم"} · renamed by you
          </p>
        )}

        <div className="mt-2 flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1 font-mono text-sm text-ink-muted">
          {user.userId}
        </div>

        <p className="mt-1 text-xs text-ink-faint">
          {user.status === "active" || user.status === "online" ? "Online" : formatLastSeen(user.lastSeenAt)}
        </p>

        {!isSelf && (
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
            <Button onClick={onMessage} fullWidth>
              <Icon name="send" size={16} />
              Message
            </Button>
            <Button variant="secondary" onClick={onRename} fullWidth>
              <Icon name="edit" size={16} />
              Rename contact
            </Button>
            <Button variant="danger" onClick={onBlock} fullWidth>
              <Icon name="block" size={16} />
              Block user
            </Button>
          </div>
        )}

        {isSelf && (
          <div className="mt-8 w-full max-w-xs space-y-1 text-left">
            {/* تم إخفاء الإيميل من هنا نهائياً */}
            <InfoRow label="Phone" value={user.phone || "No phone number"} />
            <InfoRow label="Status" value="Active" />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink" dir="ltr">{value}</span>
    </div>
  );
}
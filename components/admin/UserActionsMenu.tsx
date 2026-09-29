"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RowMenu, type RowMenuItem } from "@/components/admin/ui/RowMenu";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { useAdminToast } from "@/components/admin/ui/Toast";
import { useAdminAuth } from "@/lib/admin/adminAuth";
import { hasPermission, type AdminRole, type AdminUserRow } from "@/types/admin";
import { recordAdminAction } from "@/lib/admin/auditLog";
import { forceLogout, sendPasswordReset, setUserAccountStatus } from "@/lib/admin/api";
import { EyeIcon, LockIcon, LogoutIcon, ShieldIcon, TrashIcon } from "@/components/admin/icons";

type PendingAction =
  | { kind: "disable" | "enable" | "block" | "unblock" }
  | { kind: "reset_password" }
  | { kind: "force_logout" }
  | null;

export function UserActionsMenu({
  user,
  onUpdated,
  showView = true,
}: {
  user: AdminUserRow;
  onUpdated?: (user: AdminUserRow) => void;
  showView?: boolean;
}) {
  const router = useRouter();
  const { notify } = useAdminToast();
  const { role, uid: adminUid, displayName: adminDisplayName } = useAdminAuth();
  const [pending, setPending] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  const canManage = hasPermission(role as any, "users:manage");
  function logAction(action: Parameters<typeof recordAdminAction>[0]["action"]) {
    const adminRole: AdminRole = (role as AdminRole | undefined) ?? "moderator";

    recordAdminAction({
      adminUid: adminUid ?? "unknown",
      adminDisplayName: adminDisplayName,
      adminRole,
      action,
      targetType: "user",
      targetId: user.uid,
      targetLabel: user.userId,
    });
  }

  async function confirm() {
    if (!pending) return;
    setWorking(true);
    try {
      if (pending.kind === "disable" || pending.kind === "enable" || pending.kind === "block" || pending.kind === "unblock") {
        const nextStatus = pending.kind === "disable" ? "disabled" : pending.kind === "enable" ? "active" : pending.kind === "block" ? "blocked" : "active";
        const updated = await setUserAccountStatus(user.uid, nextStatus);
        logAction(
          pending.kind === "disable"
            ? "disabled_account"
            : pending.kind === "enable"
              ? "enabled_account"
              : pending.kind === "block"
                ? "blocked_user"
                : "unblocked_user"
        );
        if (updated) onUpdated?.(updated);
        notify(`${user.userId} ${actionPastTense(pending.kind)}.`);
      } else if (pending.kind === "reset_password") {
        await sendPasswordReset(user.uid);
        logAction("reset_password");
        notify(`Password reset email sent to ${user.userId}.`);
      } else if (pending.kind === "force_logout") {
        await forceLogout(user.uid);
        logAction("forced_logout");
        notify(`${user.userId} was signed out of all sessions.`);
      }
    } catch {
      notify("That action couldn't be completed. Please try again.", "error");
    } finally {
      setWorking(false);
      setPending(null);
    }
  }

  const items: RowMenuItem[] = [];
  if (showView) {
    items.push({ label: "View details", icon: <EyeIcon width={15} height={15} />, onSelect: () => router.push(`/admin/users/${user.uid}`) });
  }
  if (canManage) {
    items.push(
      user.accountStatus === "disabled"
        ? { label: "Enable account", icon: <ShieldIcon width={15} height={15} />, onSelect: () => setPending({ kind: "enable" }) }
        : { label: "Disable account", icon: <ShieldIcon width={15} height={15} />, onSelect: () => setPending({ kind: "disable" }) },
      user.accountStatus === "blocked"
        ? { label: "Unblock user", icon: <ShieldIcon width={15} height={15} />, onSelect: () => setPending({ kind: "unblock" }) }
        : { label: "Block user", tone: "danger", icon: <TrashIcon width={15} height={15} />, onSelect: () => setPending({ kind: "block" }) },
      { label: "Reset password", icon: <LockIcon width={15} height={15} />, onSelect: () => setPending({ kind: "reset_password" }) },
      { label: "Force logout", icon: <LogoutIcon width={15} height={15} />, onSelect: () => setPending({ kind: "force_logout" }) }
    );
  }

  return (
    <>
      <RowMenu items={items} />
      <ConfirmDialog
        open={pending !== null}
        title={pending ? dialogTitle(pending.kind) : ""}
        description={pending ? dialogDescription(pending.kind, user.userId) : ""}
        confirmLabel={pending ? dialogConfirmLabel(pending.kind) : "Confirm"}
        tone={pending && (pending.kind === "block" || pending.kind === "disable" || pending.kind === "force_logout") ? "danger" : "default"}
        loading={working}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

function actionPastTense(kind: "disable" | "enable" | "block" | "unblock"): string {
  switch (kind) {
    case "disable":
      return "disabled";
    case "enable":
      return "enabled";
    case "block":
      return "blocked";
    case "unblock":
      return "unblocked";
  }
}

function dialogTitle(kind: NonNullable<PendingAction>["kind"]): string {
  switch (kind) {
    case "disable":
      return "Disable this account?";
    case "enable":
      return "Enable this account?";
    case "block":
      return "Block this user?";
    case "unblock":
      return "Unblock this user?";
    case "reset_password":
      return "Send a password reset?";
    case "force_logout":
      return "Force logout everywhere?";
  }
}

function dialogDescription(kind: NonNullable<PendingAction>["kind"], userId: string): string {
  switch (kind) {
    case "disable":
      return `${userId} won't be able to sign in until an admin re-enables the account. Existing sessions stay active until they expire.`;
    case "enable":
      return `${userId} will be able to sign in again immediately.`;
    case "block":
      return `${userId} will be blocked from using the app and signed out of active sessions. This is logged and reversible.`;
    case "unblock":
      return `${userId} will regain normal access to the app.`;
    case "reset_password":
      return `${userId} will receive a password reset email at their registered address. Their current password stays unknown to admins, as always.`;
    case "force_logout":
      return `${userId} will be signed out of every device immediately and will need to sign in again.`;
  }
}

function dialogConfirmLabel(kind: NonNullable<PendingAction>["kind"]): string {
  switch (kind) {
    case "disable":
      return "Disable account";
    case "enable":
      return "Enable account";
    case "block":
      return "Block user";
    case "unblock":
      return "Unblock user";
    case "reset_password":
      return "Send reset email";
    case "force_logout":
      return "Force logout";
  }
}

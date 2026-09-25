type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "moderator";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-admin-canvas text-admin-textMuted border-admin-border",
  accent: "bg-admin-accentSoft text-admin-accent border-transparent",
  success: "bg-admin-successSoft text-admin-success border-transparent",
  warning: "bg-admin-warningSoft text-admin-warning border-transparent",
  danger: "bg-admin-dangerSoft text-admin-danger border-transparent",
  moderator: "bg-admin-moderatorSoft text-admin-moderator border-transparent",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[13px] font-medium leading-5 ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

const ACCOUNT_STATUS_TONE: Record<string, Tone> = {
  active: "success",
  disabled: "warning",
  blocked: "danger",
};

export function AccountStatusBadge({ status }: { status: string }) {
  const label = status === "active" ? "Active" : status === "disabled" ? "Disabled" : "Blocked";
  return <Badge tone={ACCOUNT_STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
}

const REPORT_STATUS_TONE: Record<string, Tone> = {
  open: "danger",
  reviewing: "warning",
  resolved: "success",
  dismissed: "neutral",
};

export function ReportStatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge tone={REPORT_STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
}

const ROLE_TONE: Record<string, Tone> = {
  super_admin: "accent",
  admin: "success",
  moderator: "moderator",
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  moderator: "Moderator",
};

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={ROLE_TONE[role] ?? "neutral"}>{ROLE_LABEL[role] ?? role}</Badge>;
}

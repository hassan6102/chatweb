"use client";

import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { PermissionGate } from "@/components/admin/ui/PermissionGate";
import { Badge, RoleBadge } from "@/components/admin/ui/Badge";
import { ADMIN_ROLES, ROLE_PERMISSIONS, type AdminPermission } from "@/types/admin";
import { AlertIcon, CheckIcon, LockIcon, ShieldIcon } from "@/components/admin/icons";

const PERMISSION_LABEL: Record<AdminPermission, string> = {
  "overview:view": "View overview dashboard",
  "users:view": "View user list & profiles",
  "users:view_private": "View phone number & email",
  "users:manage": "Disable, block, reset password, force logout",
  "conversations:view": "View conversation list",
  "conversations:review": "Open message content",
  "reports:view": "View reports",
  "reports:manage": "Change report status",
  "notifications:send": "Send admin notifications",
  "logs:view": "View admin activity logs",
  "security:view": "View this security page",
  "security:manage": "Manage admin allow-list / roles",
  "statistics:view": "View statistics",
  "settings:view": "View settings",
  "settings:manage": "Change global app settings",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABEL) as AdminPermission[];

const KNOWN_GAPS: { title: string; description: string; status: "pending" | "in_progress" }[] = [
  {
    title: "Field-level privacy on users/{uid}",
    description:
      "Firestore Rules currently allow any signed-in user to read a full user document, including phoneNumber. Needs a callable Cloud Function projection or a split users/{uid}/private/profile document before real phone numbers ship.",
    status: "pending",
  },
  {
    title: "Admin authorization checks",
    description:
      "No admin custom claims or allow-list exists yet in the backend. This Admin UI reads a role claim if present, but nothing currently sets one \u2014 provisioning must be built server-side before any real admin can sign in.",
    status: "pending",
  },
  {
    title: "Rate limiting / abuse prevention",
    description: "No rate limiting exists yet on message sends or report filing.",
    status: "pending",
  },
  {
    title: "Security Rules unit tests",
    description: "onlySelfEditableUserFields() and message-update rules have no automated Rules unit tests yet.",
    status: "pending",
  },
];

export default function AdminSecurityPage() {
  return (
    <PermissionGate
      permission="security:view"
      fallback={
        <div className="flex flex-col items-center gap-2 py-16 text-center text-admin-textMuted">
          <ShieldIcon width={24} height={24} />
          <p className="text-[13.5px]">Your role doesn't include access to the security page.</p>
        </div>
      }
    >
      <div>
        <PageHeading title="Security" description="Role permissions, session policy, and known hardening gaps." />

        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-admin-border bg-admin-surface px-3.5 py-3 text-[13px] text-admin-textMuted">
          <LockIcon width={16} height={16} className="mt-0.5 flex-none text-admin-textFaint" />
          <p>
            Frontend visibility is not security. Every permission below only controls what this UI shows or enables \u2014 the source of
            truth is, and must remain, Firestore/Storage Security Rules and Admin SDK checks on the server. See docs/SECURITY.md.
          </p>
        </div>

        <SectionCard title="Role permission matrix">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="px-4 py-2.5 font-medium text-admin-textMuted">Capability</th>
                  {ADMIN_ROLES.map((role) => (
                    <th key={role} className="px-4 py-2.5 text-center">
                      <RoleBadge role={role} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((perm) => (
                  <tr key={perm} className="border-b border-admin-border last:border-b-0">
                    <td className="px-4 py-2.5 text-admin-text">{PERMISSION_LABEL[perm]}</td>
                    {ADMIN_ROLES.map((role) => (
                      <td key={role} className="px-4 py-2.5 text-center">
                        {ROLE_PERMISSIONS[role].includes(perm) ? (
                          <CheckIcon width={15} height={15} className="mx-auto text-admin-success" />
                        ) : (
                          <span className="text-admin-textFaint">\u2014</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Session & access policy" className="mt-4">
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <PolicyRow label="Admin role source" value="Firebase Auth custom claim (claims.role)" />
            <PolicyRow label="Conversation review sessions" value="Time-limited (15 min), read-only, audit-logged on open" />
            <PolicyRow label="App Check" value="reCAPTCHA v3 provider available, enabled once a site key is configured" />
            <PolicyRow label="Password visibility" value="Never stored or displayed \u2014 Firebase Auth owns hashing entirely" />
          </div>
        </SectionCard>

        <SectionCard title="Known hardening gaps" className="mt-4">
          <ul className="divide-y divide-admin-border">
            {KNOWN_GAPS.map((gap) => (
              <li key={gap.title} className="flex items-start gap-3 px-4 py-3.5">
                <span className="mt-0.5 flex-none text-admin-warning">
                  <AlertIcon width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13.5px] font-medium text-admin-text">{gap.title}</p>
                    <Badge tone="warning">Pending</Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-5 text-admin-textMuted">{gap.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </PermissionGate>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-admin-border p-3">
      <p className="text-[11.5px] text-admin-textFaint">{label}</p>
      <p className="mt-0.5 text-[13px] text-admin-text">{value}</p>
    </div>
  );
}

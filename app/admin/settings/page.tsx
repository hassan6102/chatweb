"use client";

import { useState } from "react";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { PermissionGate } from "@/components/admin/ui/PermissionGate";
import { RoleBadge } from "@/components/admin/ui/Badge";
import { Toggle } from "@/components/admin/ui/Toggle";
import { useAdminAuth } from "@/lib/admin/adminAuth";
import { useAdminToast } from "@/components/admin/ui/Toast";
import { initialsFromName } from "@/lib/admin/format";

export default function AdminSettingsPage() {
  const { role, displayName, email, isDevOverride } = useAdminAuth();
  const { notify } = useAdminToast();

  const [emailOnReport, setEmailOnReport] = useState(true);
  const [emailOnDisabled, setEmailOnDisabled] = useState(false);
  const [digestWeekly, setDigestWeekly] = useState(true);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [appCheckEnforced, setAppCheckEnforced] = useState(false);

  function savePrefs() {
    notify("Notification preferences saved.");
  }

  function savePlatformSettings() {
    notify("Platform settings saved.");
  }

  return (
    <div>
      <PageHeading title="Settings" description="Your admin profile, notification preferences, and platform-wide controls." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <SectionCard title="Your profile">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-admin-accentSoft text-[14px] font-semibold text-admin-accent">
                {initialsFromName(displayName, email ?? "Admin")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-admin-text">{displayName ?? "Admin"}</p>
                {email && <p className="truncate text-[12.5px] text-admin-textMuted">{email}</p>}
              </div>
            </div>
            <div className="mt-3">{role && <RoleBadge role={role} />}</div>
            {isDevOverride && (
              <p className="mt-3 rounded-md bg-admin-warningSoft px-2.5 py-2 text-[12px] text-admin-warning">
                You're viewing this console with a local dev role override (NEXT_PUBLIC_ADMIN_DEV_ROLE). This never applies in a real
                deployment.
              </p>
            )}
            <p className="mt-3 text-[12px] text-admin-textFaint">
              Role is set by a Firebase Auth custom claim and can only be changed by a super admin through the backend provisioning
              flow, once it exists.
            </p>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="Notification preferences">
            <div className="divide-y divide-admin-border px-4">
              <Toggle checked={emailOnReport} onChange={setEmailOnReport} label="Email me on new reports" description="Get notified when a user files a new report." />
              <Toggle checked={emailOnDisabled} onChange={setEmailOnDisabled} label="Email me on account actions" description="Notify me when another admin disables or blocks an account." />
              <Toggle checked={digestWeekly} onChange={setDigestWeekly} label="Weekly summary digest" description="A weekly email with key stats and open reports." />
            </div>
            <div className="border-t border-admin-border p-4">
              <button
                onClick={savePrefs}
                className="rounded-md bg-admin-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-admin-accentHover"
              >
                Save preferences
              </button>
            </div>
          </SectionCard>

          <PermissionGate permission="settings:manage">
            <SectionCard title="Platform settings">
              <div className="divide-y divide-admin-border px-4">
                <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} label="Maintenance mode" description="Show a maintenance screen to all normal users." />
                <Toggle checked={registrationsOpen} onChange={setRegistrationsOpen} label="Open registrations" description="Allow new accounts to sign up." />
                <Toggle checked={appCheckEnforced} onChange={setAppCheckEnforced} label="Enforce App Check" description="Reject Firebase requests without a valid App Check token, once a reCAPTCHA site key is configured." />
              </div>
              <div className="border-t border-admin-border p-4">
                <button
                  onClick={savePlatformSettings}
                  className="rounded-md bg-admin-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-admin-accentHover"
                >
                  Save platform settings
                </button>
                <p className="mt-2 text-[12px] text-admin-textFaint">
                  Not yet wired to a backend \u2014 these toggles are a UI foundation. Persisting them needs a config document (e.g.
                  system/config) writable only by the Admin SDK.
                </p>
              </div>
            </SectionCard>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}

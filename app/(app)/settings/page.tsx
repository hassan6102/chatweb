"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/Icon";
import { IconButton } from "@/components/common/IconButton";
import { Switch } from "@/components/common/Switch";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/TextField";
import { Toast } from "@/components/common/Toast";
import { SettingsSection, SettingsRow } from "@/components/settings/SettingsRow";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences } from "@/hooks/usePreferences";
import { changePassword, describeAuthError, logout } from "@/lib/auth/authService";
import { auth, db } from "@/firebase/client";
import { doc, getDoc } from "firebase/firestore";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "monitor" },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { preferences, update } = usePreferences();

  // متغيرات نصية بسيطة لتجنب أي أخطاء أثناء التحميل
  const [userEmail, setUserEmail] = useState<string>("جاري التحميل...");
  const [userId, setUserId] = useState<string>("...");

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // جلب البيانات بشكل آمن
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email || "بدون إيميل");
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.email) setUserEmail(data.email);
            if (data.userId) setUserId(data.userId);
          }
        } catch (error) {
          console.error("Error loading user:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setToast("Password updated");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(describeAuthError(err));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch {
      setToast("Couldn't log out — try again");
      setLoggingOut(false);
    }
  }

  // تأمين متغيرات الإعدادات بقيم افتراضية (true) لتجنب الشاشة البيضاء
  const prefs = preferences || {};
  const msgNotif = prefs.messageNotifications ?? true;
  const reactNotif = prefs.reactionNotifications ?? true;
  const soundNotif = prefs.notificationSound ?? true;
  const readReceipts = prefs.readReceipts ?? true;
  const showLastSeen = prefs.showLastSeen ?? true;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <IconButton aria-label="Back" onClick={() => router.push("/")} className="md:hidden">
          <Icon name="back" size={20} />
        </IconButton>
        <h1 className="text-sm font-semibold text-ink">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {/* تم إزالة الصورة الرمزية وتعديل زر البروفايل ليعرض الإيميل والـ ID فقط */}
        <button
          onClick={() => router.push("/profile")}
          className="focus-ring mb-6 flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left hover:bg-surface-sunken"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-medium text-ink">{userEmail}</span>
            <span className="block font-mono text-xs text-ink-faint mt-1">ID: {userId}</span>
          </span>
          <Icon name="chevronRight" size={16} className="text-ink-faint" />
        </button>

        <SettingsSection title="Account">
          <SettingsRow
            icon="shield"
            label="Change password"
            onClick={() => setChangingPassword((v) => !v)}
          />
          {changingPassword && (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3 border-t border-border p-3">
              <TextField
                label="Current password"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <TextField
                label="New password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {passwordError && <p className="text-xs text-danger">{passwordError}</p>}
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Saving…" : "Save password"}
              </Button>
            </form>
          )}
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow
            icon="bell"
            label="Message notifications"
            trailing={
              <Switch
                checked={msgNotif}
                onChange={(v) => update("messageNotifications", v)}
                label="Message notifications"
              />
            }
          />
          <SettingsRow
            icon="smile"
            label="Reaction notifications"
            trailing={
              <Switch
                checked={reactNotif}
                onChange={(v) => update("reactionNotifications", v)}
                label="Reaction notifications"
              />
            }
          />
          <SettingsRow
            icon="volume"
            label="Sound"
            trailing={
              <Switch
                checked={soundNotif}
                onChange={(v) => update("notificationSound", v)}
                label="Notification sound"
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <div className="flex gap-2 p-3">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                aria-pressed={theme === opt.value}
                className={`focus-ring flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-xs ${
                  theme === opt.value ? "border-accent bg-accent/10 text-accent" : "border-border text-ink-muted"
                }`}
              >
                <Icon name={opt.icon} size={18} />
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title="Privacy & security">
          <SettingsRow
            icon="checkCheck"
            label="Read receipts"
            description="Let others see when you've read their messages"
            trailing={
              <Switch
                checked={readReceipts}
                onChange={(v) => update("readReceipts", v)}
                label="Read receipts"
              />
            }
          />
          <SettingsRow
            icon="clock"
            label="Show last seen"
            trailing={
              <Switch
                checked={showLastSeen}
                onChange={(v) => update("showLastSeen", v)}
                label="Show last seen"
              />
            }
          />
          <SettingsRow icon="block" label="Blocked users" onClick={() => router.push("/settings/blocked")} />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow icon="info" label="Version" trailing={<span className="text-xs text-ink-faint">1.0.0</span>} />
        </SettingsSection>

        <Button variant="danger" fullWidth onClick={handleLogout} disabled={loggingOut}>
          <Icon name="logout" size={16} />
          {loggingOut ? "Logging out…" : "Log out"}
        </Button>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
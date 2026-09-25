"use client";

import { useEffect, useState } from "react";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { LoadingCard, EmptyState } from "@/components/admin/ui/States";
import { Badge } from "@/components/admin/ui/Badge";
import { useAdminToast } from "@/components/admin/ui/Toast";
import { useAdminAuth } from "@/lib/admin/adminAuth";
import { fetchNotifications, searchUsersForNotification, sendNotification } from "@/lib/admin/api";
import { recordAdminAction } from "@/lib/admin/auditLog";
import type { AdminNotificationDocument, AdminUserRow, NotificationAudience } from "@/types/admin";
import { formatDateTime, formatNumber } from "@/lib/admin/format";
import { CloseIcon, SearchIcon, BellIcon } from "@/components/admin/icons";

export default function AdminNotificationsPage() {
  const { notify } = useAdminToast();
  const { role, uid, displayName } = useAdminAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<NotificationAudience>("all_users");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientResults, setRecipientResults] = useState<AdminUserRow[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<AdminUserRow[]>([]);
  const [sending, setSending] = useState(false);

  const [sent, setSent] = useState<AdminNotificationDocument[] | null>(null);

  useEffect(() => {
    fetchNotifications().then(setSent);
  }, []);

  useEffect(() => {
    if (audience !== "selected_users" || !recipientQuery.trim()) {
      setRecipientResults([]);
      return;
    }
    const handle = setTimeout(() => {
      searchUsersForNotification(recipientQuery).then((results) =>
        setRecipientResults(results.filter((u) => !selectedRecipients.some((r) => r.uid === u.uid)))
      );
    }, 200);
    return () => clearTimeout(handle);
  }, [recipientQuery, audience, selectedRecipients]);

  function addRecipient(u: AdminUserRow) {
    setSelectedRecipients((prev) => [...prev, u]);
    setRecipientQuery("");
    setRecipientResults([]);
  }

  function removeRecipient(uidToRemove: string) {
    setSelectedRecipients((prev) => prev.filter((u) => u.uid !== uidToRemove));
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      notify("Add a title and a message before sending.", "error");
      return;
    }
    if (audience === "selected_users" && selectedRecipients.length === 0) {
      notify("Select at least one recipient.", "error");
      return;
    }
    setSending(true);
    try {
      const created = await sendNotification({
        title: title.trim(),
        body: body.trim(),
        audience,
        recipientUids: selectedRecipients.map((u) => u.uid),
        sentByUid: uid ?? "unknown",
        sentByDisplayName: displayName ?? "Admin",
      });
      recordAdminAction({
        adminUid: uid ?? "unknown",
        adminDisplayName: displayName,
        adminRole: role ?? "moderator",
        action: "sent_notification",
        targetType: "system",
        targetId: created.notificationId,
        targetLabel: created.title,
      });
      setSent((prev) => [created, ...(prev ?? [])]);
      setTitle("");
      setBody("");
      setSelectedRecipients([]);
      notify(`Sent to ${formatNumber(created.recipientCount)} recipient${created.recipientCount === 1 ? "" : "s"}.`);
    } catch {
      notify("Couldn't send that notification. Please try again.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeading title="Notifications" description="Send announcements to all users or a selected group, and track delivery." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <SectionCard title="Compose">
          <div className="flex flex-col gap-4 p-4">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Scheduled maintenance tonight"
                className="w-full rounded-md border border-admin-border bg-admin-surface p-2.5 text-[13px] text-admin-text placeholder:text-admin-textFaint focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
              />
            </Field>

            <Field label="Message">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={400}
                placeholder="What do people need to know?"
                className="w-full rounded-md border border-admin-border bg-admin-surface p-2.5 text-[13px] text-admin-text placeholder:text-admin-textFaint focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
              />
            </Field>

            <Field label="Audience">
              <div className="flex gap-2">
                <button
                  onClick={() => setAudience("all_users")}
                  className={`flex-1 rounded-md border px-3 py-2 text-[13px] font-medium ${
                    audience === "all_users" ? "border-admin-accent bg-admin-accentSoft text-admin-accent" : "border-admin-border text-admin-textMuted hover:bg-admin-canvas"
                  }`}
                >
                  All users
                </button>
                <button
                  onClick={() => setAudience("selected_users")}
                  className={`flex-1 rounded-md border px-3 py-2 text-[13px] font-medium ${
                    audience === "selected_users" ? "border-admin-accent bg-admin-accentSoft text-admin-accent" : "border-admin-border text-admin-textMuted hover:bg-admin-canvas"
                  }`}
                >
                  Selected users
                </button>
              </div>
            </Field>

            {audience === "selected_users" && (
              <Field label={`Recipients (${selectedRecipients.length})`}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-textFaint">
                    <SearchIcon width={14} height={14} />
                  </span>
                  <input
                    value={recipientQuery}
                    onChange={(e) => setRecipientQuery(e.target.value)}
                    placeholder="Search by user ID or name\u2026"
                    className="w-full rounded-md border border-admin-border bg-admin-surface py-2 pl-8 pr-2.5 text-[13px] text-admin-text placeholder:text-admin-textFaint focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
                  />
                  {recipientResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-md border border-admin-border bg-admin-surface py-1 shadow-[0_8px_20px_rgba(18,20,28,0.12)]">
                      {recipientResults.map((u) => (
                        <button
                          key={u.uid}
                          onClick={() => addRecipient(u)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-admin-canvas"
                        >
                          <span className="font-adminMono text-[11.5px] text-admin-textFaint">{u.userId}</span>
                          <span className="text-admin-text">{u.displayName ?? "No name"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRecipients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedRecipients.map((u) => (
                      <span key={u.uid} className="flex items-center gap-1 rounded-full bg-admin-canvas px-2.5 py-1 text-[12px] text-admin-text">
                        {u.userId}
                        <button onClick={() => removeRecipient(u.uid)} aria-label={`Remove ${u.userId}`}>
                          <CloseIcon width={11} height={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            )}

            <button
              onClick={handleSend}
              disabled={sending}
              className="mt-1 rounded-md bg-admin-accent px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-admin-accentHover disabled:opacity-60"
            >
              {sending ? "Sending\u2026" : "Send notification"}
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Sent notifications">
          {sent === null ? (
            <div className="p-4">
              <LoadingCard lines={5} />
            </div>
          ) : sent.length === 0 ? (
            <EmptyState title="Nothing sent yet" description="Notifications you send will show up here with delivery and read counts." />
          ) : (
            <ul className="flex flex-col divide-y divide-admin-border">
              {sent.map((n) => (
                <li key={n.notificationId} className="flex flex-col gap-1.5 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <BellIcon width={15} height={15} className="mt-0.5 flex-none text-admin-textFaint" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-admin-text">{n.title}</p>
                        <p className="truncate text-[12.5px] text-admin-textMuted">{n.body}</p>
                      </div>
                    </div>
                    <Badge tone={n.audience === "all_users" ? "accent" : "neutral"}>
                      {n.audience === "all_users" ? "All users" : `${n.recipientCount} selected`}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-6 text-[12px] text-admin-textFaint">
                    <span>Sent by {n.sentByDisplayName ?? "Admin"}</span>
                    <span>{formatDateTime(n.createdAt)}</span>
                    <span>
                      Delivered {n.deliveredCount}/{n.recipientCount}
                    </span>
                    <span>
                      Read {n.readCount}/{n.recipientCount}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-admin-text">{label}</span>
      {children}
    </label>
  );
}

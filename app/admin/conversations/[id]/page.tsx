"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { LoadingCard, ErrorState, EmptyState } from "@/components/admin/ui/States";
import { Badge } from "@/components/admin/ui/Badge";
import { useAdminAuth } from "@/lib/admin/adminAuth";
import { hasPermission, type AdminConversationRow, type AdminMessageRow, type AdminRole } from "@/types/admin";
import { fetchConversationById, fetchConversationMessages } from "@/lib/admin/api";
import { startReviewSession, type ReviewSession } from "@/lib/admin/auditLog";
import { formatDateTime, formatTime, initialsFromName } from "@/lib/admin/format";
import { ChevronLeftIcon, ClockIcon, LockIcon, PaperclipIcon, ShieldIcon } from "@/components/admin/icons";

export default function ConversationReviewPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id;
  const router = useRouter();
  const { role, uid, displayName, loading: authLoading } = useAdminAuth();

  const [conversation, setConversation] = useState<AdminConversationRow | null>(null);
  const [messages, setMessages] = useState<AdminMessageRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [now, setNow] = useState(Date.now());

  const canReview = hasPermission(role as AdminRole | null, "conversations:review");

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (authLoading || !canReview || !uid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchConversationById(conversationId), fetchConversationMessages(conversationId)])
      .then(([convo, msgs]) => {
        if (cancelled) return;
        if (!convo) {
          setError("This conversation doesn't exist.");
          return;
        }
        setConversation(convo);
        setMessages(msgs);
        setSession(startReviewSession(conversationId, { uid, displayName, role: role as AdminRole }));
      })
      .catch(() => !cancelled && setError("Couldn't load this conversation."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, authLoading, canReview, uid]);

  const remainingMs = session ? Math.max(session.expiresAt - now, 0) : 0;
  const expired = session !== null && remainingMs === 0;
  const remainingLabel = useMemo(() => {
    const totalSec = Math.ceil(remainingMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [remainingMs]);

  if (!authLoading && !canReview) {
    return (
      <ErrorState message="Your role doesn't include permission to review conversation content. This access is intentionally restricted and logged." />
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/conversations")}
        className="mb-3 flex items-center gap-1 text-[13px] font-medium text-admin-textMuted hover:text-admin-text"
      >
        <ChevronLeftIcon width={15} height={15} />
        Back to conversations
      </button>

      <PageHeading
        title={conversation ? conversation.participantUserIds.join(" \u2194 ") : "Conversation review"}
        description={conversation ? conversation.conversationId : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-admin-warning/30 bg-admin-warningSoft px-3.5 py-2.5 text-[13px] text-admin-warning">
        <LockIcon width={16} height={16} className="flex-none" />
        <span className="flex-1">
          Read-only administrative review. This access is logged in the audit trail and visible to the account owner via internal review
          records.
        </span>
        {session && (
          <span className="flex flex-none items-center gap-1 font-adminMono text-[12px]">
            <ClockIcon width={13} height={13} />
            {expired ? "Session expired" : `${remainingLabel} left`}
          </span>
        )}
      </div>

      {loading || authLoading ? (
        <LoadingCard lines={6} />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <SectionCard title="Messages" actions={<Badge tone="neutral">{messages?.length ?? 0} shown</Badge>}>
          {expired ? (
            <EmptyState
              title="Review session expired"
              description="Reopen this conversation to start a new, freshly-logged review session."
              action={
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 rounded-md bg-admin-accent px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-admin-accentHover"
                >
                  Start new session
                </button>
              }
            />
          ) : !messages || messages.length === 0 ? (
            <EmptyState title="No messages" description="This conversation doesn't have any messages yet." />
          ) : (
            <div className="max-h-[560px] overflow-y-auto p-4">
              <ul className="flex flex-col gap-3">
                {messages.map((m) => (
                  <li key={m.messageId} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-admin-canvas text-[11px] font-semibold text-admin-textMuted">
                      {initialsFromName(m.senderDisplayName, m.senderUserId)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[12.5px] font-medium text-admin-text">{m.senderDisplayName ?? m.senderUserId}</span>
                        <span className="font-adminMono text-[11px] text-admin-textFaint">{formatTime(m.createdAt)}</span>
                        {m.hasAttachment && <PaperclipIcon width={12} height={12} className="text-admin-textFaint" />}
                      </div>
                      <div
                        className={`mt-1 inline-block max-w-[85%] rounded-lg border px-3 py-1.5 text-[13px] ${
                          m.deleted
                            ? "border-dashed border-admin-borderStrong bg-admin-canvas text-admin-textFaint italic"
                            : "border-admin-border bg-admin-canvas text-admin-text"
                        }`}
                      >
                        {m.deleted ? "This message was deleted." : m.text}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      )}

      {conversation && (
        <SectionCard title="Conversation metadata" className="mt-4">
          <dl className="grid grid-cols-1 gap-3 p-4 text-[13px] sm:grid-cols-2">
            <MetaRow label="Conversation ID" value={<span className="font-adminMono">{conversation.conversationId}</span>} />
            <MetaRow label="Type" value={<span className="capitalize">{conversation.type}</span>} />
            <MetaRow label="Participants" value={conversation.participantUids.join(", ")} />
            <MetaRow label="Created" value={formatDateTime(conversation.createdAt)} />
            <MetaRow
              label="Open reports on this conversation"
              value={
                conversation.reportCount > 0 ? (
                  <span className="flex items-center gap-1 text-admin-danger">
                    <ShieldIcon width={13} height={13} />
                    {conversation.reportCount}
                  </span>
                ) : (
                  "None"
                )
              }
            />
          </dl>
        </SectionCard>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11.5px] text-admin-textFaint">{label}</dt>
      <dd className="mt-0.5 text-admin-text">{value}</dd>
    </div>
  );
}

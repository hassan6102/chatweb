# Database structure

## Firestore

```
users/{uid}
users/{uid}/contacts/{contactUid}
users/{uid}/conversations/{conversationId}     -- inbox preview, private
userIds/{userId}                                -- uniqueness reservation, not user-facing

conversations/{conversationId}
conversations/{conversationId}/members/{uid}
conversations/{conversationId}/messages/{messageId}

reports/{reportId}
adminLogs/{logId}
```

### `users/{uid}` — see `types/user.ts`
| field | notes |
|---|---|
| uid | Firebase Auth uid, doc id |
| userId | Public, stable, searchable. Format `GH-#####`. Server-generated only. |
| email | Auth email |
| displayName | nullable |
| phoneNumber | **PRIVATE** — never exposed to other normal users (see SECURITY.md) |
| photoURL | nullable |
| status | `active` \| `away` \| `offline` (coarse; live presence is in RTDB) |
| createdAt / updatedAt / lastLoginAt / lastSeenAt | server timestamps |
| isDisabled | admin-controlled kill switch |

### `userIds/{userId}`
Reservation-only document (`{ uid, createdAt }`) used inside a transaction
to guarantee `userId` uniqueness without needing a Firestore query-then-write
race. Not read by normal app UI.

### `conversations/{conversationId}` — see `types/conversation.ts`
`type: "direct" | "group"` (only `"direct"` is created in this phase),
`directKey` (sorted `uidA_uidB`, used to prevent duplicate 1-to-1 chats,
`null` for future group chats), `lastMessage`, `lastMessageAt`, `createdBy`.

### `conversations/{conversationId}/members/{uid}`
One doc per participant: `{ uid, joinedAt, role, isRemoved }`. A direct
conversation has exactly two member docs. Using a subcollection (not an
array on the conversation doc) is what makes future group chats a
non-breaking addition.

### `conversations/{conversationId}/messages/{messageId}`
One doc per message — **never** a giant array embedded in a user or
conversation document. See `types/message.ts` for the full field list
(`type`, `text`, `status`, `editedAt`, soft-delete fields, `replyTo`,
`metadata`, `readBy`).

### `users/{uid}/conversations/{conversationId}` — inbox preview
Denormalized copy for a fast chat list without a join: `otherUserId`,
`lastMessage`, `lastMessageAt`, `unreadCount`, `pinned`, `muted`,
`archived`, and `customName`.

`customName` is **private per-user** — e.g. user A can label `GH-92841` as
"أحمد الشغل" while user B labels the same account "صاحبي". This lives only
in the viewer's own `users/{uid}/conversations/{id}` doc and never touches
the shared `conversations/{id}` document or the other user's profile, so it
can never change the real `userId`.

### `reports/{reportId}` and `adminLogs/{logId}`
Scaffolded for the future moderation/admin phases. `reports` accepts
client-side creates (a user filing a report); both collections are
otherwise server/admin-only reads and writes.

## Realtime Database
```
status/{uid}            -- { state: "online"|"offline", lastSeenAt }
typing/{conversationId}/{uid}   -- { isTyping: true, updatedAt } or absent
```
Ephemeral only. Never mirrors permanent Firestore data, and typing state is
removed (not just set to `false`) when a user stops typing.

## Soft delete
"Delete for everyone" sets `deleted: true`, `deletedAt`, `deletedBy` and
clears `text` — the message document itself is kept (not hard-deleted) so
that:
- Other clients that already fetched/cached the message reference can
  reconcile cleanly instead of hitting a missing-document error.
- Conversation ordering/pagination cursors built on `createdAt` stay valid.
The future chat UI renders `deleted: true` messages as
"This message was deleted."

## Pagination
Messages are queried with `orderBy("createdAt", "desc")`, `limit(30)`
(configurable 20–50), and `startAfter(cursor)` for older pages — see
`lib/messages/getMessagesPage.ts`. Composite indexes are declared in
`firestore.indexes.json`.

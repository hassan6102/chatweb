# Security

Security is enforced by Firestore/Storage/RTDB **Security Rules** and
server-side (Admin SDK / Cloud Functions) logic — never by hiding things in
the frontend only.

## Passwords
Never stored in this codebase in any form. Firebase Authentication owns
password storage/hashing entirely; the app only ever calls
`createUserWithEmailAndPassword` / `signInWithEmailAndPassword` /
`updatePassword` (see `lib/auth/authService.ts`).

## Public User ID vs. phone number
- `userId` (e.g. `GH-92841`) is the only identifier normal users search
  and share with each other. It is generated server-side
  (`functions/src/onUserCreate.ts`) and validated with
  `utils/userId.ts#isValidUserId` before any lookup.
- `phoneNumber` is private. `findUserByUserId()` returns only
  `PublicUserProfile` (`types/user.ts`), which strips `phoneNumber` and
  `email` in application code, in addition to the Firestore Rules layer.

### Known limitation (flagged intentionally)
Firestore Security Rules can only allow-or-deny an **entire document**
read — they cannot redact individual fields like `phoneNumber` from a
document another user is allowed to read for other reasons (e.g. displaying
`displayName`/`photoURL` in search results). `firestore.rules` currently
allows any signed-in user to `get`/`list` `users/{uid}` documents, which
means a user who bypasses the app and queries Firestore directly could, in
principle, read another user's `phoneNumber` field.

**This must be hardened before shipping `phoneNumber` on real users**, by
one of:
1. Moving public user lookups to a callable Cloud Function that returns a
   stripped `PublicUserProfile` server-side, and restricting the
   `users/{uid}` Firestore Rule to `allow get: if isSelf(uid);` (no public
   `list`/`get` at all), or
2. Splitting the private fields into a separate
   `users/{uid}/private/profile` document with rules `allow read: if
   isSelf(uid)`.

This is called out explicitly in `firestore.rules` and tracked in
`docs/TASKS.md` so the next phase doesn't silently ship the gap.

## Conversation & message access
- Only `conversations/{id}/members/{uid}` may read/write that
  conversation's data (`isConversationMember()` helper in
  `firestore.rules`).
- A user may only add **themselves** as a member
  (`allow create: if isSelf(uid)` on the `members` subcollection) — no one
  can add another user to a conversation they don't control, and no one can
  add themselves to someone else's existing 1-to-1 conversation.
- A user may only create messages with `senderId == request.auth.uid`, and
  may only update their **own** message's `text`/`editedAt`/soft-delete
  fields — never another user's message content. Marking `readBy`/`status`
  is allowed for any member (needed for read receipts).
- Messages are never hard-deleted via Rules (`allow delete: if false`) —
  only the soft-delete field pattern above.

## Profile writes
`users/{uid}` updates are restricted with
`diff(resource.data).affectedKeys().hasOnly([...])` to a safe allow-list
(`displayName`, `photoURL`, `status`, timestamps). `uid`, `userId`, `email`,
`phoneNumber`, and `isDisabled` cannot be changed by the user themselves —
`userId`/profile-creation is Cloud-Functions-only
(`allow create: if false` on `users/{uid}`), and `isDelete`/`isDisabled` is
reserved for the future admin system.

## Storage
- Avatars: signed-in read, owner-only write, capped at 5MB, must be an
  image MIME type.
- Chat media: conversation-members-only read/write (checked against
  Firestore membership via `firestore.exists(...)` inside `storage.rules`),
  capped at 25MB.
- Everything else denied by default.

## Realtime Database
`status/{uid}` and `typing/{conversationId}/{uid}` are writable only by the
authenticated owner of that uid (`database.rules.json`); everything else is
denied by default (`"$other": { ".read": false, ".write": false }`).

## App Check
`firebase/client.ts` exposes `initAppCheck()` (reCAPTCHA v3 provider by
default) to attach App Check tokens to Firebase requests once a site key is
configured, reducing abuse from non-app clients. Wire this up from a client
entry point (e.g. root providers) once a reCAPTCHA key exists — left
disabled by default (no-op) if `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` is
unset, so it doesn't break local development.

## What is NOT yet implemented
- Rate limiting / abuse prevention (message flooding, report spam).
- The `users/{uid}` phone-number hardening described above.
- Admin authorization checks (custom claims / admin allow-list) — no admin
  system exists yet; `reports` and `adminLogs` are currently fully
  server-locked pending that design.

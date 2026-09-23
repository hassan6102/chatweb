# Architecture

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Firebase: Authentication, Cloud Firestore, Realtime Database, Storage,
  Cloud Functions, Cloud Messaging (FCM), App Check

## Directory layout
```
app/                  Route segments only. No business logic here.
  (auth)/login, (auth)/register   Minimal testing UI for Phase 3 (not final design)
components/           Shared, mostly presentational React components
lib/
  auth/               Client-safe auth service functions (lib/auth/authService.ts)
  users/              User lookup + server-only profile/userId creation
  conversations/      Conversation creation/lookup services
  messages/           Send/edit/delete/read + pagination services
  realtime/           Presence & typing (Realtime Database)
firebase/
  client.ts           Client SDK init (safe for the browser)
  admin.ts            Admin SDK init ("server-only" — never bundled to client)
hooks/                React hooks (useAuth, etc.)
types/                Shared TypeScript types matching Firestore documents
utils/                Pure helper functions (e.g. userId format/validation)
docs/                 This documentation set
functions/            Cloud Functions codebase (separate package.json/tsconfig)
```

## Client vs. server Firebase separation
- `firebase/client.ts` uses only `NEXT_PUBLIC_*` env vars and the Firebase
  **client** SDK (`firebase` package). Safe to import from `"use client"`
  components.
- `firebase/admin.ts` uses only private env vars (never `NEXT_PUBLIC_*`) and
  the **Admin** SDK (`firebase-admin`). It's marked with the `server-only`
  import guard so an accidental client import fails the build instead of
  silently leaking credentials.
- Anything that must run with elevated trust (allocating a unique `userId`,
  reading another user's phone number for admin tools, etc.) lives in either
  a Cloud Function (`functions/src`) or a `*.server.ts` file under `lib/`,
  never in client-callable code.

## Authentication flow
1. Client calls `registerWithEmail()` (`lib/auth/authService.ts`), which
   calls Firebase Auth's `createUserWithEmailAndPassword`. Firebase hashes
   and stores the password — this codebase never sees or persists a
   plaintext password.
2. The Cloud Function `onUserCreate` (`functions/src/onUserCreate.ts`)
   fires automatically on Auth user creation. It allocates a unique public
   `userId` (format `GH-#####`) inside a Firestore transaction against the
   `userIds/{userId}` reservation collection, retrying on collision, and
   writes `users/{uid}`.
3. Client-side `lib/users/createUserProfile.server.ts` contains the same
   logic for use from a Route Handler / Server Action if you'd rather do
   this synchronously at sign-up time instead of via the trigger — pick one
   path, don't run both, to avoid a duplicate-user-doc race.
4. `useAuth()` (`hooks/useAuth.ts`) exposes live auth state to client
   components. `ProtectedRoute` redirects logged-out users away from
   authenticated pages (UX only — real enforcement is Security Rules).

## Message flow
1. `createOrGetDirectConversation(uidA, uidB)` deduplicates 1-to-1 chats via
   a deterministic `directKey` (`sorted(uidA,uidB).join('_')`), and creates
   the conversation doc, both `members/{uid}` docs, and both inbox preview
   docs (`users/{uid}/conversations/{conversationId}`) atomically.
2. `sendMessage()` writes a new document to
   `conversations/{id}/messages/{messageId}` and, in the same transaction,
   updates the conversation's `lastMessage`/`lastMessageAt` and each
   member's inbox preview (incrementing `unreadCount` for everyone except
   the sender).
3. `editMessage()` / `deleteMessage()` (soft delete) / `markMessageAsRead()`
   / `markConversationAsRead()` are the remaining primitives — see
   `lib/messages/messageService.ts`.
4. `getMessagesPage()` loads messages using `orderBy(createdAt desc)` +
   `limit` + `startAfter(cursor)` — see "Performance" below.

## Conversation flow
`conversations/{conversationId}` currently supports `type: "direct"` only,
but every document already carries a `type` field and members live in a
subcollection (not a fixed-size array) specifically so group conversations
can be added later without a schema migration — see
`types/conversation.ts`.

## Realtime presence & typing
Presence (`online`/`offline`, `lastSeenAt`) and typing indicators live in
**Realtime Database**, not Firestore (`lib/realtime/presence.ts`), because:
- RTDB's `onDisconnect()` gives reliable "went offline" detection.
- Per-keystroke typing updates would be wasteful and costly as Firestore
  writes; RTDB is built for this kind of ephemeral, high-frequency state.

## Performance
- Pagination is cursor-based (`getMessagesPage`), loading ~30 messages at a
  time (within the requested 20–50 range), never a whole conversation.
- Firestore listeners should be attached only while a conversation screen
  is mounted and unsubscribed on unmount — `getMessagesPage` uses one-shot
  `getDocs` for pagination; a live listener for *new* incoming messages
  should be layered on top separately (left for the UI-building phase) and
  must be unsubscribed when the user navigates away.
- Composite indexes needed for the current query shapes are declared in
  `firestore.indexes.json`.

## Not yet implemented (see docs/TASKS.md)
Final chat UI, Admin dashboard, group conversations, stories/channels,
social feed, full voice-recording UI, image editor, advanced search UI.

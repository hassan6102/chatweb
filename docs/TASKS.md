# Tasks / status

## Completed in this phase (Claude Code #1 — backend foundation)
- Project scaffolding: Next.js 14 + TypeScript + Tailwind + ESLint config
- Firebase client/admin separation (`firebase/client.ts`, `firebase/admin.ts`)
- Auth service functions + `useAuth` hook + `ProtectedRoute` + minimal
  testing-only login/register pages
- User identity system: `GH-#####` public userId, generation +
  server-side uniqueness allocation, `findUserByUserId`
- Firestore data model + TypeScript types for users, conversations,
  members, inbox previews, messages
- Conversation service: `createOrGetDirectConversation` (dedup via
  `directKey`)
- Message services: send / edit / soft-delete / mark-read /
  mark-conversation-read
- Cursor-based message pagination (`getMessagesPage`, ~30/page)
- Realtime Database presence + typing indicators, kept separate from
  Firestore
- Firestore, Storage, and Realtime Database Security Rules
- Cloud Function `onUserCreate` for automatic profile creation
- `firebase.json`, `firestore.indexes.json`, `database.rules.json`
- Documentation set (this file + ARCHITECTURE/DATABASE/SECURITY/API_CONTRACT)

## Explicitly NOT implemented yet (by design — see the original brief)
- Final chat UI (message bubbles, composer, attachments UI, etc.)
- Admin dashboard UI and admin authorization (custom claims, admin
  allow-list) — `reports`/`adminLogs` collections exist but are fully
  server-locked pending that design
- Group conversations (schema is ready — `type`, subcollection members —
  but only `"direct"` is created)
- Stories, channels, social feed
- Full voice-recording UI, image editor, advanced search UI
- Push notifications wiring (FCM token storage/sending) — App Check hook
  exists (`initAppCheck`) but is not yet called from a provider

## Known gaps to close before production (see docs/SECURITY.md)
- **`users/{uid}` field-level privacy**: current rules allow any signed-in
  user to read the full document, including `phoneNumber`. Must be
  hardened via a callable Cloud Function projection or a split
  `users/{uid}/private/profile` doc before real phone numbers are stored.
- No rate limiting / abuse prevention on message sends or report filing.
- `onlySelfEditableUserFields()` / message-update rules should get
  automated Rules unit tests (e.g. `@firebase/rules-unit-testing`) — none
  are included yet.

## Environment / build note for whoever runs this next
This container had **no network egress**, so `npm install` / `next build`
/ `tsc` / `next lint` could not actually be executed here. Files were
hand-written to be internally consistent (types, imports, rules), but they
have **not** been run through the TypeScript compiler or Next's build in
this environment. Run the following locally before trusting it as "green":
```
npm install
npm run typecheck
npm run lint
npm run build
```
and validate `firestore.rules` / `storage.rules` syntax with:
```
firebase deploy --only firestore:rules,storage:rules --dry-run
```
(or the Firebase Emulator Suite, using the `emulators` config already in
`firebase.json`).

## For Claude Code #2 (UI)
Build the real UI against the services in `lib/**` and types in
`types/**` — don't re-implement Firestore reads/writes ad hoc in
components. Replace the placeholder `app/(auth)/login` and
`app/(auth)/register` pages' styling but keep calling
`lib/auth/authService.ts`.

## For Claude Code #3 (Admin + QA)
Design admin authorization (recommend Firebase custom claims,
`admin: true`) before writing any Admin Rules. `reports` and `adminLogs`
are ready to be read from Admin SDK-backed Route Handlers.

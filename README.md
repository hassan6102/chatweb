# Messaging App — Backend Foundation

This is the backend/architecture foundation phase only (no final UI, no
admin dashboard). See `docs/` for full documentation:

- `docs/ARCHITECTURE.md` — stack, directory layout, data flows
- `docs/DATABASE.md` — Firestore/RTDB structure
- `docs/SECURITY.md` — security model and known gaps
- `docs/API_CONTRACT.md` — service function signatures
- `docs/TASKS.md` — what's done, what's not, next steps

## Setup
1. `cp .env.example .env.local` and fill in your Firebase project's config
   (client keys are public; `FIREBASE_ADMIN_*` are secret — get them from
   a service account JSON, never commit them).
2. `npm install`
3. `npm run dev`

This project's dependencies could not be installed in the environment that
generated it (no network access) — see docs/TASKS.md for the exact
commands to run locally to verify the build.

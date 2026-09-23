/**
 * SERVER-ONLY Firebase Admin initialization.
 *
 * NEVER import this file from a "use client" component or anything that
 * ends up in the browser bundle. Only import from:
 *   - Route Handlers (app/api/**\/route.ts)
 *   - Server Components / Server Actions
 *   - Cloud Functions (functions/src/**)
 *
 * Uses the private FIREBASE_ADMIN_* env vars (service account), which must
 * never be prefixed with NEXT_PUBLIC_.
 */
import "server-only";
import { cert, getApps, initializeApp, getApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getDatabase, type Database } from "firebase-admin/database";
import { getStorage, type Storage } from "firebase-admin/storage";

function loadServiceAccount() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Private keys stored in .env come with literal "\n" — must be restored.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Check FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  return { projectId, clientEmail, privateKey };
}

export const adminApp: App = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert(loadServiceAccount()),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
export const adminRtdb: Database = getDatabase(adminApp);
export const adminStorage: Storage = getStorage(adminApp);

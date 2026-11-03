import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { stopPresence } from "@/lib/realtime/presence";
import { ensureUserProfile } from "@/lib/users/ensureUserProfile";

export async function registerWithEmail(
  email: string,
  password: string,
  phoneNumber: string = ""
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user, phoneNumber);
  return credential.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user, undefined, true);
  return credential.user;
}

export async function logout(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    void stopPresence(user.uid).catch((error: unknown) => {
      console.error("Could not update presence during sign-out:", error);
    });
  }
  await firebaseSignOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("No authenticated user");
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export function describeAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
}
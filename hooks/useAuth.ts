"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/firebase/client";

export interface AuthState {
  user: User | null;
  loading: boolean;
}

/**
 * Subscribes to Firebase Auth state. This is the single source of truth
 * for "is someone logged in" across the app — components should read this
 * instead of calling auth.currentUser directly, so they re-render on
 * login/logout.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false });
    });
    return unsubscribe;
  }, []);

  return state;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfilePanel } from "@/components/users/UserProfilePanel";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { ensureUserProfile } from "@/lib/users/ensureUserProfile";

interface OwnProfile {
  uid: string;
  userId: string;
  displayName: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  photoURL: string | null;
  status: "active";
  lastSeenAt: null;
}

export default function OwnProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<OwnProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    const currentUser = user;
    let active = true;
    const authProfile: OwnProfile = {
      uid: currentUser.uid,
      userId: "Generating…",
      displayName: currentUser.displayName,
      name: currentUser.email,
      email: currentUser.email,
      phone: currentUser.phoneNumber,
      photoURL: currentUser.photoURL,
      status: "active",
      lastSeenAt: null,
    };

    setUserData(authProfile);
    setLoading(true);
    setProfileNotice(null);

    async function loadProfile() {
      try {
        await ensureUserProfile(currentUser);
        if (!active) return;
        let docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (!active) return;

        if (!docSnap.exists()) {
          setProfileNotice("Your profile could not be created. Please try again later.");
          return;
        }
        const data = docSnap.data();
        setUserData({
          ...authProfile,
          userId: typeof data.userId === "string" && data.userId ? data.userId : authProfile.userId,
          displayName: typeof data.displayName === "string" ? data.displayName : authProfile.displayName,
          name: typeof data.displayName === "string" && data.displayName ? data.displayName : authProfile.name,
          email: typeof data.email === "string" ? data.email : authProfile.email,
          phone: typeof data.phoneNumber === "string" ? data.phoneNumber : authProfile.phone,
          photoURL: typeof data.photoURL === "string" ? data.photoURL : authProfile.photoURL,
          lastSeenAt: null,
        });
      } catch (error) {
        if (!active) return;
        console.error("Error fetching user profile:", error);
        setUserData((current) => (current ? { ...current, userId: "Unavailable" } : current));
        setProfileNotice("Your contact code could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [authLoading, router, user]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center p-10 text-sm text-ink-muted">Loading profile…</div>;
  }

  if (!userData) return null;

  return (
    <div className="flex h-full flex-col">
      {profileNotice && (
        <p
          role="status"
          className="mx-4 mt-4 rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm text-ink-muted"
        >
          {profileNotice}
        </p>
      )}
      <div className="min-h-0 flex-1">
        <UserProfilePanel
          user={userData}
          isSelf
          onBack={() => router.push("/")}
          onEditProfile={() => router.push("/settings")}
        />
      </div>
    </div>
  );
}

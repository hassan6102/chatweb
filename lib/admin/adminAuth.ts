"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AdminAuthState {
  loading: boolean;
  isAdmin: boolean;
  role: string | null;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  isDevOverride: boolean;
}

export function useAdminAuth(): AdminAuthState {
  const { user, loading: authLoading } = useAuth();
  const [adminState, setAdminState] = useState<AdminAuthState>({
    loading: true,
    isAdmin: false,
    role: null,
    uid: null,
    displayName: null,
    email: null,
    isDevOverride: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      // إذا كانت حالة تسجيل الدخول قيد التحميل، ننتظر
      if (authLoading) return;

      // إذا لم يكن هناك مستخدم مسجل الدخول أصلاً
      if (!user) {
        if (isMounted) {
          setAdminState({
            loading: false,
            isAdmin: false,
            role: null,
            uid: null,
            displayName: null,
            email: null,
            isDevOverride: false,
          });
        }
        return;
      }

      try {
        // جلب بيانات المستخدم من Firestore للتحقق من الصلاحيات الحقيقية
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const userRole = data.role; // قراءة حقل role الذي أنشأناه
          const isAdmin = userRole === "admin" || userRole === "super_admin";

          if (isMounted) {
            setAdminState({
              loading: false,
              isAdmin: isAdmin,
              role: userRole || null,
              uid: user.uid,
              displayName: user.displayName || data.name || "مشرف",
              email: user.email || data.email || null,
              isDevOverride: false,
            });
          }
        } else {
          // إذا لم يجد مستند للمستخدم في Firestore
          if (isMounted) {
            setAdminState({
              loading: false,
              isAdmin: false,
              role: null,
              uid: user.uid,
              displayName: user.displayName || null,
              email: user.email || null,
              isDevOverride: false,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching admin role:", error);
        if (isMounted) {
          setAdminState((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  return adminState;
}
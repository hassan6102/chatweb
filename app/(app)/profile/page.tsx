"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfilePanel } from "@/components/users/UserProfilePanel";
import { auth, db } from "@/firebase/client";
import { doc, getDoc } from "firebase/firestore";

export default function OwnProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // مراقبة المستخدم المسجل حالياً
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // جلب بيانات المستخدم الحقيقية من قاعدة البيانات
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              id: user.uid,
              userId: data.userId || "غير محدد",
              name: data.email, // سنعرض الإيميل بدلاً من الاسم
              email: data.email,
              phone: data.phoneNumber || "لم يتم إضافة رقم",
              avatarUrl: null, // لا يوجد صورة
              status: "online",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center p-10 text-sm text-ink-muted">جاري تحميل البيانات...</div>;
  }

  if (!userData) return null;

  return (
    <UserProfilePanel
      user={userData}
      isSelf
      onBack={() => router.push("/")}
      onEditProfile={() => router.push("/settings")}
    />
  );
}
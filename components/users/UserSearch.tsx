"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { auth, db } from "@/firebase/client";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

export function UserSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "found" | "not-found" | "invalid">("idle");
  const [result, setResult] = useState<any | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  async function handleChange(next: string) {
    const cleaned = next.toUpperCase();
    setValue(cleaned);
    setResult(null);

    if (!cleaned) {
      setStatus("idle");
      return;
    }

    if (!cleaned.startsWith("USER-") || cleaned.length < 6) {
      setStatus(cleaned.length >= 10 ? "invalid" : "idle");
      return;
    }

    setStatus("searching");

    try {
      const q = query(collection(db, "users"), where("userId", "==", cleaned));
      const querySnapshot = await getDocs(q);

      const firstDoc = querySnapshot.docs[0];
      
      if (!firstDoc) {
        setStatus("not-found");
      } else {
        setResult({ uid: firstDoc.id, ...firstDoc.data() });
        setStatus("found");
      }
    } catch (error) {
      console.error("Search error:", error);
      setStatus("not-found");
    }
  }

  async function startChat(otherUid: string) {
    const myUid = auth.currentUser?.uid;
    if (!myUid) return;

    setIsStartingChat(true);

    try {
      // 1. البحث عن محادثة موجودة مسبقاً بين الطرفين
      const q = query(collection(db, "conversations"), where("participants", "array-contains", myUid));
      const snap = await getDocs(q);
      let existingConvId = null;

      snap.forEach(doc => {
        const data = doc.data();
        // التأكد أن الطرف الآخر موجود في نفس المحادثة
        if (data.participants && data.participants.includes(otherUid)) {
          existingConvId = doc.id;
        }
      });

      if (existingConvId) {
        // إذا وجدت محادثة، افتحها
        router.push(`/chat/${existingConvId}`);
      } else {
        // إذا لم توجد، قم بإنشاء محادثة جديدة في قاعدة البيانات
        const newConvRef = await addDoc(collection(db, "conversations"), {
          participants: [myUid, otherUid],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: null,
          unreadCount: 0
        });
        // ثم افتح المحادثة الجديدة
        router.push(`/chat/${newConvRef.id}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("حدث خطأ أثناء بدء المحادثة. تأكد من قواعد الأمان (Rules) في Firestore.");
    } finally {
      setIsStartingChat(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label htmlFor="user-id-search" className="mb-1.5 block text-sm font-medium text-ink">
          User ID
        </label>
        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            id="user-id-search"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="e.g. USER-45912"
            autoComplete="off"
            aria-describedby="user-id-hint"
            className="focus-ring w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 font-mono text-sm uppercase tracking-wide text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-faint"
          />
        </div>
        <p id="user-id-hint" className="mt-1.5 text-xs text-ink-faint">
          Every person has a unique ID like USER-45912. Ask them for theirs.
        </p>
      </div>

      {status === "invalid" && (
        <p className="text-sm text-danger">That doesn&apos;t look like a valid User ID (format: USER-#####).</p>
      )}

      {status === "searching" && (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface-sunken" />
            <div className="h-2.5 w-1/4 animate-pulse rounded bg-surface-sunken" />
          </div>
        </div>
      )}

      {status === "not-found" && (
        <p className="text-sm text-ink-muted">No user found with ID &ldquo;{value}&rdquo;.</p>
      )}

      {status === "found" && result && (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="min-w-0 flex-1">
            {/* إخفاء الإيميل وعرض كلمة مستخدم أو اسم العرض */}
            <p dir="auto" className="truncate text-sm font-medium text-ink">
              {result.displayName || "USER"}
            </p>
            <p className="font-mono text-xs text-ink-faint">{result.userId}</p>
          </div>
          {result.uid === auth.currentUser?.uid ? (
            <p className="text-xs text-ink-faint">This is you</p>
          ) : (
            <Button onClick={() => startChat(result.uid)} disabled={isStartingChat}>
              {isStartingChat ? "جاري..." : "Message"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
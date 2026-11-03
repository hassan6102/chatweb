"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SideRail } from "@/components/common/SideRail";
import { BottomNav } from "@/components/common/BottomNav";
import { ConversationList } from "@/components/conversations/ConversationList";
import { useAuth } from "@/hooks/useAuth";
import { startPresence } from "@/lib/realtime/presence";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeConversationId = pathname.startsWith("/chat/") ? pathname.split("/")[2] : undefined;
  const { user } = useAuth();
  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return;
    return startPresence(userId);
  }, [userId]);

  return (
    <ProtectedRoute>
      <div className="flex h-dvh w-full overflow-hidden bg-surface">
        <SideRail />

        <div className="hidden w-[360px] shrink-0 border-r border-border md:block">
          <ConversationList activeConversationId={activeConversationId} />
        </div>

        <main className="relative flex min-w-0 flex-1 flex-col pb-14 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </ProtectedRoute>
  );
}

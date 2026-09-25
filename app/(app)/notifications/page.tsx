"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <IconButton aria-label="Back" onClick={() => router.back()} className="md:hidden">
          <Icon name="back" size={20} />
        </IconButton>
        <h1 className="text-sm font-semibold text-ink">Notifications</h1>
      </header>

      <div className="flex-1 p-4">
        <EmptyState
          icon="bell"
          title="No notifications yet"
          description="When you receive new messages or alerts, they will appear here."
        />
      </div>
    </div>
  );
}
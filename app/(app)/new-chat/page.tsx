"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@/components/common/IconButton";
import { Icon } from "@/components/common/Icon";
import { UserSearch } from "@/components/users/UserSearch";

export default function NewChatPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <IconButton aria-label="Back to chats" onClick={() => router.push("/")}>
          <Icon name="back" size={20} />
        </IconButton>
        <h1 className="text-sm font-semibold text-ink">New chat</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <UserSearch />
      </div>
    </div>
  );
}

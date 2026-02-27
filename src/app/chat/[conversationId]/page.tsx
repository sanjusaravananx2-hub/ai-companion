"use client";

import { use, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell activeConversationId={conversationId} refreshKey={refreshKey}>
      <ChatContainer
        conversationId={conversationId}
        onMessageSent={() => setRefreshKey((k) => k + 1)}
      />
    </AppShell>
  );
}

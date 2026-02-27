"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConversations } from "@/hooks/useConversations";
import { Sidebar } from "../sidebar/Sidebar";

interface AppShellProps {
  activeConversationId?: string;
  children: React.ReactNode;
  refreshKey?: number;
}

export function AppShell({ activeConversationId, children, refreshKey }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { conversations, createConversation, deleteConversation, refreshConversations } =
    useConversations();
  const router = useRouter();

  // Refresh conversations when refreshKey changes
  const [lastRefreshKey, setLastRefreshKey] = useState(refreshKey);
  if (refreshKey !== lastRefreshKey) {
    setLastRefreshKey(refreshKey);
    refreshConversations();
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onNewChat={createConversation}
        onDeleteChat={async (id) => {
          await deleteConversation(id);
          if (id === activeConversationId) {
            router.push("/");
          }
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="ml-3 font-semibold text-gray-900 dark:text-white">
            Buddy
          </span>
        </div>

        {children}
      </main>
    </div>
  );
}

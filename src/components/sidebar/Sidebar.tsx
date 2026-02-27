"use client";

import { useRouter } from "next/navigation";
import type { Conversation } from "@/types";
import { ConversationItem } from "./ConversationItem";
import { NewChatButton } from "./NewChatButton";
import { ThemeToggle } from "../theme/ThemeToggle";

interface SidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onNewChat: () => Promise<string | null>;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  conversations,
  activeId,
  onNewChat,
  onDeleteChat,
  isOpen,
  onClose,
}: SidebarProps) {
  const router = useRouter();

  const handleNewChat = async () => {
    const id = await onNewChat();
    if (id) {
      router.push(`/chat/${id}`);
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Buddy
            </h1>
            <ThemeToggle />
          </div>
          <NewChatButton onClick={handleNewChat} />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} onClick={onClose}>
                <ConversationItem
                  conversation={conv}
                  isActive={conv.id === activeId}
                  onDelete={onDeleteChat}
                />
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

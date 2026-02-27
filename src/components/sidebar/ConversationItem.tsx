"use client";

import { useState } from "react";
import Link from "next/link";
import type { Conversation } from "@/types";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onDelete: (id: string) => void;
}

export function ConversationItem({ conversation, isActive, onDelete }: ConversationItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Link
        href={`/chat/${conversation.id}`}
        className={`block px-3 py-2.5 pr-9 rounded-lg transition-colors truncate ${
          isActive
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        }`}
      >
        <div className="font-medium text-sm truncate">{conversation.title}</div>
        {conversation.last_message && (
          <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
            {conversation.last_message}
          </div>
        )}
      </Link>
      {showDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(conversation.id);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete conversation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { StreamingMessage } from "./StreamingMessage";

interface ChatContainerProps {
  conversationId: string;
  onMessageSent?: () => void;
}

export function ChatContainer({ conversationId, onMessageSent }: ChatContainerProps) {
  const { messages, streamingText, isStreaming, loading, sendMessage } =
    useChat(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleSend = (content: string) => {
    sendMessage(content);
    onMessageSent?.();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Hey! I&apos;m Buddy
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Your AI best friend. What&apos;s on your mind?
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.created_at}
            />
          ))}
          {isStreaming && !streamingText && <TypingIndicator />}
          {streamingText && <StreamingMessage content={streamingText} />}
        </div>
      </div>
      <MessageInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}

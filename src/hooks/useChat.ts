"use client";

import { useState, useEffect, useCallback } from "react";
import type { Message } from "@/types";

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", err);
        setLoading(false);
      });
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      // Optimistically add user message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingText("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message: content }),
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.text) {
                accumulated += data.text;
                setStreamingText(accumulated);
              }
              if (data.done) {
                // Add the complete assistant message
                const assistantMsg: Message = {
                  id: crypto.randomUUID(),
                  conversation_id: conversationId,
                  role: "assistant",
                  content: accumulated,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
                setStreamingText("");
                setIsStreaming(false);
              }
              if (data.error) {
                console.error("Stream error:", data.error);
                setIsStreaming(false);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (err) {
        console.error("Failed to send message:", err);
        setIsStreaming(false);
      }
    },
    [conversationId]
  );

  return { messages, streamingText, isStreaming, loading, sendMessage };
}

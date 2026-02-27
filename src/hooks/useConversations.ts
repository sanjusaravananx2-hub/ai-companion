"use client";

import { useState, useEffect, useCallback } from "react";
import type { Conversation } from "@/types";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/conversations", { method: "POST" });
      const data = await res.json();
      setConversations((prev) => [data, ...prev]);
      return data.id;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      return null;
    }
  };

  const deleteConversation = async (id: string): Promise<void> => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  return { conversations, loading, createConversation, deleteConversation, refreshConversations: fetchConversations };
}

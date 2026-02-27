export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface MemorySummary {
  id: string;
  conversation_id: string;
  summary: string;
  message_range_start: string;
  message_range_end: string;
  created_at: string;
}

export interface UserFact {
  id: string;
  fact: string;
  source_conversation_id: string | null;
  created_at: string;
}

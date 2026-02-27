import { getDb, ensureSchema } from "./db";
import { getGroqClient, FAST_MODEL } from "./ai";
import { generateId } from "./utils";
import type { Message, MemorySummary, UserFact } from "@/types";

export async function getUserFacts(userId: string): Promise<UserFact[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM user_facts WHERE user_id = ? ORDER BY created_at DESC",
    args: [userId],
  });
  return result.rows as unknown as UserFact[];
}

export async function getMemorySummaries(conversationId: string): Promise<MemorySummary[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM memory_summaries
          WHERE conversation_id = ?
          ORDER BY created_at DESC
          LIMIT 10`,
    args: [conversationId],
  });
  return result.rows as unknown as MemorySummary[];
}

export async function getRecentMessages(
  conversationId: string,
  limit: number = 20
): Promise<Message[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM messages
          WHERE conversation_id = ?
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [conversationId, limit],
  });
  return (result.rows as unknown as Message[]).reverse();
}

async function getUnsummarizedMessages(conversationId: string): Promise<Message[]> {
  const db = getDb();
  const lastSummaryResult = await db.execute({
    sql: `SELECT message_range_end FROM memory_summaries
          WHERE conversation_id = ?
          ORDER BY created_at DESC LIMIT 1`,
    args: [conversationId],
  });

  if (lastSummaryResult.rows.length === 0) {
    const result = await db.execute({
      sql: "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
      args: [conversationId],
    });
    return result.rows as unknown as Message[];
  }

  const lastMsgId = lastSummaryResult.rows[0].message_range_end as string;
  const lastMsgResult = await db.execute({
    sql: "SELECT created_at FROM messages WHERE id = ?",
    args: [lastMsgId],
  });

  if (lastMsgResult.rows.length === 0) {
    const result = await db.execute({
      sql: "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
      args: [conversationId],
    });
    return result.rows as unknown as Message[];
  }

  const lastCreatedAt = lastMsgResult.rows[0].created_at as string;
  const result = await db.execute({
    sql: `SELECT * FROM messages
          WHERE conversation_id = ? AND created_at > ?
          ORDER BY created_at ASC`,
    args: [conversationId, lastCreatedAt],
  });
  return result.rows as unknown as Message[];
}

export async function maybeSummarize(conversationId: string, userId: string): Promise<void> {
  const unsummarized = await getUnsummarizedMessages(conversationId);
  if (unsummarized.length < 30) return;

  const groq = getGroqClient();

  const conversationText = unsummarized
    .map((m) => `${m.role === "user" ? "User" : "Buddy"}: ${m.content}`)
    .join("\n");

  const response = await groq.chat.completions.create({
    model: FAST_MODEL,
    messages: [
      {
        role: "user",
        content: `You are a memory system for a chat companion named Buddy. Given the following conversation segment, produce:
1. A concise summary (2-3 sentences) capturing the key topics, emotional tone, and any decisions or plans discussed.
2. A list of facts about the user that were revealed (name, preferences, life events, relationships, etc.). Only include clearly stated facts, not assumptions.

Format your response as JSON only, no markdown, no explanation:
{"summary": "...", "user_facts": ["fact1", "fact2"]}

Conversation:
${conversationText}`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content || "";

  try {
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanText);
    const db = getDb();

    if (parsed.summary) {
      await db.execute({
        sql: `INSERT INTO memory_summaries (id, conversation_id, summary, message_range_start, message_range_end)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          generateId(),
          conversationId,
          parsed.summary,
          unsummarized[0].id,
          unsummarized[unsummarized.length - 1].id,
        ],
      });
    }

    if (parsed.user_facts && Array.isArray(parsed.user_facts)) {
      const existingFacts = (await getUserFacts(userId)).map((f) => f.fact.toLowerCase());
      for (const fact of parsed.user_facts) {
        if (!existingFacts.includes(fact.toLowerCase())) {
          await db.execute({
            sql: `INSERT INTO user_facts (id, user_id, fact, source_conversation_id) VALUES (?, ?, ?, ?)`,
            args: [generateId(), userId, fact, conversationId],
          });
        }
      }
    }
  } catch {
    console.error("Failed to parse memory summary response:", text);
  }
}

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, ensureSchema } from "@/lib/db";
import { getGroqClient, CHAT_MODEL } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/personality";
import {
  getUserFacts,
  getMemorySummaries,
  getRecentMessages,
  maybeSummarize,
} from "@/lib/memory";
import { generateId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await ensureSchema();
  const { conversationId, message } = await request.json();
  const db = getDb();

  // Store the user message
  const messageId = generateId();
  await db.execute({
    sql: "INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES (?, ?, ?, 'user', ?)",
    args: [messageId, conversationId, userId, message],
  });

  // Update conversation timestamp
  await db.execute({
    sql: "UPDATE conversations SET updated_at = datetime('now') WHERE id = ? AND user_id = ?",
    args: [conversationId, userId],
  });

  // Build context
  const userFacts = await getUserFacts(userId);
  const memorySummaries = await getMemorySummaries(conversationId);
  const recentMessages = await getRecentMessages(conversationId, 20);
  const systemPrompt = buildSystemPrompt(
    userFacts.map((f) => f.fact),
    memorySummaries.map((s) => s.summary)
  );

  // Stream the response via Groq
  const groq = getGroqClient();
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const groqStream = await groq.chat.completions.create({
          model: CHAT_MODEL,
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...recentMessages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
        });

        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        // Store the complete AI response
        const aiMessageId = generateId();
        await db.execute({
          sql: "INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES (?, ?, ?, 'assistant', ?)",
          args: [aiMessageId, conversationId, userId, fullResponse],
        });

        // Auto-title the conversation on first exchange
        const msgCount = await db.execute({
          sql: "SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?",
          args: [conversationId],
        });

        if ((msgCount.rows[0].count as number) <= 2) {
          const title =
            message.length > 50 ? message.slice(0, 50) + "..." : message;
          await db.execute({
            sql: "UPDATE conversations SET title = ? WHERE id = ?",
            args: [title, conversationId],
          });
        }

        // Signal stream end
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();

        // Check if summarization is needed (fire and forget)
        maybeSummarize(conversationId, userId).catch(console.error);
      } catch (error) {
        console.error("Chat stream error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

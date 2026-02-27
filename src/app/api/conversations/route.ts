import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, ensureSchema } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT c.*,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
     FROM conversations c
     WHERE c.user_id = ?
     ORDER BY c.updated_at DESC`,
    args: [userId],
  });

  return NextResponse.json(result.rows);
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await ensureSchema();
  const db = getDb();
  const id = generateId();
  await db.execute({
    sql: "INSERT INTO conversations (id, user_id, title) VALUES (?, ?, 'New Chat')",
    args: [id, userId],
  });
  const result = await db.execute({
    sql: "SELECT * FROM conversations WHERE id = ?",
    args: [id],
  });
  return NextResponse.json(result.rows[0], { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, ensureSchema } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  await ensureSchema();
  const db = getDb();

  await db.execute({
    sql: "DELETE FROM messages WHERE conversation_id = ?",
    args: [id],
  });
  await db.execute({
    sql: "DELETE FROM memory_summaries WHERE conversation_id = ?",
    args: [id],
  });
  await db.execute({
    sql: "DELETE FROM conversations WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });

  return NextResponse.json({ success: true });
}

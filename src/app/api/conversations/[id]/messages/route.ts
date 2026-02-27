import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, ensureSchema } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    args: [id],
  });

  return NextResponse.json(result.rows);
}

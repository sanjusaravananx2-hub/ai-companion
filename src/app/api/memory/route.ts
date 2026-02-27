import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { maybeSummarize } from "@/lib/memory";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { conversationId } = await request.json();

  try {
    await maybeSummarize(conversationId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Memory summarization error:", error);
    return NextResponse.json(
      { error: "Summarization failed" },
      { status: 500 }
    );
  }
}

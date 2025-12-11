// src/app/api/threads/[threadId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const params = await context.params;
    const threadIdStr = params.threadId;
    const threadIdNum = Number(threadIdStr);

    if (!threadIdStr || Number.isNaN(threadIdNum)) {
      return NextResponse.json(
        { error: { code: "BAD_THREAD_ID", message: "Invalid thread id" } },
        { status: 400 }
      );
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadIdNum },
    });

    if (!thread) {
      return NextResponse.json(
        { error: { code: "THREAD_NOT_FOUND", message: "Thread not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ thread }, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/threads/[threadId]:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { ingestKnowledgeItem } from '../../../../../lib/ingestKnowledgeItem';

// For now, we'll assume a fake logged-in user
const DEMO_USER_ID = 1;

export async function GET(
  request: NextRequest,
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

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") || "50");

    const items = await prisma.knowledgeItem.findMany({
      where: { threadId: threadIdNum },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/threads/[threadId]/knowledge:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
      { status: 500 }
    );
  }
}


export async function POST(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    // 👇 Next.js 16: params is a Promise
    const params = await context.params;
    const threadIdStr = params.threadId;

    const threadIdNum = Number(threadIdStr);
    if (!threadIdStr || Number.isNaN(threadIdNum)) {
      return NextResponse.json(
        { error: { code: 'BAD_THREAD_ID', message: 'Invalid thread id' } },
        { status: 400 }
      );
    }

    // TODO: real auth later
    const userId = DEMO_USER_ID;

    const thread = await prisma.thread.findUnique({
      where: { id: threadIdNum },
    });

    if (!thread) {
      return NextResponse.json(
        { error: { code: 'THREAD_NOT_FOUND', message: 'Thread not found' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as any;

    const type = body.type ?? 'comment';
    const title = body.title as string | undefined;
    const content = body.content as string | undefined;
    const sourceUrl = body.sourceUrl as string | undefined;
    const metadata = (body.metadata as object | undefined) ?? {};

    if (!content && !sourceUrl) {
      return NextResponse.json(
        {
          error: {
            code: 'CONTENT_OR_URL_REQUIRED',
            message: 'Provide at least content or sourceUrl',
          },
        },
        { status: 400 }
      );
    }

    if (
      (type === 'paper' || type === 'url' || type === 'dataset') &&
      !title
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'TITLE_REQUIRED',
            message: 'Title is required for paper, url, or dataset',
          },
        },
        { status: 400 }
      );
    }

    // Create the KnowledgeItem
    const knowledgeItem = await prisma.knowledgeItem.create({
      data: {
        threadId: thread.id,
        type,
        title: title ?? null,
        rawContent: content ?? null,
        sourceUrl: sourceUrl ?? null,
        metadata,
        addedByUserId: userId,
        status: 'pending',
      },
    });

    const contentLength = (content ?? '').length;
    const MAX_SYNC_LENGTH = 15000;

    if (content && contentLength <= MAX_SYNC_LENGTH) {
      try {
        await ingestKnowledgeItem(knowledgeItem);
      } catch (err) {
        console.error('Ingestion failed:', err);
        // keep status = 'pending'
      }
    }

    const updated = await prisma.knowledgeItem.findUnique({
      where: { id: knowledgeItem.id },
    });

    return NextResponse.json({ knowledgeItem: updated }, { status: 201 });
  } catch (err) {
    console.error('Error in POST /api/threads/[threadId]/knowledge:', err);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong.',
        },
      },
      { status: 500 }
    );
  }
}

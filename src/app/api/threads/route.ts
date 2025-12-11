// src/app/api/threads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const DEMO_USER_ID = 1;

// GET /api/threads - list threads
export async function GET(_req: NextRequest) {
  try {
    const threads = await prisma.thread.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ threads }, { status: 200 });
  } catch (err: any) {
    console.error("Error in GET /api/threads:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            err?.message || "Something went wrong when loading threads.",
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/threads - create a new thread
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const title = (body.title as string | undefined)?.trim();
    const description =
      (body.description as string | undefined)?.trim() ?? "";
    const baseModelName =
      (body.baseModelName as string | undefined)?.trim() || "gpt-4.1-mini";

    if (!title) {
      return NextResponse.json(
        {
          error: {
            code: "TITLE_REQUIRED",
            message: "Thread title is required.",
          },
        },
        { status: 400 }
      );
    }

    // simple slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let slug = baseSlug || "thread";
    let suffix = 1;

    // ensure slug is unique
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.thread.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${suffix++}`;
    }

    const systemPrompt = `You are an expert assistant for the thread "${title}". Answer questions specifically in this domain, using the thread's knowledge base when available. Be concise but precise.`;

    const llmConfig = await prisma.lLMConfig.create({
      data: {
        baseModelName,
        systemPrompt,
        temperature: 0.2,
        retrievalK: 8,
      },
    });

    const thread = await prisma.thread.create({
      data: {
        slug,
        title,
        description,
        createdByUserId: DEMO_USER_ID,
        llmConfigId: llmConfig.id,
      },
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (err: any) {
    console.error("Error in POST /api/threads:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            err?.message || "Something went wrong when creating thread.",
        },
      },
      { status: 500 }
    );
  }
}

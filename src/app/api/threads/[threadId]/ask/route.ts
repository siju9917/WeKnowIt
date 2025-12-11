import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { openai } from "../../../../../lib/openai";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    // ✅ Next.js 16: params is a Promise
    const params = await context.params;
    const threadIdStr = params.threadId;
    const threadIdNum = Number(threadIdStr);

    if (!threadIdStr || Number.isNaN(threadIdNum)) {
      return NextResponse.json(
        { error: { code: "BAD_THREAD_ID", message: "Invalid thread id" } },
        { status: 400 }
      );
    }

    // Load thread + LLM config
    const thread = await prisma.thread.findUnique({
      where: { id: threadIdNum },
      include: { llmConfig: true },
    });

    if (!thread || !thread.llmConfig) {
      return NextResponse.json(
        {
          error: {
            code: "THREAD_NOT_FOUND",
            message: "Thread or LLM config not found",
          },
        },
        { status: 404 }
      );
    }

    const body = (await request.json()) as any;
    const question = (body.question as string | undefined)?.trim() ?? "";

    if (!question) {
      return NextResponse.json(
        {
          error: {
            code: "QUESTION_REQUIRED",
            message: "Question is required",
          },
        },
        { status: 400 }
      );
    }

    const model =
      thread.llmConfig.baseModelName && thread.llmConfig.baseModelName.length
        ? thread.llmConfig.baseModelName
        : "gpt-4.1-mini"; // fallback
    const temperature = thread.llmConfig.temperature ?? 0.2;

    let answerText = "";

    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature,
        messages: [
          {
            role: "system",
            content: thread.llmConfig.systemPrompt,
          },
          {
            role: "user",
            content: question,
          },
        ],
      });

      answerText =
        completion.choices[0]?.message?.content?.trim() ??
        "Sorry, I couldn't generate an answer.";
    } catch (apiError: any) {
      console.error("OpenAI API error:", apiError);
      const msg =
        apiError?.response?.data?.error?.message ||
        apiError?.message ||
        "Failed to call OpenAI.";
      return NextResponse.json(
        {
          error: {
            code: "OPENAI_ERROR",
            message: msg,
          },
        },
        { status: 500 }
      );
    }

    // You can later save Conversation + Message here.
    return NextResponse.json(
      {
        answer: answerText,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in POST /api/threads/[threadId]/ask:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong.",
        },
      },
      { status: 500 }
    );
  }
}

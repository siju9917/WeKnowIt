// src/app/api/votes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const DEMO_USER_ID = 1;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const targetType = (body.targetType as string | undefined) ?? "";
    const targetId = Number(body.targetId);
    const value = Number(body.value); // should be 1 or -1

    if (!["knowledge_item"].includes(targetType)) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_TARGET_TYPE",
            message: "Unsupported target type.",
          },
        },
        { status: 400 }
      );
    }

    if (!targetId || Number.isNaN(targetId)) {
      return NextResponse.json(
        { error: { code: "BAD_TARGET_ID", message: "Invalid target id" } },
        { status: 400 }
      );
    }

    if (![1, -1].includes(value)) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_VOTE_VALUE",
            message: "Vote value must be 1 or -1.",
          },
        },
        { status: 400 }
      );
    }

    const userId = DEMO_USER_ID;

    const vote = await prisma.vote.upsert({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType,
          targetId,
        },
      },
      update: { value },
      create: {
        userId,
        targetType,
        targetId,
        value,
      },
    });

    // Recompute cachedVoteScore for knowledge item
    if (targetType === "knowledge_item") {
      const agg = await prisma.vote.aggregate({
        _sum: { value: true },
        where: {
          targetType: "knowledge_item",
          targetId,
        },
      });

      const sum = agg._sum.value ?? 0;

      await prisma.knowledgeItem.update({
        where: { id: targetId },
        data: { cachedVoteScore: sum },
      });
    }

    return NextResponse.json({ vote }, { status: 200 });
  } catch (err) {
    console.error("Error in POST /api/votes:", err);
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

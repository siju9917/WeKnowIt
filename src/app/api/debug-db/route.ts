// src/app/api/debug-db/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const count = await prisma.thread.count();
    const dbUrl = process.env.DATABASE_URL || "";
    const hostPart = dbUrl.split("@")[1] || dbUrl; // don't leak password

    return NextResponse.json(
      {
        ok: true,
        threadCount: count,
        dbHost: hostPart,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Debug DB error:", err);
    return NextResponse.json(
      {
        ok: false,
        message: err?.message || "Unknown error",
        code: err?.code,
      },
      { status: 500 }
    );
  }
}

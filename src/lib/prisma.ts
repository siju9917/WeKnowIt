// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const connectionString = process.env.DATABASE_URL;
const pg = new PrismaPg(connectionString);

// Use require + any so TypeScript doesn't need Prisma's types on Vercel
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client") as any;

export const prisma = new PrismaClient({
  adapter: pg,
});

// src/lib/ingestKnowledgeItem.ts
import { prisma } from "./prisma";
import { chunkText } from "./chunkText";
import { embedTexts } from "./embeddings";

type KnowledgeItemLike = {
  id: number;
  threadId: number;
  rawContent: string | null;
};

/**
 * Ingest a KnowledgeItem's rawContent:
 * - chunk text
 * - embed each chunk
 * - store KnowledgeChunk rows
 * - update status to 'ingested'
 */
export async function ingestKnowledgeItem(item: KnowledgeItemLike) {
  const raw = (item.rawContent ?? "").trim();
  if (!raw) {
    // Nothing to ingest
    return;
  }

  const chunks = chunkText(raw, 1200, 200);
  if (!chunks.length) return;

  const texts = chunks.map((c) => c.text);
  const embeddings = await embedTexts(texts);

  await prisma.$transaction(async (tx) => {
    await tx.knowledgeChunk.createMany({
      data: chunks.map((chunk, idx) => ({
        knowledgeItemId: item.id,
        threadId: item.threadId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding: embeddings[idx],
      })),
    });

    await tx.knowledgeItem.update({
      where: { id: item.id },
      data: { status: "ingested" },
    });
  });
}

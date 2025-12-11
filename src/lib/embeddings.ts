// src/lib/embeddings.ts
import { openai } from './openai';

/**
 * Embed an array of texts into float vectors.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float',
  });

  return response.data.map((item) => item.embedding as number[]);
}


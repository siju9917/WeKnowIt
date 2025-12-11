// src/lib/chunkText.ts

export type TextChunk = {
  chunkIndex: number;
  text: string;
};

export function chunkText(
  text: string,
  maxChars = 1200,
  overlapChars = 200
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const trimmed = text.trim();
  if (!trimmed) return chunks;

  let start = 0;
  let index = 0;

  while (start < trimmed.length) {
    const end = Math.min(start + maxChars, trimmed.length);
    const slice = trimmed.slice(start, end);

    chunks.push({
      chunkIndex: index,
      text: slice,
    });

    if (end === trimmed.length) break;

    start = end - overlapChars;
    if (start < 0) start = 0;
    index += 1;
  }

  return chunks;
}

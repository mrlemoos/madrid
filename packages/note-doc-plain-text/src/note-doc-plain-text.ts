function collectPlainTextPartsFromNode(node: unknown, parts: string[]): void {
  if (node === null || node === undefined) {
    return;
  }
  if (typeof node !== 'object') {
    return;
  }
  const o = node as Record<string, unknown>;
  if (o.type === 'noteAudio') {
    parts.push('Recording');
  }
  if (typeof o.text === 'string') {
    parts.push(o.text);
  }
  const content = o.content;
  if (!Array.isArray(content)) {
    return;
  }
  for (const child of content) {
    collectPlainTextPartsFromNode(child, parts);
  }
}

function normaliseCollapsedWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Walks a ProseMirror/TipTap JSON `doc` and concatenates literal `text` nodes.
 * Used by the marketing micro-tool; safe on untrusted JSON (no eval).
 */
export function extractPlainTextFromDocJson(input: unknown): string {
  const parts: string[] = [];
  collectPlainTextPartsFromNode(input, parts);
  return normaliseCollapsedWhitespace(parts.join(''));
}

function extractPlainTextFromSubtree(node: unknown): string {
  const parts: string[] = [];
  collectPlainTextPartsFromNode(node, parts);
  return normaliseCollapsedWhitespace(parts.join(''));
}

/**
 * Plain text for the journal list: leading top-level headings (before the first paragraph),
 * then the first top-level paragraph. Used for a short preview under the note title.
 */
export function extractJournalNoteListPreviewFromDocJson(doc: unknown): string {
  if (doc === null || doc === undefined || typeof doc !== 'object') {
    return '';
  }
  const content = (doc as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    return '';
  }

  const blocks = content as unknown[];
  const firstParagraphIndex = blocks.findIndex((block) => {
    if (block === null || typeof block !== 'object') {
      return false;
    }
    return (block as { type?: string }).type === 'paragraph';
  });

  const segments: string[] = [];

  if (firstParagraphIndex === -1) {
    for (const block of blocks) {
      if (block === null || typeof block !== 'object') {
        continue;
      }
      if ((block as { type?: string }).type === 'heading') {
        const piece = extractPlainTextFromSubtree(block);
        if (piece) {
          segments.push(piece);
        }
      }
    }
    return segments.join(' ').trim();
  }

  for (let i = 0; i < firstParagraphIndex; i++) {
    const block = blocks[i];
    if (block === null || typeof block !== 'object') {
      continue;
    }
    if ((block as { type?: string }).type === 'heading') {
      const piece = extractPlainTextFromSubtree(block);
      if (piece) {
        segments.push(piece);
      }
    }
  }

  const paragraph = blocks[firstParagraphIndex];
  const paraText = extractPlainTextFromSubtree(paragraph);
  if (paraText) {
    segments.push(paraText);
  }

  return segments.join(' ').trim();
}

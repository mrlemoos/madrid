/**
 * Parses command-palette semantic search input: natural language outside quotes,
 * case-insensitive literal phrases inside ASCII double quotes. Escape a quote inside
 * a literal as `\"`.
 */
export function parseSemanticSearchQuery(input: string): {
  semantic: string;
  literals: string[];
} {
  const literals: string[] = [];
  const semanticChunks: string[] = [];
  let i = 0;
  let buf = '';
  let inQuote = false;

  while (i < input.length) {
    const c = input[i];
    if (inQuote) {
      if (c === '\\' && input[i + 1] === '"') {
        buf += '"';
        i += 2;
        continue;
      }
      if (c === '"') {
        literals.push(buf);
        buf = '';
        inQuote = false;
        i += 1;
        continue;
      }
      buf += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      semanticChunks.push(buf);
      buf = '';
      inQuote = true;
      i += 1;
      continue;
    }
    buf += c;
    i += 1;
  }
  semanticChunks.push(buf);

  const semantic = semanticChunks.join('').replace(/\s+/g, ' ').trim();

  return { semantic, literals };
}

import MarkdownIt from 'markdown-it';

// Markdown <-> TipTap ProseMirror JSON for the MCP server. Pure JSON walkers,
// no ProseMirror Schema: the server never has the editor's full schema (custom
// nodes live in React node views), so writes are built only from the fixed
// StarterKit/TaskList/Table node set below and reads degrade unknown nodes to
// readable placeholders.

export type NoteJsonMark = { type: string; attrs?: Record<string, unknown> };

export type NoteJsonNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NoteJsonNode[];
  text?: string;
  marks?: NoteJsonMark[];
};

const md = new MarkdownIt('default', { html: false, linkify: false });

type MarkdownToken = ReturnType<typeof md.parse>[number];

const BLOCK_OPEN: Partial<
  Record<string, (t: MarkdownToken) => Pick<NoteJsonNode, 'type' | 'attrs'>>
> = {
  paragraph_open: () => ({ type: 'paragraph' }),
  heading_open: (t) => ({
    type: 'heading',
    attrs: { level: Number(t.tag.slice(1)) },
  }),
  bullet_list_open: () => ({ type: 'bulletList' }),
  ordered_list_open: (t) => ({
    type: 'orderedList',
    attrs: { start: Number(t.attrGet('start') ?? 1) },
  }),
  list_item_open: () => ({ type: 'listItem' }),
  blockquote_open: () => ({ type: 'blockquote' }),
  table_open: () => ({ type: 'table' }),
  tr_open: () => ({ type: 'tableRow' }),
  th_open: () => ({ type: 'tableHeader' }),
  td_open: () => ({ type: 'tableCell' }),
};

const MARK_OPEN: Partial<Record<string, (t: MarkdownToken) => NoteJsonMark>> = {
  strong_open: () => ({ type: 'bold' }),
  em_open: () => ({ type: 'italic' }),
  s_open: () => ({ type: 'strike' }),
  link_open: (t) => ({ type: 'link', attrs: { href: t.attrGet('href') } }),
};

function inlineToNodes(children: MarkdownToken[]): NoteJsonNode[] {
  const out: NoteJsonNode[] = [];
  const marks: NoteJsonMark[] = [];
  const pushText = (text: string, nodeMarks: NoteJsonMark[]) => {
    if (text.length === 0) return;
    out.push(
      nodeMarks.length > 0
        ? { type: 'text', text, marks: nodeMarks }
        : { type: 'text', text },
    );
  };
  for (const t of children) {
    const open = MARK_OPEN[t.type];
    if (open) {
      marks.push(open(t));
    } else if (t.type.endsWith('_close')) {
      marks.pop();
    } else if (t.type === 'code_inline') {
      // TipTap's `code` mark excludes every other mark.
      pushText(t.content, [{ type: 'code' }]);
    } else if (t.type === 'hardbreak') {
      out.push({ type: 'hardBreak' });
    } else if (t.type === 'softbreak') {
      pushText(' ', [...marks]);
    } else if (t.type === 'image') {
      // ponytail: no remote images in notes (uploads only); keep it as a link.
      const href = t.attrGet('src');
      pushText(
        String(t.content || href || 'image'),
        href ? [...marks, { type: 'link', attrs: { href } }] : [...marks],
      );
    } else {
      pushText(t.content, [...marks]);
    }
  }
  return out;
}

const TASK_PREFIX = /^\[([ xX])\]\s+/;

/** GFM `- [ ] foo` → taskList/taskItem, when every item of the list is a task. */
function promoteTaskLists(node: NoteJsonNode): NoteJsonNode {
  const content = node.content?.map(promoteTaskLists);
  const next = content ? { ...node, content } : node;
  if (next.type !== 'bulletList' || !content?.length) return next;
  const firstTexts = content.map((item) => item.content?.[0]?.content?.[0]);
  if (
    !firstTexts.every(
      (t) => t?.type === 'text' && TASK_PREFIX.test(t.text ?? ''),
    )
  ) {
    return next;
  }
  return {
    type: 'taskList',
    content: content.map((item) => {
      const [para, ...rest] = item.content ?? [];
      const [first, ...inline] = para.content ?? [];
      const match = TASK_PREFIX.exec(first.text ?? '');
      const text = (first.text ?? '').slice(match?.[0].length ?? 0);
      const paraContent = text ? [{ ...first, text }, ...inline] : inline;
      return {
        type: 'taskItem',
        attrs: { checked: match?.[1] !== ' ' },
        content: [{ ...para, content: paraContent }, ...rest],
      };
    }),
  };
}

function withoutEmptyContent(node: NoteJsonNode): NoteJsonNode {
  if (!node.content) return node;
  if (node.content.length === 0) {
    const { content: _empty, ...rest } = node;
    return rest;
  }
  return { ...node, content: node.content.map(withoutEmptyContent) };
}

/** Markdown → top-level TipTap block nodes (headings, lists, tasks, code, tables…). */
export function markdownToNoteBlocks(markdown: string): NoteJsonNode[] {
  const root: NoteJsonNode = { type: 'doc', content: [] };
  const stack: NoteJsonNode[] = [root];
  const top = () => stack[stack.length - 1];
  const append = (node: NoteJsonNode) => {
    const parent = top();
    parent.content = [...(parent.content ?? []), node];
  };

  for (const t of md.parse(markdown, {})) {
    const open = BLOCK_OPEN[t.type];
    if (open) {
      const node: NoteJsonNode = { ...open(t), content: [] };
      append(node);
      stack.push(node);
    } else if (t.nesting === -1) {
      // thead/tbody have no TipTap node: their open token never pushed.
      if (t.type !== 'thead_close' && t.type !== 'tbody_close') stack.pop();
    } else if (t.type === 'inline') {
      const nodes = inlineToNodes(t.children ?? []);
      const parentType = top().type;
      // TipTap cells hold blocks, markdown-it cells hold inline directly.
      if (parentType === 'tableCell' || parentType === 'tableHeader') {
        append({ type: 'paragraph', content: nodes });
      } else {
        top().content = [...(top().content ?? []), ...nodes];
      }
    } else if (t.type === 'fence' || t.type === 'code_block') {
      const text = t.content.replace(/\n$/, '');
      append({
        type: 'codeBlock',
        attrs: { language: t.info.trim().split(/\s+/)[0] || null },
        ...(text ? { content: [{ type: 'text', text }] } : {}),
      });
    } else if (t.type === 'hr') {
      append({ type: 'horizontalRule' });
    }
  }

  return (root.content ?? []).map(promoteTaskLists).map(withoutEmptyContent);
}

/** Attr value as text; attrs are untyped JSON, so never stringify objects. */
function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : fallback;
}

function inlineMarkdown(nodes: NoteJsonNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => {
      if (n.type === 'hardBreak') return '\n';
      if (n.type === 'emoji') return `:${str(n.attrs?.name)}:`;
      if (n.type !== 'text') return inlineMarkdown(n.content);
      let text = n.text ?? '';
      for (const mark of n.marks ?? []) {
        if (mark.type === 'code') text = `\`${text}\``;
        else if (mark.type === 'bold') text = `**${text}**`;
        else if (mark.type === 'italic') text = `*${text}*`;
        else if (mark.type === 'strike') text = `~~${text}~~`;
        else if (mark.type === 'link')
          text = `[${text}](${str(mark.attrs?.href)})`;
      }
      return text;
    })
    .join('');
}

function indent(text: string, prefix: string): string {
  const pad = ' '.repeat(prefix.length);
  return text
    .split('\n')
    .map((line, i) => (i === 0 ? prefix + line : line ? pad + line : line))
    .join('\n');
}

function cellText(cell: NoteJsonNode): string {
  return (cell.content ?? [])
    .map((b) => inlineMarkdown(b.content))
    .join(' ')
    .replace(/\n/g, ' ')
    .replace(/\|/g, '\\|');
}

function blockMarkdown(node: NoteJsonNode): string {
  const attrs = node.attrs ?? {};
  const children = node.content ?? [];
  switch (node.type) {
    case 'paragraph':
      return inlineMarkdown(children);
    case 'heading':
      return `${'#'.repeat(Number(attrs.level) || 1)} ${inlineMarkdown(children)}`;
    case 'bulletList':
      return children.map((i) => indent(itemMarkdown(i), '- ')).join('\n');
    case 'orderedList': {
      const start = Number(attrs.start) || 1;
      return children
        .map((i, n) => indent(itemMarkdown(i), `${String(start + n)}. `))
        .join('\n');
    }
    case 'taskList':
      return children
        .map((i) =>
          indent(itemMarkdown(i), i.attrs?.checked ? '- [x] ' : '- [ ] '),
        )
        .join('\n');
    case 'blockquote':
      return blocksMarkdown(children)
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n');
    case 'codeBlock':
      return `\`\`\`${str(attrs.language)}\n${inlineMarkdown(children)}\n\`\`\``;
    case 'horizontalRule':
      return '---';
    case 'table': {
      const rows = children.map((r) => (r.content ?? []).map(cellText));
      if (rows.length === 0) return '';
      const [head, ...body] = rows;
      return [head, head.map(() => '---'), ...body]
        .map((cells) => `| ${cells.join(' | ')} |`)
        .join('\n');
    }
    case 'noteImage':
      return `[Image: ${str(attrs.filename, 'image')}]`;
    case 'notePdf':
      return `[PDF: ${str(attrs.filename, 'document.pdf')}]`;
    case 'noteAudio':
      return `[Recording: ${str(attrs.filename, 'audio')}]`;
    case 'linkPreview': {
      const href = str(attrs.href);
      const title = str(attrs.title) || str(attrs.linkText);
      return title ? `[${title}](${href})` : href;
    }
    default:
      return children.length > 0 ? blocksMarkdown(children) : `[${node.type}]`;
  }
}

function itemMarkdown(item: NoteJsonNode): string {
  return (item.content ?? []).map(blockMarkdown).join('\n');
}

function blocksMarkdown(nodes: NoteJsonNode[]): string {
  return nodes.map(blockMarkdown).join('\n\n');
}

/**
 * TipTap doc JSON → Markdown for agents. ponytail: no escaping of literal
 * `*`/`_` in text; output is for reading, not a lossless round-trip.
 */
export function noteDocToMarkdown(doc: unknown): string {
  const node = doc as NoteJsonNode | null;
  return node && Array.isArray(node.content)
    ? blocksMarkdown(node.content)
    : '';
}

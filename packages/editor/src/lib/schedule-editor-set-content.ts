import type { Content, Editor } from '@tiptap/core';

/**
 * TipTap `setContent` renders React node views via `flushSync`. Calling it
 * inside `useEffect` hits React's "flushSync from inside a lifecycle method"
 * error. Queue a microtask so the command runs after the current commit.
 * Returns a cancel fn for effect cleanup so unmount never applies the command.
 */
export function scheduleEditorSetContent(
  editor: Editor,
  content: Content,
): () => void {
  let cancelled = false;
  queueMicrotask(() => {
    if (cancelled || editor.isDestroyed) return;
    editor.commands.setContent(content, false);
  });
  return () => {
    cancelled = true;
  };
}

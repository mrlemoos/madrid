import type { Editor } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';
import { scheduleEditorSetContent } from './schedule-editor-set-content';

function stubEditor(isDestroyed = false) {
  return {
    isDestroyed,
    commands: {
      setContent: vi.fn(),
    },
  };
}

function asEditor(editor: ReturnType<typeof stubEditor>): Editor {
  return editor as unknown as Editor;
}

describe('scheduleEditorSetContent', () => {
  it('does not call setContent on the current call stack', () => {
    // Arrange
    const editor = stubEditor();
    const content = { type: 'doc' };

    // Act
    scheduleEditorSetContent(asEditor(editor), content);

    // Assert
    expect(editor.commands.setContent).not.toHaveBeenCalled();
  });

  it('calls setContent after a microtask with emitUpdate false', async () => {
    // Arrange
    const editor = stubEditor();
    const content = { type: 'doc' };

    // Act
    scheduleEditorSetContent(asEditor(editor), content);
    await Promise.resolve();

    // Assert
    expect(editor.commands.setContent).toHaveBeenCalledTimes(1);
    expect(editor.commands.setContent).toHaveBeenCalledWith(content, false);
  });

  it('skips setContent when the editor is destroyed before the microtask', async () => {
    // Arrange
    const editor = stubEditor();
    const content = { type: 'doc' };

    // Act
    scheduleEditorSetContent(asEditor(editor), content);
    editor.isDestroyed = true;
    await Promise.resolve();

    // Assert
    expect(editor.commands.setContent).not.toHaveBeenCalled();
  });

  it('skips setContent when cancelled before the microtask', async () => {
    // Arrange
    const editor = stubEditor();
    const content = { type: 'doc' };

    // Act
    const cancel = scheduleEditorSetContent(asEditor(editor), content);
    cancel();
    await Promise.resolve();

    // Assert
    expect(editor.commands.setContent).not.toHaveBeenCalled();
  });
});

import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  NoteEditorCommandsProvider,
  useNoteEditorCommands,
} from './note-editor-commands';

function wrapper({ children }: { children: ReactNode }) {
  return <NoteEditorCommandsProvider>{children}</NoteEditorCommandsProvider>;
}

describe('NoteEditorCommandsProvider', () => {
  it('returns fallback values outside provider', () => {
    // Arrange / Act
    const { result } = renderHook(() => useNoteEditorCommands());

    // Assert
    expect(result.current.canInsertMermaid).toBe(false);
    expect(result.current.canInsertTable).toBe(false);
    expect(result.current.canInsertTaskList).toBe(false);
  });

  it('tracks mermaid inserter registration', () => {
    // Arrange
    const insert = vi.fn();
    const { result } = renderHook(() => useNoteEditorCommands(), { wrapper });

    // Act
    act(() => {
      result.current.registerMermaidInserter(insert);
    });
    act(() => {
      result.current.insertMermaidAtCursor();
    });

    // Assert
    expect(result.current.canInsertMermaid).toBe(true);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('tracks table and task list inserters', () => {
    // Arrange
    const table = vi.fn();
    const task = vi.fn();
    const { result } = renderHook(() => useNoteEditorCommands(), { wrapper });

    // Act
    act(() => {
      result.current.registerTableInserter(table);
      result.current.registerTaskListInserter(task);
    });
    act(() => {
      result.current.insertTableAtCursor();
      result.current.insertTaskListAtCursor();
    });

    // Assert
    expect(result.current.canInsertTable).toBe(true);
    expect(result.current.canInsertTaskList).toBe(true);
    expect(table).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('clears canInsert flags when unregistering with null', () => {
    // Arrange
    const { result } = renderHook(() => useNoteEditorCommands(), { wrapper });
    act(() => {
      result.current.registerMermaidInserter(() => {});
    });

    // Act
    act(() => {
      result.current.registerMermaidInserter(null);
    });

    // Assert
    expect(result.current.canInsertMermaid).toBe(false);
  });
});

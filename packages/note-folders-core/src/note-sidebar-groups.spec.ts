import { describe, expect, it } from 'vitest';
import type { Folder, Note } from '@nota/database-types';
import {
  buildSidebarFolderSections,
  compareFolderNames,
  compareNoteTitles,
} from './note-sidebar-groups';

const folderBase = {
  user_id: 'u1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  parent_id: null as string | null,
  tint: null as string | null,
};

const noteBase = {
  user_id: 'u1',
  content: {},
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  folder_id: null as string | null,
  editor_settings: null,
};

function folder(id: string, name: string): Folder {
  return { id, name, ...folderBase };
}

function note(
  id: string,
  title: string,
  folder_id: string | null = null,
): Note {
  return { ...noteBase, id, title, folder_id };
}

describe('note-sidebar-groups', () => {
  it('compareFolderNames sorts case-insensitively by name', () => {
    // Arrange
    const a = folder('1', 'beta');
    const b = folder('2', 'Alpha');

    // Act
    const ordered = [a, b].sort(compareFolderNames);

    // Assert
    expect(ordered.map((f) => f.id)).toEqual(['2', '1']);
  });

  it('compareNoteTitles treats empty title as Untitled Note', () => {
    // Arrange
    const untitled = note('1', '  ');
    const named = note('2', 'Alpha');

    // Act
    const ordered = [named, untitled].sort(compareNoteTitles);

    // Assert
    expect(ordered.map((n) => n.id)).toEqual(['2', '1']);
  });

  it('buildSidebarFolderSections groups notes under folders and leaves root notes', () => {
    // Arrange
    const folders = [folder('f-b', 'Bravo'), folder('f-a', 'Alpha')];
    const notes = [
      note('n1', 'Zed', 'f-a'),
      note('n2', 'Able', 'f-a'),
      note('n3', 'Root', null),
      note('n4', 'In Bravo', 'f-b'),
    ];

    // Act
    const { sections, rootNotes } = buildSidebarFolderSections(notes, folders);

    // Assert
    expect(sections.map((s) => s.folder.id)).toEqual(['f-a', 'f-b']);
    expect(sections[0]?.notes.map((n) => n.id)).toEqual(['n2', 'n1']);
    expect(sections[1]?.notes.map((n) => n.id)).toEqual(['n4']);
    expect(rootNotes.map((n) => n.id)).toEqual(['n3']);
  });
});

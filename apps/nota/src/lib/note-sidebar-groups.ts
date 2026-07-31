import type { Folder, Note } from '~/types/database.types';
import { persistedDisplayTitle } from './note-title';

export function compareNoteTitles(left: Note, right: Note): number {
  return persistedDisplayTitle(left.title).localeCompare(
    persistedDisplayTitle(right.title),
    undefined,
    { sensitivity: 'base' },
  );
}

export function compareFolderNames(left: Folder, right: Folder): number {
  return left.name.localeCompare(right.name, undefined, {
    sensitivity: 'base',
  });
}

export type SidebarFolderSection = {
  folder: Folder;
  notes: Note[];
};

export function buildSidebarFolderSections(
  notes: Note[],
  folders: Folder[],
): { sections: SidebarFolderSection[]; rootNotes: Note[] } {
  const sortedFolders = [...folders].sort(compareFolderNames);
  const sections: SidebarFolderSection[] = sortedFolders.map((folder) => ({
    folder,
    notes: notes
      .filter(({ folder_id }) => folder_id === folder.id)
      .sort(compareNoteTitles),
  }));

  const rootNotes = notes
    .filter(({ folder_id }) => folder_id == null)
    .sort(compareNoteTitles);

  return { sections, rootNotes };
}

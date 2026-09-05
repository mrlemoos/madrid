import type { Folder, Note } from '@getmadrid/database-types';

/** Matches persisted title used when saving empty titles to the database. */
function persistedDisplayTitle(raw: string): string {
  const t = raw.trim();
  return t ? t : 'Untitled Note';
}

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

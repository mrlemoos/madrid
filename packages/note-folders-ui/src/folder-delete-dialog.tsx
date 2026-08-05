import { useCallback, useId, useMemo, useState, type JSX } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { NotaButton } from '@nota/design/button';
import { NOTA_DIALOG_MOTION_CLASS } from '@nota/design/popup-motion';
import { cn } from '@nota/design/utils';
import type { Folder } from '@nota/database-types';
import {
  clientDeleteAllNotesInFolderThenDeleteFolder,
  clientMoveAllNotesThenDeleteFolder,
} from './delete-folder-client';
import { useFolderTranslator } from './use-folder-translator';
import {
  folderPathLabel,
  subtreeFolderIds,
} from '@nota/note-folders-core/folder-tree';

type FolderDeleteDialogProps = {
  folder: Folder | null;
  /** Other folders (excludes `folder` when rendering move targets). */
  allFolders: Folder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  removeNoteFromList: (id: string) => void;
  removeFolderFromList: (id: string) => void;
  refreshNotesList: (options?: { silent?: boolean }) => Promise<void>;
};

export function FolderDeleteDialog({
  folder,
  allFolders,
  open,
  onOpenChange,
  removeNoteFromList,
  removeFolderFromList,
  refreshNotesList,
}: FolderDeleteDialogProps): JSX.Element {
  const titleId = useId();
  const descId = useId();
  const { t } = useFolderTranslator();
  const pathSep = t(' / ');
  const excludedIds = useMemo(() => {
    if (!folder) {
      return new Set<string>();
    }
    return new Set(subtreeFolderIds(folder.id, allFolders));
  }, [folder, allFolders]);

  const otherFolders = allFolders.filter((f) => !excludedIds.has(f.id));

  const [targetId, setTargetId] = useState<string>('');
  const [busy, setBusy] = useState<'move' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = useCallback((): void => {
    setTargetId('');
    setError(null);
    setBusy(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const onMoveThenDelete = useCallback(async (): Promise<void> => {
    if (!folder || busy) {
      return;
    }
    setBusy('move');
    setError(null);
    try {
      const dest = targetId === '' ? null : targetId;
      await clientMoveAllNotesThenDeleteFolder({
        folderId: folder.id,
        targetFolderId: dest,
        removeFolderFromList,
        refreshNotesList,
      });
      resetAndClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Something went wrong.'));
    } finally {
      setBusy(null);
    }
  }, [
    busy,
    folder,
    refreshNotesList,
    removeFolderFromList,
    resetAndClose,
    targetId,
    t,
  ]);

  const onDeleteAllThenDelete = useCallback(async (): Promise<void> => {
    if (!folder || busy) {
      return;
    }
    if (
      !window.confirm(
        t('Delete every note in this folder? This cannot be undone.'),
      )
    ) {
      return;
    }
    setBusy('delete');
    setError(null);
    try {
      await clientDeleteAllNotesInFolderThenDeleteFolder({
        folderId: folder.id,
        removeNoteFromList,
        removeFolderFromList,
        refreshNotesList,
      });
      resetAndClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Something went wrong.'));
    } finally {
      setBusy(null);
    }
  }, [
    busy,
    folder,
    refreshNotesList,
    removeFolderFromList,
    removeNoteFromList,
    resetAndClose,
    t,
  ]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Popup
          className={cn(
            'fixed top-[20%] left-1/2 z-[60] w-[min(100vw-2rem,24rem)] -translate-x-1/2 rounded-lg border border-border/60 bg-background p-4 text-foreground shadow-lg outline-none',
            NOTA_DIALOG_MOTION_CLASS,
          )}
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <Dialog.Title id={titleId} className="font-medium text-foreground">
            {folder?.name
              ? t('Delete folder "{folderName}"?', { folderName: folder.name })
              : t('Delete folder?')}
          </Dialog.Title>
          <p id={descId} className="mt-2 text-sm text-muted-foreground">
            {t(
              'Move all notes elsewhere and remove the folder, or delete every note in the folder first.',
            )}
          </p>

          <div className="mt-4 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              {t('Move all notes to')}
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
              }}
              disabled={Boolean(busy)}
            >
              <option value="" aria-label="No folder">
                {'\u200B'}
              </option>
              {otherFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {folderPathLabel(f.id, allFolders, pathSep)}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <NotaButton
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
              disabled={Boolean(busy)}
            >
              {t('Cancel')}
            </NotaButton>
            <NotaButton
              type="button"
              variant="default"
              disabled={Boolean(busy)}
              onClick={() => {
                void onMoveThenDelete();
              }}
            >
              {busy === 'move'
                ? t('Working…')
                : t('Move notes and delete folder')}
            </NotaButton>
            <NotaButton
              type="button"
              variant="destructive"
              disabled={Boolean(busy)}
              onClick={() => {
                void onDeleteAllThenDelete();
              }}
            >
              {busy === 'delete'
                ? t('Working…')
                : t('Delete all notes in folder')}
            </NotaButton>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

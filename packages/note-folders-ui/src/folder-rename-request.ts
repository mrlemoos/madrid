export const NOTA_RENAME_FOLDER_REQUEST_EVENT = 'nota:rename-folder-request';

export type RenameFolderRequestDetail = {
  folderId: string;
};

export function dispatchRenameFolderRequest(folderId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<RenameFolderRequestDetail>(
      NOTA_RENAME_FOLDER_REQUEST_EVENT,
      {
        detail: { folderId },
      },
    ),
  );
}

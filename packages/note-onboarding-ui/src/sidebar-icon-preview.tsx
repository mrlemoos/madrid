'use client';

import type { JSX } from 'react';

import { Icon } from '@getmadrid/design/icon';
import { TintCircle } from '@getmadrid/design/nota-tint-circle';
import { cn } from '@getmadrid/design/utils';
import type { createTranslator } from '@getmadrid/i18n';
import { folderTintOptionForPersisted } from '@getmadrid/note-folders-core/folder-tint-presets';
import {
  NOTA_SIDEBAR_TREE_BRANCH_CLASS,
  NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS,
  notesSidebarTreeFolderLabelClass,
  notesSidebarTreeFolderRowVariants,
  notesSidebarTreeLeafRowVariants,
  notesSidebarTreeRowVariants,
} from '@getmadrid/notes-chrome-core/sidebar-tree-styles';

export type SidebarIconPreviewProps = {
  /** Draw the file icon beside note titles. */
  showNoteIcons: boolean;
  /** Draw a tinted folder icon instead of the tint dot. */
  showFolderIcons: boolean;
  t: ReturnType<typeof createTranslator>['t'];
  className?: string;
};

/**
 * Still sample of the notes sidebar, drawn with the same row classes as the
 * real tree so the onboarding and Settings toggles show the actual result.
 *
 * ponytail: static sample, not a live sidebar. If it drifts from
 * `notes-sidebar-list.tsx`, extract a shared row component instead of
 * copying more markup here.
 */
export function SidebarIconPreview({
  showNoteIcons,
  showFolderIcons,
  t,
  className,
}: SidebarIconPreviewProps): JSX.Element {
  const tint = folderTintOptionForPersisted('blue');

  return (
    <figure
      aria-hidden
      data-slot="sidebar-icon-preview"
      className={cn('space-y-1.5', className)}
    >
      <figcaption className="text-xs text-muted-foreground">
        {t('Preview')}
      </figcaption>
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-2">
        <ul className="space-y-0.5">
          <li className="list-none">
            <div
              className={cn(
                notesSidebarTreeFolderRowVariants(),
                'px-1.5 text-muted-foreground',
              )}
              data-folder-tint={tint.id}
            >
              <span className="mr-1 inline-flex size-6 shrink-0 items-center justify-center">
                {showFolderIcons ? (
                  <Icon
                    name="folder"
                    size={14}
                    strokeWidth={1.5}
                    color={tint.swatchColour}
                    className="shrink-0"
                    data-nota-sidebar-folder-icon
                  />
                ) : (
                  <TintCircle
                    colour={tint.swatchColour}
                    sizePx={10}
                    className="border-0"
                  />
                )}
              </span>
              <span className={notesSidebarTreeFolderLabelClass}>
                {t('Field notes')}
              </span>
            </div>
            <div
              className={cn(NOTA_SIDEBAR_TREE_BRANCH_CLASS, 'min-w-0 pb-1')}
              role="group"
              data-expanded
            >
              <div className={NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS}>
                <ul>
                  <PreviewNoteRow
                    label="Barcelona"
                    nested
                    selected
                    showNoteIcons={showNoteIcons}
                  />
                </ul>
              </div>
            </div>
          </li>
          <PreviewNoteRow
            label={t('Reading list')}
            showNoteIcons={showNoteIcons}
          />
        </ul>
      </div>
    </figure>
  );
}

function PreviewNoteRow({
  label,
  nested = false,
  selected = false,
  showNoteIcons,
}: {
  label: string;
  nested?: boolean;
  selected?: boolean;
  showNoteIcons: boolean;
}): JSX.Element {
  return (
    <li className="list-none">
      <div
        className={
          nested
            ? notesSidebarTreeLeafRowVariants({ selected })
            : notesSidebarTreeRowVariants({ selected })
        }
        data-slot="sidebar-icon-preview-note"
      >
        {showNoteIcons ? (
          <Icon
            name="file-description"
            size={14}
            strokeWidth={1.5}
            data-nota-sidebar-note-icon
            className={cn(
              'shrink-0',
              selected ? 'text-foreground' : 'text-muted-foreground',
            )}
          />
        ) : null}
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm',
            selected ? 'font-semibold text-foreground' : 'font-normal',
          )}
        >
          {label}
        </span>
      </div>
    </li>
  );
}

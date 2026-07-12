import { cva } from 'class-variance-authority';

/** Branch container for nested folders and notes when a folder is expanded. */
export const NOTA_SIDEBAR_TREE_BRANCH_CLASS = 'nota-folder-branch ml-4 pl-1';

/** Inner wrapper for folder branch grid collapse (overflow clip). */
export const NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS = 'nota-folder-branch__inner';

const treeNoteRowBase =
  'group flex w-full min-w-0 cursor-pointer items-center rounded-lg py-1.5 text-left transition-colors';

const treeFolderRowBase =
  'group relative flex w-full min-w-0 cursor-pointer items-center rounded-md py-1 text-left transition-colors before:absolute before:inset-y-0 before:left-0 before:-z-10 before:h-7 before:w-full before:rounded-md before:bg-accent/70 before:opacity-0 before:transition-opacity hover:before:opacity-100';

/**
 * Note row highlight :  selected state only (no hover background).
 */
export const notesSidebarTreeRowVariants = cva(treeNoteRowBase, {
  variants: {
    selected: {
      true: 'bg-muted/20',
      false: '',
    },
    dragOver: {
      true: 'bg-primary/15 text-primary-foreground',
      false: '',
    },
  },
  defaultVariants: {
    selected: false,
    dragOver: false,
  },
});

/** Folder row :  slimmer than note rows. */
export const notesSidebarTreeFolderRowVariants = cva(treeFolderRowBase, {
  variants: {
    dragOver: {
      true: 'text-primary-foreground before:bg-primary/20 before:opacity-100',
      false: '',
    },
  },
  defaultVariants: {
    dragOver: false,
  },
});

/** Folder / tree-node trigger row (chevron + label). */
export const notesSidebarTreeFolderTriggerClass =
  'flex w-full min-w-0 items-center justify-start gap-1 border-0 bg-transparent p-0 text-left text-inherit outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

/** Folder name label inside the trigger. */
export const notesSidebarTreeFolderLabelClass =
  'block min-w-0 flex-1 truncate text-left text-sm leading-tight';

/** Chevron on folder rows :  rotates when expanded. */
export const notesSidebarTreeChevronClass =
  'mr-0.5 size-3.5 shrink-0 text-muted-foreground/50 motion-safe:transition-transform motion-safe:duration-[180ms] motion-safe:ease-out';

/** Note leaf row inside a folder branch. */
export const notesSidebarTreeLeafRowVariants = cva(
  `${treeNoteRowBase} ml-5 gap-0`,
  {
    variants: {
      selected: {
        true: 'bg-muted/20',
        false: '',
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

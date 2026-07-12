import { describe, expect, it } from 'vitest';
import {
  NOTA_SIDEBAR_TREE_BRANCH_CLASS,
  NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS,
  notesSidebarTreeChevronClass,
  notesSidebarTreeFolderRowVariants,
  notesSidebarTreeLeafRowVariants,
  notesSidebarTreeRowVariants,
} from './notes-sidebar-tree-styles';

describe('notes-sidebar-tree-styles', () => {
  it('exposes branch indentation without a left border guide', () => {
    // Arrange
    // Act
    const branch = NOTA_SIDEBAR_TREE_BRANCH_CLASS;

    // Assert
    expect(branch).not.toContain('border-l');
    expect(branch).toContain('ml-4');
    expect(branch).toContain('pl-1');
    expect(branch).toContain('nota-folder-branch');
  });

  it('exports folder branch motion class tokens', () => {
    // Arrange
    // Act
    const inner = NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS;
    const chevron = notesSidebarTreeChevronClass;

    // Assert
    expect(inner).toBe('nota-folder-branch__inner');
    expect(chevron).toContain('ease-out');
    expect(chevron).toContain('duration-[180ms]');
  });

  it('does not apply hover background on note rows', () => {
    // Arrange
    // Act
    const noteRow = notesSidebarTreeRowVariants();

    // Assert
    expect(noteRow).not.toContain('hover:before:opacity-100');
  });

  it('applies a subtle full-row background when a note row is selected', () => {
    // Arrange
    // Act
    const selected = notesSidebarTreeRowVariants({
      selected: true,
      dragOver: false,
    });
    const dragOver = notesSidebarTreeRowVariants({
      selected: false,
      dragOver: true,
    });

    // Assert
    expect(selected).toContain('bg-muted/20');
    expect(selected).not.toContain('before:');
    expect(dragOver).toContain('bg-primary/15');
  });

  it('uses a slimmer row height for folder rows than note rows', () => {
    // Arrange
    // Act
    const folderRow = notesSidebarTreeFolderRowVariants();
    const noteRow = notesSidebarTreeRowVariants();

    // Assert
    expect(folderRow).toContain('py-1');
    expect(folderRow).toContain('before:h-7');
    expect(noteRow).toContain('py-1.5');
    expect(noteRow).not.toContain('before:h-8');
  });

  it('indents leaf rows for notes under a folder branch', () => {
    // Arrange
    // Act
    const leaf = notesSidebarTreeLeafRowVariants({ selected: true });

    // Assert
    expect(leaf).toContain('ml-5');
    expect(leaf).toContain('bg-muted/20');
  });

  it('scopes folder row transitions to colour only, not transition-all', () => {
    // Arrange
    // Act
    const folderRow = notesSidebarTreeFolderRowVariants();
    const noteRow = notesSidebarTreeRowVariants();

    // Assert
    expect(folderRow).not.toContain('transition-all');
    expect(folderRow).toContain('transition-colors');
    expect(folderRow).toContain('before:transition-opacity');
    expect(noteRow).toContain('transition-colors');
  });

  it('gates folder chevron transform transition behind motion-safe', () => {
    // Arrange
    // Act
    const chevron = notesSidebarTreeChevronClass;
    const tokens = chevron.split(/\s+/);

    // Assert
    expect(chevron).toContain('motion-safe:transition-transform');
    expect(chevron).toContain('motion-safe:duration-[180ms]');
    expect(tokens).not.toContain('transition-transform');
    expect(tokens).not.toContain('duration-[180ms]');
  });
});

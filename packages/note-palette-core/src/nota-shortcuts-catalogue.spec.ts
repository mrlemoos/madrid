import { describe, expect, it } from 'vitest';
import {
  filterShortcutCatalogSections,
  NOTA_SHORTCUT_SECTIONS,
  type ShortcutCatalogSection,
} from './nota-shortcuts-catalogue.js';

describe('filterShortcutCatalogSections', () => {
  it('keeps every row when today’s note rows are included', () => {
    // Arrange
    const sections: ShortcutCatalogSection[] = [
      {
        id: 's',
        title: 'Section',
        rows: [
          { description: 'always', keysApple: 'A', keysOther: 'A' },
          {
            description: 'today',
            keysApple: 'D',
            keysOther: 'D',
            requiresTodaysNotePreference: true,
          },
        ],
      },
    ];

    // Act
    const out = filterShortcutCatalogSections(sections, true);

    // Assert
    expect(out[0].rows.map((r) => r.description)).toEqual(['always', 'today']);
  });

  it('drops today’s-note rows when they are not enabled', () => {
    // Arrange
    const sections: ShortcutCatalogSection[] = [
      {
        id: 's',
        title: 'Section',
        rows: [
          { description: 'always', keysApple: 'A', keysOther: 'A' },
          {
            description: 'today',
            keysApple: 'D',
            keysOther: 'D',
            requiresTodaysNotePreference: true,
          },
        ],
      },
    ];

    // Act
    const out = filterShortcutCatalogSections(sections, false);

    // Assert
    expect(out[0].rows.map((r) => r.description)).toEqual(['always']);
  });

  it('does not mutate the source sections', () => {
    // Arrange
    const sections: ShortcutCatalogSection[] = [
      {
        id: 's',
        title: 'Section',
        rows: [
          {
            description: 'today',
            keysApple: 'D',
            keysOther: 'D',
            requiresTodaysNotePreference: true,
          },
        ],
      },
    ];

    // Act
    filterShortcutCatalogSections(sections, false);

    // Assert
    expect(sections[0].rows).toHaveLength(1);
  });

  it('drops the today’s-note rows from the real catalogue when disabled', () => {
    // Act
    const withPref = filterShortcutCatalogSections(
      NOTA_SHORTCUT_SECTIONS,
      true,
    );
    const withoutPref = filterShortcutCatalogSections(
      NOTA_SHORTCUT_SECTIONS,
      false,
    );

    // Assert
    const countRows = (sections: ShortcutCatalogSection[]): number =>
      sections.reduce((total, section) => total + section.rows.length, 0);
    expect(countRows(withoutPref)).toBeLessThan(countRows(withPref));
  });
});

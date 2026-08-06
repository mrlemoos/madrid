import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function loadNoteDetailPanelSource(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(resolve(thisDir, 'note-detail-panel.tsx'), 'utf8');
}

function loadStylesCss(): string {
  // Regression guard only: `styles.css` is the app's global stylesheet, not a
  // package dependency — this test reads it via `node:fs`, it is never imported.
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(
    resolve(thisDir, '../../../apps/nota/styles.css'),
    'utf8',
  );
}

describe('NoteDetailPanel note switch', () => {
  it('does not remount NoteEditor with a note-open fade class', () => {
    // Arrange
    const source = loadNoteDetailPanelSource();

    // Act
    const usesNoteOpenFade = source.includes('nota-note-open-fade');
    const remountsOnNoteId = /key=\{displayNote\.id\}/.test(source);

    // Assert
    expect(usesNoteOpenFade).toBe(false);
    expect(remountsOnNoteId).toBe(false);
  });

  it('does not define note-open fade keyframes in styles.css', () => {
    // Arrange
    const stylesCss = loadStylesCss();

    // Act
    const definesNoteOpenFade = stylesCss.includes('nota-note-open-fade');

    // Assert
    expect(definesNoteOpenFade).toBe(false);
  });

  it('resolves banner signed URL from cache during render', () => {
    // Arrange
    const source = loadNoteDetailPanelSource();

    // Act
    const derivesCachedBannerUrl = source.includes('cachedBannerSignedUrl');
    const usesAsyncOnlyBannerState =
      /const \[bannerSignedUrl, setBannerSignedUrl\] = useState/.test(source);

    // Assert
    expect(derivesCachedBannerUrl).toBe(true);
    expect(usesAsyncOnlyBannerState).toBe(false);
  });
});

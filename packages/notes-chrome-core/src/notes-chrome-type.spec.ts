import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NOTA_CHROME_CONTROL_COMPACT_CLASS,
  NOTA_SECTION_HEAD_CLASS,
  NOTA_TRACKING_CHROME_XS_CLASS,
  NOTA_TRACKING_DISPLAY_CLASS,
} from './notes-chrome-type';

describe('notes-chrome-type', () => {
  it('exports display tracking as a negative letter-spacing token class', () => {
    // Arrange
    const stylesPath = resolve(__dirname, '../../../apps/nota/styles.css');
    const styles = readFileSync(stylesPath, 'utf8');

    // Act
    const displayClass = NOTA_TRACKING_DISPLAY_CLASS;

    // Assert
    expect(displayClass).toBe('nota-tracking-display');
    expect(styles).toMatch(/--nota-tracking-display:\s*-0\.025em/);
    expect(styles).toContain(`.${displayClass}`);
    expect(styles).toMatch(
      new RegExp(
        `\\.${displayClass}[^{]*\\{[^}]*letter-spacing:\\s*var\\(--nota-tracking-display\\)`,
      ),
    );
  });

  it('exports chrome text-xs tracking near zero with slight positive bias', () => {
    // Arrange
    const stylesPath = resolve(__dirname, '../../../apps/nota/styles.css');
    const styles = readFileSync(stylesPath, 'utf8');

    // Act
    const chromeXsClass = NOTA_TRACKING_CHROME_XS_CLASS;

    // Assert
    expect(chromeXsClass).toBe('nota-tracking-chrome-xs');
    expect(styles).toMatch(/--nota-tracking-chrome-xs:\s*0\.01em/);
    expect(styles).toContain(`.${chromeXsClass}`);
    expect(styles).toMatch(
      new RegExp(
        `\\.${chromeXsClass}[^{]*\\{[^}]*letter-spacing:\\s*var\\(--nota-tracking-chrome-xs\\)`,
      ),
    );
  });

  it('keeps Instrument Serif on brand section heads with display tracking', () => {
    // Arrange
    // Act
    const sectionHead = NOTA_SECTION_HEAD_CLASS;

    // Assert
    expect(sectionHead).toContain('font-serif');
    expect(sectionHead).toContain(NOTA_TRACKING_DISPLAY_CLASS);
    expect(sectionHead).not.toContain('font-sans');
  });

  it('exposes a compact chrome control size under touch-hostile icon-lg', () => {
    // Arrange
    // Act
    const compact = NOTA_CHROME_CONTROL_COMPACT_CLASS;

    // Assert
    expect(compact).toBe('size-7');
    expect(compact).not.toBe('size-8');
  });
});

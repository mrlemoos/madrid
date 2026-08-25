import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  NOTA_CMDK_ITEM_CLASS,
  NOTA_PRESS_IN_MS,
  NOTA_PRESS_OUT_MS,
  NOTA_PRESS_SCALE,
  NOTA_PRESSABLE_CLASS,
  NOTA_SAVE_PULSE_CLASS,
  NOTA_CHROME_NAV_ITEM_CLASS,
  NOTA_SIDEBAR_ROW_CLASS,
} from '@nota/nota-motion-ui/interaction';

const stylesCss = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../styles.css'),
  'utf8',
);

const folderCreateDialog = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../packages/note-folders-ui/src/folder-create-dialog.tsx',
  ),
  'utf8',
);

const folderDeleteDialog = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../packages/note-folders-ui/src/folder-delete-dialog.tsx',
  ),
  'utf8',
);

const commandPalette = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../packages/note-palette-ui/src/command-palette.tsx',
  ),
  'utf8',
);

// Arrange: exported class tokens and styles.css hooks
// Act + Assert: micro-interactions stay discoverable and respect reduced motion
describe('nota-interaction', () => {
  it('exports stable class names for chrome micro-interactions', () => {
    expect(NOTA_PRESSABLE_CLASS).toBe('nota-pressable');
    expect(NOTA_CHROME_NAV_ITEM_CLASS).toBe('nota-chrome-nav-item');
    expect(NOTA_SIDEBAR_ROW_CLASS).toBe('nota-sidebar-row');
    expect(NOTA_SAVE_PULSE_CLASS).toBe('nota-save-pulse');
    expect(NOTA_CMDK_ITEM_CLASS).toBe('nota-cmdk-item');
  });

  it('exports asymmetric press timing constants (press-in faster than release)', () => {
    // Arrange|Act|Assert
    expect(NOTA_PRESS_IN_MS).toBe(100);
    expect(NOTA_PRESS_OUT_MS).toBe(160);
    expect(NOTA_PRESS_SCALE).toBe(0.97);
    expect(NOTA_PRESS_IN_MS).toBeLessThan(NOTA_PRESS_OUT_MS);
  });

  it('defines asymmetric press-only feedback and reduced-motion guards in styles.css', () => {
    for (const className of [
      NOTA_PRESSABLE_CLASS,
      NOTA_CHROME_NAV_ITEM_CLASS,
      NOTA_SIDEBAR_ROW_CLASS,
      NOTA_SAVE_PULSE_CLASS,
      NOTA_CMDK_ITEM_CLASS,
    ]) {
      expect(stylesCss).toContain(`.${className}`);
    }

    // Arrange — extract .nota-pressable block before lightbox / other sections
    const pressableBlock = stylesCss.match(
      /\.nota-pressable\s*\{[^}]+\}[\s\S]*?@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\.nota-pressable:active\s*\{[^}]+\}/,
    )?.[0];

    // Assert — CSS uses P0 tokens; values stay asymmetric (press-in < release)
    expect(pressableBlock).toBeDefined();
    expect(pressableBlock).toContain(
      'transition-duration: var(--nota-press-out-ms)',
    );
    expect(pressableBlock).toContain(
      'transform: scale(var(--nota-press-scale))',
    );
    expect(pressableBlock).toContain(
      'transition-duration: var(--nota-press-in-ms)',
    );
    expect(stylesCss).toMatch(
      new RegExp(
        `\\.${NOTA_SIDEBAR_ROW_CLASS}:active[\\s\\S]*opacity:\\s*0\\.88`,
      ),
    );
    expect(stylesCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(stylesCss).toMatch(
      new RegExp(
        `\\.${NOTA_SAVE_PULSE_CLASS}[\\s\\S]*@media \\(prefers-reduced-motion: reduce\\)`,
      ),
    );
  });

  it('gives folder dialogs pointer enter motion while keeping palette Mod+K instant', () => {
    // Arrange|Act|Assert
    expect(folderCreateDialog).toContain('NOTA_DIALOG_MOTION_CLASS');
    expect(folderDeleteDialog).toContain('NOTA_DIALOG_MOTION_CLASS');
    expect(commandPalette).not.toContain('NOTA_DIALOG_MOTION_CLASS');
    expect(commandPalette).not.toContain('data-[starting-style]:scale-95');
  });
});

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { NOTA_SAVE_PULSE_CLASS } from '@nota/nota-motion-ui/interaction';

const stylesCss = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../styles.css'),
  'utf8',
);

describe('nota save status fade', () => {
  it('keeps the stable class token for the saving indicator', () => {
    // Arrange|Act|Assert
    expect(NOTA_SAVE_PULSE_CLASS).toBe('nota-save-pulse');
  });

  it('uses a quiet one-shot status fade, not an infinite pulse', () => {
    // Arrange — first `.nota-save-pulse` rule (mount fade), not the reduced-motion override
    const saveRule = stylesCss.match(
      new RegExp(`\\.${NOTA_SAVE_PULSE_CLASS}\\s*\\{[^}]+\\}`),
    )?.[0];

    // Assert — short ease-out fade; no looping keyframes
    expect(saveRule).toBeDefined();
    expect(saveRule).toMatch(/animation:\s*nota-save-status-fade\s+1[56]0ms/);
    expect(saveRule).toMatch(/var\(--ease-out\)/);
    expect(saveRule).not.toMatch(/infinite/);

    expect(stylesCss).toMatch(
      /@keyframes\s+nota-save-status-fade\s*\{[\s\S]*?from[\s\S]*?opacity:\s*0/,
    );
    expect(stylesCss).toMatch(
      new RegExp(
        `@media\\s*\\(prefers-reduced-motion:\\s*reduce\\)[\\s\\S]*\\.${NOTA_SAVE_PULSE_CLASS}\\s*\\{[\\s\\S]*animation:\\s*none`,
      ),
    );
  });
});

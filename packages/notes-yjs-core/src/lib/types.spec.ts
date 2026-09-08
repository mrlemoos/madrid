import { describe, expect, it } from 'vitest';

import { NOTA_YDOC_FIELD } from './types';

describe('NOTA_YDOC_FIELD', () => {
  it("pins TipTap's field name, not Yjs' own default", () => {
    // Arrange|Act|Assert — changing this unbinds every stored document
    expect(NOTA_YDOC_FIELD).toBe('default');
    expect(NOTA_YDOC_FIELD).not.toBe('prosemirror');
  });
});

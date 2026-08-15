import { describe, expect, it } from 'vitest';

import { attachmentUrl } from './shared-note-body';

describe('attachmentUrl', () => {
  it('scopes the attachment to the share token', () => {
    // Arrange
    const token = 'abc123';
    const attachmentId = 'att-1';

    // Act
    const url = attachmentUrl(token, attachmentId);

    // Assert
    expect(url).toBe('/s/abc123/attachment/att-1');
  });

  it('encodes both segments so neither can escape the path', () => {
    // Arrange
    const token = '../other';
    const attachmentId = 'a/b';

    // Act
    const url = attachmentUrl(token, attachmentId);

    // Assert
    expect(url).toBe('/s/..%2Fother/attachment/a%2Fb');
  });
});

import { describe, expect, it } from 'vitest';

import { ATTACHMENT_SIGNED_URL_TTL_SEC } from './attachment-signed-url-ttl';

describe('ATTACHMENT_SIGNED_URL_TTL_SEC', () => {
  it('is one hour, expressed in seconds for the Supabase signer', () => {
    // Arrange|Act|Assert
    expect(ATTACHMENT_SIGNED_URL_TTL_SEC).toBe(60 * 60);
  });
});

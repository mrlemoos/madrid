import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearOgPreviewCache,
  fetchOgPreviewForEditor,
} from './og-preview-client';

const { grabCall } = vi.hoisted(() => ({ grabCall: vi.fn() }));

vi.mock('@getmadrid/data-source/app-api-grab', () => ({
  appApiGrab: () => grabCall,
}));

vi.mock('@getmadrid/data-source/grab-error', () => ({
  grabErrorBody: (error: unknown) => error,
}));

const preview = {
  url: 'https://example.com/',
  title: 'Example',
  description: null,
  image: null,
  platform: null,
};

describe('fetchOgPreviewForEditor de-duplication', () => {
  beforeEach(() => {
    // Arrange
    clearOgPreviewCache();
    grabCall.mockReset();
  });

  it('issues one request when the same href is requested repeatedly', async () => {
    // Arrange
    grabCall.mockResolvedValue([preview, undefined]);

    // Act: concurrent callers join the in-flight request, later callers reuse it.
    const concurrent = await Promise.all([
      fetchOgPreviewForEditor('https://example.com/'),
      fetchOgPreviewForEditor('https://example.com/'),
      fetchOgPreviewForEditor('https://example.com/'),
    ]);
    const afterSettled = await fetchOgPreviewForEditor('https://example.com/');

    // Assert
    expect(grabCall).toHaveBeenCalledTimes(1);
    expect(concurrent).toEqual([preview, preview, preview]);
    expect(afterSettled).toEqual(preview);
  });

  it('re-requests for a different href, on force, and after a failure', async () => {
    // Arrange
    grabCall.mockResolvedValue([preview, undefined]);

    // Act
    await fetchOgPreviewForEditor('https://example.com/');
    await fetchOgPreviewForEditor('https://other.example/');
    await fetchOgPreviewForEditor('https://example.com/', { force: true });

    grabCall.mockResolvedValue([undefined, { error: 'Could not fetch' }]);
    const failed = fetchOgPreviewForEditor('https://fails.example/');
    await expect(failed).rejects.toThrow('Could not fetch');
    await expect(
      fetchOgPreviewForEditor('https://fails.example/'),
    ).rejects.toThrow('Could not fetch');

    // Assert: 3 successes (two hrefs + one forced refresh) and 2 un-cached failures.
    expect(grabCall).toHaveBeenCalledTimes(5);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const notaServerExposeErrorDetails = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('./nota-server-error-detail.server', () => ({
  notaServerExposeErrorDetails,
}));

const { isSemanticConfigurationError, semanticJsonError } = await import(
  './semantic-http'
);

beforeEach(() => {
  vi.clearAllMocks();
  notaServerExposeErrorDetails.mockReturnValue(false);
});

describe('isSemanticConfigurationError', () => {
  it('recognises every missing-configuration message', () => {
    // Arrange
    const messages = [
      'set SUPABASE_URL for server-side access',
      'missing SUPABASE_SECRET_KEY',
      'deprecated SUPABASE_SERVICE_ROLE_KEY not set',
      'NOTA_SEMANTIC_EMBEDDINGS_API_KEY is required',
    ];

    // Act|Assert
    for (const message of messages) {
      expect(isSemanticConfigurationError(message)).toBe(true);
    }
  });

  it('does not mistake a runtime failure for a misconfiguration', () => {
    // Arrange|Act|Assert
    expect(isSemanticConfigurationError('rate limited')).toBe(false);
  });
});

describe('semanticJsonError', () => {
  it('withholds the detail by default', async () => {
    // Arrange|Act
    const response = semanticJsonError(
      { error: 'Search failed' },
      'SUPABASE_URL missing',
      500,
    );

    // Assert — the detail can name environment variables
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Search failed' });
  });

  it('attaches the detail when debug details are turned on', async () => {
    // Arrange
    notaServerExposeErrorDetails.mockReturnValue(true);

    // Act
    const response = semanticJsonError(
      { error: 'Search failed' },
      'SUPABASE_URL missing',
      500,
    );

    // Assert
    await expect(response.json()).resolves.toEqual({
      error: 'Search failed',
      detail: 'SUPABASE_URL missing',
    });
  });

  it('sends the base body when there is no detail to add', async () => {
    // Arrange
    notaServerExposeErrorDetails.mockReturnValue(true);

    // Act
    const response = semanticJsonError(
      { error: 'Search failed' },
      undefined,
      400,
    );

    // Assert
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Search failed' });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const grab = vi.fn();
const grabkit = vi.fn(() => grab);

vi.mock('grabkit', () => ({ default: grabkit }));

const ENV_KEYS = [
  'NOTA_SEMANTIC_EMBEDDINGS_API_KEY',
  'NOTA_SEMANTIC_EMBEDDINGS_API_BASE',
  'NOTA_SEMANTIC_EMBEDDINGS_MODEL',
  'NOTA_SEMANTIC_EMBEDDINGS_DIMENSIONS',
] as const;

/** Fresh module per test: the grabkit callable is cached in module scope. */
async function loadModule() {
  vi.resetModules();
  grabkit.mockClear();
  grab.mockReset();
  return import('./semantic-embeddings.server');
}

function vector(length = 1536, fill = 0.5): number[] {
  return Array.from({ length }, () => fill);
}

beforeEach(() => {
  process.env.NOTA_SEMANTIC_EMBEDDINGS_API_KEY = 'sk-embed';
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe('embeddingModel', () => {
  it('defaults to the small OpenAI model', async () => {
    // Arrange
    const { embeddingModel } = await loadModule();

    // Act|Assert
    expect(embeddingModel()).toBe('text-embedding-3-small');
  });

  it('takes the configured model', async () => {
    // Arrange
    process.env.NOTA_SEMANTIC_EMBEDDINGS_MODEL = '  voyage-3  ';
    const { embeddingModel } = await loadModule();

    // Act|Assert
    expect(embeddingModel()).toBe('voyage-3');
  });
});

describe('embeddingDimensionsExpected', () => {
  it('defaults to the migration’s vector width', async () => {
    // Arrange
    const { embeddingDimensionsExpected } = await loadModule();

    // Act|Assert
    expect(embeddingDimensionsExpected()).toBe(1536);
  });

  it('takes the configured width', async () => {
    // Arrange
    process.env.NOTA_SEMANTIC_EMBEDDINGS_DIMENSIONS = '1024';
    const { embeddingDimensionsExpected } = await loadModule();

    // Act|Assert
    expect(embeddingDimensionsExpected()).toBe(1024);
  });

  it('rejects a width that cannot be stored', async () => {
    // Arrange
    const { embeddingDimensionsExpected } = await loadModule();

    // Act|Assert
    for (const raw of ['0', '-1', 'wide']) {
      process.env.NOTA_SEMANTIC_EMBEDDINGS_DIMENSIONS = raw;
      expect(() => embeddingDimensionsExpected()).toThrow(
        /must be a positive integer/,
      );
    }
  });
});

describe('embedTextsForSemanticSearch', () => {
  it('does not call the upstream for an empty batch', async () => {
    // Arrange
    const { embedTextsForSemanticSearch } = await loadModule();

    // Act|Assert
    await expect(embedTextsForSemanticSearch([])).resolves.toEqual([]);
    expect(grab).not.toHaveBeenCalled();
  });

  it('posts the batch to an OpenAI-compatible endpoint with the bearer key', async () => {
    // Arrange
    const { embedTextsForSemanticSearch } = await loadModule();
    grab.mockResolvedValue([
      { data: [{ embedding: vector(), index: 0 }] },
      null,
    ]);

    // Act
    await embedTextsForSemanticSearch(['a note']);

    // Assert
    expect(grabkit).toHaveBeenCalledWith('https://api.openai.com/v1', {
      format: 'json',
    });
    expect(grab).toHaveBeenCalledWith('POST /embeddings', {
      body: { model: 'text-embedding-3-small', input: ['a note'] },
      headers: { Authorization: 'Bearer sk-embed' },
    });
  });

  it('reads the base URL at runtime and drops its trailing slash', async () => {
    // Arrange
    process.env.NOTA_SEMANTIC_EMBEDDINGS_API_BASE =
      'https://api.voyageai.com/v1/';
    const { embedTextsForSemanticSearch } = await loadModule();
    grab.mockResolvedValue([
      { data: [{ embedding: vector(), index: 0 }] },
      null,
    ]);

    // Act
    await embedTextsForSemanticSearch(['a note']);

    // Assert
    expect(grabkit).toHaveBeenCalledWith('https://api.voyageai.com/v1', {
      format: 'json',
    });
  });

  it('returns the vectors in the order the inputs were given', async () => {
    // Arrange
    const { embedTextsForSemanticSearch } = await loadModule();
    grab.mockResolvedValue([
      {
        data: [
          { embedding: vector(1536, 0.2), index: 1 },
          { embedding: vector(1536, 0.1), index: 0 },
        ],
      },
      null,
    ]);

    // Act
    const vectors = await embedTextsForSemanticSearch(['first', 'second']);

    // Assert — an out-of-order upstream would attach vectors to the wrong notes
    expect(vectors[0]?.[0]).toBe(0.1);
    expect(vectors[1]?.[0]).toBe(0.2);
  });

  it('refuses a vector that does not fit the stored column', async () => {
    // Arrange
    const { embedTextsForSemanticSearch } = await loadModule();
    grab.mockResolvedValue([
      { data: [{ embedding: vector(768), index: 0 }] },
      null,
    ]);

    // Act|Assert
    await expect(embedTextsForSemanticSearch(['a note'])).rejects.toThrow(
      /does not match NOTA_SEMANTIC_EMBEDDINGS_DIMENSIONS=1536/,
    );
  });

  it('names the missing key rather than calling the upstream unauthenticated', async () => {
    // Arrange
    delete process.env.NOTA_SEMANTIC_EMBEDDINGS_API_KEY;
    const { embedTextsForSemanticSearch } = await loadModule();

    // Act|Assert
    await expect(embedTextsForSemanticSearch(['a note'])).rejects.toThrow(
      /NOTA_SEMANTIC_EMBEDDINGS_API_KEY/,
    );
    expect(grab).not.toHaveBeenCalled();
  });

  it('reports the upstream status and body on failure', async () => {
    // Arrange
    const { embedTextsForSemanticSearch } = await loadModule();
    grab.mockResolvedValue([
      {},
      {
        name: 'GrabkitError',
        statusCode: 429,
        body: { error: 'rate limited' },
        message: 'Too Many Requests',
      },
    ]);

    // Act|Assert
    await expect(embedTextsForSemanticSearch(['a note'])).rejects.toThrow(
      'semantic embeddings failed: 429 {"error":"rate limited"}',
    );
  });
});

describe('embedTextForSemanticSearch', () => {
  it('returns the single vector for one text', async () => {
    // Arrange
    const { embedTextForSemanticSearch } = await loadModule();
    grab.mockResolvedValue([
      { data: [{ embedding: vector(), index: 0 }] },
      null,
    ]);

    // Act
    const embedded = await embedTextForSemanticSearch('a note');

    // Assert
    expect(embedded).toHaveLength(1536);
  });

  it('fails rather than returning an empty vector', async () => {
    // Arrange
    const { embedTextForSemanticSearch } = await loadModule();
    grab.mockResolvedValue([{ data: [] }, null]);

    // Act|Assert
    await expect(embedTextForSemanticSearch('a note')).rejects.toThrow(
      'nota-server: empty embedding response',
    );
  });
});

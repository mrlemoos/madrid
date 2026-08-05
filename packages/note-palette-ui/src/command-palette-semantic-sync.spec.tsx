import { render } from '@testing-library/react';
import { Command } from 'cmdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommandPaletteSemanticSync } from './command-palette-semantic-sync';

/** Debounce in `command-palette-semantic-sync.tsx`. */
const DEBOUNCE_MS = 320;

function renderSync(onIds: (ids: string[] | null) => void): void {
  render(
    <Command>
      <Command.Input value="hello" onValueChange={() => undefined} />
      <CommandPaletteSemanticSync
        enabled
        onSemanticOrderedIds={onIds}
        onLoadingChange={() => undefined}
      />
    </Command>,
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('CommandPaletteSemanticSync', () => {
  it('posts the query as JSON to the same-origin semantic search route', async () => {
    // Arrange
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [{ noteId: 'note-1' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const onIds = vi.fn();

    // Act
    vi.useFakeTimers();
    renderSync(onIds);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 1);
    vi.useRealTimers();
    await vi.waitFor(() => {
      expect(onIds).toHaveBeenCalledWith(['note-1']);
    });

    // Assert
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${window.location.origin}/api/semantic-search`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ query: 'hello' }));
    expect(new Headers(init.headers).get('Content-Type')).toBe(
      'application/json',
    );
  });

  it('clears the ordering when the route returns an HTTP error', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
        }),
      ),
    );
    const onIds = vi.fn();

    // Act
    vi.useFakeTimers();
    renderSync(onIds);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 1);
    vi.useRealTimers();

    // Assert
    await vi.waitFor(() => {
      expect(onIds).toHaveBeenCalledWith(null);
    });
  });
});

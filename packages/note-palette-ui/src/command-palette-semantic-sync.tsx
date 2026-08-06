import { useCommandState } from 'cmdk';
import { useEffect, useRef, useState } from 'react';
import grabkit from 'grabkit';

/**
 * Built lazily: grabkit rejects a relative URI unless a `baseURL` is set, and reading
 * `window.location.origin` at module scope would break the server render of this
 * client component. `format: 'json'` because the app API is plain JSON, not JSON:API
 * (the default mode would demand a `type` field on the request body).
 */
let grab: ReturnType<typeof grabkit> | null = null;

function semanticSearch(): ReturnType<typeof grabkit> {
  grab ??= grabkit(window.location.origin, { format: 'json' });
  return grab;
}

const DEBOUNCE_MS = 320;

type SemanticSearchJson = {
  results?: Array<{ noteId: string }>;
};

/**
 * Must render under `cmdk` `Command`. Debounces palette input and updates semantic note ordering.
 */
export function CommandPaletteSemanticSync(options: {
  enabled: boolean;
  onSemanticOrderedIds: (ids: string[] | null) => void;
  onLoadingChange: (loading: boolean) => void;
}): null {
  const { enabled, onSemanticOrderedIds, onLoadingChange } = options;
  const search = useCommandState((s) => s.search);
  const [debounced, setDebounced] = useState('');
  const cancelledRef = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(search);
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [search]);

  useEffect(() => {
    if (!enabled) {
      onSemanticOrderedIds(null);
      onLoadingChange(false);
      return;
    }

    const q = debounced.trim();
    if (q.length === 0) {
      onSemanticOrderedIds(null);
      onLoadingChange(false);
      return;
    }

    cancelledRef.current = false;
    onLoadingChange(true);

    void (async () => {
      try {
        const [json, error] = await semanticSearch()<
          SemanticSearchJson,
          { query: string }
        >('POST /api/semantic-search', { body: { query: debounced } });
        if (cancelledRef.current) {
          return;
        }
        // grabkit returns HTTP and transport failures in the tuple rather than throwing.
        if (error) {
          onSemanticOrderedIds(null);
          return;
        }
        const ids =
          json.results?.map(({ noteId }) => noteId).filter(Boolean) ?? [];
        onSemanticOrderedIds(ids);
      } catch {
        if (!cancelledRef.current) {
          onSemanticOrderedIds(null);
        }
      } finally {
        if (!cancelledRef.current) {
          onLoadingChange(false);
        }
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [debounced, enabled, onLoadingChange, onSemanticOrderedIds]);

  return null;
}

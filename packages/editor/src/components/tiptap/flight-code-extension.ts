import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';
import { findFlightCodes } from '../../lib/flight-code';

export type FlightCodeHandlers = {
  onHover: (code: string, anchor: HTMLElement) => void;
  onHoverEnd: () => void;
  onOpen: (code: string) => void;
};

/** Stable ref the host component swaps callbacks into without re-creating the extension. */
export type FlightCodeHandlersRef = { current: FlightCodeHandlers | null };

export type FlightCodeOptions = {
  handlersRef: FlightCodeHandlersRef | null;
};

const flightCodeKey = new PluginKey('flightCode');

function buildDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    for (const m of findFlightCodes(node.text)) {
      decorations.push(
        Decoration.inline(pos + m.start, pos + m.end, {
          class: 'nota-flight-code',
          'data-flight-code': m.code,
        }),
      );
    }
  });
  return DecorationSet.create(doc, decorations);
}

function flightCodeElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest<HTMLElement>('[data-flight-code]');
}

/**
 * Decorates flight codes (known IATA airline + number) inline and wires hover /
 * click to the host's handlers. Passive: never mutates the document. Runs in the
 * read-only editor too, so the shared `/s/` page gets it for free.
 */
export const FlightCode = Extension.create<FlightCodeOptions>({
  name: 'flightCode',

  addOptions() {
    return { handlersRef: null };
  },

  addProseMirrorPlugins() {
    const getHandlers = (): FlightCodeHandlers | null =>
      this.options.handlersRef?.current ?? null;

    return [
      new Plugin({
        key: flightCodeKey,
        state: {
          init: (_config, state) => buildDecorations(state.doc),
          apply: (tr, old) => (tr.docChanged ? buildDecorations(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return flightCodeKey.getState(state);
          },
          handleDOMEvents: {
            mouseover: (_view, event) => {
              const el = flightCodeElement(event.target);
              if (!el) return false;
              const code = el.dataset['flightCode'];
              if (code) {
                getHandlers()?.onHover(code, el);
              }
              return false;
            },
            mouseout: (_view, event) => {
              const el = flightCodeElement(event.target);
              if (!el) return false;
              // Ignore moves that stay inside the same decorated span.
              const to = flightCodeElement(event.relatedTarget);
              if (to === el) return false;
              getHandlers()?.onHoverEnd();
              return false;
            },
            click: (_view, event) => {
              const el = flightCodeElement(event.target);
              if (!el) return false;
              const code = el.dataset['flightCode'];
              if (code) getHandlers()?.onOpen(code);
              return false;
            },
          },
        },
      }),
    ];
  },
});

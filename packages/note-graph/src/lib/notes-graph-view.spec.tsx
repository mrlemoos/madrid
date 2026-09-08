import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';

/**
 * React Flow needs a measured container, which jsdom will not give it. Render
 * the nodes and edges plainly so the mapping this component owns stays visible.
 */
const flowProps = { current: null as Record<string, unknown> | null };
vi.mock('@xyflow/react', () => {
  const passthrough = ({ children }: { children?: unknown }) => children;
  return {
    ReactFlow: (props: Record<string, unknown>) => {
      flowProps.current = props;
      const nodes = props.nodes as { id: string; data: { label: string } }[];
      return (
        <div
          data-testid="flow"
          data-edges={String((props.edges as unknown[]).length)}
        >
          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={(event) => {
                (props.onNodeClick as (e: unknown, n: unknown) => void)(
                  event,
                  node,
                );
              }}
              onMouseEnter={(event) => {
                (props.onNodeMouseEnter as (e: unknown, n: unknown) => void)(
                  event,
                  node,
                );
              }}
              onMouseLeave={() => {
                (props.onNodeMouseLeave as () => void)();
              }}
            >
              {node.data.label}
            </button>
          ))}
        </div>
      );
    },
    ReactFlowProvider: passthrough,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    Handle: () => null,
    Position: { Top: 'top', Bottom: 'bottom' },
    MarkerType: { ArrowClosed: 'arrowclosed' },
    useNodesState: (initial: unknown[]) => {
      const state = { current: initial };
      return [
        state.current,
        (next: unknown[]) => (state.current = next),
        vi.fn(),
      ];
    },
    useEdgesState: (initial: unknown[]) => {
      const state = { current: initial };
      return [
        state.current,
        (next: unknown[]) => (state.current = next),
        vi.fn(),
      ];
    },
    useReactFlow: () => ({ fitView: vi.fn() }),
  };
});

const { NotesGraphView } = await import('./notes-graph-view');

const NOTE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const NOTE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function note(
  id: string,
  title: string,
  options: { linksTo?: string[]; hidden?: boolean } = {},
): Note {
  return {
    id,
    title,
    editor_settings: options.hidden ? { showInNoteGraph: false } : {},
    content: {
      type: 'doc',
      content: (options.linksTo ?? []).map((target) => ({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: target,
            marks: [{ type: 'link', attrs: { href: `/notes/${target}` } }],
          },
        ],
      })),
    },
  } as unknown as Note;
}

function t(key: string): string {
  return key;
}

beforeEach(() => {
  flowProps.current = null;
});

describe('NotesGraphView', () => {
  it('says so for an empty vault', () => {
    // Arrange|Act
    render(<NotesGraphView notes={[]} onOpenNote={vi.fn()} t={t} />);

    // Assert
    expect(screen.getByText('No notes to show.')).toBeTruthy();
  });

  it('explains how to unhide notes when every one opted out', () => {
    // Arrange|Act
    render(
      <NotesGraphView
        notes={[note(NOTE_A, 'Hidden', { hidden: true })]}
        onOpenNote={vi.fn()}
        t={t}
      />,
    );

    // Assert — an empty canvas alone would look broken
    expect(screen.getByText('Show in note graph')).toBeTruthy();
    expect(screen.queryByTestId('flow')).toBeNull();
  });

  it('draws one node per visible note', () => {
    // Arrange|Act
    render(
      <NotesGraphView
        notes={[
          note(NOTE_A, 'Itinerary'),
          note(NOTE_B, 'Hidden', { hidden: true }),
        ]}
        onOpenNote={vi.fn()}
        t={t}
      />,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Itinerary' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Hidden' })).toBeNull();
  });

  it('draws an edge for each internal link', () => {
    // Arrange|Act
    render(
      <NotesGraphView
        notes={[
          note(NOTE_A, 'Itinerary', { linksTo: [NOTE_B] }),
          note(NOTE_B, 'Gate'),
        ]}
        onOpenNote={vi.fn()}
        t={t}
      />,
    );

    // Assert
    expect(screen.getByTestId('flow').getAttribute('data-edges')).toBe('1');
  });

  it('labels an untitled note rather than drawing a blank box', () => {
    // Arrange|Act
    render(
      <NotesGraphView
        notes={[note(NOTE_A, '   ')]}
        onOpenNote={vi.fn()}
        t={t}
      />,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Untitled Note' })).toBeTruthy();
  });

  it('opens the note behind a node', () => {
    // Arrange
    const onOpenNote = vi.fn();
    render(
      <NotesGraphView
        notes={[note(NOTE_A, 'Itinerary')]}
        onOpenNote={onOpenNote}
        t={t}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Itinerary' }));

    // Assert
    expect(onOpenNote).toHaveBeenCalledWith(NOTE_A);
  });

  it('highlights a note’s own edges while the pointer is over it', async () => {
    // Arrange
    render(
      <NotesGraphView
        notes={[
          note(NOTE_A, 'Itinerary', { linksTo: [NOTE_B] }),
          note(NOTE_B, 'Gate'),
        ]}
        onOpenNote={vi.fn()}
        t={t}
      />,
    );
    const before = (flowProps.current?.edges as { animated?: boolean }[])[0];

    // Act
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Itinerary' }));

    // Assert
    await waitFor(() => {
      expect(
        (flowProps.current?.edges as { animated?: boolean }[])[0],
      ).not.toEqual(before);
    });

    // Act
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Itinerary' }));

    // Assert
    await waitFor(() => {
      expect((flowProps.current?.edges as { animated?: boolean }[])[0]).toEqual(
        before,
      );
    });
  });
});

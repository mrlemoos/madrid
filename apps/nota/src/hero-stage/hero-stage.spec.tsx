import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OPEN_NOTE_TITLE } from './demo-vault';

vi.mock('@getmadrid/editor', () => ({
  TipTapEditor: (props: Record<string, unknown>) => (
    <div data-testid="tiptap" data-note-id={String(props.noteId)} />
  ),
}));
vi.mock('@getmadrid/note-graph', () => ({
  NotesGraphScreen: () => <div data-testid="graph" />,
}));
vi.mock('@getmadrid/notes-chrome-ui/notes-sidebar-list', () => ({
  NotesSidebarList: (props: Record<string, unknown>) => (
    <div
      data-testid="sidebar"
      data-notes={String((props.notes as unknown[]).length)}
    />
  ),
}));

const { HeroStage } = await import('./hero-stage');

function scene(name: 'write' | 'graph') {
  return document.querySelector(`[data-scene="${name}"]`) as HTMLElement;
}

afterEach(() => {
  delete window.__heroStage;
  document.documentElement.className = '';
});

describe('HeroStage', () => {
  it('mounts the real workspace components over the invented vault', () => {
    // Arrange|Act
    render(<HeroStage />);

    // Assert — nothing here reaches Clerk or Supabase
    expect(screen.getByTestId('sidebar')).toBeTruthy();
    expect(screen.getByTestId('tiptap')).toBeTruthy();
    expect(screen.getByTestId('graph')).toBeTruthy();
    expect(screen.getByRole('heading', { name: OPEN_NOTE_TITLE })).toBeTruthy();
  });

  it('films light, matching the product shots further down the page', () => {
    // Arrange|Act
    render(<HeroStage />);

    // Assert
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('starts dimmed on the writing scene, so the film can fade in', () => {
    // Arrange|Act
    render(<HeroStage />);

    // Assert
    expect(scene('write').hasAttribute('inert')).toBe(false);
    expect(scene('graph').hasAttribute('inert')).toBe(true);
    expect(document.querySelector('.hero-stage-window')?.className).toContain(
      'opacity-0',
    );
  });

  it('exposes a handle for the recorder to drive', () => {
    // Arrange|Act
    render(<HeroStage />);

    // Assert
    expect(window.__heroStage?.ready).toBe(true);
    expect(typeof window.__heroStage?.setScene).toBe('function');
    expect(typeof window.__heroStage?.setDim).toBe('function');
  });

  it('switches scenes on command, making the hidden one inert', () => {
    // Arrange
    render(<HeroStage />);

    // Act
    act(() => {
      window.__heroStage?.setScene('graph');
    });

    // Assert — an interactive hidden scene would steal focus mid-take
    expect(scene('graph').hasAttribute('inert')).toBe(false);
    expect(scene('write').hasAttribute('inert')).toBe(true);
  });

  it('fades the window in and out for a seamless loop', () => {
    // Arrange
    render(<HeroStage />);

    // Act
    act(() => {
      window.__heroStage?.setDim(false);
    });

    // Assert
    expect(document.querySelector('.hero-stage-window')?.className).toContain(
      'opacity-100',
    );
  });

  it('takes the handle away on unmount', () => {
    // Arrange
    const { unmount } = render(<HeroStage />);

    // Act
    unmount();

    // Assert
    expect(window.__heroStage).toBeUndefined();
  });
});

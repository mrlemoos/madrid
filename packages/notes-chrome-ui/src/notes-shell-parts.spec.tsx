import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShellPanel, SidebarToggle } from './notes-shell-parts.js';
import { useNotesSidebarStore } from '@nota/note-runtime/stores/sidebar';
import {
  markNavIntent,
  NOTA_PANEL_FADE_CLASS,
  peekNavIntent,
  resetNavIntent,
} from '@nota/nota-motion-ui/panel-motion';

vi.mock('./use-notes-chrome-translator.js', () => ({
  useNotesChromeTranslator: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@nota/electron-bridge-ui/use-is-electron', () => ({
  useIsElectron: () => false,
}));

describe('SidebarToggle', () => {
  beforeEach(() => {
    useNotesSidebarStore.setState({ open: true });
  });

  it('calls toggle when the button is clicked', () => {
    // Arrange
    const toggle = vi.fn();
    useNotesSidebarStore.setState({ open: true, toggle });

    // Act
    render(<SidebarToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Close sidebar' }));

    // Assert
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('reflects the open state in aria-expanded', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });

    // Act
    render(<SidebarToggle />);

    // Assert
    expect(
      screen
        .getByRole('button', { name: 'Open sidebar' })
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('shows a Close sidebar tooltip when the sidebar is open', async () => {
    // Arrange
    useNotesSidebarStore.setState({ open: true });
    render(<SidebarToggle />);
    const button = screen.getByRole('button', { name: 'Close sidebar' });

    // Act
    fireEvent.focus(button);

    // Assert — Base UI tooltip popup has no role="tooltip"; assert visible label text
    expect(await screen.findByText('Close sidebar')).toBeTruthy();
  });

  it('shows an Open sidebar tooltip when the sidebar is closed', async () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });
    render(<SidebarToggle />);
    const button = screen.getByRole('button', { name: 'Open sidebar' });

    // Act
    fireEvent.focus(button);

    // Assert
    expect(await screen.findByText('Open sidebar')).toBeTruthy();
  });
});

describe('ShellPanel panel motion', () => {
  beforeEach(() => {
    resetNavIntent();
    document.documentElement.removeAttribute('data-nav-intent');
  });

  afterEach(() => {
    resetNavIntent();
    document.documentElement.removeAttribute('data-nav-intent');
  });

  it('applies the pointer fade class when becoming active after pointer intent', () => {
    // Arrange
    markNavIntent('pointer');
    const { rerender, container } = render(
      <ShellPanel active={false} panelId="nota-panel-graph">
        <span>Graph</span>
      </ShellPanel>,
    );

    // Act
    act(() => {
      rerender(
        <ShellPanel active={true} panelId="nota-panel-graph">
          <span>Graph</span>
        </ShellPanel>,
      );
    });

    // Assert
    const panel = container.querySelector('#nota-panel-graph');
    expect(panel?.className).toContain(NOTA_PANEL_FADE_CLASS);
    expect(panel?.getAttribute('data-nav-intent')).toBe('pointer');
    expect(peekNavIntent()).toBe('keyboard');
  });

  it('stays instant when becoming active after keyboard intent', () => {
    // Arrange
    markNavIntent('keyboard');
    const { rerender, container } = render(
      <ShellPanel active={false} panelId="nota-panel-settings">
        <span>Settings</span>
      </ShellPanel>,
    );

    // Act
    act(() => {
      rerender(
        <ShellPanel active={true} panelId="nota-panel-settings">
          <span>Settings</span>
        </ShellPanel>,
      );
    });

    // Assert
    const panel = container.querySelector('#nota-panel-settings');
    expect(panel?.className).not.toContain(NOTA_PANEL_FADE_CLASS);
    expect(panel?.getAttribute('data-nav-intent')).toBe('keyboard');
  });
});

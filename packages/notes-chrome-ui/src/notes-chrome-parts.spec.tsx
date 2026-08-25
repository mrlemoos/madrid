import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChromePanel,
  SidebarIconRail,
  SidebarToggle,
  NOTA_COLLAPSED_SIDEBAR_PEEK_LEAVE_MS,
  type ChromeNavItem,
} from './notes-chrome-parts';
import { useNotesSidebarStore } from '@nota/note-runtime/stores/sidebar';
import {
  markNavIntent,
  NOTA_PANEL_FADE_CLASS,
  peekNavIntent,
  resetNavIntent,
} from '@nota/nota-motion-ui/panel-motion';

vi.mock('./use-notes-chrome-translator', () => ({
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

  it('anchors the Close sidebar tooltip to the right of the toggle', async () => {
    // Arrange — tip must clear the sidebar rail (not paint under glass on side=bottom)
    useNotesSidebarStore.setState({ open: true });
    render(<SidebarToggle />);
    const button = screen.getByRole('button', { name: 'Close sidebar' });

    // Act
    fireEvent.focus(button);
    const label = await screen.findByText('Close sidebar');
    const positioner = label.parentElement;

    // Assert
    expect(positioner?.getAttribute('data-side')).toBe('right');
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

describe('ChromePanel panel motion', () => {
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
      <ChromePanel active={false} panelId="nota-panel-graph">
        <span>Graph</span>
      </ChromePanel>,
    );

    // Act
    act(() => {
      rerender(
        <ChromePanel active={true} panelId="nota-panel-graph">
          <span>Graph</span>
        </ChromePanel>,
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
      <ChromePanel active={false} panelId="nota-panel-settings">
        <span>Settings</span>
      </ChromePanel>,
    );

    // Act
    act(() => {
      rerender(
        <ChromePanel active={true} panelId="nota-panel-settings">
          <span>Settings</span>
        </ChromePanel>,
      );
    });

    // Assert
    const panel = container.querySelector('#nota-panel-settings');
    expect(panel?.className).not.toContain(NOTA_PANEL_FADE_CLASS);
    expect(panel?.getAttribute('data-nav-intent')).toBe('keyboard');
  });
});

describe('SidebarIconRail', () => {
  const items: ChromeNavItem[] = [
    {
      key: 'graph',
      href: '/notes/graph',
      label: 'Note Graph',
      icon: 'brain-circuit',
      active: false,
    },
    {
      key: 'settings',
      href: '/notes/settings',
      label: 'Settings',
      icon: 'gear',
      active: true,
    },
  ];

  beforeEach(() => {
    useNotesSidebarStore.setState({ open: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the collapsed rail inert until the pointer enters the left-edge hit target', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });

    // Act
    const { container } = render(<SidebarIconRail items={items} />);
    const rail = container.querySelector('[data-slot="sidebar-icon-rail"]');
    const edge = container.querySelector('[data-slot="sidebar-hover-edge"]');

    // Assert
    expect(edge).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Open sidebar' })).toBeNull();
    expect(rail?.getAttribute('data-open')).toBe('false');
    expect(rail?.getAttribute('aria-hidden')).toBe('true');
    expect(rail?.hasAttribute('inert')).toBe(true);
  });

  it('reveals the expand toggle and nav icons after hovering the left edge', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });
    const { container } = render(<SidebarIconRail items={items} />);
    const edge = container.querySelector('[data-slot="sidebar-hover-edge"]');
    if (!(edge instanceof HTMLElement)) {
      throw new Error('sidebar hover edge not found');
    }

    // Act
    fireEvent.pointerEnter(edge);

    // Assert
    const rail = container.querySelector('[data-slot="sidebar-icon-rail"]');
    expect(rail?.getAttribute('data-open')).toBe('true');
    expect(screen.getByRole('button', { name: 'Open sidebar' })).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Settings' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(screen.getByRole('link', { name: 'Note Graph' })).toBeTruthy();
  });

  it('hides the collapsed rail again after the pointer leaves the peek', () => {
    // Arrange
    vi.useFakeTimers();
    useNotesSidebarStore.setState({ open: false });
    const { container } = render(<SidebarIconRail items={items} />);
    const edge = container.querySelector('[data-slot="sidebar-hover-edge"]');
    const rail = container.querySelector('[data-slot="sidebar-icon-rail"]');
    if (!(edge instanceof HTMLElement) || !(rail instanceof HTMLElement)) {
      throw new Error('sidebar peek targets not found');
    }
    fireEvent.pointerEnter(edge);

    // Act
    fireEvent.pointerLeave(rail);
    act(() => {
      vi.advanceTimersByTime(NOTA_COLLAPSED_SIDEBAR_PEEK_LEAVE_MS);
    });

    // Assert
    expect(screen.queryByRole('button', { name: 'Open sidebar' })).toBeNull();
    expect(rail.getAttribute('data-open')).toBe('false');
    vi.useRealTimers();
  });
});

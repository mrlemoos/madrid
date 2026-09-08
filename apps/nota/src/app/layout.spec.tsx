import { describe, expect, it, vi } from 'vitest';

vi.mock('@/providers', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@fontsource-variable/inter/index.css', () => ({}));
vi.mock('@fontsource-variable/bricolage-grotesque/index.css', () => ({}));
vi.mock('@fontsource/instrument-serif/400.css', () => ({}));
vi.mock('@fontsource-variable/source-serif-4/index.css', () => ({}));
vi.mock('@fontsource/geist-sans/latin.css', () => ({}));
vi.mock('@fontsource-variable/nunito/index.css', () => ({}));
vi.mock('../../styles.css', () => ({}));

const layout = await import('./layout');

/** Walks the element tree looking for the first node of a given tag. */
function findElement(node: unknown, type: string): Record<string, any> | null {
  if (!node || typeof node !== 'object') {
    return null;
  }
  const element = node as { type?: unknown; props?: { children?: unknown } };
  if (element.type === type) {
    return element as Record<string, any>;
  }
  const children = element.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = findElement(child, type);
    if (found) {
      return found;
    }
  }
  return null;
}

describe('root metadata', () => {
  it('resolves OG image URLs against the production origin', () => {
    // Arrange|Act|Assert — relative URLs would resolve against localhost
    expect(layout.metadata.metadataBase?.toString()).toBe(
      'https://app.getmadrid.app/',
    );
  });

  it('names the app and its favicon', () => {
    // Arrange|Act|Assert
    expect(layout.metadata.title).toBe('Madrid');
    expect(layout.metadata.icons).toEqual({ icon: '/favicon.svg' });
    expect(layout.viewport.themeColor).toBe('#ffffff');
  });
});

describe('RootLayout', () => {
  it('marks Electron on <html> before the first paint', () => {
    // Arrange|Act
    const tree = layout.default({ children: 'app' });
    const script = findElement(tree, 'script');

    // Assert — anything later shows one opaque frame over the vibrancy
    expect(script?.props.dangerouslySetInnerHTML.__html).toContain(
      'nota-electron',
    );
    expect(script?.props.src).toBeUndefined();
  });

  it('lets the theme script set the colour scheme without a hydration warning', () => {
    // Arrange|Act
    const tree = layout.default({ children: 'app' });

    // Assert
    expect(tree.props.lang).toBe('en');
    expect(tree.props.suppressHydrationWarning).toBe(true);
  });

  it('renders the app inside the providers', () => {
    // Arrange|Act
    const tree = layout.default({ children: 'app' });
    const body = findElement(tree, 'body');

    // Assert
    expect(body).not.toBeNull();
    expect(JSON.stringify(body)).toContain('app');
  });
});

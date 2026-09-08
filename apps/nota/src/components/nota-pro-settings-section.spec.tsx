import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const postNotaProInvalidate = vi.fn().mockResolvedValue(undefined);
const refreshNotesList = vi.fn().mockResolvedValue(undefined);
const meta = { current: { notaProEntitled: false, loading: false } };

vi.mock('@clerk/react', () => ({
  PricingTable: () => <div data-testid="pricing-table" />,
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesDataMeta: () => meta.current,
  useNotesDataActions: () => ({ refreshNotesList }),
}));
vi.mock('../lib/nota-server-client', () => ({ postNotaProInvalidate }));

const { NotaProSettingsSection } = await import('./nota-pro-settings-section');

beforeEach(() => {
  vi.clearAllMocks();
  meta.current = { notaProEntitled: false, loading: false };
  postNotaProInvalidate.mockResolvedValue(undefined);
});

describe('NotaProSettingsSection', () => {
  it('waits rather than guessing at the subscription state', () => {
    // Arrange
    meta.current = { notaProEntitled: false, loading: true };

    // Act
    render(<NotaProSettingsSection />);

    // Assert
    expect(screen.getByText('Loading subscription status…')).toBeTruthy();
    expect(screen.queryByTestId('pricing-table')).toBeNull();
  });

  it('asks an unsubscribed reader to choose a plan', () => {
    // Arrange|Act
    render(<NotaProSettingsSection />);

    // Assert
    expect(
      screen.getByText(/Madrid requires an active subscription/),
    ).toBeTruthy();
    expect(screen.getByTestId('pricing-table')).toBeTruthy();
  });

  it('tells a subscriber their vault is syncing, and still shows the plans', () => {
    // Arrange
    meta.current = { notaProEntitled: true, loading: false };

    // Act
    render(<NotaProSettingsSection />);

    // Assert — Settings is checkout and plan management, not an essay
    expect(
      screen.getByText(/You have an active Madrid subscription/),
    ).toBeTruthy();
    expect(screen.getByTestId('pricing-table')).toBeTruthy();
  });

  it('offers the post-checkout refresh to an unsubscribed reader', () => {
    // Arrange|Act
    render(<NotaProSettingsSection />);

    // Assert
    expect(
      screen.getByRole('button', { name: /I completed checkout/ }),
    ).toBeTruthy();
  });

  it('invalidates the server entitlement cache, then reloads the vault', async () => {
    // Arrange
    render(<NotaProSettingsSection />);

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: /I completed checkout/ }),
    );

    // Assert — refreshing without invalidating would read a stale entitlement
    await waitFor(() => {
      expect(refreshNotesList).toHaveBeenCalled();
    });
    expect(postNotaProInvalidate.mock.invocationCallOrder[0]).toBeLessThan(
      refreshNotesList.mock.invocationCallOrder[0] as number,
    );
  });

  it('re-enables the button even when the refresh fails', async () => {
    // Arrange
    postNotaProInvalidate.mockRejectedValue(new Error('offline'));
    render(<NotaProSettingsSection />);

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: /I completed checkout/ }),
    );

    // Assert
    await waitFor(() => {
      expect(
        screen
          .getByRole('button', { name: /I completed checkout/ })
          .hasAttribute('disabled'),
      ).toBe(false);
    });
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { McpConnectSettingsSection } from './mcp-connect-settings-section';

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('McpConnectSettingsSection', () => {
  it('shows the MCP URL for this origin', () => {
    // Arrange|Act
    render(<McpConnectSettingsSection />);

    // Assert
    expect(screen.getByLabelText('MCP server URL')).toHaveProperty(
      'value',
      `${window.location.origin}/api/mcp`,
    );
    expect(
      screen.getByText(/can't delete or change what you wrote/),
    ).toBeTruthy();
  });

  it('copies the URL and confirms briefly', async () => {
    // Arrange
    vi.useFakeTimers();
    render(<McpConnectSettingsSection />);

    // Act
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });

    // Assert
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/api/mcp`);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('stays on Copy when the clipboard refuses', async () => {
    // Arrange
    writeText.mockRejectedValue(new Error('denied'));
    render(<McpConnectSettingsSection />);

    // Act
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });

    // Assert
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });
});

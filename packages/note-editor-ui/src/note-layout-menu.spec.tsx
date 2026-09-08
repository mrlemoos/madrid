import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NoteEditorSettings } from '@getmadrid/editor';

import { NoteLayoutMenu } from './note-layout-menu';

function open() {
  fireEvent.click(screen.getByRole('button', { name: 'Note layout' }));
}

function props(overrides: Record<string, unknown> = {}) {
  return {
    settings: {},
    onSettingsChange: vi.fn(),
    ...overrides,
  } as Parameters<typeof NoteLayoutMenu>[0] & {
    onSettingsChange: ReturnType<typeof vi.fn>;
  };
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NoteLayoutMenu column width', () => {
  it('starts on the standard column', async () => {
    // Arrange
    render(<NoteLayoutMenu {...props()} />);

    // Act
    open();

    // Assert
    const select = await screen.findByLabelText('Column width');
    expect((select as HTMLSelectElement).value).toBe('');
  });

  it('applies a chosen width', async () => {
    // Arrange
    const p = props();
    render(<NoteLayoutMenu {...p} />);
    open();

    // Act
    fireEvent.change(await screen.findByLabelText('Column width'), {
      target: { value: 'wide' },
    });

    // Assert
    expect(p.onSettingsChange).toHaveBeenCalledWith({ measure: 'wide' });
  });

  it('drops the setting rather than storing the standard width', async () => {
    // Arrange
    const p = props({ settings: { measure: 'wide' } });
    render(<NoteLayoutMenu {...p} />);
    open();

    // Act
    fireEvent.change(await screen.findByLabelText('Column width'), {
      target: { value: '' },
    });

    // Assert
    expect(p.onSettingsChange).toHaveBeenCalledWith({ measure: undefined });
  });
});

describe('NoteLayoutMenu graph visibility', () => {
  it('is on by default', async () => {
    // Arrange
    render(<NoteLayoutMenu {...props()} />);

    // Act
    open();

    // Assert
    const box = await screen.findByLabelText('Show in note graph');
    expect((box as HTMLInputElement).checked).toBe(true);
  });

  it('records only the opt-out', async () => {
    // Arrange
    const p = props();
    render(<NoteLayoutMenu {...p} />);
    open();

    // Act
    fireEvent.click(await screen.findByLabelText('Show in note graph'));

    // Assert — the default stays absent from the stored settings
    expect(p.onSettingsChange).toHaveBeenCalledWith({ showInNoteGraph: false });
  });

  it('clears the opt-out when switched back on', async () => {
    // Arrange
    const p = props({ settings: { showInNoteGraph: false } });
    render(<NoteLayoutMenu {...p} />);
    open();

    // Act
    fireEvent.click(await screen.findByLabelText('Show in note graph'));

    // Assert
    expect(p.onSettingsChange).toHaveBeenCalledWith({
      showInNoteGraph: undefined,
    });
  });
});

describe('NoteLayoutMenu banner', () => {
  it('hides the banner controls when the note cannot take one', async () => {
    // Arrange
    render(<NoteLayoutMenu {...props()} />);

    // Act
    open();

    // Assert
    await screen.findByLabelText('Column width');
    expect(screen.queryByText('Banner image')).toBeNull();
  });

  it('uploads a chosen image and attaches it', async () => {
    // Arrange
    const onBannerUpload = vi.fn().mockResolvedValue('att-1');
    const onBannerChange = vi.fn();
    render(<NoteLayoutMenu {...props({ onBannerChange, onBannerUpload })} />);
    open();
    await screen.findByText('Banner image');
    const file = new File(['x'], 'banner.png', { type: 'image/png' });

    // Act
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // Assert
    await waitFor(() => {
      expect(onBannerChange).toHaveBeenCalledWith('att-1');
    });
    expect(onBannerUpload).toHaveBeenCalledWith(file);
  });

  it('says when the upload failed, and stays ready to retry', async () => {
    // Arrange
    const onBannerUpload = vi.fn().mockRejectedValue(new Error('too large'));
    const onBannerChange = vi.fn();
    render(<NoteLayoutMenu {...props({ onBannerChange, onBannerUpload })} />);
    open();
    await screen.findByText('Banner image');

    // Act
    fireEvent.change(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      { target: { files: [new File(['x'], 'b.png', { type: 'image/png' })] } },
    );

    // Assert
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Banner upload failed.',
    );
    expect(onBannerChange).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole('button', { name: 'Add banner image' })
        .hasAttribute('disabled'),
    ).toBe(false);
  });

  it('previews and removes an attached banner', async () => {
    // Arrange
    const onBannerChange = vi.fn();
    render(
      <NoteLayoutMenu
        {...props({
          onBannerChange,
          onBannerUpload: vi.fn(),
          bannerAttachmentId: 'att-1',
          bannerSignedUrl: 'https://signed.example/banner.png',
        })}
      />,
    );
    open();

    // Act
    const preview = await screen.findByAltText('Banner preview');
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    // Assert
    expect(preview.getAttribute('src')).toBe(
      'https://signed.example/banner.png',
    );
    expect(onBannerChange).toHaveBeenCalledWith(null);
  });
});

describe('NoteLayoutMenu reset', () => {
  it('clears every setting and the banner in one go', async () => {
    // Arrange
    const onBannerChange = vi.fn();
    const p = props({
      settings: { measure: 'wide', showInNoteGraph: false },
      onBannerChange,
      onBannerUpload: vi.fn(),
      bannerAttachmentId: 'att-1',
    });
    render(<NoteLayoutMenu {...p} />);
    open();

    // Act
    fireEvent.click(
      await screen.findByRole('button', { name: 'Reset to defaults' }),
    );

    // Assert
    expect(p.onSettingsChange).toHaveBeenCalledWith({});
    expect(onBannerChange).toHaveBeenCalledWith(null);
  });
});

describe('NoteLayoutMenu when disabled', () => {
  it('cannot be opened', () => {
    // Arrange|Act
    render(<NoteLayoutMenu {...props({ disabled: true })} />);

    // Assert
    expect(
      screen
        .getByRole('button', { name: 'Note layout' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });
});

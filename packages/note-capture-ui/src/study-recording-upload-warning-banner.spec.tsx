import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAudioToNoteSession } from '@getmadrid/note-runtime/stores/audio-session';

import { StudyRecordingUploadWarningBanner } from './study-recording-upload-warning-banner';

afterEach(() => {
  act(() => {
    useAudioToNoteSession.getState().setRecordingAttachmentWarning(null);
  });
});

describe('StudyRecordingUploadWarningBanner', () => {
  it('renders nothing while there is no warning', () => {
    // Arrange|Act
    const { container } = render(<StudyRecordingUploadWarningBanner />);

    // Assert
    expect(container.firstElementChild).toBeNull();
  });

  it('announces the warning politely once one is set', () => {
    // Arrange
    act(() => {
      useAudioToNoteSession
        .getState()
        .setRecordingAttachmentWarning('Recording could not be uploaded.');
    });

    // Act
    render(<StudyRecordingUploadWarningBanner />);

    // Assert — a status role does not steal focus from the editor
    const banner = screen.getByRole('status');
    expect(banner.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByText('Recording could not be uploaded.')).toBeTruthy();
  });

  it('goes away when dismissed', () => {
    // Arrange
    act(() => {
      useAudioToNoteSession
        .getState()
        .setRecordingAttachmentWarning('Recording could not be uploaded.');
    });
    render(<StudyRecordingUploadWarningBanner />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    // Assert
    expect(screen.queryByRole('status')).toBeNull();
    expect(
      useAudioToNoteSession.getState().recordingAttachmentWarning,
    ).toBeNull();
  });
});

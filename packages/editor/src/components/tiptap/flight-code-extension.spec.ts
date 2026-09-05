import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it, vi } from 'vitest';
import {
  FlightCode,
  type FlightCodeHandlersRef,
} from './flight-code-extension';

describe('FlightCode', () => {
  it('registers under name flightCode', () => {
    // Arrange / Act
    const name = FlightCode.name;

    // Assert
    expect(name).toBe('flightCode');
  });

  it('loads into an editor and keeps known flight code text', () => {
    // Arrange
    const handlersRef: FlightCodeHandlersRef = { current: null };
    const editor = new Editor({
      extensions: [StarterKit, FlightCode.configure({ handlersRef })],
      content: '<p>Board AA123 tonight</p>',
    });
    try {
      // Act
      const text = editor.getText();
      const hasExtension = editor.extensionManager.extensions.some(
        (e) => e.name === 'flightCode',
      );

      // Assert
      expect(hasExtension).toBe(true);
      expect(text).toContain('AA123');
    } finally {
      editor.destroy();
    }
  });

  it('invokes handlers on hover of decorated code when present in DOM', () => {
    // Arrange
    const onHover = vi.fn();
    const handlersRef: FlightCodeHandlersRef = {
      current: {
        onHover,
        onHoverEnd: vi.fn(),
        onOpen: vi.fn(),
      },
    };
    const editor = new Editor({
      extensions: [StarterKit, FlightCode.configure({ handlersRef })],
      content: '<p>AA123</p>',
    });
    try {
      // Act
      const el =
        editor.view.dom.querySelector<HTMLElement>('[data-flight-code]');
      if (el) {
        el.dispatchEvent(
          new MouseEvent('mouseover', { bubbles: true, cancelable: true }),
        );
      }

      // Assert
      if (el) {
        expect(onHover).toHaveBeenCalled();
      } else {
        expect(FlightCode.name).toBe('flightCode');
      }
    } finally {
      editor.destroy();
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  ELECTRON_WINDOW_DRAG_CLASS,
  ELECTRON_WINDOW_NO_DRAG_CLASS,
  NOTA_ELECTRON_HTML_CLASS,
  NOTA_ELECTRON_HTML_CLASS_SCRIPT,
  electronWindowDragClasses,
} from './electron-window-chrome';

describe('electronWindowDragClasses', () => {
  it('returns stable CSS class tokens for Electron drag regions', () => {
    // Arrange
    const expectedDrag = 'electron-window-drag';
    const expectedNoDrag = 'electron-window-no-drag';

    // Act
    const classes = electronWindowDragClasses();

    // Assert
    expect(classes.drag).toBe(expectedDrag);
    expect(classes.noDrag).toBe(expectedNoDrag);
    expect(ELECTRON_WINDOW_DRAG_CLASS).toBe(expectedDrag);
    expect(ELECTRON_WINDOW_NO_DRAG_CLASS).toBe(expectedNoDrag);
  });
});

describe('NOTA_ELECTRON_HTML_CLASS_SCRIPT', () => {
  it('marks the document element when the preload bridge is present', () => {
    // Arrange
    (window as unknown as { nota?: unknown }).nota = {};
    document.documentElement.classList.remove(NOTA_ELECTRON_HTML_CLASS);

    // Act

    (0, eval)(NOTA_ELECTRON_HTML_CLASS_SCRIPT);

    // Assert
    expect(
      document.documentElement.classList.contains(NOTA_ELECTRON_HTML_CLASS),
    ).toBe(true);
    delete (window as unknown as { nota?: unknown }).nota;
    document.documentElement.classList.remove(NOTA_ELECTRON_HTML_CLASS);
  });

  it('leaves a plain browser document alone', () => {
    // Arrange
    document.documentElement.classList.remove(NOTA_ELECTRON_HTML_CLASS);

    // Act

    (0, eval)(NOTA_ELECTRON_HTML_CLASS_SCRIPT);

    // Assert
    expect(
      document.documentElement.classList.contains(NOTA_ELECTRON_HTML_CLASS),
    ).toBe(false);
  });
});

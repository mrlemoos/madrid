import { base64ToUint8, uint8ToBase64 } from './yjs-base64.js';

describe('yjs-base64 round-trip', () => {
  it('restores the original bytes', () => {
    // Arrange
    const bytes = new Uint8Array([0, 1, 2, 254, 255, 128, 42]);

    // Act
    const restored = base64ToUint8(uint8ToBase64(bytes));

    // Assert
    expect(Array.from(restored)).toEqual(Array.from(bytes));
  });

  it('handles payloads larger than one chunk without arg-count overflow', () => {
    // Arrange
    const bytes = new Uint8Array(0x8000 * 2 + 5);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;

    // Act
    const restored = base64ToUint8(uint8ToBase64(bytes));

    // Assert
    expect(Array.from(restored)).toEqual(Array.from(bytes));
  });
});

import { describe, expect, it } from 'vitest';
import { notaLowlight } from './nota-lowlight';

describe('notaLowlight', () => {
  it('highlights common languages', () => {
    // Arrange
    const code = 'const x = 1;';

    // Act
    const tree = notaLowlight.highlight('javascript', code);

    // Assert
    expect(tree).toBeDefined();
    expect(tree.type).toBe('root');
  });

  it('registers mermaid as a language alias', () => {
    // Arrange
    const diagram = 'graph TD\n  A --> B';

    // Act
    const registered = notaLowlight.registered('mermaid');
    const tree = notaLowlight.highlight('mermaid', diagram);

    // Assert
    expect(registered).toBe(true);
    expect(tree).toBeDefined();
  });
});

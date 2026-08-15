import { afterEach, describe, expect, it } from 'vitest';
import { notaServerExposeErrorDetails } from './nota-server-error-detail.server';

describe('notaServerExposeErrorDetails', () => {
  const prevNodeEnv = process.env.NODE_ENV;
  const prevDebug = process.env.NOTA_SERVER_DEBUG_ERRORS;

  afterEach(() => {
    process.env.NODE_ENV = prevNodeEnv;
    if (prevDebug === undefined) {
      delete process.env.NOTA_SERVER_DEBUG_ERRORS;
    } else {
      process.env.NOTA_SERVER_DEBUG_ERRORS = prevDebug;
    }
  });

  it('returns false in production when NOTA_SERVER_DEBUG_ERRORS is unset', () => {
    // Arrange
    process.env.NODE_ENV = 'production';
    delete process.env.NOTA_SERVER_DEBUG_ERRORS;

    // Act
    const result = notaServerExposeErrorDetails();

    // Assert
    expect(result).toBe(false);
  });

  it('returns true in production when NOTA_SERVER_DEBUG_ERRORS=1', () => {
    // Arrange
    process.env.NODE_ENV = 'production';
    process.env.NOTA_SERVER_DEBUG_ERRORS = '1';

    // Act
    const result = notaServerExposeErrorDetails();

    // Assert
    expect(result).toBe(true);
  });

  it('returns true outside production without debug flag', () => {
    // Arrange
    process.env.NODE_ENV = 'development';
    delete process.env.NOTA_SERVER_DEBUG_ERRORS;

    // Act
    const result = notaServerExposeErrorDetails();

    // Assert
    expect(result).toBe(true);
  });
});

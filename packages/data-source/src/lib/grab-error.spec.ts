import { describe, expect, it } from 'vitest';
import type { GrabkitError, GrabkitTransportError } from 'grabkit';

import { grabErrorBody, grabErrorStatus } from './grab-error';

/** Shaped like grabkit's downlevelled errors: `name` is the only reliable tag. */
function httpError(statusCode: number, body: unknown): GrabkitError {
  return { name: 'GrabkitError', statusCode, body } as unknown as GrabkitError;
}

function transportError(): GrabkitTransportError {
  return {
    name: 'GrabkitTransportError',
    cause: new Error('offline'),
  } as unknown as GrabkitTransportError;
}

describe('grabErrorStatus', () => {
  it('reports the HTTP status behind a server error', () => {
    // Arrange|Act|Assert
    expect(grabErrorStatus(httpError(404, null))).toBe(404);
    expect(grabErrorStatus(httpError(402, null))).toBe(402);
  });

  it('reports 0 when the request never reached a server', () => {
    // Arrange|Act|Assert
    expect(grabErrorStatus(transportError())).toBe(0);
  });

  it('discriminates on name, so a lost prototype chain still narrows', () => {
    // Arrange — a plain object, exactly what grabkit's ES5 downlevel produces
    const notAnInstance = { name: 'GrabkitError', statusCode: 500, body: {} };

    // Act|Assert
    expect(grabErrorStatus(notAnInstance as unknown as GrabkitError)).toBe(500);
  });
});

describe('grabErrorBody', () => {
  it('hands back the parsed error body from the server', () => {
    // Arrange|Act|Assert
    expect(grabErrorBody(httpError(422, { message: 'nope' }))).toEqual({
      message: 'nope',
    });
  });

  it('is null on a transport failure, where there is no body', () => {
    // Arrange|Act|Assert
    expect(grabErrorBody(transportError())).toBeNull();
  });
});

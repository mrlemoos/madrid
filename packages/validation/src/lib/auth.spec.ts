import { describe, expect, it } from 'vitest';

import { loginSchema, signupSchema } from './auth';

describe('signupSchema', () => {
  it('accepts a well-formed signup', () => {
    // Arrange
    const input = {
      email: 'ada@example.com',
      password: 'correcthorse',
      confirmPassword: 'correcthorse',
    };

    // Act
    const result = signupSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('reports the mismatch on the confirmation field, not the password', () => {
    // Arrange
    const input = {
      email: 'ada@example.com',
      password: 'correcthorse',
      confirmPassword: 'correcthose',
    };

    // Act
    const result = signupSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    const issue = result.error?.issues[0];
    expect(issue?.path).toEqual(['confirmPassword']);
    expect(issue?.message).toBe('Passwords do not match');
  });

  it('rejects a password shorter than six characters', () => {
    // Arrange|Act
    const result = signupSchema.safeParse({
      email: 'ada@example.com',
      password: 'short',
      confirmPassword: 'short',
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'Password must be at least 6 characters',
    );
  });

  it('distinguishes a missing field from a malformed one', () => {
    // Arrange|Act
    const empty = signupSchema.safeParse({
      email: '',
      password: '',
      confirmPassword: '',
    });
    const malformed = signupSchema.safeParse({
      email: 'not-an-email',
      password: 'correcthorse',
      confirmPassword: 'correcthorse',
    });

    // Assert
    expect(empty.error?.issues.map((i) => i.message)).toContain(
      'Email is required',
    );
    expect(malformed.error?.issues.map((i) => i.message)).toContain(
      'Invalid email address',
    );
  });
});

describe('loginSchema', () => {
  it('accepts any non-empty password, with no length rule', () => {
    // Arrange|Act
    const result = loginSchema.safeParse({
      email: 'ada@example.com',
      password: 'x',
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it('requires both fields', () => {
    // Arrange|Act
    const result = loginSchema.safeParse({ email: '', password: '' });

    // Assert
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain('Email is required');
    expect(messages).toContain('Password is required');
  });
});

function serverTargetLabel(baseUrl: string | undefined): string {
  if (!baseUrl) {
    return 'your Nota server';
  }
  try {
    const u = new URL(baseUrl);
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    return `${u.hostname}:${port}`;
  } catch {
    return 'your Nota server';
  }
}

/**
 * Actionable copy when entitlement `fetch` fails (React Native: "Network request failed").
 */
export function formatEntitlementNetworkError(
  baseUrl: string | undefined,
  error: unknown,
): string {
  const target = serverTargetLabel(baseUrl);

  const message =
    error instanceof Error ? error.message : 'Network request failed';

  if (
    message.includes('Network request failed') ||
    message.includes('Failed to connect') ||
    message.includes('ECONNREFUSED')
  ) {
    return `Cannot reach Nota server at ${target}. For local dev, run: pnpm exec nx dev @nota/nota`;
  }

  return message || 'Network error during entitlement check';
}

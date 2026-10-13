import 'server-only';
import { auth } from '@clerk/nextjs/server';
import type { AuthInfo } from '@modelcontextprotocol/server';

// MCP clients authenticate with a Clerk OAuth access token (Clerk is the
// authorization server; this app is only the resource server). Not a Clerk
// session token, so Supabase RLS can't take it: the MCP path uses the service
// key with explicit per-user scoping in `mcp-notes.server.ts`.

/** Clerk Frontend API origin (the OAuth issuer), decoded from the publishable key. */
export function clerkFrontendApiUrl(
  publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
): string {
  const encoded = publishableKey?.trim().replace(/^pk_(test|live)_/, '');
  if (!encoded) {
    throw new Error('mcp: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set');
  }
  const host = Buffer.from(encoded, 'base64')
    .toString('utf8')
    .replace(/\$$/, '');
  return `https://${host}`;
}

/** `withMcpAuth` verifier: Clerk OAuth token → AuthInfo carrying the Clerk user id. */
export async function verifyMcpToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;
  const result = await auth({ acceptsToken: 'oauth_token' });
  if (!result.isAuthenticated || !result.userId) return undefined;
  return {
    token: bearerToken,
    clientId: result.clientId,
    scopes: result.scopes,
    extra: { userId: result.userId },
  };
}

export function mcpUserId(authInfo: AuthInfo | undefined): string | undefined {
  const userId = authInfo?.extra?.userId;
  return typeof userId === 'string' && userId.length > 0 ? userId : undefined;
}

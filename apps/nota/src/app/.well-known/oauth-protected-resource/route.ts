import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from 'mcp-handler';
import { clerkFrontendApiUrl } from '@/server/mcp-auth.server';

export const runtime = 'nodejs';

/** RFC 9728 metadata: tells MCP clients that Clerk issues tokens for /api/mcp. */
export function GET(request: Request): Response {
  // Built per request so a missing env var fails the request, not `next build`.
  return protectedResourceHandler({
    authServerUrls: [clerkFrontendApiUrl()],
  })(request);
}

export const OPTIONS = metadataCorsOptionsRequestHandler();

import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { verifyMcpToken } from '@/server/mcp-auth.server';
import { registerMadridMcpTools } from '@/server/mcp-tools.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Remote MCP server (Streamable HTTP). Auth is a Clerk OAuth access token; an
// unauthenticated call gets 401 + `WWW-Authenticate` pointing at
// /.well-known/oauth-protected-resource so clients can run the OAuth flow.
const handler = withMcpAuth(
  createMcpHandler(registerMadridMcpTools, {
    serverInfo: { name: 'madrid', version: '1.0.0' },
  }),
  verifyMcpToken,
  { required: true },
);

export { handler as GET, handler as POST, handler as DELETE };

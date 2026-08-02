import type { NextConfig } from 'next';
import packageJson from './package.json' with { type: 'json' };

// Ported from vercel.json — kept in sync until the static SPA config is retired.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://*.accounts.dev https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://challenges.cloudflare.com https://*.nota.mrlemoos.dev https://clerk.nota.mrlemoos.dev https://*.i.posthog.com",
  "worker-src 'self' blob:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
  'upgrade-insecure-requests',
].join('; ');

function isNotaWorkspacePackage(packageName: string): boolean {
  return packageName.startsWith('@nota/');
}

// Workspace libraries are published via the `@nota/source` export condition to
// raw `src/*.tsx`; Next must compile them (Vite did this via `conditions`).
const NOTA_WORKSPACE_PACKAGES = [
  ...Object.keys(packageJson.dependencies).filter(isNotaWorkspacePackage),
  ...Object.keys(packageJson.devDependencies).filter(isNotaWorkspacePackage),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: NOTA_WORKSPACE_PACKAGES,
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;

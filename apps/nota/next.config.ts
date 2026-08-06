import type { NextConfig } from 'next';
import packageJson from './package.json' with { type: 'json' };

// Ported from vercel.json — kept in sync until the static SPA config is retired.
// Next dev (Turbopack HMR + React Refresh) evals + uses a ws to the dev server,
// which a production-strict CSP blocks (blank page under Electron/Chromium).
// Relax only in development; production stays eval-free.
const IS_DEV = process.env.NODE_ENV !== 'production';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `script-src 'self' 'unsafe-inline'${IS_DEV ? " 'unsafe-eval'" : ''} https://*.accounts.dev https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://challenges.cloudflare.com https://*.nota.mrlemoos.dev https://clerk.nota.mrlemoos.dev https://*.i.posthog.com`,
  "worker-src 'self' blob:",
  `connect-src 'self' https: wss:${IS_DEV ? ' ws:' : ''}`,
  "frame-src 'self' https:",
  // Would upgrade ws://localhost + http dev assets to secure and break HMR.
  ...(IS_DEV ? [] : ['upgrade-insecure-requests']),
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

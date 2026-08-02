import { clerkMiddleware } from '@clerk/nextjs/server';

// Clerk middleware (Next 16 `proxy`): populates the request auth context from the
// Clerk session cookie so route handlers can call `auth()` without a Bearer
// token. Non-protecting by default — routes decide via `auth()`/`auth.protect()`.
export default clerkMiddleware();

export const config = {
  // Only the API routes need server auth; the SPA manages its own session
  // client-side (@clerk/react), so keep the middleware off page navigations.
  matcher: ['/api/(.*)'],
};

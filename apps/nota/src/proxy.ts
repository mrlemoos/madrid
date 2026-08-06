import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

// `clerkMiddleware` only wires the `auth()` context onto each request. Route
// protection is resource-based, per Clerk's current guidance (middleware path
// matching can diverge from how Next routes requests): the notes workspace is
// gated by the `(protected)` layout's server-side `auth()` check, and each API
// route handler gates itself via `requireUserId` / `requireEntitledUserId`.
export default clerkMiddleware(async (auth, req) => {
  // Signed-in visitors don't need the marketing landing — send them to the
  // workspace server-side (no client-side redirect flash).
  if (req.nextUrl.pathname === '/') {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL('/notes', req.url));
    }
  }
  return NextResponse.next();
});

export const config = {
  // Run on all page routes (excluding Next internals + static files) and the API.
  matcher: ['/((?!_next|.*\\..*).*)', '/api/(.*)'],
};

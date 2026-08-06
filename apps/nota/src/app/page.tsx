import type { JSX } from 'react';
import { LandingPage } from '@/components/landing-page';

/**
 * Public marketing landing (`/`). Middleware redirects signed-in visitors to
 * `/notes` server-side, so this route only ever renders for signed-out users —
 * no client-side auth gating or redirect flash.
 */
export default function LandingRoute(): JSX.Element {
  return <LandingPage />;
}

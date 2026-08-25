/**
 * Fallback for the `@header` slot when Next can't recover a matching header for the
 * active route (required for parallel routes). Renders nothing.
 */
export default function AuthHeaderDefault(): null {
  return null;
}

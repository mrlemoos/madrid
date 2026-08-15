# Nota iPhone (mobile)

React Native / Expo app for Nota on iPhone. **platform:mobile** — depends on `platform:shared` workspace packages plus Clerk Expo and Supabase glue.

## What ships today

- **Auth:** Clerk email/password in-app (`@clerk/expo/legacy`), SecureStore token cache, email verification when Clerk requires a code.
- **Entitlement:** `fetchNotaProEntitled` via `EXPO_PUBLIC_NOTA_SERVER_API_URL` → paywall or full vault.
- **Notes:** Supabase-backed list + note editor (`@nota/mobile-editor`), debounced save, same ProseMirror JSON as web.
- **Deep links:** `nota://notes/:uuid` (`@nota/internal-note-link`).

Offline sync (`@nota/notes-offline`) is web-only for now; mobile reads/writes Supabase when entitled and online.

## Environment

Copy [`.env.example`](.env.example) to `.env`. Required for a signed-in vault:

| Variable                            | Purpose                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key                                    |
| `EXPO_PUBLIC_SUPABASE_URL`          | Supabase project URL                                     |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`     | Supabase anon key (RLS)                                  |
| `EXPO_PUBLIC_NOTA_SERVER_API_URL`   | Nota web app origin serving `/api/*` (no trailing slash) |
| `EXPO_PUBLIC_WEB_APP_URL`           | Web app for Nota Pro checkout                            |

Start the **Next web app** before signing in (it serves `/api/*`; entitlement runs immediately after auth):

```bash
pnpm exec nx dev @nota/nota
```

On a **physical device**, loopback in `.env` is rewritten to your Mac’s Metro IP in dev builds. The server must be reachable on the configured port.

## Run locally

From the repo root:

```bash
pnpm install
pnpm exec nx dev @nota/nota-mobile
# or
cd apps/nota-mobile && pnpm dev
```

iOS simulator / device:

```bash
cd apps/nota-mobile
pnpm exec expo run:ios
```

Use Nx or the app directory — do not run `npx expo` from the monorepo root.

If you change `polyfills.js` or `index.js`, restart Metro with `--clear`.

## Routing

| State                   | Screen                                    |
| ----------------------- | ----------------------------------------- |
| Signed out              | `(auth)/sign-in`, `sign-up`               |
| Signed in, not entitled | `/paywall`                                |
| Signed in, entitled     | `(main)` notes list + `notes/[id]` editor |

## Session API (`useMobileSession`)

```ts
{
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: { id: string; email: string | null } | null;
  notaProEntitled: boolean | null;
  isCheckingEntitlement: boolean;
  entitlementError: string | null;
  getAccessToken: () => Promise<string | null>;
  refreshEntitlement: () => Promise<boolean>;
  signOut: () => Promise<void>;
}
```

## Platform

iOS and Android targets (no react-native-web). See `AGENTS.md` for portable `@nota/*` imports and `packages/mobile-editor/ARCHITECTURE.md` for the editor.

# `@gohan-ai/react-native` — minimal integration

```tsx
import { GohanCoach } from '@gohan-ai/react-native';

export function CoachScreen() {
  return (
    <GohanCoach
      apiBaseUrl="https://<ref>.supabase.co/functions/v1"
      getAuthToken={async () => mySessionToken}
      userId={user.id}
      tenantSlug="smartfit"
    />
  );
}
```

## Auth tokens accepted

`getAuthToken` may return either a **Gohan session JWT** (issued by the
`api-session` edge function after the host's gym-JWT exchange — this is the
embedded-module path) or a **`gk_live_*` API key** (server-to-server, scoped
to a single tenant). Standalone Expo apps should pass a Supabase-issued JWT
directly — same code path, the edge function verifies it via the Supabase
JWKS instead of `tenant_signing_secrets`.

## API-key variant (server-to-server)

Pass `externalId` so the SDK forwards `X-External-Id` on every request and
the edge function resolves the matching `(tenant_id, external_id)` profile.

```tsx
<GohanCoach
  apiBaseUrl="https://<ref>.supabase.co/functions/v1"
  getAuthToken={async () => 'gk_live_smartfit_...'}
  externalId="gym-user-42"
  tenantSlug="smartfit"
/>
```

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
to a single tenant). When using an API key the host must also set the
`X-External-Id` header on outbound requests so the edge function knows which
end-user to act as; wiring that header through the SDK's HTTP client is a
**Phase 4 concern** (today the `<GohanCoach />` root only forwards the
bearer token). Standalone Expo apps should pass a Supabase-issued JWT
directly — same code path, the edge function verifies it via the Supabase
JWKS instead of `tenant_signing_secrets`.

# Proposal

## Why

All public authentication endpoints are currently unthrottled. The magic-link
request sends an email per call, so it can be abused to flood a victim's inbox
or burn the SMTP quota, and every anonymous login start (OIDC, magic link,
passkey) inserts a database row. Because production runs behind a reverse
proxy, the backend also cannot currently tell clients apart: every request
appears to come from the proxy's address.

This change depends on `add-passkey-login` and is implemented after it, so
that the passkey login endpoints are covered too.

## What Changes

- Resolve the real client IP from `X-Forwarded-For` only when the direct peer
  is a configured trusted proxy (new optional `TRUSTED_PROXIES` CIDR list);
  otherwise use the connection's remote address. IPv6 clients are grouped by
  their /64 prefix.
- Apply in-memory, per-client-IP token-bucket limits to every public
  authentication endpoint, with fixed limits defined in code:
  - magic-link request: 5 per 10 minutes, burst 3;
  - magic-link consumption, OIDC start, OIDC callback: 30 per minute;
  - passkey login options and assertion: 30 per minute.
- Allow per-client-IP limiting to be switched off with a new optional
  `RATE_LIMIT_PER_IP` setting (`true` by default) for deployments that cannot
  specify their trusted proxies. The per-recipient magic-link limit and
  logging stay active either way; startup logs that per-IP limiting is off.
- Add a per-recipient limit for magic-link requests (3 emails per normalized
  address per 15 minutes) that silently skips delivery while returning the
  normal accepted response, so it cannot reveal account existence.
- JSON endpoints answer `429` with `Retry-After` and error code
  `rate_limited`; browser-navigation endpoints (magic-link consumption, OIDC
  start/callback) redirect to `/auth/login?error=rate_limited` instead.
- Every rate-limit hit, including silent per-recipient hits, is written as an
  info-level log entry without the plain email address.
- The login screen shows a localized "too many attempts" message for a `429`
  response and for the `error=rate_limited` redirect.
- Expired-row cleanup is already in place (hourly `Prune`) and is not part of
  this change.

## Capabilities

### New Capabilities

- `authentication/rate-limiting`: client IP resolution behind trusted proxies,
  per-endpoint and per-recipient limits on public authentication endpoints,
  rate-limited responses, and logging of every limit hit.

### Modified Capabilities

- `api-contract/authentication`: document `429` responses and the
  `rate_limited` error code for the throttled operations, and the login
  redirect used by browser-navigation operations.
- `frontend/authentication`: the login screen presents a localized rate-limit
  message.

## Impact

- **Configuration**: new optional `TRUSTED_PROXIES` environment variable
  (comma-separated CIDRs/IPs) and `RATE_LIMIT_PER_IP` switch (`true`/`false`,
  default `true`), added to `.env.example`, config validation, and the backend
  README with a Traefik example.
- **Backend**: new rate-limiting middleware and client-IP resolver in the auth
  package; route registration wraps public auth routes; magic-link handler
  consults the per-recipient limiter; first use of structured `log/slog`
  info-level logging; new dependency `golang.org/x/time/rate`.
- **API**: additive `429` responses in both synchronized OpenAPI documents;
  regenerated frontend types.
- **Frontend**: login route reads an `error` search parameter and handles
  `429`; new de/en translations.
- **Operations**: limits reset on restart and are per process (single instance
  assumed). A misconfigured `TRUSTED_PROXIES` makes all clients share one
  bucket (too strict) or lets clients spoof their IP (too lax).

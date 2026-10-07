# Design

## Context

See `proposal.md` for motivation and `specs/` for requirements.

Public auth routes are registered in `auth.Service.RegisterRoutes` on the
shared `http.ServeMux` built by `httpserver.NewMux`. The magic-link handler
already normalizes the email before creating a challenge. The backend runs as a
single container behind a reverse proxy, so `r.RemoteAddr` is the proxy's
address in production. Logging uses the standard `log` package without levels.
Expired authentication rows are already pruned hourly by `Store.Prune`
(`main.go`), and `add-passkey-login` extends it to passkey challenges.

## Goals / Non-Goals

**Goals:**

- Correct per-client identification behind a reverse proxy without trusting
  spoofable headers from arbitrary peers.
- Bounded memory under attack.
- Throttling that never reveals whether an email has an account.

**Non-Goals:**

- Limits on authenticated endpoints, account lockout, CAPTCHAs.
- Multi-instance / persistent limit state.
- Configurable limit values.

## Decisions

### In-memory token buckets with `golang.org/x/time/rate`

A `Limiter` type holds a `map[string]*entry` (bucket + last-seen time) behind a
mutex, one instance per endpoint group plus one for magic-link recipients. A
background sweep (every minute) removes entries idle longer than the time
their bucket needs to refill completely, keeping memory proportional to recently
active clients. Limit values are package constants.

Postgres-backed counters were rejected: one container, and a DB write per
auth request is unnecessary cost. A hand-rolled fixed-window counter was
rejected because `x/time/rate` is maintained by the Go team, small, and gives
burst semantics plus an exact `Retry-After` from the reservation delay.

### Trusted-proxy client IP resolution

`TRUSTED_PROXIES` is an optional comma-separated list of IPs or CIDRs, parsed
into `[]netip.Prefix` during config load (a bare IP becomes a /32 or /128);
parse errors fail startup. `ClientIP(r)`:

1. Parse `r.RemoteAddr`. If it is not in a trusted prefix → return it.
2. Otherwise walk `X-Forwarded-For` entries (all headers, comma-split) from
   right to left, skipping trusted entries; return the first untrusted valid
   address. If none, return the remote address.

The limiter key is the IPv4 address or the IPv6 address masked to /64
(IPv4-mapped IPv6 is unmapped first). Using `X-Real-IP` or the leftmost
`X-Forwarded-For` entry was rejected: the leftmost value is client-controlled,
and `X-Real-IP` is not set uniformly by all proxies. With Docker-based proxies
the operator configures the Docker network range (e.g. `172.16.0.0/12`); the
README documents this.

### Middleware per route group, applied at registration

`RegisterRoutes` wraps each public route with
`s.limit(group, mode, handler)`, where `mode` is `json` or `redirect`.
`json` writes `429`, `Retry-After`, and the standard error body with code
`rate_limited` via `apierror.Write`. `redirect` responds `303` to
`/auth/login?error=rate_limited`. Session-protected routes are not wrapped. A
global middleware matching paths was rejected because route-level wrapping
keeps the group/mode explicit next to each route.

### Per-recipient limit inside the magic-link handler

After email validation and normalization, the handler asks the recipient
limiter for `sha256(normalizedEmail)`. If denied it logs the hit and returns
the normal `202` without creating a challenge or sending mail. The client-IP
limit runs before, in the middleware, so an over-limit client cannot probe
recipients.

### Info logging with `log/slog`

Each hit calls `slog.Info("rate limit exceeded", "limit", <client|recipient>,
"group", <group>, "key", <client key or first 12 hex chars of the recipient
hash>, "path", r.URL.Path)`. `slog`'s default handler routes through the
standard `log` output, so existing log lines keep their format and the new
entries carry `INFO`. Logging plain emails was rejected for privacy; the hash
prefix still lets an operator correlate repeated hits for one recipient.

### Frontend handling

`ApiError` already exposes the status. The login route adds an optional
`error` search parameter accepting only `rate_limited`, and maps a `429` from
the magic-link mutation or passkey sign-in to the same localized message
(`login.rateLimited`). No retry timer is shown; the message says to try again
in a few minutes.

## Risks / Trade-offs

- [Every throttled request logs a line; a flood produces a log flood] →
  Accepted as requested; entries are short and the proxy/infra can apply its
  own limits. Can be sampled later without spec change to the logged content.
- [Misconfigured `TRUSTED_PROXIES`: empty behind a proxy → all users share one
  bucket] → README calls this out; magic-link burst limits are low, so the
  symptom (frequent 429s) is visible quickly.
- [Limits reset on restart] → Acceptable for abuse throttling.
- [Shared NAT / CGNAT users share a bucket] → Limits sized for that (30/min on
  login flows); magic-link per-IP limit is the tightest and only affects
  requesting emails.
- [OIDC callback throttled loses the authorization code] → User restarts login
  from the redirect target; rare at 30/min.

## Migration Plan

No schema change. Deploy with `TRUSTED_PROXIES` set to the reverse proxy's
address range; without it, the backend behaves correctly for direct
connections only. Rollback is a binary rollback.

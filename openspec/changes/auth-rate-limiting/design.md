# Design

## Context

See `proposal.md` for motivation and `specs/` for requirements.

Public auth routes are registered in `auth.Service.RegisterRoutes` on the
shared `http.ServeMux` built by `httpserver.NewMux`. The magic-link handler
already normalizes the email before creating a challenge. The backend runs as a
single container behind a reverse proxy, so `r.RemoteAddr` is the proxy's
address in production (Traefik). Logging uses the standard `log` package without levels.
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

A `keyedLimiter` holds a `map[string]*bucket` (token bucket + last-seen time)
behind a mutex, one instance per endpoint group. At most once a minute, the
next request sweeps out entries idle longer than their bucket needs to refill
completely, keeping memory proportional to recently active clients without a
background goroutine (and with an injectable clock for tests). Limit values
are package constants.

The per-recipient limit uses a small sliding-window limiter instead of a
token bucket, because the spec promises "at most 3 per 15 minutes": a bucket
refilling one token per 5 minutes would admit a fourth email after 5 minutes.

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
and `X-Real-IP` is not set uniformly by all proxies. The README documents the
Traefik setup: give the Docker network shared by Traefik and the app a fixed
subnet (e.g. `172.30.0.0/24`) and set `TRUSTED_PROXIES` to it; keep Traefik's
`forwardedHeaders.insecure` off so Traefik replaces client-supplied
`X-Forwarded-For` with the real peer address; if a CDN/load balancer sits in
front of Traefik, list its ranges in both Traefik's `trustedIPs` and
`TRUSTED_PROXIES`; verify by checking that rate-limit log keys show public
client IPs rather than `172.x` addresses.

### Per-IP limiting can be switched off

`RATE_LIMIT_PER_IP` (`true`/`false`, default `true`; anything else fails
startup) controls whether route groups are wrapped with the per-client
limiter. `main.go` passes it and `TRUSTED_PROXIES` to
`Service.ConfigureRateLimiting` before route registration. When `false`,
`RegisterRoutes` skips the wrapping entirely, startup
logs `slog.Info("per-IP rate limiting disabled")`, and the per-recipient
magic-link limit and its logging remain active because they do not depend on
the client address. Automatically disabling per-IP limiting when
`TRUSTED_PROXIES` is empty was rejected: direct (proxy-less) deployments
legitimately have no trusted proxies and still benefit from per-IP limits, so
the operator decides explicitly.

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
  bucket] → README calls this out; the log key reveals it (always the proxy
  address); operators who cannot fix it set `RATE_LIMIT_PER_IP=false`.
- [Per-IP limiting disabled → login endpoints only protected by the
  per-recipient magic-link limit] → Explicit opt-out, logged at startup;
  rely on Traefik middleware (e.g. its `rateLimit`) if needed.
- [Limits reset on restart] → Acceptable for abuse throttling.
- [Shared NAT / CGNAT users share a bucket] → Limits sized for that (30/min on
  login flows); magic-link per-IP limit is the tightest and only affects
  requesting emails.
- [OIDC callback throttled loses the authorization code] → User restarts login
  from the redirect target; rare at 30/min.

## Migration Plan

No schema change. Deploy with `TRUSTED_PROXIES` set to the Traefik network
subnet, or with `RATE_LIMIT_PER_IP=false` if that is not possible; without
either, the backend behaves correctly for direct connections only. Rollback is a binary rollback.

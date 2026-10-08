# Tasks

## 1. Contract and configuration

- [ ] 1.1 Add `429` responses (with `Retry-After` header and `rate_limited` error code) to the magic-link request and passkey login operations, and document the `error=rate_limited` login redirect on magic-link consumption, OIDC start, and OIDC callback in both synchronized OpenAPI documents; verify OpenAPI lint and the sync test pass.
- [ ] 1.2 Add optional `TRUSTED_PROXIES` (parsed to prefixes, bare IPs as single-host prefixes, invalid entries fail startup) and `RATE_LIMIT_PER_IP` (`true`/`false`, default `true`, other values fail startup) to config, `.env.example`, and `EnvKeys`; verify config tests cover empty, IPs, CIDRs, IPv6, invalid entries, switch default/true/false/invalid, and the env-key sync test passes.

## 2. Backend limiting

- [ ] 2.1 Implement client-IP resolution and limiter keying (trusted-proxy walk of `X-Forwarded-For`, IPv4-mapped unmapping, IPv6 /64 masking); verify table tests cover no proxies, trusted proxy, spoofed leftmost entry, chained proxies, malformed entries, and IPv6 grouping.
- [ ] 2.2 Add `golang.org/x/time/rate` and implement the keyed limiter with idle-entry sweeping and `Retry-After` computation; verify tests with an injected clock cover burst, refill, independent keys, and eviction.
- [ ] 2.3 Wrap public auth routes with per-group limiting in `json` or `redirect` mode and log every hit via `slog.Info`; verify HTTP tests cover 429 + `Retry-After` + error body, `303` to `/auth/login?error=rate_limited`, group independence, authenticated routes untouched, a captured info log entry per hit, and with `RATE_LIMIT_PER_IP=false` no per-IP 429s plus a startup info entry.
- [ ] 2.4 Add the per-recipient magic-link limit inside the handler (hash of normalized email, silent `202`, no challenge, no email, hashed-prefix log); verify tests cover the fourth request from different IPs, unchanged response body, no mail sent, and no plain address in the log.
- [ ] 2.5 Document `TRUSTED_PROXIES`, `RATE_LIMIT_PER_IP`, the limits, and the Traefik setup (fixed Docker subnet, `forwardedHeaders.insecure` off, CDN `trustedIPs`, log-key check) in `backend/README.md`; verify the README names both variables and their failure modes.

## 3. Frontend

- [ ] 3.1 Accept `error=rate_limited` on the login route and map `429` from magic-link request and passkey sign-in to a localized message that keeps input; add de/en translations; verify route tests cover both triggers, unknown error values, and both locales, and the locale key-parity test passes.

## 4. Integration

- [ ] 4.1 Run frontend `check:api`, tests, typecheck, Biome, OpenAPI lint, and build; run full backend tests, `openspec validate auth-rate-limiting --strict`, and `git diff --check`; verify all pass.

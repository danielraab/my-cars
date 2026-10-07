# Spec Delta

## Purpose

Protects the public authentication endpoints against abuse by throttling
requests per client and per magic-link recipient, resolving real client
addresses behind trusted reverse proxies, and logging every throttling event.

## ADDED Requirements

### Requirement: Client address is resolved only through trusted proxies
The system SHALL use the connection's remote address as the client address
unless that address is in the optional trusted-proxy list. Then it SHALL use
the rightmost `X-Forwarded-For` entry that is not a trusted proxy. Invalid
trusted-proxy configuration SHALL fail startup.

#### Scenario: No trusted proxies configured
- **WHEN** no trusted proxies are configured and a request carries `X-Forwarded-For: 203.0.113.9`
- **THEN** the client address is the connection's remote address and the header is ignored

#### Scenario: Request arrives through a trusted proxy
- **WHEN** the remote address is a trusted proxy and `X-Forwarded-For` is `198.51.100.1, 203.0.113.9`
- **THEN** the client address is `203.0.113.9`

#### Scenario: Client prepends a spoofed address
- **WHEN** a client sends `X-Forwarded-For: 192.0.2.66` through a trusted proxy that appends the real address `203.0.113.9`
- **THEN** the client address is `203.0.113.9`

#### Scenario: Invalid trusted proxy entry
- **WHEN** the trusted-proxy list contains an entry that is neither an IP address nor a CIDR range
- **THEN** startup fails with an error naming the trusted-proxy setting

### Requirement: IPv6 clients share a limit per /64 prefix
The system SHALL key per-client limits by the full IPv4 address or by the /64
prefix of an IPv6 address, so that rotating addresses within one IPv6 prefix
does not bypass the limits.

#### Scenario: Rotating IPv6 addresses
- **WHEN** requests come from `2001:db8:1:2::a` and `2001:db8:1:2::b`
- **THEN** both count against the same per-client limit

### Requirement: Public authentication endpoints are throttled per client
The system SHALL apply per-client token-bucket limits, kept separately for
each endpoint group: magic-link request 5 per 10 minutes with burst 3;
magic-link consumption, OIDC start, and OIDC callback 30 per minute; passkey
login options and assertion 30 per minute. Authenticated endpoints SHALL NOT
be throttled by this capability.

#### Scenario: Magic-link requests exceed the client limit
- **WHEN** one client sends a fourth magic-link request within a few seconds
- **THEN** that request is rejected as rate limited and no email is sent

#### Scenario: Groups are limited independently
- **WHEN** a client has exhausted the magic-link request limit
- **THEN** its passkey login requests are still accepted

#### Scenario: Different clients are independent
- **WHEN** one client has exhausted a limit
- **THEN** requests from another client address are still accepted

### Requirement: Magic-link delivery is throttled per recipient without disclosure
The system SHALL send at most 3 magic-link emails per normalized address per
15 minutes. A request over that limit SHALL receive the same accepted
response as any valid request, and SHALL NOT send an email or create a
challenge.

#### Scenario: Recipient limit reached from many clients
- **WHEN** a fourth magic-link request for the same address arrives within 15 minutes from a different client
- **THEN** the response is the normal accepted response and no email is sent

### Requirement: Rate-limited requests receive a defined response
The system SHALL answer a throttled JSON operation with `429`, a `Retry-After`
header in seconds, and the standard error body with code `rate_limited`. It
SHALL answer a throttled browser-navigation operation (magic-link consumption,
OIDC start, OIDC callback) with a redirect to `/auth/login?error=rate_limited`.

#### Scenario: Throttled JSON operation
- **WHEN** a passkey login options request is throttled
- **THEN** the response is `429` with `Retry-After` and error code `rate_limited`

#### Scenario: Throttled browser navigation
- **WHEN** an OIDC start request is throttled
- **THEN** the browser is redirected to `/auth/login?error=rate_limited` and no OIDC attempt is created

### Requirement: Every rate-limit hit is logged at info level
The system SHALL write one info-level log entry for every throttled request,
including silent per-recipient hits, naming the limit, the endpoint group, and
the client address key. It SHALL NOT log a plain email address; a recipient
SHALL be identified only by a truncated one-way hash.

#### Scenario: Client limit hit is logged
- **WHEN** a client request is throttled
- **THEN** an info-level entry is written containing the limit name, endpoint group, and client key

#### Scenario: Recipient limit hit is logged without the address
- **WHEN** a magic-link request is silently throttled by the recipient limit
- **THEN** an info-level entry is written with a truncated hash of the address and without the address itself

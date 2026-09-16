## Project context

This is the Go backend for the my-car rewrite. It exposes a REST API
(documented in the project's OpenAPI spec) and, in production, serves the
frontend's static build output (`../frontend/`) as well.

Auth is handled entirely here — two login methods, OIDC and magic link,
which must resolve to the same account when the email address matches.
Never issue tokens intended for browser localStorage; sessions should use
an httpOnly cookie or equivalent.

Non-trivial changes should follow the OpenSpec explore → propose → apply
workflow described in the root `AGENTS.md`.

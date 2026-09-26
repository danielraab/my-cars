# Tasks

## 1. Contract and configuration

- [x] 1.1 Add the public authentication-method operation and closed method-code response schema to both synchronized OpenAPI documents; verify OpenAPI lint and byte-synchronization tests pass.
- [x] 1.2 Make the three OIDC environment variables an optional all-or-none group and expose the enabled decision; verify config tests cover all absent, all present, every partial combination, and invalid enabled issuer URLs.
- [x] 1.3 Update `.env.example`, compose defaults, and backend documentation for magic-link-only and OIDC-enabled modes; verify environment-key synchronization and documented names pass existing tests.

## 2. Conditional backend behavior

- [x] 2.1 Make OIDC provider construction and discovery conditional while preserving fail-fast discovery when enabled; verify startup wiring tests or focused unit seams cover enabled and disabled modes.
- [x] 2.2 Register the public method operation always and OIDC start/callback routes only with a configured provider; verify HTTP tests cover exact method lists, absent disabled OIDC routes, and unchanged enabled OIDC flow.

## 3. Frontend method discovery

- [x] 3.1 Regenerate OpenAPI TypeScript types and add the typed authentication-method client/query; verify client tests cover valid method responses, malformed responses, and transport/API failures.
- [x] 3.2 Gate login actions on authentication-method resolution, hide OIDC in magic-link-only mode, and add localized loading/error/retry UI; verify route tests cover magic-link-only, both-method, loading, failure, and retry states in German and English.

## 4. Validation

- [x] 4.1 Run frontend API synchronization, tests, type checking, Biome, OpenAPI lint, and build; run the complete backend tests, `openspec validate optional-oidc --strict`, and `git diff --check`, verifying all pass with no `old/` changes.

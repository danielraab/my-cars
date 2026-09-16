# my-car

Rewrite of a legacy Next.js full-stack car management app. The old app is
kept as read-only reference in [`old/`](old) — do not edit it, do not build
new features by patching it.

> **IMPORTANT: `old/` is strictly read-only.** Never create, edit, or
> delete any file under `old/`, for any reason (not even formatting,
> renames, or "cleanup"). It is reference material only and the entire
> folder will be deleted once the rewrite is complete.

## Target architecture

- **Backend** (`backend/`): Go. Exposes a REST API and, in production,
  serves the frontend's static build output.
- **Frontend** (`frontend/`): React, built to static files only (no SSR, no
  Node runtime in production). Stack: pnpm, Vite, TanStack Router, Tailwind
  CSS, lucide-react icons, HeadlessUI.
- **API contract**: every endpoint is documented in an OpenAPI spec, which
  is the source of truth for request/response shapes.
- **Auth**: handled entirely by the backend. Two methods — OIDC and magic
  link — and both must resolve to the same account when the email address
  matches. Never store tokens/sessions in browser localStorage.

## Workflow

This project uses [OpenSpec](openspec/) for spec-driven development. Any
non-trivial change (new feature, endpoint, schema change, architectural
decision) must go through **explore → propose (→ apply)**, not be
implemented ad hoc. Small, obvious fixes are exempt.

See `openspec/config.yaml` for the full project context handed to artifact
generation.

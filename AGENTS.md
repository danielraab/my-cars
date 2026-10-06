# my-car

Rewrite of a legacy Next.js full-stack car management app. The legacy code
has been removed from the working tree; it remains available in git history
(vendored in commit `bbd18eb`) for reference only.

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

## Parity

[`docs/parity-checklist.md`](docs/parity-checklist.md) is the acceptance
criterion for every rewrite slice: it inventories every legacy screen,
endpoint and derived value with a stable id, plus the closed list of
non-goals. Anything outside it and outside its non-goals needs its own
proposal.

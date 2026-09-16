## Project context

This frontend is a static build only — no SSR, no Node server at runtime.
In production the compiled assets are served by the Go backend
(`../backend/`). All data access goes through the REST API documented in
the project's OpenAPI spec; do not call any identity provider directly —
auth (OIDC + magic link) is handled by the backend, and tokens/sessions
must never be stored in `localStorage`.

The app must support i18n and always ship both German (de) and English
(en) — no user-facing string should be added in only one locale.

Non-trivial changes should follow the OpenSpec explore → propose → apply
workflow described in the root `AGENTS.md`.

<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

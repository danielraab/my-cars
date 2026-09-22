# Proposal

## Why

Parity with the legacy app is the acceptance criterion for the whole rewrite,
but the only record of what "parity" means is prose in a planning document and
the legacy source in `old/`, which is scheduled for deletion once the rewrite
lands. Every later slice — `api-contract-v1`, `db-schema-v1`,
`auth-oidc-magic-link`, each feature vertical — needs one checkable list to tick
off and one explicit list of what is deliberately *not* being ported, or each
slice re-derives both by re-reading `old/` and reaches a slightly different
answer.

## What Changes

- Add `docs/parity-checklist.md`: the durable, line-per-item inventory of the
  legacy app's behaviour, derived by reading `old/`, organised as
  - **Screens** — the 21 non-API pages under `old/pages/` (22 `.tsx` files,
    less `_app.tsx`, which is the shell), with what each one shows and the
    actions it offers.
  - **Endpoints** — every method-and-path pair served by the 22 handler files
    under `old/pages/api/v1/`, with auth requirement, scoping and sort order.
  - **Derived values** — fields the legacy app computes rather than stores, each
    with its exact formula.
  - **Non-goals** — the Scope decisions table, restated as the closed list of
    things that are *not* parity failures.
  Every item carries a stable id (`SCR-…`, `EP-…`, `DRV-…`, `NG-…`) so later
  proposals and tasks can cite one line instead of restating it.
- Record the parity risks the audit surfaced, each assigned to the change that
  owns the decision rather than decided here:
  - **Derived refuel fields.** `distance` and `consumption` are computed in the
    browser (`old/hooks/fetch/use-refuels-backend.ts`) by walking the whole
    date-ascending refuel list and keeping the previous odometer reading per
    car. Under cursor pagination the client no longer holds the predecessor, so
    the first row of every page would render a blank consumption. Owner:
    `api-contract-v1`.
  - **Car filter on list screens.** `/refuels`, `/repairs` and `/tickets` build
    their car filter from the rows already loaded and filter client-side
    (`ButtonSelect`). With paged lists the filter can only see the current page.
    Owner: `api-contract-v1`.
  - **Charts consume whole lists.** The fuel-price and consumption charts are fed
    the same array the list renders, so paging the list silently truncates the
    chart. Owner: `api-contract-v1`, alongside the already-flagged
    `/stats/expenses` decision.
- Add a "Parity" section to `AGENTS.md` and a link from `README.md` pointing at
  the checklist as the acceptance criterion, so the rule is discoverable from
  the repo rather than only from the planning document.

No behaviour changes, no code: this change produces documentation that later
changes consume.

## Capabilities

### New Capabilities

None. This change adds no behaviour — it records what the legacy app already
does so that later changes can declare capabilities against it. The capabilities
themselves belong to the slices that implement them (`api-contract-v1` onward);
declaring them here would freeze requirement text before the contract and schema
decisions that shape it. `.openspec.yaml` sets `skip_specs: true`.

### Modified Capabilities

None. No spec exists yet, and no requirement changes here.

## Impact

- **Files**: `docs/parity-checklist.md` (new), `AGENTS.md`, `README.md`.
- **Code**: none. `backend/` and `frontend/` are untouched.
- **Downstream**: `api-contract-v1` inherits three flagged decisions
  (derived refuel fields, car filtering, chart inputs) on top of the two the
  planning document already hands it. Every later slice gains a citable id per
  parity item.
- **Reference material**: `old/` stays read-only; this change only reads it.

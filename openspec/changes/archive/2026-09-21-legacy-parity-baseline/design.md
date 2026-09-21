# Design

## Context

See `proposal.md` — Why. The constraints that shape the approach:

- `old/` is read-only and will be deleted when the rewrite completes, so
  anything the checklist relies on must be copied out of it, not linked into it.
- The legacy app has no automated tests (`old/test/` holds seven `.http` request
  files), so the checklist is derived by reading source, not by running it.
- `bootstrap-build` is merged: CI runs `go build/vet/test`, `pnpm check` +
  `pnpm build`, and a `docker build`. There is no docs job, and no behaviour to
  test here.
- `openspec/specs/` is empty. This is the last change before `api-contract-v1`
  starts writing requirements, so the checklist's shape determines how citable
  those requirements are.

## Goals / Non-Goals

**Goals:**

- One file, checked into the repo, that answers "is this slice done?" for any
  later slice, without reopening `old/`.
- Stable ids per item, so a task line in `api-contract-v1` can read "covers
  `EP-12`, `EP-13`" rather than restating the endpoint.
- Every item traceable to the legacy file it came from, so a disputed line can
  be settled while `old/` still exists.
- The non-goals list closed: if it is not in the checklist and not in the
  non-goals, adding it needs its own proposal.

**Non-Goals:**

- Deciding any of the flagged questions. The checklist records that
  consumption, the car filter and the chart inputs conflict with cursor
  pagination; `api-contract-v1` decides what to do about each.
- Describing the *new* system. The checklist describes the legacy app plus the
  agreed exceptions; how the Go backend shapes a response is the contract's
  business.
- Porting the legacy app's UI. Screens are listed by what they let a user do,
  not by their Bootstrap layout.

## Decisions

**A durable `docs/parity-checklist.md`, not a spec under `openspec/specs/`.**
OpenSpec specs describe requirements of the system being built, and syncing the
whole legacy surface into `openspec/specs/` now would make every later slice a
*modification* of a requirement written before the contract and schema were
settled — either vague enough to be useless or wrong the moment
`api-contract-v1` lands. The checklist is an inventory of a system being
replaced, which is a different artifact. Alternative considered: declare one
`parity-baseline` capability and put the inventory in its spec. Rejected: the
proposal instructions forbid inventing a requirement to satisfy validation, and
this would be one. `skip_specs: true` is set instead.

**Checklist lives in `docs/`, not `openspec/`.** Changes under
`openspec/changes/` are archived once applied, and the checklist has to outlive
this change — the slices that consume it run for months afterwards. `docs/` is
new (the repo has no such directory today) but keeps the file out of the
OpenSpec CLI's scanned tree, where a stray markdown file has no defined meaning.
Alternative considered: `openspec/parity-checklist.md`. Rejected for that last
reason.

**Four sections with prefixed ids: `SCR-`, `EP-`, `DRV-`, `NG-`.** Numbering
within a prefix, assigned once and never reused, so a citation stays valid after
items are added. Screens and endpoints are separate lists because a slice
usually delivers both halves of a vertical and needs to tick them off
independently — the backend can be done while the screen is not. Alternative
considered: one flat list grouped by feature. Rejected: it hides the case where
an endpoint exists with no screen (`GET /refuels/stations` feeds autocomplete,
not a page).

**Derived values get their own section with exact formulas.** `perLiter`,
`distance` and `consumption` exist only in the browser and only as arithmetic in
`old/hooks/fetch/use-refuels-backend.ts`. They are the items most likely to be
lost in a rewrite — nothing in the database or the API surface hints at them —
and the rounding is observable (`Math.round(10000 * liter / distance) / 100`
gives two decimals for consumption, three for `perLiter`). Recording the formula
verbatim makes a mismatch a test failure rather than a judgement call.

**Non-goals restate the Scope decisions table rather than referencing it.** The
planning document lives outside the repository; a contributor reading the repo
has to be able to see the closed list. Duplication is accepted here because the
list is settled and short.

**The three newly flagged conflicts are recorded, not resolved.** Each is a
contract-shaped question — where a derived value is computed, what a filter
filters, what feeds a chart — and `api-contract-v1` owns the cross-cutting
conventions. Deciding them here would settle pagination semantics in a document
that declares no requirements.

## Risks / Trade-offs

**The checklist drifts from `old/` as items are ticked, and no test catches it.**
→ Each item cites the legacy path it came from, and the audit happens once,
while `old/` is present and frozen at `774a37f`. Ticking an item is a claim
about the *new* code, not an edit to what the legacy app did, so the derived
half of the file does not drift.

**One flat inventory is long enough that slices skim it.** → Ids are the
mitigation: a slice cites the handful of lines it owns in its own tasks, so the
reader never needs the whole file at once.

**"Parity" hides behaviour that was a bug.** The unscoped suggestion endpoints
were parity until they were read closely. → Endpoint items record scoping and
sort order explicitly, which is where that class of bug shows up, and anything
deliberately not ported goes in non-goals with a reason rather than being
quietly dropped.

**`docs/` invites unrelated documentation.** → The change adds exactly one file
and a link to it from `AGENTS.md` and `README.md`; what else lands there is a
later decision.

## Migration Plan

None. No deployed behaviour changes, nothing to roll back; reverting the commit
removes the document.

## Open Questions

None. The three conflicts the audit surfaced are assigned to `api-contract-v1`
by name, which is a decision about ownership rather than a deferred unknown.

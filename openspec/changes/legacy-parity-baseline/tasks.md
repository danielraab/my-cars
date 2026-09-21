# Tasks

## 1. Scaffold the checklist

- [ ] 1.1 Create `docs/parity-checklist.md` with the four sections (Screens,
      Endpoints, Derived values, Non-goals), a header stating that it is the
      acceptance criterion for every rewrite slice, and a note that it was
      derived from `old/` at legacy commit `774a37f`; verify the file exists and
      the four headings are present.
- [ ] 1.2 Write the id conventions into the header — `SCR-`, `EP-`, `DRV-`,
      `NG-`, numbered within a prefix, assigned once and never reused — and
      state that later proposals cite ids rather than restating items; verify by
      reading the header back.

## 2. Inventory the legacy surface

- [ ] 2.1 List every screen under `old/pages/` that is not an API route as one
      `SCR-` line each, giving the route, what the screen shows and the actions
      it offers, with the source path; verify the count matches
      `find old/pages -name '*.tsx' -not -path '*/api/*' | wc -l` minus one (22
      files, of which `_app.tsx` is the shell rather than a screen, so 21
      `SCR-` lines) and that no `SCR-` id repeats.
- [ ] 2.2 List every handler under `old/pages/api/v1/` as one `EP-` line each,
      giving method and path, whether it requires auth, how it scopes rows to
      the caller, and its sort order, with the source path; note that a file may
      serve several methods (`cars/index.ts` handles GET and POST), so give one
      `EP-` line per method-and-path pair and verify every one of the 22 files
      under `find old/pages/api/v1 -name '*.ts'` is cited by at least one line
      and that no `EP-` id repeats.
- [ ] 2.3 Record the derived values as `DRV-` lines with their exact formulas
      and rounding — `perLiter`, `distance`, `consumption` from
      `old/hooks/fetch/use-refuels-backend.ts` — plus where each is displayed;
      verify each formula transcribed matches the legacy source character for
      character.
- [ ] 2.4 Restate the Scope decisions table as `NG-` lines (password login,
      `specialToken`, unscoped suggestion endpoints, reminders, unpaged lists,
      tokens in `localStorage`), each with the reason it is not a parity
      failure; verify every row of the Scope decisions table has a
      corresponding `NG-` line.

## 3. Record the flagged conflicts

- [ ] 3.1 Add a "Flagged for `api-contract-v1`" subsection recording the three
      conflicts between legacy behaviour and cursor pagination — derived refuel
      fields losing their predecessor across a page boundary, the client-side
      car filter on `/refuels`, `/repairs` and `/tickets` seeing only the loaded
      page, and the charts being fed the same truncated array — each naming the
      legacy source and the `DRV-`/`SCR-` ids it affects, and each stating the
      question without answering it; verify all three appear and none of them
      resolves the decision.

## 4. Make the checklist discoverable

- [ ] 4.1 Add a "Parity" section to `AGENTS.md` stating that
      `docs/parity-checklist.md` is the acceptance criterion for every slice and
      that anything outside it and outside its non-goals needs its own proposal;
      verify the section is present and links to the file.
- [ ] 4.2 Link the checklist from `README.md` in the Workflow section, next to
      the existing OpenSpec link; verify the link resolves to an existing file.

## 5. Verify the change

- [ ] 5.1 Cross-check every `EP-` line against the legacy handler it cites by
      reading each file, confirming the recorded auth requirement, scoping and
      sort order; verify no line contradicts its source.
- [ ] 5.2 Run `openspec validate legacy-parity-baseline` and confirm it passes
      with `skip_specs: true` and no zero-delta error.
- [ ] 5.3 Run the repository's CI checks locally (`go build ./...`, `go vet ./...`,
      `go test ./...` in `backend/`, and `pnpm check` + `pnpm build` in
      `frontend/`) and confirm they still pass — this change touches no code, so
      any failure is pre-existing and must be reported, not fixed here.
- [ ] 5.4 Confirm `git status` shows no modification under `old/`; the legacy
      tree is read-only and this change only reads it.

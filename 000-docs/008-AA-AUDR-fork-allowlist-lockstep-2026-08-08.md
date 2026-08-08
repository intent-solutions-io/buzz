# 008 — AUDIT: the fork allowlist granted a path the contract never declared

**Date:** 2026-08-08
**Type:** Audit record (AA-AUDR)
**Trigger:** A handover readiness pass on the Buzz documentation set. Carter Gray is taking over Buzz
management, so `FORK.md` was re-read as the contract a new maintainer is handed, and checked against
the code that enforces it rather than accepted as written.
**Severity:** Low. No breach, no divergence, no production impact. Recorded because the defect class
— the human contract and its machine form disagreeing — is exactly what `007` cost us.
**Status:** Fixed in this change.

---

## 1. The claim under test

`scripts/fork-gates/check-additive-only.sh`, immediately above the `ALLOW` array:

> ```text
> # The fork allowlist — every path prefix this fork is allowed to differ on.
> # Keep in lockstep with the FORK.md must-survive table (that table is the
> # human contract; this array is its machine form).
> ```

Two artifacts, one asserted to be the other's machine form. That assertion is testable, and nothing
tests it — `check-must-survive.sh` asserts the *paths exist*, not that the two lists agree.

## 2. Finding — one entry in `ALLOW` has no row in `FORK.md`

Comparing the 14 `ALLOW` entries against the 11 rows of `FORK.md` § *Must-survive set*:

| `ALLOW` entry | `FORK.md` row |
|---|---|
| `FORK.md`, `REVIEW.md`, `TEST_AUDIT.md`, `000-docs/`, `.beads/` | present |
| `scripts/fork-gates/`, `scripts/audit-harness`, `.audit-harness/` | present |
| `.harness-hash`, `.harness-hash-extra-patterns`, `lefthook-local.yml` | present |
| `CLAUDE.md`, `.github/workflows/fork-gates.yml` | present (declared divergences) |
| **`.gitleaksignore`** | **absent** |

Three further facts settle what to do about it:

- **The file does not exist.** Not in the worktree, not in `git diff upstream/main...HEAD`.
- **Nothing would use it.** `gitleaks` does not run anywhere in this repository — the only workflow
  is `fork-gates.yml`, whose two steps are the additive-only and must-survive checks. The single
  occurrence of the string `gitleaks` in the entire repo was that `ALLOW` entry.
- **It is a permission, not a claim.** `ALLOW` means *"if this path differs from upstream, that is
  allowed"*. So the entry was standing permission for a file nobody needs, that no gate would
  notice appearing.

## 3. Why removal, rather than adding a row to `FORK.md`

Both fixes restore lockstep. Adding a `FORK.md` row would have documented a file that does not
exist — and `decision-log/048` (D170/D171, 2026-08-07) ratified the opposite instinct four weeks
into exactly this problem: *docs should describe things that exist*, and a name held in reserve is
indistinguishable, to a reader six months later, from something they cannot find. That ruling
retired two phantom repositories and deleted the disambiguation rule they had forced.

The same reasoning applies to a permission held in reserve, with an extra argument on top:
**removal fails closed.** If a `.gitleaksignore` is ever genuinely wanted, the additive-only gate
will refuse the diff until `FORK.md` and `ALLOW` are updated together — which is the contract doing
its job, and precisely the review step that `007` found had been missing.

## 4. What changed

- `scripts/fork-gates/check-additive-only.sh` — `.gitleaksignore` removed from `ALLOW` (14 → 13).
- `.harness-hash` re-pinned, because `scripts/fork-gates/*.sh` is inside the hash-pinned policy
  surface (`.harness-hash-extra-patterns:7`). An unpinned edit to a gate script is the thing that
  pin exists to catch.

`FORK.md` is unchanged — it was already correct; the array had drifted away from it.

**Incidental finding, surfaced by the re-pin and worth naming rather than letting it ride in
silently:** `.harness-hash` was missing an entry for `000-docs/007-AA-AUDR-fork-contract-breach-2026-08-03.md`.
That file is inside the pinned surface, so it should have been pinned when it was added on 2026-08-03
and `scripts/audit-harness init` was evidently not re-run then. Re-pinning here picked it up, so the
manifest now covers 14 files rather than 12. Nothing was tampered with — an unpinned file is simply
one the verify step was silently not watching, which makes this the second instance in this same
audit of *enforcement whose scope quietly stopped matching its subject*.

## 5. Verified

`check-additive-only.sh upstream/main` and `check-must-survive.sh` both pass against the reduced
array, and `scripts/audit-harness verify` passes on the re-pinned manifest. The divergence set is
byte-for-byte what it was before this change.

## 6. Method note

This was found by diffing the two lists rather than by reading either one. `007`'s causal chain was
*"the gates existed but were never in CI"* — enforcement that is present but not wired. This is the
adjacent failure: enforcement that is wired, but whose scope no longer matches the contract it
claims to enforce. A comment saying *"keep these in lockstep"* is an unenforced assertion, and this
repository's own history is the argument for not trusting those.

**Worth considering as a follow-up, deliberately not done here:** a check that parses the `FORK.md`
table and asserts set-equality with `ALLOW`, so the lockstep comment becomes a gate. It is a small
script; it is not this change, because this change should be reviewable as a one-line removal.

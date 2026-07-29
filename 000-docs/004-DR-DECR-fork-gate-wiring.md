# Decision Record — Fork-gate wiring (TEST_AUDIT G6) + escape-scan baseline

**Artifact:** 004-DR-DECR
**Decided:** 2026-07-29
**Status:** RATIFIED (implements bead `buzz-4ei.3`; TEST_AUDIT.md §5 items 2–8)

## Decision 1 — hooks ride a tracked `lefthook-local.yml`

The fork-lane gates are wired through a **committed `lefthook-local.yml`**:
upstream ships `lefthook.yml` but no local-override file, lefthook merges the
two automatically, and upstream's `.gitignore` does not ignore it — so the
file is additive, versioned, and active for every clone of this fork without
touching any upstream-owned path.

Rejected alternatives:
- **Fork-owned `.github/workflows/fork-gates.yml`** — technically additive,
  but `FORK.md` treats `.github/` as upstream turf, and Actions dispatch has
  an external failure mode (org billing) the estate just spent a night
  routing around.
- **Manual invocation only** — no enforcement; the additive-only invariant
  was already violated once (TEST_AUDIT F1, caught pre-commit) proving the
  gate must be automatic.

## What is wired where

| Hook | Gate | Guards |
|---|---|---|
| pre-commit | `scripts/audit-harness escape-scan --staged` | public fork: nothing secret-shaped or REFUSE-patterned reaches a commit |
| pre-push | `scripts/fork-gates/check-additive-only.sh` | no upstream-owned path modified vs `upstream/main` |
| pre-push | `scripts/fork-gates/check-must-survive.sh` | governance set survives rebases |
| pre-push | `scripts/audit-harness verify` | hash-pinned policy files (`.harness-hash`, patterns in `.harness-hash-extra-patterns`) haven't drifted |

`check-additive-only.sh` carries the machine form of the FORK.md allowlist +
an explicitly-empty `CARRIED_PATCHES` array — the day we carry a patch, it is
named there and removed when upstream merges it.

## Decision 2 — F1 resolution (recorded)

TEST_AUDIT F1 (bd init had modified upstream's `.gitignore` + `AGENTS.md` in
the working tree) was resolved by **option (a): revert to upstream** before
the first commit; beads ignore rules live in `.beads/.gitignore` + the local
git exclude file, and agent guidance lives in fork-owned files. No FORK.md
exception was needed.

## Decision 3 — escape-scan baseline: one approved CHALLENGE

The initial vendoring commit trips exactly one escape-scan CHALLENGE:
`.audit-harness/scripts/escape-scan.sh` **matching its own pattern-definition
lines** ("trivially-true assertion" heuristic) in the diff that vendors it.
Approved as a self-scan artifact of importing the scanner; subsequent commits
do not re-add those lines, so any future CHALLENGE is a real finding and must
be reviewed, never waved through by analogy to this one.

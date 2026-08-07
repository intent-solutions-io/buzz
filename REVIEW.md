# REVIEW.md

Repository-specific guidance for Kilo's automated pull-request reviewer.

Catch defects, unsafe claims, and governance drift that CI cannot judge. Report only findings
introduced by the pull request and verify each against surrounding source.

## Review objective

This repository is **`intent-solutions-io/buzz`, a fork of `block/buzz`** — not a product of ours.
Buzz is Block's Rust relay for team chat; we run upstream published images, digest-pinned, and add
governance files on top. Read `CLAUDE.md` first, then `FORK.md`, then `AGENTS.md` (upstream-owned and
authoritative for all build, test, and architecture questions).

The single highest-value thing you can catch here is a **fork-contract breach**. It has happened
once: PR #16 merged 14 upstream-owned paths onto fork `main` and had to be reverted. The audit is
`000-docs/007-AA-AUDR-fork-contract-breach-2026-08-03.md`. Read it before reviewing anything that
touches an upstream path.

## The fork contract (the rule that outranks everything else)

**This fork is ADDITIVE-ONLY.** `main` tracks upstream `main`. A PR that modifies an upstream-owned
path — code, workflows, lockfiles, docs, `.gitignore`, anything — is a **defect**, regardless of how
good the change is. Good changes go upstream; they do not land here.

The machine form of the contract is the `ALLOW` array in
`scripts/fork-gates/check-additive-only.sh`; its human form is `FORK.md`'s must-survive table. The
two must stay in lockstep — **flag any PR that edits one without the other**.

- Exactly **two** declared divergences from upstream-owned paths exist: `CLAUDE.md` (replaces
  upstream's `AGENTS.md` symlink) and `.github/workflows/fork-gates.yml`. A PR proposing a third is
  a **Critical** finding unless it also amends `FORK.md`, the gate allowlist, and states the
  justification.
- `CARRIED_PATCHES` in the gate script is **empty by design**. An entry is a deliberate, temporary
  carry of a fix upstream has not merged, and must name the upstream PR/issue and be removed on
  merge. A populated `CARRIED_PATCHES` with no upstream reference is a **Critical** finding.
- Adding any **new** root-level or new-prefix file requires adding it to the gate allowlist *and*
  `FORK.md`. A new file that is not on the allowlist fails the gate — if a PR adds one and the gate
  is green, suspect the allowlist was widened silently.

## Two branch lanes — never mix them

| Lane | Branch | Contents |
|---|---|---|
| Fork governance | `main` (via PR) | Additive IS files only: `000-docs/`, `.beads/`, `FORK.md`, `REVIEW.md`, `TEST_AUDIT.md`, `scripts/fork-gates/`, the vendored harness, the two declared divergences |
| Upstream contribution | `contrib/*` | Real Buzz changes destined for `block/buzz`. DCO-signed, comment-first per upstream CONTRIBUTING |

Mixing them is a finding in **both** directions: governance files on a `contrib/*` branch will be
rejected by upstream and leak internal planning into a public PR; upstream code changes on `main`
breach the contract. A `contrib/*` branch must never add intent-only paths (`intent-os/`, `iep/`,
`evidence/private/`, `.env*`, `*.age`, `*.key`, `private/`, `internal/`) or governance files.

## Public-repo disclosure safety

**This repository is public** — GitHub forks of public repos cannot be made private. Treat every
added line as published.

Nothing estate-private belongs here, ever: compose environment files, relay/owner/agent keys, member
data, ingress configuration, hostnames-as-addresses, IP addresses, runbooks, backup configuration.
Those live in the private ops lane (`intent-os` `ops/buzz/`), which this repo points to and never
reproduces. Public-safe planning describes *shape* — asset names and pipeline structure — not
addresses or credentials.

Never reproduce a suspected secret in a review comment; identify only its location and the required
remediation. The vendored harness runs an escape-scan pre-commit, but it is a pattern matcher, not a
judgment: a hostname or member name that no regex flags is still a disclosure finding.

## Naming and authority

`000-docs/006-DR-STND-authoritative-naming-and-boundaries.md` is **canonical** for asset naming and
plane boundaries. Any doc naming a Buzz asset defers to it; where another doc conflicts, `006` wins
and the other is corrected — flag the conflict rather than accepting the newer text.

- `intent-ops-buzz` is a **VPS host**, not a repository.
- Exactly **two** Buzz repositories exist: upstream `block/buzz` and this fork. A PR that references
  any other Buzz repository is asserting something untrue — flag it. Two repositories that earlier
  revisions reserved were retired 2026-08-07 (`006` § *Revision 2026-08-07*).
- `000-docs/001-PP-PLAN-buzz-adoption-master-blueprint.md` is the standing execution authority; its
  completion ledger is updated on every epic close. Flag ledger rows that contradict `.beads/` state.

## Status and evidence integrity

- Green CI proves only the checks that ran — not architecture, operational readiness, live
  integration, owner approval, or production conformance.
- Documentation, closed work, or structural tests are not deployment.
- Flag unsupported terms such as "verified", "proven", or "production-ready" where no command,
  drill, artifact, or receipt is named. Evidence names the command, the result, and the rollback.
- Historical records describe what was known then. Require a dated correction or successor entry
  instead of rewriting them to fit today's narrative — `000-docs/` filing law and the append-only
  discipline of audit records both depend on this.
- An upstream PR referenced as justification must have its **actual state** checked. "Upstream fixed
  it" for an *open* PR is a false claim, and a cheap one to catch.

## Gates that must stay green

Both fork gates run in CI as the required check `fork-contract`
(`.github/workflows/fork-gates.yml`):

```
scripts/fork-gates/check-additive-only.sh   # no upstream-owned path may differ
scripts/fork-gates/check-must-survive.sh    # the governance set is intact
```

The vendored Intent Solutions audit harness pins the fork policy surface (`000-docs/*`, `FORK.md`,
`TEST_AUDIT.md`, `lefthook-local.yml`, both gate scripts) in `.harness-hash`:

- `scripts/audit-harness escape-scan --staged` — pre-commit secret / REFUSE-pattern scan
- `scripts/audit-harness verify` — pre-push pin check; **exit 2 = TAMPERED**
- `scripts/audit-harness init` — re-pin, only *after* a reviewed edit to a pinned file

A PR that edits a pinned file **must** re-pin in the same PR. A PR that re-pins without a
corresponding reviewed content change is the inverse smell — flag it and ask what drifted.

Upstream's own gate is unchanged and applies to any `contrib/*` work: activate hermit
(`. ./bin/activate-hermit`), run `just ci`, and commit with `git commit -s` (DCO is a required
check). Never rewrite a hook command to work around an unconfigured `PATH`.

## Beads

Task state lives in beads (prefix `buzz`); `.beads/issues.jsonl` is the tracked portable mirror, and
the authoritative history is the local Dolt database. Change beads through `bd`/`bd-sync`, never by
hand-editing the JSONL. Flag manual JSONL edits, bulk regeneration, or a bead closed in the mirror
with no evidence in its reason.

## Severity calibration

- **Critical:** an upstream-owned path modified on `main`; a third declared divergence added without
  amending `FORK.md` and the gate allowlist; any credential, key, member datum, hostname-as-address,
  or estate-private configuration committed to this public repo; a `CARRIED_PATCHES` entry with no
  upstream reference; a false claim about production or upstream state that could authorize unsafe
  action.
- **Warning:** governance and contribution lanes mixed; gate allowlist and `FORK.md` drifted apart; a
  pinned file edited without a re-pin; a canonical-record conflict left unresolved; an unsupported
  "verified"/"production-ready" claim; a ledger row contradicting `.beads/` state; a doc naming a
  repository that does not exist.
- **Info:** a concrete maintainability or documentation improvement with real future cost. Use
  sparingly, never for personal preference.

Do not flag formatting-only differences or failures already enforced and reported by tooling.
Severity follows credible impact, not file importance. **Docs-only does not mean low risk here** —
`000-docs/` holds the canonical naming record and the standing execution authority, and a wrong
statement in either propagates to every session that reads it.

## Scope discipline

Most PRs on this fork are governance and documentation, and are small. Review what the PR changed.
Pre-existing drift in unmodified lines is worth *one* note with a suggested deferral, not a demand
that the PR grow — a naming-cleanup PR is not the place to reconcile production status.

## Comments and summary

Comment on an exact changed line only when actionable. Inspect enough context to prove the issue; do
not post speculative or duplicate findings. Explain the impact and the smallest safe correction.

Summarize which lane the PR is in (governance `main` vs `contrib/*`), whether the fork contract
holds, what the gates actually proved, and any disclosure risk. If no actionable finding remains,
respond with `lgtm` and nothing else.

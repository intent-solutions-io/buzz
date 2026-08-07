# CLAUDE.md — intent-solutions-io/buzz (FORK — read this before anything)

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository. It covers **only** what is specific to this fork —
build, test, architecture, and all upstream conventions live in `AGENTS.md`,
which is upstream-owned and authoritative. Do not restate it here; it changes
under us.

> **Declared divergence.** Upstream `block/buzz` ships `CLAUDE.md` as a symlink
> to `AGENTS.md`. This fork replaces it with this file — one of exactly two
> declared divergences from upstream-owned paths (the other is
> `.github/workflows/fork-gates.yml`). Both are listed in `FORK.md`'s
> must-survive table and the fork-gate allowlist.

## Read order (mandatory)

1. **`AGENTS.md`** — upstream's agent contributor guide: repo structure, the
   crate map, `just` recipes, event-kind/`h`-tag design law, desktop/mobile
   rules, screenshot protocol, gotchas. All of it applies unchanged to all
   upstream code.
2. **`FORK.md`** — the fork contract. It governs everything this file
   summarizes.
3. **`000-docs/000-INDEX.md`** — the fork's own planning artifacts.
   `006-DR-STND` is **canonical** for asset naming and plane boundaries; any
   other doc naming a Buzz asset defers to it.

## The fork contract (binding — violations are defects)

- **This fork is ADDITIVE-ONLY.** `main` tracks upstream `main`. Never modify an
  upstream-owned path here — not code, not workflows, not lockfiles, not docs.
  A PR that touches one is a defect (it happened once — PR #16, reverted; audit:
  `000-docs/007-AA-AUDR-fork-contract-breach-2026-08-03.md`).
- **Do NOT customize Buzz.** Block is actively developing it; we run **upstream
  published images**, digest-pinned. No carried patches, no fork relay images,
  no fork-image deploys.
- **Solved problems go UPSTREAM via the `/contribute` system** — repo dossier,
  issue-before-PR, upstream conventions, deterministic gates. Never onto fork
  `main`; never as ad-hoc upstream PRs.
- **A deliberate carry requires a `CARRIED_PATCHES` entry** in
  `scripts/fork-gates/check-additive-only.sh` — it is **empty by design**, and
  the entry is removed the moment upstream merges the patch.

## Two branch lanes — never mix them

| Lane | Branch | Contents |
|---|---|---|
| Fork governance | `main` (via PR) | Additive IS files only: `000-docs/`, `.beads/`, `FORK.md`, `TEST_AUDIT.md`, `scripts/fork-gates/`, vendored harness, the two declared divergences |
| Upstream contribution | `contrib/*` off this org fork | Real Buzz changes destined for `block/buzz`. DCO-signed, comment-first per upstream CONTRIBUTING. **Never** mixed with governance files |

## Commands (fork-lane — these exist nowhere in AGENTS.md)

```bash
# Fork gates — run BOTH before any PR. Same checks are a required CI check on
# main (.github/workflows/fork-gates.yml); the 2026-08-03 breach merged because
# they were local-only.
git fetch upstream main                        # gates diff against upstream/main
scripts/fork-gates/check-additive-only.sh      # no upstream-owned path may differ
scripts/fork-gates/check-must-survive.sh       # governance set intact — run after EVERY rebase

# Vendored Intent Solutions audit harness (v1.3.1) — wired via lefthook-local.yml
scripts/audit-harness escape-scan --staged     # pre-commit: secret / REFUSE-pattern scan
scripts/audit-harness verify                   # pre-push: .harness-hash pin check (exit 2 = TAMPERED)
scripts/audit-harness init                     # re-pin AFTER a reviewed edit to a pinned file
scripts/audit-harness list                     # what is currently pinned
```

`.harness-hash` pins the fork policy surface (`000-docs/*`, `FORK.md`,
`TEST_AUDIT.md`, `lefthook-local.yml`, both gate scripts). Editing any of them
without re-running `init` fails pre-push — that is the point, not a bug.

`lefthook-local.yml` is merged with upstream's `lefthook.yml` by lefthook;
upstream's hooks are untouched. `just setup` / `just hooks` installs both.
Decision record for this wiring: `000-docs/004-DR-DECR-fork-gate-wiring.md`.

**Upstream gate, unchanged** — activate hermit first (`. ./bin/activate-hermit`;
never rewrite hook commands to work around an unconfigured `PATH`), then
`just ci` before any PR, and commit with `git commit -s` (DCO is a required
check). Everything else — `just test`, `just relay`, `just desktop-screenshot`,
crate layout — is in `AGENTS.md`.

## What lives where

- **This fork (public):** code + public-safe planning only (`000-docs/`,
  `.beads/` prefix `buzz`, `FORK.md`, fork gates, vendored audit harness).
- **NOT here, ever:** compose env, relay/owner/agent keys, member data, ingress
  config, runbooks, backups — those live in the private ops lane
  (intent-os `ops/buzz/`). This repo is public by GitHub's fork rules.
- **Task state:** beads, prefix `buzz` (`bd ready`, `bd show <id>`); `.beads/`
  is on the must-survive list and its JSONL mirror is tracked. Mirror changes
  with `bd-sync`, not raw `bd`.
- Execution authority for the adoption program:
  `000-docs/001-PP-PLAN-buzz-adoption-master-blueprint.md`.

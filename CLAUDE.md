# CLAUDE.md — intent-solutions-io/buzz (FORK — read this before anything)

> **Declared divergence.** Upstream `block/buzz` ships `CLAUDE.md` as a symlink to
> `AGENTS.md`. This fork replaces it with this file — one of exactly two declared
> divergences from upstream-owned paths (the other is
> `.github/workflows/fork-gates.yml`). Both are listed in `FORK.md`'s must-survive
> table and the fork-gate allowlist.

## Read order (mandatory)

1. **`AGENTS.md`** — upstream's agent contributor guide. All upstream rules
   (hermit activation, `just ci`, DCO `-s`, Nostr-first design law) apply
   unchanged to all upstream code.
2. **`FORK.md`** — the fork contract. It governs everything this file summarizes.

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
- **Run both fork gates before any PR:**
  `scripts/fork-gates/check-additive-only.sh` and
  `scripts/fork-gates/check-must-survive.sh`. The same checks run in CI
  (`.github/workflows/fork-gates.yml`) as a **required check** on `main` — a PR
  that modifies upstream-owned paths cannot merge.

## What lives where

- **This fork (public):** code + public-safe planning only (`000-docs/`,
  `.beads/` prefix `buzz`, `FORK.md`, fork gates, vendored audit harness).
- **NOT here, ever:** compose env, relay/owner/agent keys, member data, ingress
  config, runbooks, backups — those live in the private ops lane
  (intent-os `ops/buzz/`).
- Execution authority for the adoption program:
  `000-docs/001-PP-PLAN-buzz-adoption-master-blueprint.md`.

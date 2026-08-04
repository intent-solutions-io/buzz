# FORK.md — Intent Solutions fork of block/buzz

This repository is **`intent-solutions-io/buzz`**, a fork of
[`block/buzz`](https://github.com/block/buzz) maintained by Intent Solutions
as the home of our Buzz adoption (self-hosted closed relay for the internal
team). Upstream's own README, CONTRIBUTING, LICENSE, and governance documents
apply unchanged to all upstream code.

## Fork contract

- **Tracking:** `main` tracks upstream `main` and stays rebase-clean. We
  deploy from **upstream published images**; this fork builds images only
  if/when we carry a patch upstream hasn't merged yet.
- **Additive-only:** every Intent Solutions file is one upstream does not
  have. We never modify upstream-owned files (README.md, CONTRIBUTING.md,
  LICENSE, AGENTS.md, TESTING.md, `.gitignore`, workflows, code).
  A dressing commit that touches an upstream path is a defect — breached once
  (PR #16, reverted; audit `000-docs/007-AA-AUDR-fork-contract-breach-2026-08-03.md`).
  **Exactly two declared divergences** are exempt and gate-allowlisted:
  `CLAUDE.md` (upstream's symlink to AGENTS.md, replaced with the fork-contract
  briefing) and `.github/workflows/fork-gates.yml` (this contract's CI
  enforcement, a **required check** on `main`).
- **No customization:** while upstream is in active development we do not
  customize Buzz at all. Solved problems go **upstream** through the
  contribution system (dossier, issue-before-PR, upstream conventions) —
  never onto fork `main`.
- **Upstream contributions ride dedicated `contrib/*` branches** of this org
  fork (owner call 2026-07-28: all Buzz lives in the org) — DCO sign-off,
  comment-first per upstream's CONTRIBUTING, never mixed with the additive
  governance files above.

## Must-survive set (files that must survive any rebase against upstream)

| Path | Purpose |
|---|---|
| `FORK.md` | this contract |
| `000-docs/` | Intent Solutions planning artifacts (master blueprint, decision record, deploy posture) |
| `.beads/` (tracked subset) | task tracking for the adoption program (prefix `buzz`) |
| `TEST_AUDIT.md` | testing-SOP baseline audit |
| `scripts/fork-gates/` | machine enforcement of this contract (additive-only + must-survive checks) |
| `scripts/audit-harness` + `.audit-harness/` | vendored IS audit harness (escape-scan, hash verify) |
| `.harness-hash` + `.harness-hash-extra-patterns` | hash-pin manifest for the fork policy surface |
| `lefthook-local.yml` | fork-lane hook wiring (merged with upstream's lefthook.yml; see `000-docs/004`) |
| `CLAUDE.md` | declared divergence: replaces upstream's AGENTS.md symlink with the fork-contract briefing |
| `.github/workflows/fork-gates.yml` | declared divergence: CI enforcement of this contract (required check on `main`) |

After any rebase: run `scripts/fork-gates/check-must-survive.sh` then
`scripts/fork-gates/check-additive-only.sh` — together they assert this table
exists and that `git diff upstream/main` shows **only** paths from it (plus
any deliberately carried patch named in the gate script).

## What is deliberately NOT here

Anything estate-specific: compose environment files, relay/owner/agent keys,
member data, ingress configuration, runbooks, backup configuration. Those
live in Intent Solutions' private operations repo. This fork is public by
GitHub's fork rules and holds code and public-safe planning only.

## Security

For vulnerabilities in Buzz itself, follow upstream's `SECURITY.md`.
For anything specific to Intent Solutions' deployment, contact
`jeremy@intentsolutions.io` — do not open a public issue.

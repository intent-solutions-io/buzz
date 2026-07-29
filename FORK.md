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
  LICENSE, AGENTS.md, CLAUDE.md, TESTING.md, `.gitignore`, workflows, code).
  A dressing commit that touches an upstream path is a defect.
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
| `TEST_AUDIT.md` (when present) | testing-SOP baseline audit |

After any rebase: verify these paths exist, then `git diff upstream/main --stat`
must show **only** paths from this table (plus any deliberately carried patch).

## What is deliberately NOT here

Anything estate-specific: compose environment files, relay/owner/agent keys,
member data, ingress configuration, runbooks, backup configuration. Those
live in Intent Solutions' private operations repo. This fork is public by
GitHub's fork rules and holds code and public-safe planning only.

## Security

For vulnerabilities in Buzz itself, follow upstream's `SECURITY.md`.
For anything specific to Intent Solutions' deployment, contact
`jeremy@intentsolutions.io` — do not open a public issue.

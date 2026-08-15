# 000-docs index — intent-solutions-io/buzz

Filed per Document Filing Standard v4.4 (`NNN-CC-ABCD-description.md`, flat).
This directory is an Intent Solutions **addition** to the fork — upstream
`block/buzz` does not carry it. See `FORK.md` for the fork relationship.

| # | Artifact | What it is |
|---|---|---|
| 001 | [PP-PLAN — Buzz self-hosting blueprint](001-PP-PLAN-buzz-adoption-master-blueprint.md) | Current public-safe architecture: thin upstream-tracking fork, minimum production baseline, manual upgrades, recovery requirements, optional components, and truthful state ledger. |
| 002 | [DR-DECR — Adoption decision record](002-DR-DECR-buzz-adoption-decision-record.md) | Why Buzz, alternatives, accepted risks, consequences. |
| 003 | [OD-DEPL — Deploy posture (public-safe)](003-OD-DEPL-deploy-posture-public.md) | Hosting shape, wrapped update lane, edge controls, go-live gates. Operator detail lives in the private ops lane. |
| 004 | [DR-DECR — Fork-gate wiring](004-DR-DECR-fork-gate-wiring.md) | TEST_AUDIT G6 decision: tracked `lefthook-local.yml` + fork gates + hash pinning; F1 resolution; escape-scan baseline. |
| 005 | [DR-DECR — Dedicated production VPS topology](005-DR-DECR-dedicated-vps-topology.md) | Owner decision (2026-07-29): production on a dedicated VPS; the shared-host stack becomes permanent staging. Supersedes the one-server answer in `001`/`003`. |
| 006 | [DR-STND — Authoritative naming & boundaries](006-DR-STND-authoritative-naming-and-boundaries.md) | **CANONICAL** (owner amendment 2026-07-29, FINAL): the six Buzz assets, the host-vs-repo disambiguation rule, the four-plane flow, and the two gates (contribution vs deployment). Any doc naming a Buzz asset defers to this. |
| 007 | [AA-AUDR — Fork-contract breach audit 2026-08-03](007-AA-AUDR-fork-contract-breach-2026-08-03.md) | PR #16 merged 14 upstream-owned paths onto fork `main` (process breach only; prod untouched). Divergence inventory, causal chain (gates never in CI), remediation: revert → repair-branch sync → upstream via the contribution lane → gates as a required CI check. |

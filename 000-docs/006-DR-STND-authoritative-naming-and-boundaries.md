# Authoritative Buzz naming & boundaries record

> **Status: CANONICAL.** This is the single source of truth for every Buzz asset
> name and the boundary between them. Owner amendment 2026-07-29; narrowed by
> **Revision 2026-08-07** (below). It supersedes every earlier statement that
> combined the fork, the production host, or the ops lane. Any doc that names a
> Buzz asset defers to this record; where another doc conflicts, this one wins
> and the other is corrected.
>
> Filed per Document Filing Standard v4.4. Public-safe: this record names
> assets and describes the pipeline shape only — no hostnames-as-addresses, no
> IPs, no keys, no member data. Every operator-private detail lives in the
> private ops lane (`intent-os` `ops/buzz/`), which this record points to but
> never reproduces.

## Revision 2026-08-07 — two phantom repositories retired

The original record listed **six** assets. Two of them were repositories that
had never been created and now never will be:

- `intent-solutions-io/intent-ops-buzz` — the Track-C **contributor lab**.
  Track C is closed as deferred-indefinitely: the contribution practice has
  produced one upstream PR (`block/buzz#4722`) that needed no lab, and the
  flagship candidate the lab was designed to verify was dropped (Block fixed
  the relay half independently in `#4196`; the desktop half was a fork-local
  defect). Its parked architecture draft now lives at `intent-os`
  `ops/buzz/PLAN-contrib-lab-architecture.md`, marked DEFERRED — the test-layer
  taxonomy and fault matrix in it apply to the relay we run **today**,
  independent of any lab repo.
- `intent-solutions-io/intent-ops-buzz-plugin` — the deferred operator plugin.
  Still deferred; if it is ever built its name is chosen then, not reserved now.

Retiring the lab repository also retires the reason the old §3 existed. That
section defined a "never write the bare phrase `intent-ops-buzz`" rule because a
phantom repository had been given the same string as the production host. With
the phantom gone there is no collision, so **the rule is deleted rather than
enforced** — a name that needs a footnote on every mention is the defect.

**The production host name is unchanged.** `intent-ops-buzz` is a real VPS with
DNS, systemd units, compose files, and backup scripts; the overwhelming majority
of references to that string across the estate are to the host and are correct.

## 1. Why this record exists

Early planning blurred the code fork, the live ops lane, and the production host
into one "Buzz repo." They are distinct planes with distinct trust levels,
distinct secrets postures, and distinct answers to "does this submit upstream?"
Conflating them is how prod credentials leak into a PR runner or how an
untrusted fork branch gets deployed. This record fixes the names and the
boundaries so no session has to re-derive them.

## 2. The four assets (exact identifiers)

| Asset | Exact identifier | Type | Purpose | Holds secrets? | Submits upstream? |
|---|---|---|---|---|---|
| **Upstream** | `block/buzz` | repo | official source of truth for Buzz | — | n/a |
| **Code fork** | `intent-solutions-io/buzz` | repo (fork of `block/buzz`) | clean `contrib/*` branches → PRs to `block/buzz` **only**; additive-only IS overlay (`000-docs/`, `FORK.md`, beads) | **NO** | **YES** |
| **Production host** | `intent-ops-buzz` | **VPS host** (NOT a repo) | the deployed prod relay | runtime secrets only | n/a |
| **Live ops lane** | `intent-solutions-io/intent-os` path `ops/buzz/` | repo path | authoritative prod state: digest, deploy/backup/restore/monitor/promotion records, runbooks | **YES** (sops-encrypted) | n/a |

Every asset above **exists**. There are exactly two Buzz repositories — upstream
and the fork. The personal fork `jeremylongshore/buzz` is **retired**; all Buzz
work lives under the org. Two further repositories that earlier revisions of
this record reserved were never created and have been retired outright — see
*Revision 2026-08-07*.

## 3. The three-plane flow

Each plane does exactly one job. The Intent Eval Platform **decides** what the
evidence means; Intent OS **records** what is approved and running; the host
**runs** it.

```text
 block/buzz  ◄──PR──  intent-solutions-io/buzz          (contribute: clean contrib/* branches)
                          │ candidate SHA + gate evidence
                          ▼
                 Intent Eval Platform (IEP)               (DECIDE: evaluate / sign / gate)
                          │ decision + evidence digest
                          ▼
              intent-os  ops/buzz/  (the ops lane)         (RECORD: approval + exact digest)
                          │ approved digest
                          ▼
              intent-ops-buzz PRODUCTION HOST              (RUN: deploy exact digest)
                          │ post-deploy smoke evidence
                          └──────────────► back to intent-os ops/buzz  (RECORD: deploy evidence)
```

## 4. Two separate gates

A change that is safe to **submit upstream** is **not** automatically safe to
**deploy**. Evidence comes from upstream CI (`just ci`, the required checks on
`block/buzz`) plus this fork's own gates — additive-only, must-survive,
escape-scan, and the vendored audit harness. IEP renders each verdict.

| Gate | Question | Verdicts |
|---|---|---|
| **Contribution gate** | Should this go to `block/buzz`? | `SUBMIT` / `HOLD` / `NEEDS_HUMAN_REVIEW` / `INVALID_EVIDENCE` |
| **Deployment gate** | Should this merged commit/image be promoted into the prod relay? | `ship` / `no_ship` / `advisory` / `error` |

The deployment gate adds everything the contribution gate does not check:
Compose conformance, migrations, backup, restore, upgrade, rollback,
persistence, monitoring, CORS, pairing, image scan.

## 5. Boundaries — what may and may not cross plane lines

- **Secrets** live only in the ops lane (`ops/buzz/`, sops-encrypted) and as
  runtime state on the production host. The code fork **never** holds secrets.
  Untrusted candidate / fork-PR code runs on disposable, isolated runners with
  **no** prod credentials, **no** SSH, and **no** Docker socket. The prod host
  is **not** a general-purpose PR runner.
- **The code fork stays rebase-clean:** IS additions are additive-only; internal
  tooling never enters the fork unless it is deliberately proposed upstream.
  A `contrib/*` branch must not add intent-only paths (`intent-os/`, `iep/`,
  `evidence/private/`, `.env*`, `*.age`, `*.key`, `private/`, `internal/`).
- **The ops lane is the only ops authority.** Prod state — digests, deploy and
  restore records, runbooks — lives in `intent-os` `ops/buzz/` and nowhere else.
  No second ops repo is created for any reason.
- **IEP is reused, not rebuilt.** Anything that emits gate evidence depends only
  on the published `@intentsolutions/core` schemas/validators and emits
  `gate-result/v1` rows through the existing signing path; it does not
  re-implement evaluation or signing.

## 6. Relationship to the other fork docs

- `001` (master blueprint) — the completion ledger and phase tree; reconciled
  to prod-up alongside this record. Where `001` named an asset loosely, this
  record is authoritative.
- `005` (dedicated-VPS topology) — established the prod host as a dedicated VPS
  and the shared-host stack as permanent staging; this record names those
  assets precisely.
- The contributor-lab architecture draft is parked, not filed here — it lives in
  the private ops lane at `intent-os` `ops/buzz/PLAN-contrib-lab-architecture.md`
  as a DEFERRED plan. See *Revision 2026-08-07* for why.

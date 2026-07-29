# Authoritative Buzz naming & boundaries record

> **Status: CANONICAL.** This is the single source of truth for every Buzz asset
> name and the boundary between them. Owner amendment 2026-07-29 (FINAL). It
> supersedes every earlier statement that combined the fork, the contributor
> lab, the production host, or the ops lane. Any doc that names a Buzz asset
> defers to this record; where another doc conflicts, this one wins and the
> other is corrected.
>
> Filed per Document Filing Standard v4.4. Public-safe: this record names
> assets and describes the pipeline shape only — no hostnames-as-addresses, no
> IPs, no keys, no member data. Every operator-private detail lives in the
> private ops lane (`intent-os` `ops/buzz/`), which this record points to but
> never reproduces.

## 1. Why this record exists

Two of the assets below deliberately share the string `intent-ops-buzz` — one
is a **VPS host**, the other is a **GitHub repository**. Early planning also
blurred the code fork, the contribution/verification lab, and the live ops
lane into one "Buzz repo." They are distinct planes with distinct trust levels,
distinct secrets postures, and distinct answers to "does this submit upstream?"
Conflating them is how prod credentials leak into a PR runner or how an
untrusted fork branch gets deployed. This record fixes the names and the
boundaries so no session has to re-derive them.

## 2. The six assets (exact identifiers)

| Asset | Exact identifier | Type | Purpose | Holds secrets? | Submits upstream? |
|---|---|---|---|---|---|
| **Upstream** | `block/buzz` | repo | official source of truth for Buzz | — | n/a |
| **Code fork** | `intent-solutions-io/buzz` | repo (fork of `block/buzz`) | clean `contrib/*` branches → PRs to `block/buzz` **only**; additive-only IS overlay (`000-docs/`, `FORK.md`, beads) | **NO** | **YES** |
| **Contributor lab** | `intent-solutions-io/intent-ops-buzz` | repo (**NOT a fork**) | reproducible test runner: self-host / fault / deployment conformance, PR evidence, IEP adapter, CI orchestration | **NO** | **NO** |
| **Production host** | `intent-ops-buzz` | **VPS host** (NOT a repo) | the deployed prod relay | runtime secrets only | n/a |
| **Live ops lane** | `intent-solutions-io/intent-os` path `ops/buzz/` | repo path | authoritative prod state: digest, deploy/backup/restore/monitor/promotion records, runbooks | **YES** (sops-encrypted) | n/a |
| **Deferred plugin** | `intent-solutions-io/intent-ops-buzz-plugin` | repo | operator plugin for the CCPI marketplace — **DEFERRED, out of scope now** | — | **NO** |

The contributor lab and the deferred plugin repos **do not exist yet** — that is
correct. They are created only when their track opens (lab = Track C; plugin =
gauged from the real install cycle, owner call 2026-07-29). The personal fork
`jeremylongshore/buzz` is **retired** — all Buzz work lives under the org.

## 3. The disambiguation rule (non-negotiable)

The production **host** and the contributor-lab **repository** share the string
`intent-ops-buzz`. **NEVER use the bare phrase.** Always write:

- "`intent-ops-buzz` **production host**" (or "the prod host", "the Buzz VPS"), **or**
- "`intent-ops-buzz` **repository**" (or "the contributor lab").

A bare `intent-ops-buzz` in any doc, commit, bead, or prompt is a defect — fix
it on sight.

## 4. The four-plane flow

Each plane does exactly one job. The lab **executes** tests; the Intent Eval
Platform **decides** what the evidence means; Intent OS **records** what is
approved and running; the host **runs** it.

```text
 block/buzz  ◄──PR──  intent-solutions-io/buzz          (contribute: clean contrib/* branches)
                          │ candidate SHA
                          ▼
              intent-ops-buzz REPOSITORY (the lab)        (EXECUTE: run tests, normalize evidence)
                          │ normalized gate-result/v1 evidence bundle
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

## 5. Two separate gates

A change that is safe to **submit upstream** is **not** automatically safe to
**deploy**. The lab produces evidence for both; IEP renders each verdict.

| Gate | Question | Verdicts |
|---|---|---|
| **Contribution gate** | Should this go to `block/buzz`? | `SUBMIT` / `HOLD` / `NEEDS_HUMAN_REVIEW` / `INVALID_EVIDENCE` |
| **Deployment gate** | Should this merged commit/image be promoted into the prod relay? | `ship` / `no_ship` / `advisory` / `error` |

The deployment gate adds everything the contribution gate does not check:
Compose conformance, migrations, backup, restore, upgrade, rollback,
persistence, monitoring, CORS, pairing, image scan.

## 6. Boundaries — what may and may not cross plane lines

- **Secrets** live only in the ops lane (`ops/buzz/`, sops-encrypted) and as
  runtime state on the production host. The code fork and the contributor lab
  **never** hold secrets. Untrusted candidate / fork-PR code runs on
  disposable, isolated runners with **no** prod credentials, **no** SSH, and
  **no** Docker socket. The prod host is **not** a general-purpose PR runner.
- **The code fork stays rebase-clean:** IS additions are additive-only; internal
  tooling never enters the fork unless it is deliberately proposed upstream.
  A `contrib/*` branch must not add intent-only paths (`intent-os/`, `iep/`,
  `evidence/private/`, `.env*`, `*.age`, `*.key`, `private/`, `internal/`).
- **The ops lane is the only ops authority.** Adding the contributor-lab
  repository does **not** create a second ops repo — it is a distinct
  *contribution + verification* plane. Prod state stays in `intent-os`
  `ops/buzz/`.
- **IEP is reused, not rebuilt.** The lab depends only on the published
  `@intentsolutions/core` schemas/validators and emits `gate-result/v1`
  rows through the existing signing path; it does not re-implement evaluation
  or signing.

## 7. Relationship to the other fork docs

- `001` (master blueprint) — the completion ledger and phase tree; reconciled
  to prod-up alongside this record. Where `001` named an asset loosely, this
  record is authoritative.
- `005` (dedicated-VPS topology) — established the prod host as a dedicated VPS
  and the shared-host stack as permanent staging; this record names those
  assets precisely.
- The contributor-lab architecture (parked draft) graduates to a filed artifact
  only in Track C, now that this naming record exists.

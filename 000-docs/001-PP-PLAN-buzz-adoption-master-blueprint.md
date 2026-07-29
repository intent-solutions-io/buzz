# Buzz Adoption Master Blueprint

**Artifact:** 001-PP-PLAN — standing execution authority for this fork
**Repo:** `intent-solutions-io/buzz` (fork of [`block/buzz`](https://github.com/block/buzz))
**Status:** ACTIVE — Phase 2 in flight (topology revised 2026-07-29, see `005`)
**Rule of use:** execution prompts for any epic below are **extracted from this
document — never re-derived per session**. Bead epics are hand-rolled FROM this
blueprint (design-first, one epic at a time), each mirrored bead ↔ GitHub issue ↔
Plane. Any session that completes an epic updates the completion ledger below
before ending.

> **Public/private split (architectural):** this fork is public — GitHub forks of
> public repos cannot be made private. It therefore holds **code and public-safe
> planning only**. Every operator-private detail (concrete hosts, keys, member
> data, compose env, ingress config, runbooks, backup config) lives in the
> private operations repo under its `ops/buzz/` lane; this blueprint POINTS
> there and never restates it.

---

## What Buzz is (ground truth, verified 2026-07-28)

- One Rust binary (`buzz-relay`) serves WebSocket + REST + web UI on one port.
  The relay IS the community: one relay URL = one workspace; no federation.
- First-party self-host bundle at `deploy/compose/`: relay + Postgres 17 +
  Redis 7 + MinIO + optional Caddy. Published images `ghcr.io/block/buzz`
  (`:main` explicitly not for production).
- Invite-only closed-relay mode is first-class (`BUZZ_REQUIRE_RELAY_MEMBERSHIP`
  + `BUZZ_REQUIRE_AUTH_TOKEN` + `RELAY_OWNER_PUBKEY`, plus a stable
  `BUZZ_RELAY_PRIVATE_KEY` — the relay's own identity, required for
  membership enforcement to start; key material never documented, sops-held);
  members via `buzz-admin` or invite links. Keypairs generate client-side;
  NIP-42 auth per connection.
- Clients: desktop mature; web client served by the relay; Android young but
  live; iOS lane still maturing.
- Agents: `buzz-acp` bridge runs client-side on an operator machine, connects
  with its own Nostr key, subscribes to @mentions, spawns a harness. Claude
  Code is a Tier-1 builtin harness.
- Honest limitations (upstream's own): bundled MinIO is eval-only; rate
  limiting defined but not enforced; some workflow features stubbed. This is
  **preview-software adoption** — mitigated by closed-relay + invite-only +
  the hardening gates below.
- Loss-critical state: relay private key, Postgres, media bucket, git volume,
  owner key.

## Fork strategy

- **This fork (`intent-solutions-io/buzz`)** is the adoption home: tracking
  branch off upstream `main`, rebase-clean, carries patches only when needed.
  Deploys use **upstream images** on a wrapped update lane; switch to
  fork-built images only if/when we carry a patch upstream hasn't merged.
- **All IS additions are ADDITIVE-ONLY**: add files upstream doesn't have
  (`000-docs/`, `FORK.md`, `.beads/` tracked set, `TEST_AUDIT.md`); never
  modify upstream-owned files (README, CONTRIBUTING, LICENSE, AGENTS.md,
  CLAUDE.md, TESTING.md, `.gitignore`, …). This keeps rebases against
  upstream conflict-free. See `FORK.md` for the must-survive set.
- **Contribution lane rides `contrib/*` branches of this org fork** (owner
  call 2026-07-28 — all Buzz in the org; the briefly-used personal fork is
  retired), worked from the contribute-workspace clone: DCO sign-off,
  comment-first per upstream CONTRIBUTING, small scoped changes. Upstream
  candidates are tracked in the contribute system — not duplicated here.

## Task tracking

This repo runs its own beads database (prefix `buzz`, tracked
`.beads/issues.jsonl`, Dolt-backed with auto-commit on, hooks 5/5). Epic
boundaries are tagged in Dolt (`dolt tag buzz-<epic>-start/-complete`). Beads
are hand-rolled from this blueprint, never bulk-scripted, and mirrored
three-way (bead ↔ GitHub issue ↔ Plane project `BUZZ`).

---

## Completion ledger (update on every epic close)

| Epic | Phase | State | Evidence |
|---|---|---|---|
| E1 — Fork + repo infrastructure | 1 | **COMPLETE** (2026-07-29) | PRs #2 #3 #5 + fork-gates PR; bead `buzz-4ei` closed; gates: additive-only + must-survive + escape-scan + hash-verify wired via `lefthook-local.yml` |
| E2 — Relay hosting stack (**re-designated STAGING**, `005`) | 2 | staging live, in flight (epic `buzz-ocv`: DNS + secrets + closed compose stack live; own Caddy ingress live; backups real + restore drill PROVEN; open: Tauri-CORS, pairing sidecar, updater planted-fault drill, full smoke suite) | GH #8 · Plane BUZZ-2 |
| E2d — Dedicated production host + cutover (Track D, `005`) | 2 | **prod host built + deployed + verified, pre-cutover** (epic `buzz-nry`; PRs #279 #280): `intent-ops-buzz` **production host** bootstrapped to estate conventions; prod relay deployed with fresh secrets serving `buzz-prod.intentsolutions.io`; functional membership probe GREEN, unauth matrix pass, caps verified. Apex `buzz.` cutover + owner desktop-key swap remain (owner-gated). | GH #9 · Plane BUZZ-3 |
| E3 — Hardening + go-live gates (run against PROD) | 2 | in flight — membership probe + unauth HTTP matrix + resource caps + backup/restore PROVEN against prod; remaining BLOCKING: off-site backup leg, updater planted-fault drill (on staging), monitoring alerts exercised, full smoke suite, CORS client verify, pairing verify-or-documented, key runbooks rehearsed | — |
| E4 — Headless administration | 2.5 | not started | — |
| E5 — Team onboarding (all-in) | 3 | not started | — |
| E6 — Agent bridge (`@claude`, isolated) | 4 | not started | — |
| E7 — Governed-brain agent (`@bob`, BYOH) | 4 | staged (follow-up) | — |
| ELab — Contributor laboratory (`intent-solutions-io/intent-ops-buzz` **repository**, Track C) | 6 | not started (repo not yet created — correct; depends on the naming record `006`) | — |
| E8 — Upstream contribution lane (Track D) | 5 | qualified candidates filed | — |
| E9 — Operator plugin (`intent-solutions-io/intent-ops-buzz-plugin`) | 7 | **DEFERRED** — scope gauged from the real install cycle (owner call 2026-07-29); repo not yet created | — |

Asset names are governed by `006-DR-STND-authoritative-naming-and-boundaries.md`
(canonical). Never write the bare phrase `intent-ops-buzz` — it is either the
**production host** or the **repository**; always disambiguate.

(The LMS↔estate integration audit — an adjacent adoption-program workstream —
lives entirely in the private operations repo; it has no phase or epic here.
Phase 6 in this tree is the contributor laboratory, below.)

---

## Dependency-ordered phase tree

### Phase 1 — Fork + repo infrastructure (E1) — FIRST; nothing else starts before it

1. Fork `block/buzz` → `intent-solutions-io/buzz`; clone with upstream remote. ✔
2. Beads + Dolt full activation (prefix `buzz`, hooks 5/5, auto-commit on,
   clean DB — no foreign imports). ✔
3. This blueprint as `000-docs/001`; `000-INDEX.md` as nav layer; adoption
   decision record (`002`); public deploy-posture doc (`003`).
4. `FORK.md` — fork relationship + must-survive set (additive-mode governance;
   zero upstream-path edits, validated per commit).
5. Testing SOP baseline: `/audit-tests` diagnostic → `TEST_AUDIT.md` mapping
   upstream's suite (`just test-unit` / docker integration / e2e via
   buzz-test-client) against the 7-layer taxonomy; then `/implement-tests`
   for gaps with Layer 1 (git hooks) required, in-repo harness only —
   staged for review, never auto-committed.
6. Plane `BUZZ` project + epic mirror + memory seeding (repo memory + estate
   memory + private `ops/buzz/README.md`).

**Exit:** tracking exists; every subsequent step lands as a tracked bead.

### Phase 2 — Relay hosting (E2 staging + E2d prod) + hardening gates (E3)

Depends on: E1. Operator detail: private `ops/buzz/`.

> **Topology (revised 2026-07-29, decision `005`):** production runs on a
> **dedicated VPS**; the stack below, built on the shared estate host, is
> **permanent staging** (drills + release promotion run there, never on
> prod). Prod deploys the same digest-pinned compose with **fresh secrets —
> staging keys never promote**; DNS cuts over at go-live and staging
> renames to `buzz-staging.intentsolutions.io`.

- E2 (staging, epic `buzz-ocv`): compose stack on the shared estate host
  (relay, Postgres 17, Redis 7, MinIO-for-now) beside existing stacks; the
  full closed-relay configuration set from first boot (membership +
  auth-token enforcement, owner pubkey, and the relay's stable identity
  private key); sops-managed secrets; stable-release images pinned by
  digest. Includes the client-path defects surfaced by the external
  infrastructure review (2026-07-29):
  - **Tauri desktop origins** (upstream #3490): the packaged desktop
    client presents its own origins; they must be in the relay CORS
    allowlist or desktop join is blocked. No permissive-CORS shortcuts;
    verify with the packaged client, not a dev build.
  - **Mobile pairing sidecar** (upstream #2734 / PR #2736): the compose
    bundle lacks the pairing sidecar; add an overlay service + ingress
    route, and claim it works only after a real desktop↔mobile pairing.
  - **`buzz-admin` rule** (upstream #2837): admin commands run only inside
    the relay container (env present), never from the host without an
    explicit `DATABASE_URL` — the dev-credential fallback is a trap.
- E2d (prod, epic `buzz-nry`): bootstrap the dedicated host to estate
  conventions → deploy the staging-proven artifacts with fresh secrets →
  DNS cutover → all E3 gates re-run against prod.
- E2b: **wrapped auto-update lane** (not naked `:latest` + auto-migrate):
  per stable release — stop/drain writes → bound snapshot (`pg_dump -Fc` +
  media/git snapshots taken as one named restorable recovery point) →
  promote by digest → auto-migrate → functional probe (member key
  authenticates, publishes, reads back; un-invited key refused) → on any
  failure auto-revert **in order**: stop the new release → restore every
  store from the bound recovery point → repin last-known-good digest →
  start → re-probe → alert. Update window is write-isolated, so the bound
  snapshot loses nothing. RPO ≤ 24 h only for host-loss disasters. The
  promotion checklist (external review, 2026-07-29) additionally requires:
  release-notes review, a **staging boot**, a **probe-hang check**
  (upstream #2723 / PR #2724 — the git-conformance probe can wedge
  startup; our pinned digest boots healthy with
  `BUZZ_GIT_CONFORMANCE_PROBE=true`, but a future image must prove it on
  staging first), and a CORS/Tauri-origin + pairing regression check.
  Upstream's own `backup` command is a checklist, not a backup — our
  `pg_dump` + three-store recovery point stands; the off-site copy rides
  the estate B2/borg chain (there is no "home server").
- E3 (all BLOCKING before any invite goes out — the whole team lands at
  once, so hardening is not pilot-optional):
  - Edge compensating controls (body-size caps, timeouts, security headers,
    OS-level connection limiting) — upstream rate limiting is
    defined-but-unenforced.
  - Co-tenancy caps: mem/cpu/pids limits, size-capped dedicated media volume,
    own bridge network with no route to other stacks.
  - **Unauthenticated probe matrix, off-network**: media PUT, git
    upload/receive-pack, hook endpoints — every one must 401/403.
  - **Backup proof by restore drill**: `pg_dump` artifact (never a live
    datadir copy), three stores snapshotted as one named recovery point,
    restore boots and a sampled event→media/git reference walk finds zero
    dangling refs.
  - Update-wrapper drill: planted bad release → probe fails → auto-revert →
    alert delivered; one kill-mid-migration chaos run on a scratch relay.
  - Key runbooks rehearsed once each: member lost-key (remove → re-invite →
    new identity; verify live-session termination), relay-key incident,
    agent-key rotation. Verify desktop stores the secret key encrypted at
    rest.

### Phase 2.5 — Headless administration (E4)

Depends on: E2. Everything except chatting is CLI/API-administrable
(`buzz-admin` roster + keys + migrate; invite-token API; `buzz-cli` channel
ops). The owner's interface-required moments are exactly two: generating his
own keypair in desktop onboarding, and using the chat.

### Phase 3 — Team onboarding, all-in (E5)

Depends on: E3 gates ALL green. Owner decision: the whole team onboards from
the start; the legacy chat channel stays alive as fallback until Buzz holds
**two stable weeks**; Matrix stays shelved as Plan B.

- Owner first: desktop onboarding → own keypair → pubkey becomes
  `RELAY_OWNER_PUBKEY` → relay restarted into closed mode.
- Channel structure mirrors the existing team structure: onboarding/prep,
  certified members, leads, town square, agents lab. Channel membership is
  the access boundary (relay-enforced per op).
- Leads land days 1–2 as channel stewards; full team same week. Per-member
  invite links via the estate sender. Onboarding email carries two
  non-negotiables: (a) *your key is your identity; back it up; we cannot
  reset it*; (b) *no one — not the owner, not an agent, not "support" — will
  EVER ask for your key; any such request is an attack: screenshot and
  report.*
- Known onboarding risk (tracked as issue #4 on this fork): a member with
  an existing Buzz identity from another community hits "identity already
  connected" with no sign-out path.
- Stability gate: two stable weeks → legacy channel formally retired; can't
  hold → fall back and re-evaluate.

### Phase 4 — Agents in channels (E6, E7)

Depends on: E5 (agents lab channel exists). Agents are team-level chat
members with their own keys; brains run client-side through `buzz-acp` on an
operator machine. One agent serves everyone.

- E6 `@claude` (Tier-1 builtin): **isolation is a hard gate** — channel text
  is attacker-controlled input into a tool-bearing agent, so bridge+harness
  run in a dedicated isolated container: no home-dir mount, no secrets
  beyond the agent's own key, egress allowlisted to the relay only, harness
  deny-by-default. Supervised with restart caps + a liveness sweep (upstream
  #1743: offline agents fail silently — the sweep is the detector). Scope:
  agents-lab channel only.
- E7 `@bob` (Tier-3 BYOH): thin ACP shim over the existing governed-brain
  query API; registered as a custom harness. Waits until E6 proves the
  bridge.

### Phase 5 — Upstream contribution lane (E8, parallel)

Governed by the contribute system. Operating the relay in production feeds
operator repros → scoped fixes. Qualified first touches: upstream #3419
(AppImage path bug), #1743 (offline-agent @mention failure — we will hit
this in Phase 4), #3399 (ACP runtime registry docs). Comment-first, DCO,
human approval on every claim/PR.

### Phase 6 — Contributor laboratory (ELab, Track C)

Depends on: the naming record `006` (done). A **separate** repository —
`intent-solutions-io/intent-ops-buzz` **repository** (NOT a fork, NOT the prod
host of the same name) — that resolves any exact Buzz candidate, mirrors
upstream CI, adds self-hosting/fault/deployment tests, compares against an exact
upstream baseline, produces reusable PR evidence, and hands normalized
`gate-result/v1` evidence to the Intent Eval Platform for the contribution and
deployment gates (`006` §4–§5). The lab **executes**; IEP **decides**; the ops
lane **records**; the host **runs**. Its full architecture (contrib.lock schema,
pinned runner, `buzz-contrib` CLI, test profiles, CI workflows, IEP adapter,
J-Rig dataset, evidence bundle, baseline run, contamination check) graduates
from the parked draft to filed artifacts **in Track C** — not before, per the
owner amendment's "no durable architecture docs until the naming record lands."

### Phase 7 — Operator plugin (E9)

Depends on: E2 basics proven (the references are distilled from real
runbooks, sanitized to generic). Four skills (`buzz-self-host`,
`buzz-admin`, `buzz-agent-wiring`, `buzz-contribute`) + two read-only
subagents (`buzz-relay-doctor`, `buzz-upgrade-auditor`); marketplace
8-field frontmatter; all validation gates blocking; no estate hostnames,
keys, or topology anywhere in the plugin.

**Scope DEFERRED — gauge from the real install (owner call 2026-07-29).** We do
NOT pre-spec the plugin's shape. Base Claude Code can already read the upstream
docs and run compose, so a generic "install helper" is low-value and redundant.
The plugin earns its place ONLY where it encodes **specialized operator
knowledge the upstream docs don't carry and a general agent gets wrong** — the
landmines surfaced by actually operating the relay (e.g. `/health` is a 404 so
the real smoke is `_readiness` + NIP-11; the closed-relay identity-key ordering;
the Tauri CORS trap #3490; the pairing sidecar #2734; the probe-hang #2723; the
`buzz-admin` dev-credential fallback #2837; "upstream's backup is a checklist,
not a backup"; the wrapped-updater vs naked Watchtower; the unauth HTTP probe
matrix). **Decision rule:** run the E2/E3 install + setup + operate cycle first,
capture what a general agent would have gotten wrong, THEN scope the plugin
around exactly that gap (likely the two diagnostic subagents + a hardening/backup
skill, not a tutorial).

- **Branding:** Intent, model-agnostic (matches Buzz's ACP neutrality); never a
  vendor/model name, per the estate's own-vocabulary rule.
- **Home:** its **own standalone repo** `intent-solutions-io/intent-ops-buzz-plugin`
  (per the naming record `006`; not `jeremylongshore`), listed in the CCPI
  marketplace by reference, never vendored into the monorepo — its release
  cadence tracks Buzz, not the marketplace. The repo is not yet created (correct
  — the scope is deferred).
- **Prior-art check (done 2026-07-29):** Buzz ships native agent-harness support
  *for running an agent inside Buzz* (the `buzz-acp` ACP bridge), but no plugin
  exists for *building/operating/self-hosting* a Buzz relay — genuine gap, not a
  duplicate.

---

## Non-goals / standing constraints

- No public announcement of any kind — internal rollout.
- Matrix/Element remains Plan B, unbuilt.
- Nothing estate-private in this repo, ever (enforced by the split above).
- This adoption program is owner-ordered operations; it does not consume a
  Mission Control implementation slot in the estate's Phase-1 discipline.

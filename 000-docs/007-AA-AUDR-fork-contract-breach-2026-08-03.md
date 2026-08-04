# 007-AA-AUDR — Fork-contract breach audit — 2026-08-03

**Status:** FINAL (audit record; append corrections, do not rewrite)
**Scope:** `intent-solutions-io/buzz` fork `main` vs `upstream/main` (`block/buzz`)
**Refs at audit time:** fork `main` = `71ad4571c` (2026-08-03 17:36 -0500);
`upstream/main` = `631b05c88` (2026-08-03 21:51 -0400)
**Verdict:** FORK.md contract breached — **process breach only**. No production,
data, or security impact. Nothing was pushed upstream.

---

## 1. What happened

PR **#16** (`fix(onboarding): auto-join invited members to General`,
merged 2026-08-03 22:36 UTC) was merged onto fork `main` modifying **14
upstream-owned paths** — relay crates, desktop code, all four upstream CI
workflows, and both lockfiles. FORK.md's contract is explicit: the fork is
**additive-only**; "a dressing commit that touches an upstream path is a
defect." The same working session also built fork relay images and chased a
GHCR credential wall — machinery the contract says we don't need, because
deploys use **upstream published images** and `CARRIED_PATCHES` is empty by
design.

The code itself is good — CI-proven, reviewer-hardened, reproduction-tested.
It is in the wrong lane: solved problems go **upstream** through the
contribution system, not onto fork `main`.

## 2. Divergence inventory (fork `main` `71ad4571c` vs `upstream/main`)

`git diff 631b05c88...71ad4571c --name-status` (pinned object IDs — the same
refs `upstream/main`/`origin/main` resolved to at audit time) shows 73
divergent paths.
Classification against the `scripts/fork-gates/check-additive-only.sh`
allowlist:

### 2.1 ALLOW — legitimate additive fork surface (57 paths)

All `A` (added) status, all under allowlisted prefixes:

| Prefix | Paths | Purpose |
|---|---|---|
| `.audit-harness/` | 33 | vendored IS audit harness |
| `.beads/` | 11 | task tracking (prefix `buzz`) |
| `000-docs/` | 7 | planning artifacts (001–006 + index) |
| `scripts/fork-gates/` | 2 | contract enforcement scripts |
| `FORK.md`, `TEST_AUDIT.md`, `lefthook-local.yml`, `scripts/audit-harness` | 4 | contract, test baseline, hook wiring, harness wrapper |

### 2.2 VIOLATIONS — upstream-owned paths modified by PR #16 (14 paths)

Confirmed as exactly the path set of the #16 squash
(`git diff 9b0ff3c92..71ad4571c --name-status`):

| Path | Status |
|---|---|
| `.github/workflows/ci.yml` | M |
| `.github/workflows/docker.yml` | M |
| `.github/workflows/release.yml` | M |
| `.github/workflows/signed-macos-canary.yml` | M |
| `Cargo.lock` | M |
| `crates/buzz-relay/src/api/invites.rs` | M |
| `crates/buzz-relay/src/handlers/side_effects.rs` | M |
| `desktop/src-tauri/Cargo.lock` | M |
| `desktop/src-tauri/src/commands/channels.rs` | M |
| `desktop/src-tauri/src/commands/channels_tests.rs` | M |
| `desktop/src/features/onboarding/welcome.test.mjs` | M |
| `desktop/src/features/onboarding/welcome.ts` | M |
| `desktop/src/features/settings/ui/SettingsPanels.tsx` | M |
| `desktop/tests/e2e/invites-settings-screenshots.spec.ts` | M |

### 2.3 PRE-EXISTING gate failures — not part of #16 (2 paths)

`.harness-hash` and `.harness-hash-extra-patterns` are **added** files
(hash-pin manifests, listed in FORK.md's must-survive table) that were never
added to the gate script's `ALLOW` array. A latent allowlist/contract
mismatch, present before #16. The repair branch fixes the allowlist to
legitimize them.

**Gate run on fork `main` at `71ad4571c`:** `check-additive-only.sh` **FAIL —
16 upstream-owned path(s)** (= 2.2 + 2.3); `check-must-survive.sh` PASS
(10/10 paths).

## 3. Causal chain

1. **The fork gates were never wired into CI.** They ran only via
   `lefthook-local.yml` pre-push — a local hook an agent working through
   tooling that pushes without lefthook (or from a fresh clone without
   `lefthook install`) never executes. The fork's GitHub checks were
   upstream's own CI, which knows nothing about the fork contract.
2. **PR #16 targeted fork `main` instead of the contribution lane.** The
   working agent solved a real bug (invite claims don't join the canonical
   General channel), then landed the fix where it was standing — the fork —
   rather than routing it upstream per FORK.md ("upstream contributions ride
   dedicated `contrib/*` branches").
3. **The merge went green** because the only required signals were upstream
   CI compiles + reviewer comments. Nothing machine-checked the contract at
   the merge boundary. An agent that hadn't read FORK.md had no forcing
   function to encounter it.

Root cause in one line: **the contract lived in prose and a local hook, not
in a required check.**

## 4. What was NOT damaged

- **Production relay:** runs the **upstream published image**, digest-pinned
  (`ghcr.io/block/buzz@sha256:a0f67…` — digest deliberately truncated here;
  this fork is public, and full deployment evidence lives in the private ops
  lane's deployment reference). The fork relay image built during the #16
  session was **never deployed**.
- **Agent runtime:** `buzz-agent:fork-9b0ff3c92` is a **sanctioned** estate
  artifact (private ops decision log entry 039), built from an allowlisted
  fork state — unrelated to the breach.
- **Upstream:** nothing was pushed to `block/buzz`. No upstream PR, issue, or
  branch was created from the breach content.
- **Data / members / keys:** untouched. The relay's Postgres, roster, and
  membership were not part of this work.
- **Fork history:** clean of force-pushes. The breach is one revertable
  squash commit.

## 5. Flagged follow-up (not part of this breach)

**Dormant updater tag suspect:** `buzz-updater.service` pins
`ghcr.io/block/buzz:relay`, but that tag does not currently resolve on GHCR.
The unit is dormant (timer not enabled). **Verify the tag resolves — or
re-pin to a digest — before the timer is ever enabled.** Tracked in the
adoption program's beads.

## 6. Remediation plan (filed with this audit; execution tracked in PRs)

This record is filed **before** remediation completes; each step's completion
evidence is its referenced PR, not this document.

1. **Revert** the #16 squash on fork `main` via PR — no force-push, no
   history rewrite. → fork **PR #18**.
2. **Land the repair branch** `fix/fork-upstream-sync-20260803` (merge-based
   upstream sync to `a5dbdf5e6`, 117 commits + gate-allowlist fix for §2.3)
   via PR; upstream-path collisions resolve to **upstream's side**. → fork
   **PR #19**.
3. **Route the solved problems upstream** through the contribution system
   (dossier, issue-before-PR, upstream conventions) — the invite-claim fix,
   the CI-brittleness findings, and the buildcache finding are candidates.
   No direct upstream PRs outside that lane. Submission runs on the
   contribution system's cadence, not this audit's.
4. **Never again** (planned; PR reference lands when opened): fork gates
   become an **additive** CI workflow (`.github/workflows/fork-gates.yml`)
   and a **required check** on `main`; the fork gains a declared-divergence
   `CLAUDE.md` stating the contract for every future agent; both divergences
   enter `ALLOW` + FORK.md's must-survive table in the same reviewed PR.

**Acceptance for "remediated"** (conditions to verify at completion, then
recorded in the closing PR): both fork-gate scripts PASS on restored `main`;
`git diff upstream/main...main` contains only allowlisted paths; a deliberate
canary PR touching `crates/…` goes red on the required check and is closed
unmerged.

# 009-AA-AUDR — Fork-contract breach audit — 2026-08-16

**Status:** FINAL (audit record; append corrections, do not rewrite)
**Scope:** `intent-solutions-io/buzz` fork `main` vs `upstream/main` (`block/buzz`)
**Refs at audit time:** fork `main` = `468705310`; `upstream/main` = `4a9de1a3a`
(2026-08-31); merge base of the breach window = `a5dbdf5e6` (2026-08-02).
**Verdict:** FORK.md contract breached — **process breach only**. Same class as
the PR #16 breach audited in `007-AA-AUDR-fork-contract-breach-2026-08-03.md`.
No production data, member, or security impact. Nothing was pushed upstream.

---

## 1. What happened

PR **#26** (`fix(invites): add members to default channel`, merged
2026-08-16 23:08 UTC) and PR **#27** (`fix(deploy): restore production
migration compatibility`, merged 2026-08-16 23:37 UTC) landed a **deliberately
carried patch** on fork `main` — the very machinery FORK.md says we do not
run ("no carried patches, no fork relay images, no fork-image deploys";
`CARRIED_PATCHES` is **empty by design**). The carry was *declared* — FORK.md
grew a "Deliberately carried patches" section and the gate script's
`CARRIED_PATCHES` array was populated so both fork gates stayed green — but a
declared carry is still a contract violation of the operating rule adopted
after #16: solved problems go **upstream** through the contribution lane,
never onto fork `main`.

Unlike #16, the gates were in CI and required. They did not fail because the
same PRs widened the gates' own baseline. The lesson of #16 ("the contract
lived in prose, not a required check") has a sequel: **a required check an
author can re-baseline in the same PR is consent, not enforcement.**

## 2. Divergence inventory (breach window `a5dbdf5e6..468705310`)

Upstream-owned paths touched by PRs #26/#27:

### 2.1 Modified upstream-owned paths (11, all `M`; PR #26)

| Path | Status |
|---|---|
| `.env.example` | M |
| `crates/buzz-db/src/channel.rs` | M |
| `crates/buzz-db/src/lib.rs` | M |
| `crates/buzz-db/src/relay_invite.rs` | M |
| `crates/buzz-db/src/relay_members.rs` | M |
| `crates/buzz-relay/src/api/invites.rs` | M |
| `crates/buzz-relay/src/config.rs` | M |
| `desktop/playwright.config.ts` | M |
| `desktop/src/features/onboarding/useClaimInvite.ts` | M |
| `desktop/src/shared/api/inviteHelpers.test.mjs` | M |
| `desktop/src/shared/api/inviteHelpers.ts` | M |

### 2.2 Added into upstream-owned directories (3, all `A`)

| Path | Source |
|---|---|
| `desktop/tests/e2e/manual-invite-join.spec.ts` | PR #26 regression e2e for the carry |
| `migrations/0027_channels_id_lookup_index.sql` | PR #27 byte-for-byte backport of upstream migration 27 |
| `migrations/0028_long_reaction_payloads.sql` | PR #27 byte-for-byte backport of upstream migration 28 |

### 2.3 Fork-owned paths widened to legalize the carry

`FORK.md` (new "Deliberately carried patches" section) and
`scripts/fork-gates/check-additive-only.sh` (`CARRIED_PATCHES` populated with
the 14 paths above). `CLAUDE.md` also shows as a `T` (typechange) against
upstream in any diff — that is the pre-existing **declared divergence**
(fork briefing file replacing upstream's symlink), not part of this breach.

## 3. Causal chain

1. **A real gap existed upstream:** invite claims did not admit the member to
   the deployment-configured default channel (now tracked as upstream
   block/buzz issue **#4307**). The team needed working invites for the
   production rollout that week.
2. **The fix was landed as a fork carry** instead of riding the contribution
   lane, because upstream review latency did not fit the rollout window. The
   authors used the escape hatch FORK.md's carried-patch clause provided —
   and the clause has no counterweight (no expiry, no second approver, no
   required exit bead).
3. **Consequence: production froze on a fork image.** The relay ran the
   fork-built `intent-buzz:9ba98c220` instead of an upstream published
   image, which is exactly the deploy posture ("upstream published images,
   digest-pinned") the contract exists to protect. PR #27 was pure
   fallout-management: the fork image's SQLx checksums forced byte-for-byte
   migration backports to keep the relay booting.

Root cause in one line: **the carried-patch escape hatch let schedule
pressure convert a contribution-lane problem into fork divergence, and the
gate baseline was editable by the same PR that needed it widened.**

## 4. What was NOT damaged

- **Upstream:** nothing was pushed to `block/buzz`. The gap is filed as
  upstream issue #4307 through the contribution lane.
- **Data / members / keys:** untouched; the patch changed admission behavior
  only, and behaved correctly in production while deployed.
- **Fork history:** clean of force-pushes. The carry is ordinary revertable
  merges, superseded by the 2026-08-31 upstream sync rather than reverted.
- **Security:** no security-relevant surface changed; the carry was reviewed
  and CI-proven before merge.

## 5. Remediation (this PR; prod already restored)

1. **Prod back on upstream:** production was rebuilt on the **upstream
   published image** `ghcr.io/block/buzz@sha256:fe092cf9…` (digest truncated
   here; full deployment evidence in the private ops lane) — effective
   2026-09-01. The fork image `intent-buzz:9ba98c220` is retired.
2. **Enrollment moved out of the code path:** the invite→default-channel
   admission now runs as an ops-side watcher (systemd timer) in the private
   ops repo — outside this fork entirely — until upstream #4307 lands the
   real fix.
3. **Fork returned to additive-only** (this PR): merge `upstream/main`
   (`4a9de1a3a`, ~480 commits) with every upstream-owned path resolved to
   upstream's version exactly; delete the carried e2e spec; empty
   `CARRIED_PATCHES`; retire FORK.md's "temporary hotfix" carried-patch
   exception text. `git diff upstream/main..HEAD --name-status` shows only
   allowlisted additive fork paths plus the declared `CLAUDE.md` typechange.
4. **Upstream fix tracked:** block/buzz issue **#4307** is the durable home
   of the invite→default-channel gap; any code contribution rides a
   `contrib/*` branch per the contribution system.

**Acceptance for "remediated"** (verified in this PR): both fork-gate scripts
PASS with `CARRIED_PATCHES` empty; `git diff upstream/main..HEAD` contains
only allowlisted paths; FORK.md's carried-patch section states "None — empty
by design" and points here.

## 6. Flagged follow-up (not part of this breach)

The carried-patch clause survives in FORK.md as an escape hatch. If it is
ever used again, it needs the counterweights it lacked here: a named exit
condition, an expiry, and a review that is not authored by the same PR that
populates `CARRIED_PATCHES`. Tracked in the adoption program's beads.

# Buzz self-hosting blueprint

**Artifact:** 001-PP-PLAN

**Upstream:** [`block/buzz`](https://github.com/block/buzz)

**Fork:** `intent-solutions-io/buzz`

**Status:** ACTIVE — simplified and reconciled 2026-08-15

This document defines the public-safe operating model for the fork. It does not
contain hostnames, credentials, member data, private topology, or live commands.
Those belong only in the private `intent-os/ops/buzz/` deployment lane, which is
a separate repository and is not part of this source tree.

## The decision

Intent Solutions self-hosts Buzz from a public fork of the upstream repository.
That is a normal and supported open-source model:

1. The fork preserves source access and a contribution lane.
2. `upstream/main` remains the source of truth for Buzz code.
3. Production normally runs Block's stable, published relay image pinned by
   immutable digest.
4. The fork builds a production image only while carrying an explicitly declared
   patch that upstream has not merged.
5. Deployment configuration, secrets, backups, and runbooks remain private.

The fork is intentionally thin. Self-hosting does not require maintaining a
second product roadmap or modifying upstream-owned files.

## Required self-hosting baseline

### Source and release policy

- Keep an `upstream` remote pointing to `block/buzz`.
- Regularly synchronize the fork with `upstream/main`.
- Use stable relay releases, never `:main` in production.
- Resolve the selected release to `ghcr.io/block/buzz@sha256:…` before deploy.
- Review upstream release notes before changing the deployed digest.
- Send generally useful code fixes upstream on DCO-signed `contrib/*` branches.

### Runtime stack

The supported baseline follows upstream's compose architecture:

- `buzz-relay`
- PostgreSQL 17
- Redis 7
- S3-compatible media storage (MinIO is acceptable for the current small
  deployment; migrate to managed object storage when scale or durability calls
  for it)
- TLS reverse proxy

The relay and stores run with explicit memory, CPU, PID, restart, health, and
volume policies. Databases and object storage are not publicly exposed.

### Access control

- Require relay authentication and membership.
- Keep a stable relay identity key.
- Keep owner, relay, agent, database, Redis, media, and hook credentials separate.
- Store secrets only in encrypted private operations material and host runtime
  files with restrictive permissions.
- Treat client secret keys as user-owned identities that cannot be reset.

### Backups and recovery

A successful recovery point contains all loss-critical state:

- PostgreSQL custom-format dump
- checksummed media tree
- Git object-volume archive
- deployed compose and environment snapshot
- image, schema, environment, and source provenance

The backup must fail if any required store is absent or cannot be copied. A
freshness marker is written only after the encrypted archive succeeds. The
non-destructive restore drill must verify every artifact, restore PostgreSQL in
scratch, and validate the Git archive. Live restoration remains an explicit
human action.

At least one encrypted copy must live outside the production host. Until that
copy and a restore from it are verified, disaster recovery is **PARTIAL** rather
than proven.

### Upgrades

Relay upgrades are manual, staging-first, and digest-pinned. There is no scheduled
application updater and no raw Watchtower deployment.

The operator:

1. selects a stable upstream relay release;
2. takes a fresh complete recovery point;
3. rehearses the digest on staging or an ephemeral equivalent;
4. runs readiness, authentication, publish/readback, CORS, and applicable pairing
   checks;
5. promotes the same digest to production;
6. records the old digest, new digest, probe result, and rollback command.

Image rollback may be automated inside that operator-invoked action. Destructive
store restoration is never automatic.

## Optional components

These are not prerequisites for a sound self-hosted relay:

| Component | Policy |
|---|---|
| Pairing sidecar | Enable only when desktop/mobile NIP-AB pairing is used. It reuses the same stable relay-image digest. |
| Permanent staging | Optional. An ephemeral rehearsal stack is sufficient if it exercises the production compose shape. |
| Coding or curator agents | Disabled until their own keys, owner authorization, health checks, and narrow permissions are proven. The relay never depends on them. |
| Automated application updates | Not used. Manual upgrades are safer and simpler for preview software. |
| Operator plugin | Deferred until repeated operations demonstrate a real need. |
| AI/news feed automation | Product work, not relay self-hosting infrastructure. Track separately if pursued. |

## Current-state ledger

`VERIFIED` means a live or destructive-equivalent check has a receipt. `PARTIAL`
means useful work exists but an important guarantee remains open. `DEFERRED`
means the component is not required for the relay.

| Area | State | Evidence boundary |
|---|---|---|
| Fork relationship | **VERIFIED** | Upstream remote and additive fork contract exist; synchronization is part of every maintenance pass. |
| Core relay and stores | **VERIFIED** | Stable relay release, PostgreSQL, Redis, media store, TLS, readiness, and resource limits are live. Exact runtime data remains private. |
| Closed-relay controls | **VERIFIED** | Authentication, membership, stable relay identity, and explicit CORS are enabled. |
| Local recovery | **VERIFIED** | Complete versioned recovery point and real scratch PostgreSQL/media/Git verification pass. |
| Off-host recovery | **PARTIAL — BLOCKING DR GAP** | Key custody exists; the production data replica and restore receipt are still required. |
| Relay upgrades | **VERIFIED MANUAL POSTURE** | Scheduled updater retired; stable digest changes are operator-initiated and staging-first. |
| Device pairing | **PARTIAL / OPTIONAL** | Sidecar and public WebSocket route work; one real device pairing is still required for an end-to-end claim. |
| Persistent coding agent | **DEFERRED / DISABLED** | Not required for self-hosting; re-enable only after owner authorization and a successful tagged turn. |
| Team onboarding | **SEPARATE WORKSTREAM** | Membership and channels exist; rollout policy is not a relay infrastructure gate. |

## Fork contract

Fork-governance additions are additive-only and enumerated in `FORK.md`. With the
exception of explicitly documented divergences, files owned by upstream are not
modified on the adoption branch. Any carried code patch must identify its upstream
issue or pull request and be removed when upstream merges the fix.

Public fork checks must use exact matches for files and directory-prefix matches
only for declared directories. A filename that merely starts with an allowed
filename is not allowed.

## Tracking and authority

- This blueprint governs public self-hosting architecture and scope.
- Private operations documentation governs live deployment state.
- Beads is the durable work tracker for this fork. GitHub issues may mirror work
  that benefits from review; a third mandatory tracker is not required.
- Historical decision and audit records remain immutable evidence. When reality
  changes, update this current-state document instead of treating historical prose
  as an instruction.

## Definition of respectably self-hosted

The deployment is technically sound when:

- the relay and dependencies are healthy and privately networked;
- access is closed and identities are recoverable according to policy;
- every production image is an reviewed immutable digest;
- a complete backup fails closed and is monitored for age;
- a restore is periodically proven without touching live stores;
- an independently stored encrypted copy can be restored;
- optional automation can be removed without affecting chat; and
- documentation describes the system that actually exists.

Everything beyond that baseline must justify its operational cost.

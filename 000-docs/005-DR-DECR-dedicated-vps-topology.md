# DR-DECR — Dedicated production VPS; shared-host stack re-designated staging

**Artifact:** 005-DR-DECR · **Date:** 2026-07-29 · **Status:** DECIDED (owner)
**Supersedes:** the one-server topology answer in `003-OD-DEPL` §"Where it
runs" and blueprint `001` Phase 2 as originally written.

## Decision

Buzz **production runs on its own dedicated VPS**, not on the shared estate
host that carries the revenue-serving stacks. The relay stack already built
on the shared host (E2, epic `buzz-ocv`) is **re-designated permanent
STAGING** — it is not discarded: same digest-pinned compose, same gates, and
it becomes the standing drill environment (backup-restore drills and updater
planted-fault drills run there, never against prod).

Concrete host identity, credentials, and bootstrap procedure are
operator-private and live in the private ops repo's `ops/buzz/` lane, per
this fork's public/private split.

## Why

1. **Failure-domain separation.** Buzz is preview software moving fast
   pre-1.0 (upstream's own honest-limitations list: eval-only bundled MinIO,
   rate limiting defined-but-unenforced, stubbed workflow features). A stack
   with that risk profile should not share a host — kernel, disk, memory,
   ingress process — with revenue workloads. An external infrastructure
   review reached the same conclusion independently; the estate's own
   plane-separation lens agrees.
2. **A real staging tier falls out for free.** The two-host shape gives the
   wrapped update lane what it actually wants: promotion candidates boot on
   staging first (including the probe-hang class of upstream regression),
   and destructive drills never touch member data.
3. **Cost is bounded and known** (one additional small VPS) versus the
   unbounded blast radius of a shared-host incident during an all-in,
   whole-team rollout.

## Consequences

- **Fresh production secrets, always**: new relay identity key, new
  bootstrap owner key (until the owner's client-side desktop key swaps in),
  new database/cache/object-store credentials. **Staging keys never
  promote.**
- **DNS cutover**: `buzz.intentsolutions.io` repoints to the dedicated host
  at go-live; the shared-host env renames to
  `buzz-testing.intentsolutions.io` (closed, internal-only).
- **Go-live gates unchanged but re-targeted**: every blocking gate (unauth
  probe matrix off-network, functional membership probe, backup restore
  drill, updater planted-fault drill, key runbooks, resource caps) runs
  against **prod on the dedicated box** before any invite. The restore
  drill restores *staging* from *prod's* backup artifacts, which doubles as
  the off-site-recovery proof.
- **Promotion pipeline**: stable upstream releases are proven on staging
  (boot + probe-hang check + CORS/pairing regression) before their digest
  is promoted to prod by the wrapped updater.
- Tracking: Track D epic `buzz-nry` (GH #9, Plane BUZZ-3); staging epic
  `buzz-ocv` (GH #8, Plane BUZZ-2) re-scoped accordingly.

## Alternatives considered

- **Stay single-host** (the original Phase-2 answer): acceptable for a
  leads-only pilot, rejected for an all-in whole-team adoption — comms
  becomes load-bearing enough to earn its own failure domain on day one.
- **Kubernetes / the upstream Helm chart**: not our shape; compose on a
  plain host matches every other estate stack and the operator tooling.
- **A second ops repo for the deployment**: rejected — the private ops
  repo's `ops/buzz/` lane already is the operator authority; a second repo
  would split it.

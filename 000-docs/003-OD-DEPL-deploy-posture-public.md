# Deploy posture (public-safe summary)

**Artifact:** 003-OD-DEPL
**Status:** ACTIVE — concrete operator detail lives in the private operations
repo (`ops/buzz/` lane), never here.

## Shape

> **Topology revised 2026-07-29 (decision `005`):** production runs on a
> **dedicated VPS** with its **own** Caddy ingress (separate failure
> domain). The stack described below, built on the shared estate host, is
> **permanent staging**. Prod deploys the identical digest-pinned compose
> with **fresh secrets — staging keys never promote**; `buzz.` DNS cuts
> over at go-live and staging renames to `buzz-staging.intentsolutions.io`.
> The per-service compose shape is otherwise as written here.

- **Self-contained compose stack** (on staging today, mirrored to the
  dedicated prod host): `buzz-relay`,
  `buzz-db` (Postgres 17), `buzz-redis` (Redis 7), `buzz-minio` (interim
  media store — upstream marks bundled MinIO eval-only; an S3-compatible
  external store is a follow-up bead). Volumes: pgdata, media, git repos.
- **Closed relay from first boot**: `BUZZ_REQUIRE_RELAY_MEMBERSHIP=true`,
  `BUZZ_REQUIRE_AUTH_TOKEN=true`, `RELAY_OWNER_PUBKEY=<owner>`. Members via
  `buzz-admin` / invite links only.
- **Images**: upstream `ghcr.io/block/buzz` stable relay releases, promoted
  **pinned by digest** — never `:main`, never a floating tag in production.

## Update lane — wrapped, not raw auto-pull

Per new stable relay release, a scheduled updater executes:

1. **Write isolation** — stop (or drain to read-only) the relay for the
   update window, so nothing is written after the snapshot that a rollback
   would silently destroy;
2. **Bound recovery point** — `pg_dump -Fc` plus media-store and git-volume
   snapshots taken back-to-back as ONE named, restorable recovery point
   (never a stale daily as the restore point; "markers" alone are not
   backups — each store must actually restore);
3. **Promote by digest** (provenance verify when upstream publishes
   signatures);
4. **Auto-migrate** (upstream migrations are embedded + advisory-locked),
   then a **functional probe** — a throwaway member key authenticates
   (NIP-42), publishes an event, reads it back; an un-invited key is
   refused. Liveness endpoints alone prove nothing.
5. **On any probe failure: auto-revert, strictly ordered** — stop the new
   release → restore every store from the bound recovery point (Postgres,
   media, git — migrations are forward-only, so the prior image must never
   start against migrated state) → repin the last-known-good digest →
   start → re-run the probe → urgent alert. Bounded recovery, no 3 a.m.
   human.

Stated RPO: zero for the update window itself (write-isolated + bound
snapshot); ≤ 24 h only for host-loss disasters (daily backup chain).
Desktop and mobile clients self-update independently; the Nostr wire
tolerates modest client/relay skew.

## Compensating edge controls

Upstream rate limiting is defined but not enforced, so the edge compensates:
request-body size caps, proxy read/idle timeouts, restrictive security
headers (CSP, nosniff, frame and referrer policies) — the relay serves the
web client + user media same-origin — plus OS-level connection limiting.
Co-tenancy caps (memory/CPU/pids limits, size-capped media volume, isolated
bridge network) ensure the chat stack cannot starve revenue surfaces.

## Go-live gates (all blocking; details in blueprint `001` §E3)

Unauthenticated probe matrix · backup proof by restore drill ·
update-wrapper planted-fault drill · rehearsed key runbooks · resource caps.

## Smoke + rollback

Smoke: `/health`, `/_readiness`, NIP-11 GET, then the functional probe.
Rollback: repin previous digest + `docker compose up -d`; migrations are
forward-only, so the bound pre-upgrade snapshot is the restore point.

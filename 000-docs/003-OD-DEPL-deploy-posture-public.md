# Deploy posture (public-safe summary)

**Artifact:** 003-OD-DEPL
**Status:** ACTIVE — concrete operator detail lives in the private operations
repo (`ops/buzz/` lane), never here.

## Shape

- **One production host** (the existing estate VPS), one Caddy ingress, one
  new self-contained compose stack beside the existing stacks: `buzz-relay`,
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

1. **Bound snapshot** — `pg_dump -Fc` + media/git snapshot markers taken at
   the update event (never a stale daily as the restore point);
2. **Promote by digest** (provenance verify when upstream publishes
   signatures);
3. **Auto-migrate** (upstream migrations are embedded + advisory-locked),
   then a **functional probe** — a throwaway member key authenticates
   (NIP-42), publishes an event, reads it back; an un-invited key is
   refused. Liveness endpoints alone prove nothing.
4. **On any probe failure: auto-revert** — repin last-known-good digest +
   restore the bound snapshot + urgent alert. Bounded recovery, no 3 a.m.
   human.

Stated RPO: ≤ minutes around updates; ≤ 24 h only for host-loss disasters
(daily backup chain). Desktop and mobile clients self-update independently;
the Nostr wire tolerates modest client/relay skew.

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

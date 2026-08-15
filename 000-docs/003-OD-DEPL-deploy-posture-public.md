# Deploy posture (public-safe summary)

**Artifact:** 003-OD-DEPL

**Status:** ACTIVE — reconciled 2026-08-15. Concrete runtime detail lives only
in the private operations repository.

## Shape

- A dedicated production host runs the upstream compose architecture: relay,
  PostgreSQL 17, Redis 7, S3-compatible media storage, and TLS ingress.
- An independent non-production environment may be permanent or ephemeral. Its
  purpose is release rehearsal, not hosting production data.
- Production and non-production use separate keys and credentials.
- Only TLS ingress is public. Databases, Redis, media administration, and health
  ports remain private or loopback-bound.
- Every long-running service has resource limits, a restart policy, persistent
  storage where required, and an explicit health signal.

## Images

Production runs a stable upstream `ghcr.io/block/buzz` relay release resolved to
an immutable digest. It never runs `:main` or a floating tag. The optional pairing
sidecar uses the same relay-image digest.

Fork-built images are allowed only for a declared carried patch that names its
upstream issue or pull request. They are removed when upstream absorbs the fix.

## Closed-relay controls

- relay authentication required;
- relay membership required;
- stable relay identity and explicit owner identity;
- explicit browser and packaged-client CORS origins;
- members admitted through supported administration and invite flows;
- separate credentials for relay, stores, hooks, users, and optional agents.

## Backup posture

The daily encrypted recovery point is successful only when it contains:

- a PostgreSQL custom-format dump;
- a checksummed copy of every media object;
- a readable Git-volume archive;
- the exact compose/environment snapshot; and
- image, schema, source, and environment provenance.

A daily freshness check detects a stopped backup schedule. A weekly
non-destructive drill extracts the newest archive, verifies the manifest and
media checksums, restores PostgreSQL in scratch, and validates the Git archive.
Live restoration requires an explicit human `--in-place` action.

Local recovery is not disaster recovery. An encrypted off-host replica and a
restore receipt from that replica remain mandatory.

## Upgrade posture

Buzz application upgrades are not scheduled. An operator selects a stable
release, takes a fresh complete backup, rehearses it outside production, resolves
the image to a digest, and runs authenticated publish/readback and access-control
checks before promoting the same digest.

If the functional probe fails, the image can be repinned to the prior digest.
Store restoration remains human-gated; an application probe must never
automatically drop a production database.

## Optional surfaces

- Pairing is enabled only when mobile device pairing is needed and must complete
  one real device handshake before an end-to-end claim.
- Coding/curator agents are independent clients, never relay dependencies. They
  remain disabled until their own identity, authorization, health, and least
  privilege are proven.
- Feed automation, plugins, and broader community programming are separate
  product workstreams, not self-hosting requirements.

## Minimum release receipt

Every production digest change records the selected upstream release, resolved
digest, complete recovery-point handle, rehearsal result, production functional
probe, previous digest, and rollback command. Liveness alone is not acceptance.

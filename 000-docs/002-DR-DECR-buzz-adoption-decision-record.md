# Decision Record — Adopt Buzz as the Intent Solutions team-chat surface

**Artifact:** 002-DR-DECR
**Decided:** 2026-07-28 (owner decision)
**Status:** RATIFIED

## Decision

Adopt Block's **Buzz** (Nostr-based team chat for humans + AI agents,
Apache-2.0) as the Intent Solutions internal chat surface, self-hosted as a
closed relay on the estate, with the whole team onboarding from the start
("all-in") and the legacy chat channel kept alive as fallback until Buzz
holds two stable weeks.

## Why Buzz

1. **Humans + agents are first-class peers** — agents join channels with
   their own cryptographic identities via the `buzz-acp` bridge; Claude Code
   is a Tier-1 builtin harness. This matches how the company already works.
2. **Self-hostable in one binary** — the relay is the community; the
   first-party compose bundle fits the estate's existing single-host,
   single-ingress topology with no new moving parts.
3. **Invite-only closed-relay mode is first-class**, which fits an internal,
   never-announced surface.
4. **Apache-2.0 with an active upstream** — an upstream-contribution lane is
   part of the adoption (operator repros → scoped fixes), which feeds the
   company's OSS credibility loop.

## Alternatives considered

- **Matrix/Element** — shelved as Plan B, unbuilt. Heavier operational
  footprint; no first-class agent story.
- **Staying on the legacy channel** — no agent participation, no
  self-hosting, no ownership of the surface.

## Risks accepted (owner-acknowledged)

- **Preview software**: upstream's own honest limitations (eval-only bundled
  MinIO, rate limiting defined but not enforced, stubbed workflow features).
  Mitigation: closed relay, invite-only, and blocking hardening gates before
  any invite (blueprint `001`, Phase 2/E3).
- **Mobile asymmetry**: Android young but live; iOS members ride web/desktop
  until the iOS lane ships.
- **Key-loss UX**: keys are client-side identities; lost key = new identity.
  Mitigation: onboarding non-negotiables + rehearsed lost-key runbook.

## Consequences

- All-in onboarding means every go-live gate is **blocking** before the first
  invite — the hardening is not pilot-optional.
- The fork (`intent-solutions-io/buzz`) becomes a governed IS repo: beads
  tracking, additive-only file discipline, testing SOP baseline.
- Rollback path: fall back to the legacy channel; Matrix remains Plan B.

# TEST_AUDIT.md — Testing baseline audit (fork lane)

> Artifact of the Intent Solutions testing SOP (`/audit-tests`). **Diagnostic only** — this
> audit modifies nothing and recommends only additive, fork-owned changes. Fork context:
> `intent-solutions-io/buzz` is a fork of `block/buzz`; the test suite mapped below is
> **upstream's own work** and is documented here to baseline the fork lane, not to grade or
> change it. Upstream-owned files (Justfile, TESTING.md, lefthook.yml, `.github/workflows/*`,
> all code) are out of remediation scope per `FORK.md`.
>
> Date: 2026-07-28 · Branch: `feat/is-fork-infrastructure` · HEAD == `upstream/main` (no
> committed divergence) · Bead: `buzz-4ei.3`

---

## 1. Repository classification

| Facet | Value |
|---|---|
| Type | Service + desktop-app monorepo (relay server, Tauri desktop, admin/web frontends, mobile) |
| Primary language | Rust — 26-crate workspace (`crates/`), incl. `buzz-relay`, `buzz-core`, `buzz-db`, `buzz-conformance`, `buzz-test-client` |
| Secondary | TypeScript (desktop UI, `admin-web/`, `web/`), Rust-in-Tauri (`desktop/src-tauri/`), Dart/Flutter (`mobile/`) |
| Build tooling | cargo (hermit-pinned toolchain in `bin/`) + `just` (Justfile task runner) + pnpm workspace |
| Test runners | cargo test / cargo-nextest, node:test (desktop TS), vitest (admin-web), Playwright (desktop, web, admin-web), flutter test |
| CI | GitHub Actions — 12 workflow files; `ci.yml` alone has ~20 jobs (path-filtered via dorny/paths-filter) |
| Infra for tests | Postgres + Redis via docker compose (`scripts/run-tests.sh` auto-starts) |
| Deploy surface | Dockerfiles, docker-compose, Helm charts (`deploy/`) — fork deploys from upstream published images per `FORK.md` |

## 2. Upstream test infrastructure — 7-layer map

Counts are ripgrep/find approximations against the working tree.

| Layer | Upstream | Fork additions | Evidence |
|---|---|---|---|
| **L1 — Git hooks** | **PRESENT** | ABSENT | `lefthook.yml`: parallel pre-commit (rust-fmt, desktop/web/mobile fix, glob-scoped to mirror CI path filters), commit-msg (DCO sign-off trailer), pre-push (branch-skew check, `just test-unit`, desktop-check/-test, desktop-tauri-test, mobile-test). Installed via `just setup-hooks`. |
| **L2 — Static analysis** | **PRESENT** | ABSENT | rustfmt + clippy `-D warnings` (CI `rust-lint`), biome (desktop/web/admin-web + root `biome.json`), `tsc --noEmit`, cargo-deny (`deny.toml`, CI `security` job), dead-token-reference grep gate, file-size ratchet, SHA-pinned actions, renovate. |
| **L3 — Unit** | **PRESENT** | ABSENT | Rust: ~5,700 `#[test]`/`#[tokio::test]` fns across ~359 files; `just test-unit` runs cargo-nextest on buzz-core, buzz-auth, buzz-db (`--lib`, infra-free SQL-lint set), buzz-conformance, buzz-push-gateway. Desktop TS: ~340 `*.test.mjs` (node:test). Mobile: ~85 Dart test files (`flutter test`). admin-web: vitest configured but **0 unit test files** (`--passWithNoTests`) — thin, and upstream's call. |
| **L4 — Integration** | **PRESENT** | ABSENT | `just test` / `scripts/run-tests.sh integration` against Postgres + Redis (auto-started); ~33 `crates/*/tests/*.rs` integration files across 9 crates; Postgres-backed buzz-db tests (`#[ignore]`d out of the unit set); CI `backend-integration` job. |
| **L5 — System** | **PRESENT** | ABSENT | CI `desktop-e2e-relay` builds real relay artifacts consumed by `desktop-e2e-integration` (2-shard, real services); multi-tenant conformance replay w/ golden fixtures (`buzz-conformance`); cross-compile + Windows + macOS build jobs; benchmarks (`benchmarks/harbor-buzz-orchestra`, `perf/`). |
| **L6 — E2E** | **PRESENT** | ABSENT | `buzz-test-client` crate: 17 test files, ~230 test fns, majority `#[ignore]`d — require a live relay (`cargo test -p buzz-test-client -- --ignored`, per TESTING.md). Desktop Playwright: ~124 `*.spec.ts` in smoke + integration projects, sharded in CI. Web + admin-web Playwright smoke specs. Mesh hardware suites (`just mesh-e2e-*`) run locally, deliberately not in CI. |
| **L7 — Acceptance** | **PARTIAL** | ABSENT | No Gherkin/BDD, RTM, or persona/journey traceability. Acceptance is implicit: conformance golden fixtures, canary workflows (linux/windows/signed-macos), release-contract checks in CI. Normal for upstream; not a fork remediation target. |

**Honest read:** upstream ships a serious, layered suite — real hooks, real static gates,
thousands of unit tests, infra-backed integration, sharded Playwright E2E, a dedicated E2E
client crate, and canary/release verification. There is no upstream gap the fork should
"fix"; anything upstream-shaped goes upstream via the contribution path in `FORK.md`.

## 3. Fork lane — what THIS fork adds, and its risk surface

Fork additions to date are governance/planning files only — **untested by definition**:

| Fork file | State |
|---|---|
| `FORK.md` (fork contract) | untracked, uncommitted |
| `000-docs/` (4 planning artifacts) | untracked, uncommitted |
| `.beads/` (task tracking, prefix `buzz`) | local |
| `TEST_AUDIT.md` (this file) | new |

The fork's own risk surface is **fork-infrastructure drift**, not application defects:

- **Additive-only invariant** (`FORK.md`): `git diff upstream/main --stat` must show only
  fork-added paths from the must-survive table. This is the fork's single most important
  testable property and currently has **no automated check**.
- **Rebase survival**: after any rebase onto upstream, the must-survive set must still exist.
- **No estate leakage**: fork is public; staged diffs must never carry deployment secrets,
  keys, or private operational detail.

### Finding F1 — additive-only invariant currently violated (working tree)

`git status` shows upstream-owned `.gitignore` (+6 lines of beads ignores) and `AGENTS.md`
(+80-line managed "Beads Issue Tracker" block) **modified in the working tree** — side
effects of `bd init`. `FORK.md` explicitly lists both files as never-modify. HEAD is clean
(== `upstream/main`), so nothing is committed yet, but committing the tree as-is would break
the fork contract on day one. Resolution options (decision for the owner, not this audit):
(a) revert both files to upstream and move the beads guidance into a fork-owned file
(e.g. a `FORK.md` section or `000-docs/` note), or (b) amend `FORK.md` to carve out an
explicit exception for the bd-managed block. Either way, the additive-only gate below would
have caught this — which is the point.

## 4. Gaps — what the IS testing SOP adds (fork lane, additive-only)

Constraint: **new files only.** Never touch Justfile, TESTING.md, lefthook.yml,
`.github/workflows/*` (all upstream-owned). No mutation/coverage work on upstream code.

| # | Gap | Layer | Additive remedy |
|---|---|---|---|
| G1 | No additive-only invariant check | L1/L2 (fork) | New `scripts/fork-gates/check-additive-only.sh`: diff `upstream/main`, fail on any path outside the `FORK.md` must-survive table (+ deliberately carried patches). Run pre-push and post-rebase. |
| G2 | No in-repo enforcement harness | L1 (fork) | In-repo audit-harness: `cargo install intent-audit-harness` or vendored `scripts/audit-harness/` (curl install.sh). Referenced in-repo only — never `~/.claude/` paths. |
| G3 | No escape-scan on staged diffs | L1 (fork) | Harness escape-scan over staged diffs (public fork — REFUSE-pattern + secret-shaped content gate before anything is committed). |
| G4 | No hash-pinning of fork-owned files | L2 (fork) | `audit-harness init` manifest scoped to `FORK.md` + `000-docs/` + fork gate scripts; verify detects silent drift/rebase loss. |
| G5 | No must-survive rebase check | L5 (fork) | Same `scripts/fork-gates/` script family: assert every must-survive path exists after rebase (existence check is cheap; pairs with G1). |
| G6 | Hook wiring without touching `lefthook.yml` | L1 (fork) | Decision needed: a new tracked `lefthook-local.yml` (upstream has none — additive) or documented manual invocation (`just` is upstream-owned too, so no new recipes). A new fork-owned workflow file (`.github/workflows/fork-gates.yml`) is technically additive but sits in a directory `FORK.md` treats as upstream turf — owner call before adding. |

## 5. Handoff — `/implement-tests` items (bead `buzz-4ei.3`)

Additive-only; every item is a **new file**; stage for review, never auto-commit.

1. **Resolve F1 first** (owner decision): revert `.gitignore` + `AGENTS.md` to upstream, or
   ratify a documented exception in `FORK.md`. The gate in item 3 is meaningless while the
   tree violates the contract.
2. Install the harness in-repo: `cargo install intent-audit-harness` (or vendor
   `scripts/audit-harness/` via install.sh).
3. Write `scripts/fork-gates/check-additive-only.sh` — allowlist sourced from the `FORK.md`
   must-survive table; exit non-zero on any other path in `git diff upstream/main --stat`.
4. Write `scripts/fork-gates/check-must-survive.sh` (or fold into item 3) — post-rebase
   existence check for the must-survive set.
5. Wire escape-scan against staged diffs via the installed harness.
6. `audit-harness init` — hash-pin manifest covering fork-owned files.
7. Decide + implement hook wiring (G6): tracked `lefthook-local.yml` vs documented manual
   run vs fork-owned workflow file; record the decision in `000-docs/`.
8. Update the `FORK.md` must-survive table to include `scripts/fork-gates/` (this file is already listed there).

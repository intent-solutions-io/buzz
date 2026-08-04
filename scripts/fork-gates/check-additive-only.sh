#!/usr/bin/env bash
# check-additive-only.sh — enforce the FORK.md contract: this fork only ADDS
# files; it never modifies upstream-owned paths. Fails if `git diff` against
# the upstream tracking ref contains any path outside the fork allowlist.
#
# Usage: scripts/fork-gates/check-additive-only.sh [upstream-ref]
# Default ref: upstream/main (fetched if the remote exists and the ref is stale-ok).
# Wired: lefthook-local.yml pre-push; also run manually after any rebase.
set -euo pipefail

REF="${1:-upstream/main}"
cd "$(git rev-parse --show-toplevel)"

if ! git rev-parse --verify -q "$REF" >/dev/null; then
  echo "fork-gates: upstream ref '$REF' not found — add the remote:" >&2
  echo "  git remote add upstream https://github.com/block/buzz.git && git fetch upstream" >&2
  exit 2
fi

# The fork allowlist — every path prefix this fork is allowed to differ on.
# Keep in lockstep with the FORK.md must-survive table (that table is the
# human contract; this array is its machine form).
ALLOW=(
  "FORK.md"
  "TEST_AUDIT.md"
  "000-docs/"
  ".beads/"
  ".gitleaksignore"
  "lefthook-local.yml"
  "scripts/fork-gates/"
  "scripts/audit-harness"
  ".audit-harness/"
  ".harness-hash"
  ".harness-hash-extra-patterns"
)
# Deliberately carried patches (normally empty — populate ONLY when we carry a
# fix upstream hasn't merged, and remove the entry once upstream merges it).
CARRIED_PATCHES=(
)

violations=0
while IFS= read -r path; do
  [ -z "$path" ] && continue
  ok=0
  for a in "${ALLOW[@]}" "${CARRIED_PATCHES[@]}"; do
    case "$path" in "$a"*) ok=1; break;; esac
  done
  if [ "$ok" = 0 ]; then
    echo "fork-gates: NON-ADDITIVE CHANGE vs $REF: $path" >&2
    violations=$((violations+1))
  fi
done < <(git diff --name-only "$REF"...HEAD)

if [ "$violations" -gt 0 ]; then
  echo "fork-gates: FAIL — $violations upstream-owned path(s) modified (see FORK.md)" >&2
  exit 1
fi
echo "fork-gates: additive-only OK vs $REF"

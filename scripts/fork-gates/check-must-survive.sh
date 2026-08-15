#!/usr/bin/env bash
# check-must-survive.sh — after any rebase onto upstream, every path in the
# FORK.md must-survive set must still exist. Cheap existence check that pairs
# with check-additive-only.sh (which catches modifications; this catches loss).
#
# Usage: scripts/fork-gates/check-must-survive.sh
# Wired: lefthook-local.yml pre-push; run manually right after a rebase.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

MUST_SURVIVE=(
  "FORK.md"
  "REVIEW.md"
  "TEST_AUDIT.md"
  "000-docs/000-INDEX.md"
  "000-docs/001-PP-PLAN-buzz-adoption-master-blueprint.md"
  ".beads/issues.jsonl"
  "lefthook-local.yml"
  "scripts/fork-gates/check-additive-only.sh"
  "scripts/fork-gates/check-must-survive.sh"
  "scripts/fork-gates/test-additive-only.sh"
  "scripts/audit-harness"
  ".audit-harness/VERSION"
  "CLAUDE.md"
  ".github/workflows/fork-gates.yml"
)

missing=0
for p in "${MUST_SURVIVE[@]}"; do
  if [ ! -e "$p" ]; then
    echo "fork-gates: MUST-SURVIVE PATH MISSING: $p" >&2
    missing=$((missing+1))
  fi
done

if [ "$missing" -gt 0 ]; then
  echo "fork-gates: FAIL — $missing must-survive path(s) lost (bad rebase? see FORK.md)" >&2
  exit 1
fi
echo "fork-gates: must-survive set intact (${#MUST_SURVIVE[@]} paths)"

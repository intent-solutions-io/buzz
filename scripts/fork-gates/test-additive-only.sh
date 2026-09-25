#!/usr/bin/env bash
# Regression test: file entries are exact; only entries ending in / are prefixes.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
GATE="$ROOT/scripts/fork-gates/check-additive-only.sh"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

git -C "$WORK" init -q -b main
git -C "$WORK" config user.name test
git -C "$WORK" config user.email test@example.invalid
mkdir -p "$WORK/scripts/fork-gates"
cp "$GATE" "$WORK/scripts/fork-gates/check-additive-only.sh"
printf 'base\n' >"$WORK/README.md"
git -C "$WORK" add .
git -C "$WORK" commit -qm base
git -C "$WORK" branch upstream-main

check_case() { # <path> <allow|reject>
  local path="$1" expected="$2"
  git -C "$WORK" reset -q --hard upstream-main
  mkdir -p "$(dirname "$WORK/$path")"
  printf 'test\n' >"$WORK/$path"
  git -C "$WORK" add "$path"
  git -C "$WORK" commit -qm "case $path"
  rc=0
  ( cd "$WORK" && bash scripts/fork-gates/check-additive-only.sh upstream-main ) >/dev/null 2>&1 || rc=$?
  if [ "$expected" = allow ] && [ "$rc" = 0 ]; then return 0; fi
  if [ "$expected" = reject ] && [ "$rc" = 1 ]; then return 0; fi
  echo "additive-only regression: $path expected=$expected rc=$rc" >&2
  return 1
}

check_case FORK.md allow
check_case FORK.md.evil reject
check_case 000-docs/nested.md allow
check_case scripts/audit-harness-malware reject
echo "fork-gates: exact-file/prefix-directory regression OK"

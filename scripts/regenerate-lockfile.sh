#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/keshav-lockfile.XXXXXX")"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

cd "$repo_root"

if [[ ! -f package.json ]]; then
  echo "package.json not found in $repo_root" >&2
  exit 1
fi

if [[ ! -f package-lock.json ]]; then
  echo "package-lock.json not found in $repo_root" >&2
  exit 1
fi

echo "Preparing clean lockfile workspace: $tmp_dir"
cp package.json package-lock.json "$tmp_dir/"

echo "Regenerating package-lock.json without installing node_modules..."
(
  cd "$tmp_dir"
  npm install --package-lock-only --ignore-scripts
)

echo "Verifying regenerated lockfile with clean npm ci..."
(
  cd "$tmp_dir"
  npm ci --dry-run
)

cp "$tmp_dir/package-lock.json" "$repo_root/package-lock.json"

echo "package-lock.json regenerated and verified."

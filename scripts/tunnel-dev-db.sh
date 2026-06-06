#!/usr/bin/env bash
# tunnel-dev-db.sh — Open an SSH tunnel to the remote dev database.
#
# Usage:
#   ./scripts/tunnel-dev-db.sh            # open tunnel
#   ./scripts/tunnel-dev-db.sh --stop     # kill existing tunnel on LOCAL_DB_PORT
#
# To make executable (first time):
#   chmod +x scripts/tunnel-dev-db.sh
#
# Config via env vars (or .env.local):
#   SSH_DEV_HOST     — remote server hostname/IP (required)
#   SSH_DEV_USER     — SSH login user          (default: root)
#   SSH_DEV_KEY      — path to SSH private key (optional; omit to use SSH agent)
#   REMOTE_DB_HOST   — DB host on the remote server (default: localhost)
#   REMOTE_DB_PORT   — DB port on the remote server (default: 5432)
#   LOCAL_DB_PORT    — local port to forward to  (default: 5433)

set -euo pipefail

# ---------------------------------------------------------------------------
# 1. Load .env.local if present (do not abort if file is missing or unreadable)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$REPO_ROOT/.env.local" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/.env.local" 2>/dev/null || true
  set +a
fi

# ---------------------------------------------------------------------------
# 2. Defaults
# ---------------------------------------------------------------------------
SSH_DEV_HOST="${SSH_DEV_HOST:-}"
SSH_DEV_USER="${SSH_DEV_USER:-root}"
SSH_DEV_KEY="${SSH_DEV_KEY:-}"
REMOTE_DB_HOST="${REMOTE_DB_HOST:-localhost}"
REMOTE_DB_PORT="${REMOTE_DB_PORT:-5432}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-5433}"

# ---------------------------------------------------------------------------
# 3. Parse flags
# ---------------------------------------------------------------------------
STOP_MODE=false
for arg in "$@"; do
  case "$arg" in
    --stop) STOP_MODE=true ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: $0 [--stop]" >&2
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# 4. --stop: kill existing tunnel on LOCAL_DB_PORT
# ---------------------------------------------------------------------------
if [[ "$STOP_MODE" == true ]]; then
  echo "Stopping SSH tunnel on local port $LOCAL_DB_PORT..."
  PIDS="$(lsof -ti:"$LOCAL_DB_PORT" 2>/dev/null || true)"
  if [[ -z "$PIDS" ]]; then
    echo "No process found listening on port $LOCAL_DB_PORT."
  else
    echo "$PIDS" | xargs kill
    echo "Tunnel stopped (killed PIDs: $(echo "$PIDS" | tr '\n' ' '))."
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# 5. Validate required config
# ---------------------------------------------------------------------------
if [[ -z "$SSH_DEV_HOST" ]]; then
  echo "" >&2
  echo "ERROR: SSH_DEV_HOST is not set." >&2
  echo "" >&2
  echo "Set it in .env.local or export it before running this script:" >&2
  echo "  export SSH_DEV_HOST=your.server.ip.or.hostname" >&2
  echo "" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 6. Build SSH command
# ---------------------------------------------------------------------------
SSH_OPTS=(-N -L "${LOCAL_DB_PORT}:${REMOTE_DB_HOST}:${REMOTE_DB_PORT}")

if [[ -n "$SSH_DEV_KEY" ]]; then
  SSH_OPTS+=(-i "$SSH_DEV_KEY")
fi

SSH_TARGET="${SSH_DEV_USER}@${SSH_DEV_HOST}"

# ---------------------------------------------------------------------------
# 7. Trap Ctrl+C / SIGTERM for clean exit
# ---------------------------------------------------------------------------
cleanup() {
  echo ""
  echo "Tunnel closed. Goodbye."
}
trap cleanup INT TERM

# ---------------------------------------------------------------------------
# 8. Print summary and open tunnel
# ---------------------------------------------------------------------------
DB_NAME="${POSTGRES_DB:-keshav_kitchen_dev}"
DB_USER="${POSTGRES_USER:-keshav}"
DB_PASS="${POSTGRES_PASSWORD:-keshav123}"

echo ""
echo "Opening SSH tunnel:"
echo "  ${SSH_TARGET}  →  local port ${LOCAL_DB_PORT}"
echo "  Forwarding: localhost:${LOCAL_DB_PORT} -> ${REMOTE_DB_HOST}:${REMOTE_DB_PORT} (on remote)"
if [[ -n "$SSH_DEV_KEY" ]]; then
  echo "  Key: $SSH_DEV_KEY"
else
  echo "  Key: (using SSH agent / default key)"
fi
echo ""
echo "While the tunnel is active, use this DATABASE_URL in another terminal:"
echo ""
echo "  DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:${LOCAL_DB_PORT}/${DB_NAME}"
echo ""
echo "Press Ctrl+C to close the tunnel."
echo ""

ssh "${SSH_OPTS[@]}" "$SSH_TARGET"

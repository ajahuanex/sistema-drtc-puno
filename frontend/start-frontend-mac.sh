#!/usr/bin/env bash
# Redirige al script principal start-frontend-mac.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/../start-frontend-mac.sh" "$@"

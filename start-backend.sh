#!/usr/bin/env bash
# Redirige a start-backend-mac.sh asegurando compatibilidad en macOS
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/start-backend-mac.sh" "$@"

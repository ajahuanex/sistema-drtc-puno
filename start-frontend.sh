#!/usr/bin/env bash
# Redirige a start-frontend-mac.sh asegurando compatibilidad en macOS
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/start-frontend-mac.sh" "$@"

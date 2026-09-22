#!/usr/bin/env bash
# Desactivar conversión automática de rutas POSIX en Git Bash / MSYS2 en Windows
export MSYS_NO_PATHCONV=1
# Redirige a start-frontend-mac.sh asegurando compatibilidad en macOS
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/start-frontend-mac.sh" "$@"

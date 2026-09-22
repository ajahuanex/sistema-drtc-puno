#!/usr/bin/env bash
# Desactivar conversión automática de rutas POSIX en Git Bash / MSYS2 en Windows
export MSYS_NO_PATHCONV=1

# ==============================================================================
# Script de Inicio de Frontend (SIRRETT - Angular 20) para macOS y Windows (Git Bash)
# ==============================================================================

# Colores para salida de terminal
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Localizar directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/frontend" ]; then
    PROJECT_ROOT="$SCRIPT_DIR"
    FRONTEND_DIR="$SCRIPT_DIR/frontend"
elif [ -f "$SCRIPT_DIR/angular.json" ]; then
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    FRONTEND_DIR="$SCRIPT_DIR"
else
    echo -e "${RED}❌ Error: No se encontró la carpeta 'frontend' en $SCRIPT_DIR${NC}"
    exit 1
fi

PORT="4200"
HOST="localhost"
OPEN_BROWSER=false
FORCE_KILL=false

# Mostrar ayuda
show_help() {
    echo -e "${BOLD}Uso:${NC} ./start-frontend-mac.sh [opciones]"
    echo ""
    echo "Opciones disponibles:"
    echo "  --port <numero>  Cambiar el puerto del servidor (por defecto: 4200)"
    echo "  --host <ip>      Cambiar el host (por defecto: localhost)"
    echo "  --open, -o       Abrir el navegador automáticamente"
    echo "  --kill           Terminar automáticamente cualquier proceso en el puerto 4200"
    echo "  -h, --help       Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./start-frontend-mac.sh"
    echo "  ./start-frontend-mac.sh --open"
    echo "  ./start-frontend-mac.sh --kill --port 4200"
    exit 0
}

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case "$1" in
        --port)
            PORT="$2"
            shift 2
            ;;
        --host)
            HOST="$2"
            shift 2
            ;;
        --open|-o)
            OPEN_BROWSER=true
            shift
            ;;
        --kill)
            FORCE_KILL=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo -e "${RED}Opción desconocida: $1${NC}"
            show_help
            ;;
    esac
done

echo -e "${CYAN}======================================================${NC}"
echo -e "${BOLD}🅰️  Iniciando Frontend SIRRET (Angular 20) en macOS / Windows (Git Bash)${NC}"
echo -e "${CYAN}======================================================${NC}"

# 1. Configurar y validar Node.js compatible (Angular 20 requiere Node 18+, 20+ o 22+)
echo -e "\n${BLUE}[1/3] Verificando versión compatible de Node.js...${NC}"

# Cargar NVM si existe
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1091
    \. "$NVM_DIR/nvm.sh"
fi

# Intentar cambiar a Node 20 o 22 vía NVM si está disponible
if command -v nvm >/dev/null 2>&1; then
    nvm use 20 >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1 || nvm use default >/dev/null 2>&1
fi

# Si no está en PATH una versión moderna pero existe en ~/.nvm/versions/node/, agregarla
NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/v([0-9]+).*/\1/')
fi

if [ "$NODE_MAJOR" -lt 18 ]; then
    if [ -d "$HOME/.nvm/versions/node/v20.20.2/bin" ]; then
        export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
    elif [ -d "$HOME/.nvm/versions/node/v22.23.2/bin" ]; then
        export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
    fi
    NODE_VERSION=$(node -v 2>/dev/null || echo "ninguna")
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/v([0-9]+).*/\1/')
fi

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}❌ Error: Se requiere Node.js >= 18.19 para Angular 20.${NC}"
    echo -e "   Versión actual detectada: ${YELLOW}$NODE_VERSION${NC}"
    echo -e "   Ejecuta en tu terminal: ${BOLD}nvm use 20${NC} o instala Node LTS."
    exit 1
fi

echo -e "${GREEN}✓ Node.js compatible detectado: ${BOLD}$NODE_VERSION${NC} (${CYAN}$(which node)${NC})"

# 2. Entrar a la carpeta frontend y verificar dependencias
cd "$FRONTEND_DIR" || exit 1

# Agregar node_modules/.bin al PATH para que 'ng' esté disponible directamente
export PATH="$FRONTEND_DIR/node_modules/.bin:$PATH"

echo -e "\n${BLUE}[2/3] Verificando dependencias y Angular CLI...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}No se encontró 'node_modules'. Instalando dependencias (npm install)...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error durante npm install${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Dependencias instaladas exitosamente.${NC}"
else
    echo -e "${GREEN}✓ Dependencias verificadas (node_modules existente).${NC}"
fi

# 3. Verificar si el puerto está en uso
echo -e "\n${BLUE}[3/3] Verificando puerto $PORT...${NC}"
OCCUPIED_PID=$(lsof -ti :"$PORT" 2>/dev/null)
if [ -n "$OCCUPIED_PID" ]; then
    if [ "$FORCE_KILL" = true ]; then
        echo -e "${YELLOW}⚠️  Puerto $PORT ocupado por el PID(s): $OCCUPIED_PID. Liberando...${NC}"
        kill -9 $OCCUPIED_PID 2>/dev/null || true
        sleep 1
    else
        echo -e "${YELLOW}⚠️  El puerto $PORT ya está en uso por el proceso con PID: ${BOLD}$OCCUPIED_PID${NC}"
        echo -n "¿Deseas liberar el puerto terminando dicho proceso? [s/N]: "
        read -r RESP
        if [[ "$RESP" =~ ^[sSyY]$ ]]; then
            kill -9 $OCCUPIED_PID 2>/dev/null || true
            sleep 1
            echo -e "${GREEN}✓ Puerto $PORT liberado.${NC}"
        else
            echo -e "${RED}❌ No se puede iniciar el frontend mientras el puerto $PORT esté en uso.${NC}"
            echo -e "Tip: Puedes iniciar con otro puerto usando: ${BOLD}./start-frontend-mac.sh --port 4201${NC}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✓ Puerto $PORT disponible.${NC}"
fi

# Construir comando de arranque
EXTRA_ARGS=""
if [ "$OPEN_BROWSER" = true ]; then
    EXTRA_ARGS="--open"
fi

echo -e "\n${CYAN}======================================================${NC}"
echo -e "${BOLD}⚡ SERVIDOR ANGULAR LISTO PARA INICIAR${NC}"
echo -e "   • URL Aplicación:     ${GREEN}http://${HOST}:${PORT}/${NC}"
echo -e "   • Proxy Backend API:  ${GREEN}http://localhost:8000${NC} (vía proxy.conf.json)"
echo -e "   • Detener servidor:   ${YELLOW}Ctrl + C${NC}"
echo -e "${CYAN}======================================================${NC}\n"

# Iniciar servidor Angular
exec ng serve --proxy-config proxy.conf.json --port "$PORT" --host "$HOST" $EXTRA_ARGS

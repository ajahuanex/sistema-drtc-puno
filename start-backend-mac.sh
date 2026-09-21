#!/usr/bin/env bash
# ==============================================================================
# Script de Inicio de Backend (SIRRETT) para macOS
# Compatible con Bash y Zsh en macOS
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
if [ -d "$SCRIPT_DIR/backend" ]; then
    PROJECT_ROOT="$SCRIPT_DIR"
    BACKEND_DIR="$SCRIPT_DIR/backend"
elif [ -f "$SCRIPT_DIR/main.py" ] && [ -d "$SCRIPT_DIR/app" ]; then
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    BACKEND_DIR="$SCRIPT_DIR"
else
    echo -e "${RED}❌ Error: No se encontró la carpeta 'backend' en $SCRIPT_DIR${NC}"
    exit 1
fi

# Valores por defecto
PORT="8000"
HOST="0.0.0.0"
FORCE_KILL=false
DB_MODE="" # "local", "remote", or "" (usa .env)

# Mostrar ayuda
show_help() {
    echo -e "${BOLD}Uso:${NC} ./start-backend-mac.sh [opciones]"
    echo ""
    echo "Opciones disponibles:"
    echo "  --remote         Conectar a la base de datos MongoDB remota (161.132.52.69)"
    echo "  --local          Conectar a la base de datos MongoDB local (localhost:27017)"
    echo "  --port <numero>  Cambiar el puerto del servidor (por defecto: 8000)"
    echo "  --host <ip>      Cambiar el host del servidor (por defecto: 0.0.0.0)"
    echo "  --kill           Terminar automáticamente cualquier proceso en el puerto antes de iniciar"
    echo "  -h, --help       Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./start-backend-mac.sh"
    echo "  ./start-backend-mac.sh --remote"
    echo "  ./start-backend-mac.sh --kill --port 8000"
    exit 0
}

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case "$1" in
        --remote)
            DB_MODE="remote"
            shift
            ;;
        --local)
            DB_MODE="local"
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --host)
            HOST="$2"
            shift 2
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
echo -e "${BOLD}🚀 Iniciando Backend SIRRET (FastAPI) en macOS${NC}"
echo -e "${CYAN}======================================================${NC}"

# 1. Verificar si el puerto ya está en uso
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
            echo -e "${RED}❌ No se puede iniciar el backend mientras el puerto $PORT esté en uso.${NC}"
            echo -e "Tip: Puedes iniciar con otro puerto usando: ${BOLD}./start-backend-mac.sh --port 8001${NC}"
            exit 1
        fi
    fi
fi

# 2. Ir al directorio backend
cd "$BACKEND_DIR" || exit 1

# 3. Validar / configurar entorno virtual Python
echo -e "\n${BLUE}[1/3] Verificando entorno virtual de Python...${NC}"

VENV_PATH="$BACKEND_DIR/venv"
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${YELLOW}No se encontró venv en $VENV_PATH. Creando nuevo entorno...${NC}"
    if command -v python3 >/dev/null 2>&1; then
        python3 -m venv "$VENV_PATH"
        echo -e "${GREEN}✓ Entorno virtual creado exitosamente.${NC}"
    else
        echo -e "${RED}❌ Error: 'python3' no está instalado en este sistema macOS.${NC}"
        exit 1
    fi
fi

# Activar entorno virtual
if [ -f "$VENV_PATH/bin/activate" ]; then
    # shellcheck disable=SC1091
    source "$VENV_PATH/bin/activate"
    echo -e "${GREEN}✓ Entorno virtual activado (${VENV_PATH})${NC}"
else
    echo -e "${RED}❌ Error: No se encontró script de activación en $VENV_PATH/bin/activate${NC}"
    exit 1
fi

# Verificar uvicorn
if ! python -c "import uvicorn, fastapi" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Faltan dependencias en el entorno virtual. Instalando de requirements.txt...${NC}"
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando dependencias de requirements.txt${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Dependencias instaladas correctamente.${NC}"
fi

# 4. Configurar variables de entorno y Base de Datos
echo -e "\n${BLUE}[2/3] Configurando variables de entorno...${NC}"

# Cargar .env si existe para exportar variables por defecto
if [ -f "$BACKEND_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$BACKEND_DIR/.env"
    set +a
fi

if [ "$DB_MODE" = "remote" ]; then
    export USE_REMOTE_DB="true"
    export MONGODB_TARGET="remote"
    echo -e "${CYAN}→ Modo de base de datos:${NC} ${BOLD}REMOTA${NC} (161.132.52.69)"
elif [ "$DB_MODE" = "local" ]; then
    export USE_REMOTE_DB="false"
    export MONGODB_TARGET="local"
    echo -e "${CYAN}→ Modo de base de datos:${NC} ${BOLD}LOCAL${NC} (localhost:27017)"
else
    # Si no se pasó argumento, respetar lo que haya en backend/.env o default local
    if [ "$USE_REMOTE_DB" = "true" ] || [ "$MONGODB_TARGET" = "remote" ]; then
        echo -e "${CYAN}→ Modo de base de datos (.env):${NC} ${BOLD}REMOTA${NC}"
    else
        echo -e "${CYAN}→ Modo de base de datos (.env):${NC} ${BOLD}LOCAL${NC}"
    fi
fi

# 5. Comprobación rápida de conectividad con MongoDB
echo -e "\n${BLUE}[3/3] Verificando conectividad con base de datos...${NC}"
if [ "$USE_REMOTE_DB" = "true" ] || [ "$MONGODB_TARGET" = "remote" ]; then
    echo -e "${GREEN}✓ Configurado para MongoDB Remoto.${NC}"
else
    # Probar puerto 27017 localmente
    nc -z -w 1 127.0.0.1 27017 >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  ADVERTENCIA: MongoDB local no responde en 127.0.0.1:27017${NC}"
        echo -e "   Si no tienes MongoDB local activo, puedes conectar a la BD remota ejecutando:"
        echo -e "   ${BOLD}./start-backend-mac.sh --remote${NC}"
        echo -e "   O inicia tu contenedor de MongoDB con Docker / Homebrew."
    else
        echo -e "${GREEN}✓ MongoDB local detectado en puerto 27017.${NC}"
    fi
fi

# 6. Lanzar servidor
echo -e "\n${CYAN}======================================================${NC}"
echo -e "${BOLD}⚡ SERVIDOR LISTO PARA INICIAR${NC}"
echo -e "   • API Base URL:       ${GREEN}http://localhost:${PORT}${NC}"
echo -e "   • Swagger UI:         ${GREEN}http://localhost:${PORT}/docs${NC}"
echo -e "   • Redoc UI:           ${GREEN}http://localhost:${PORT}/redoc${NC}"
echo -e "   • Detener servidor:   ${YELLOW}Ctrl + C${NC}"
echo -e "${CYAN}======================================================${NC}\n"

# Iniciar Uvicorn
exec python -m uvicorn app.main:app --host "$HOST" --port "$PORT" --reload

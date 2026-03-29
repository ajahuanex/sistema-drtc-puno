#!/bin/bash
# Script de limpieza de código basura
# Uso: ./scripts/cleanup.sh [--dry-run]

set -e

DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - No se eliminarán archivos"
fi

echo "🧹 Iniciando limpieza de código basura..."

# Crear backup
BACKUP_FILE="backup_limpieza_$(date +%Y%m%d_%H%M%S).tar.gz"
echo "📦 Creando backup: $BACKUP_FILE"

FILES_TO_BACKUP=(
    "test_*.py" "debug_*.py" "verificar_*.py" "diagnosticar_*.py"
    "RESUMEN_*.md" "ESTADO_*.md" "SOLUCION_*.md"
)

if [ "$DRY_RUN" = false ]; then
    tar -czf "$BACKUP_FILE" "${FILES_TO_BACKUP[@]}" 2>/dev/null || true
    echo "✅ Backup creado"
fi

# Función para eliminar archivos
delete_files() {
    local pattern=$1
    local count=$(find . -maxdepth 1 -name "$pattern" 2>/dev/null | wc -l)
    
    if [ $count -gt 0 ]; then
        echo "  Encontrados: $count archivos con patrón '$pattern'"
        if [ "$DRY_RUN" = false ]; then
            find . -maxdepth 1 -name "$pattern" -delete
            echo "  ✅ Eliminados"
        fi
    fi
}

# Eliminar archivos de prueba
echo ""
echo "🗑️  Eliminando archivos de prueba..."
delete_files "test_*.py"
delete_files "debug_*.py"
delete_files "verificar_*.py"
delete_files "diagnosticar_*.py"
delete_files "crear_*.py"
delete_files "actualizar_*.py"
delete_files "migracion_*.py"
delete_files "arreglar_*.py"
delete_files "limpiar_*.py"
delete_files "fix_*.py"
delete_files "reparar_*.py"
delete_files "revertir_*.py"
delete_files "simular_*.py"
delete_files "check_*.py"
delete_files "probar_*.py"
delete_files "start_*.py"
delete_files "restart_*.py"
delete_files "restore_*.py"
delete_files "obtener_*.py"
delete_files "insertar_*.py"
delete_files "iniciar_*.py"
delete_files "inicializar_*.py"
delete_files "activar_*.py"
delete_files "borrar_*.py"
delete_files "agregar_*.py"
delete_files "analizar_*.py"
delete_files "arreglo_*.py"
delete_files "capturar_*.py"
delete_files "clean_*.py"
delete_files "consultar_*.py"
delete_files "convertir_*.py"
delete_files "corregir_*.py"
delete_files "demo_*.py"
delete_files "ejecutar_*.py"
delete_files "encontrar_*.py"
delete_files "generar_*.py"
delete_files "importar_*.py"
delete_files "listar_*.py"
delete_files "mostrar_*.py"
delete_files "optimizar_*.py"
delete_files "reset_*.py"
delete_files "simple_*.py"
delete_files "solucion_*.py"

# Eliminar documentos de proceso
echo ""
echo "📄 Eliminando documentos de proceso..."
delete_files "RESUMEN_*.md"
delete_files "ESTADO_*.md"
delete_files "SOLUCION_*.md"
delete_files "PLAN_*.md"
delete_files "ANALISIS_*.md"
delete_files "ARREGLO_*.md"
delete_files "CAMBIOS_*.md"
delete_files "CHECKLIST_*.md"
delete_files "CORRECCION_*.md"
delete_files "CORRECCIONES_*.md"
delete_files "DEBUG_*.md"
delete_files "DEPURACION_*.md"
delete_files "DESPLIEGUE_*.md"
delete_files "DIAGNOSTICO_*.md"
delete_files "DISEÑO_*.md"
delete_files "EJEMPLO_*.md"
delete_files "ELIMINACION_*.md"
delete_files "EMPEZAR_*.md"
delete_files "EMPRESAS_*.md"
delete_files "ESTADISTICAS_*.md"
delete_files "ESTRATEGIA_*.md"
delete_files "EXITO_*.md"
delete_files "FASE_*.md"
delete_files "FILTRO_*.md"
delete_files "FIX_*.md"
delete_files "FORMATEO_*.md"
delete_files "FORMATO_*.md"
delete_files "FRONTEND_*.md"
delete_files "FUENTES_*.md"
delete_files "FUNCIONALIDAD_*.md"
delete_files "FUNCIONALIDADES_*.md"
delete_files "GITHUB_*.md"
delete_files "GUIA_*.md"
delete_files "HABILITACION_*.md"
delete_files "HACER_*.md"
delete_files "ICONOS_*.md"
delete_files "IMPLEMENTACION_*.md"
delete_files "INDICE_*.md"
delete_files "INICIO_*.md"
delete_files "INSTRUCCIONES_*.md"
delete_files "INTEGRACION_*.md"
delete_files "LIMPIAR_*.md"
delete_files "LIMPIEZA_*.md"
delete_files "LISTO_*.md"
delete_files "LOCALIDADES_*.md"
delete_files "MANUAL_*.md"
delete_files "MAPA_*.md"
delete_files "MEJORA_*.md"
delete_files "MEJORAS_*.md"
delete_files "MODELO_*.md"
delete_files "MODULO_*.md"
delete_files "MONGODB_*.md"
delete_files "NIVELES_*.md"
delete_files "OPCIONES_*.md"
delete_files "OPTIMIZACION_*.md"
delete_files "PAGINADOR_*.md"
delete_files "PARA_*.md"
delete_files "PERFORMANCE_*.md"
delete_files "PLANTILLA_*.md"
delete_files "PROPUESTA_*.md"
delete_files "PROTECCION_*.md"
delete_files "PROTOCOLO_*.md"
delete_files "PRUEBA_*.md"
delete_files "PRUEBAS_*.md"
delete_files "QUE_*.md"
delete_files "QUICK_*.md"
delete_files "README_*.md"
delete_files "REBUILD_*.md"
delete_files "RECOMENDACION_*.md"
delete_files "REEMPLAZAR_*.md"
delete_files "REESTRUCTURACION_*.md"
delete_files "REFACTORIZACION_*.md"
delete_files "REINICIAR_*.md"
delete_files "REPARACION_*.md"
delete_files "REPORTE_*.md"
delete_files "RESOLUCION_*.md"
delete_files "RESULTADO_*.md"
delete_files "REVISION_*.md"
delete_files "RUTAS_*.md"
delete_files "SCRIPT_*.md"
delete_files "SEDES_*.md"
delete_files "SIMPLIFICACION_*.md"
delete_files "SINCRONIZACION_*.md"
delete_files "SISTEMA_*.md"
delete_files "SUGERENCIAS_*.md"
delete_files "TABLA_*.md"
delete_files "TASK_*.md"
delete_files "VALIDACION_*.md"
delete_files "VEHICULOS_*.md"
delete_files "VERIFICACION_*.md"
delete_files "VERIFICAR_*.md"
delete_files "VISTA_*.md"

# Eliminar datos de prueba
echo ""
echo "📊 Eliminando datos de prueba..."
delete_files "datos_prueba_*.json"
delete_files "datos_prueba_*.xlsx"
delete_files "plantilla_*.xlsx"
delete_files "test_*.xlsx"
delete_files "test_*.csv"
delete_files "test_*.json"
delete_files "reporte_*.json"

# Eliminar archivos temporales
echo ""
echo "🗑️  Eliminando archivos temporales..."
delete_files "*.tmp"
delete_files "*.bak"
delete_files "*.swp"
delete_files "*.swo"
delete_files "*~"

# Eliminar archivos específicos
echo ""
echo "🎯 Eliminando archivos específicos..."
if [ -f "curl" ]; then
    echo "  Eliminando: curl"
    if [ "$DRY_RUN" = false ]; then
        rm -f curl
        echo "  ✅ Eliminado"
    fi
fi

if [ -f "er.name" ]; then
    echo "  Eliminando: er.name"
    if [ "$DRY_RUN" = false ]; then
        rm -f er.name
        echo "  ✅ Eliminado"
    fi
fi

# Eliminar carpetas de backup
echo ""
echo "📁 Eliminando carpetas de backup..."
if [ -d "backup_resoluciones_componentes" ]; then
    echo "  Encontrada: backup_resoluciones_componentes/"
    if [ "$DRY_RUN" = false ]; then
        rm -rf backup_resoluciones_componentes
        echo "  ✅ Eliminada"
    fi
fi

if [ -d "backup_templates_problematicos" ]; then
    echo "  Encontrada: backup_templates_problematicos/"
    if [ "$DRY_RUN" = false ]; then
        rm -rf backup_templates_problematicos
        echo "  ✅ Eliminada"
    fi
fi

# Limpiar caché de Python
echo ""
echo "🐍 Limpiando caché de Python..."
if [ "$DRY_RUN" = false ]; then
    find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    echo "  ✅ Caché limpiado"
fi

echo ""
if [ "$DRY_RUN" = true ]; then
    echo "✅ DRY RUN completado - No se eliminaron archivos"
    echo "   Ejecuta sin --dry-run para aplicar los cambios"
else
    echo "✅ Limpieza completada exitosamente"
    echo "📦 Backup guardado en: $BACKUP_FILE"
fi

echo ""
echo "📊 Estadísticas finales:"
echo "  Archivos Python: $(find . -maxdepth 1 -name "*.py" | wc -l)"
echo "  Archivos Markdown: $(find . -maxdepth 1 -name "*.md" | wc -l)"
echo "  Archivos totales en raíz: $(find . -maxdepth 1 -type f | wc -l)"

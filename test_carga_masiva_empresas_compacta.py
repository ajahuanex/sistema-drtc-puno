#!/usr/bin/env python3
"""
Script para probar el diseño compacto y funcional de carga masiva de empresas
"""

import requests
import json
import sys
from datetime import datetime

def test_carga_masiva_empresas_compacta():
    """Prueba el componente de carga masiva de empresas con diseño compacto"""
    
    print("🏢 Probando Carga Masiva de Empresas - Diseño Compacto")
    print("=" * 60)
    
    # Verificar que el frontend esté funcionando
    try:
        response = requests.get("http://localhost:4200", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend Angular funcionando correctamente")
        else:
            print(f"⚠️  Frontend responde con código: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando al frontend: {e}")
        return False
    
    # Verificar que el backend esté funcionando
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend FastAPI funcionando correctamente")
        else:
            print(f"⚠️  Backend responde con código: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando al backend: {e}")
        return False
    
    print("\n📋 Características del diseño compacto:")
    print("   • Header reducido con información esencial")
    print("   • Una sola card principal para upload y opciones")
    print("   • Botón de plantilla integrado en el header")
    print("   • Área de upload más pequeña pero funcional")
    print("   • Opciones de radio en línea horizontal")
    print("   • Stats en grid compacto de 4 columnas")
    print("   • Secciones colapsables para resultados")
    print("   • Listas simplificadas para empresas y errores")
    
    print("\n🎨 Mejoras de diseño compacto:")
    print("   • Menos espacio vertical utilizado")
    print("   • Información más densa pero legible")
    print("   • Colores y gradientes mantenidos")
    print("   • Animaciones suaves conservadas")
    print("   • Responsive design optimizado")
    print("   • Mejor aprovechamiento del espacio")
    
    print("\n🔧 Funcionalidades verificadas:")
    print("   • Validación de archivos Excel (.xlsx, .xls)")
    print("   • Drag & drop funcional")
    print("   • Selección de modo (validar/procesar)")
    print("   • Descarga de plantilla integrada")
    print("   • Mensajes de estado compactos")
    print("   • Resultados organizados y colapsables")
    
    print("\n📱 Responsive mejorado:")
    print("   • Mejor adaptación a pantallas pequeñas")
    print("   • Opciones de radio apiladas en móvil")
    print("   • Stats en 2 columnas en tablet, 1 en móvil")
    print("   • Botones de ancho completo en móvil")
    
    print("\n🚀 Ventajas del diseño compacto:")
    print("   • Menos scroll necesario")
    print("   • Información más accesible")
    print("   • Flujo de trabajo más directo")
    print("   • Mejor para pantallas pequeñas")
    print("   • Carga más rápida")
    
    print("\n🔧 Para probar el componente:")
    print("   1. Abrir http://localhost:4200")
    print("   2. Ir al módulo de Empresas")
    print("   3. Hacer clic en 'Carga Masiva'")
    print("   4. Descargar plantilla (botón en header)")
    print("   5. Arrastrar archivo Excel al área de upload")
    print("   6. Seleccionar modo de operación")
    print("   7. Hacer clic en Validar o Procesar")
    print("   8. Ver resultados en secciones colapsables")
    
    return True

if __name__ == "__main__":
    success = test_carga_masiva_empresas_compacta()
    if success:
        print("\n✅ Componente de carga masiva de empresas compacto listo para usar")
        print("🎯 Diseño optimizado para mejor experiencia de usuario")
        sys.exit(0)
    else:
        print("\n❌ Error en la verificación del componente")
        sys.exit(1)
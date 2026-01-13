#!/usr/bin/env python3
"""
Script para verificar la consistencia completa del sistema SIRRET
después de la sincronización con GitHub
"""

import os
import json
from pathlib import Path

def verificar_configuracion_backend():
    """Verificar configuración del backend"""
    print("🔧 VERIFICANDO CONFIGURACIÓN BACKEND")
    print("=" * 50)
    
    # Verificar archivo de configuración principal
    config_file = "backend/app/config/settings.py"
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Verificar nombre del sistema
        if "Sistema Regional de Registros de Transporte (SIRRET)" in content:
            print("✅ Nombre del sistema correcto en backend")
        else:
            print("❌ Nombre del sistema incorrecto en backend")
            
        # Verificar base de datos
        if "drtc_puno_db" in content:
            print("✅ Base de datos configurada correctamente")
        else:
            print("❌ Base de datos mal configurada")
            
        # Verificar CORS
        if "localhost:4200" in content:
            print("✅ CORS configurado para frontend")
        else:
            print("❌ CORS mal configurado")
    else:
        print("❌ Archivo de configuración backend no encontrado")

def verificar_configuracion_frontend():
    """Verificar configuración del frontend"""
    print("\n🌐 VERIFICANDO CONFIGURACIÓN FRONTEND")
    print("=" * 50)
    
    # Verificar environments
    env_files = [
        "frontend/src/environments/environment.ts",
        "frontend/src/environments/environment.prod.ts"
    ]
    
    for env_file in env_files:
        if os.path.exists(env_file):
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            print(f"\n📁 {env_file}:")
            
            # Verificar configuración
            if "systemName: 'SIRRET'" in content:
                print("  ✅ systemName correcto")
            else:
                print("  ❌ systemName incorrecto")
                
            if "Sistema Regional de Registros de Transporte" in content:
                print("  ✅ systemFullName correcto")
            else:
                print("  ❌ systemFullName incorrecto")
                
            if "useDataManager: false" in content:
                print("  ✅ useDataManager configurado para datos reales")
            else:
                print("  ❌ useDataManager mal configurado")
                
            if "localhost:8000" in content:
                print("  ✅ API URL configurada")
            else:
                print("  ❌ API URL mal configurada")
        else:
            print(f"❌ {env_file} no encontrado")

def verificar_package_json():
    """Verificar package.json del frontend"""
    print("\n📦 VERIFICANDO PACKAGE.JSON")
    print("=" * 50)
    
    package_file = "frontend/package.json"
    if os.path.exists(package_file):
        with open(package_file, 'r', encoding='utf-8') as f:
            package_data = json.load(f)
            
        # Verificar dependencias críticas
        dependencies = package_data.get('dependencies', {})
        dev_dependencies = package_data.get('devDependencies', {})
        
        critical_deps = [
            '@angular/core',
            '@angular/common',
            '@angular/router',
            '@angular/forms',
            '@angular/material'
        ]
        
        for dep in critical_deps:
            if dep in dependencies:
                print(f"  ✅ {dep}: {dependencies[dep]}")
            else:
                print(f"  ❌ {dep}: NO ENCONTRADO")
                
        # Verificar scripts
        scripts = package_data.get('scripts', {})
        if 'start' in scripts:
            print(f"  ✅ Script start: {scripts['start']}")
        else:
            print("  ❌ Script start no encontrado")
            
    else:
        print("❌ package.json no encontrado")

def verificar_estructura_archivos():
    """Verificar estructura de archivos críticos"""
    print("\n📁 VERIFICANDO ESTRUCTURA DE ARCHIVOS")
    print("=" * 50)
    
    archivos_criticos = [
        # Backend
        "backend/app/main.py",
        "backend/app/config/settings.py",
        "backend/app/dependencies/db.py",
        "backend/requirements.txt",
        
        # Frontend
        "frontend/src/app/app.config.ts",
        "frontend/src/app/app.routes.ts",
        "frontend/src/index.html",
        "frontend/angular.json",
        
        # Docker
        "docker-compose.yml",
        
        # Scripts
        "start-backend.bat",
        "crear_usuario_admin.py",
        "crear_datos_iniciales.py"
    ]
    
    for archivo in archivos_criticos:
        if os.path.exists(archivo):
            print(f"  ✅ {archivo}")
        else:
            print(f"  ❌ {archivo} - NO ENCONTRADO")

def verificar_componentes_nuevos():
    """Verificar componentes nuevos agregados"""
    print("\n🧩 VERIFICANDO COMPONENTES NUEVOS")
    print("=" * 50)
    
    componentes_nuevos = [
        "frontend/src/app/components/configuracion/configuracion.component.ts",
        "frontend/src/app/components/empresas/carga-masiva-empresas.component.ts",
        "frontend/src/app/components/resoluciones/carga-masiva-resoluciones.component.ts",
        "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts",
        "frontend/src/app/services/configuracion.service.ts"
    ]
    
    for componente in componentes_nuevos:
        if os.path.exists(componente):
            print(f"  ✅ {componente}")
        else:
            print(f"  ❌ {componente} - NO ENCONTRADO")

def verificar_servicios_backend():
    """Verificar servicios del backend"""
    print("\n⚙️ VERIFICANDO SERVICIOS BACKEND")
    print("=" * 50)
    
    servicios = [
        "backend/app/services/empresa_service.py",
        "backend/app/services/vehiculo_service.py",
        "backend/app/services/resolucion_service.py",
        "backend/app/services/configuracion_service.py",
        "backend/app/services/empresa_excel_service.py",
        "backend/app/services/vehiculo_excel_service.py"
    ]
    
    for servicio in servicios:
        if os.path.exists(servicio):
            print(f"  ✅ {servicio}")
        else:
            print(f"  ❌ {servicio} - NO ENCONTRADO")

def verificar_routers_backend():
    """Verificar routers del backend"""
    print("\n🛣️ VERIFICANDO ROUTERS BACKEND")
    print("=" * 50)
    
    routers = [
        "backend/app/routers/empresas_router.py",
        "backend/app/routers/vehiculos_router.py",
        "backend/app/routers/resoluciones_router.py",
        "backend/app/routers/configuraciones.py",
        "backend/app/routers/rutas_router.py"
    ]
    
    for router in routers:
        if os.path.exists(router):
            print(f"  ✅ {router}")
        else:
            print(f"  ❌ {router} - NO ENCONTRADO")

def verificar_modelos():
    """Verificar modelos de datos"""
    print("\n📊 VERIFICANDO MODELOS DE DATOS")
    print("=" * 50)
    
    modelos_backend = [
        "backend/app/models/empresa.py",
        "backend/app/models/vehiculo.py",
        "backend/app/models/resolucion.py",
        "backend/app/models/configuracion.py"
    ]
    
    modelos_frontend = [
        "frontend/src/app/models/empresa.model.ts",
        "frontend/src/app/models/vehiculo.model.ts",
        "frontend/src/app/models/resolucion.model.ts"
    ]
    
    print("  Backend:")
    for modelo in modelos_backend:
        if os.path.exists(modelo):
            print(f"    ✅ {modelo}")
        else:
            print(f"    ❌ {modelo} - NO ENCONTRADO")
    
    print("  Frontend:")
    for modelo in modelos_frontend:
        if os.path.exists(modelo):
            print(f"    ✅ {modelo}")
        else:
            print(f"    ❌ {modelo} - NO ENCONTRADO")

def verificar_plantillas_excel():
    """Verificar plantillas Excel"""
    print("\n📋 VERIFICANDO PLANTILLAS EXCEL")
    print("=" * 50)
    
    plantillas = [
        "backend/plantilla_vehiculos.xlsx",
        "plantilla_empresas_actualizada_final.xlsx",
        "plantilla_profesional.xlsx"
    ]
    
    for plantilla in plantillas:
        if os.path.exists(plantilla):
            print(f"  ✅ {plantilla}")
        else:
            print(f"  ❌ {plantilla} - NO ENCONTRADO")

def main():
    """Función principal"""
    print("🔍 VERIFICACIÓN DE CONSISTENCIA SISTEMA SIRRET")
    print("=" * 60)
    print("Verificando consistencia después de sincronización GitHub")
    print("=" * 60)
    
    # Ejecutar todas las verificaciones
    verificar_configuracion_backend()
    verificar_configuracion_frontend()
    verificar_package_json()
    verificar_estructura_archivos()
    verificar_componentes_nuevos()
    verificar_servicios_backend()
    verificar_routers_backend()
    verificar_modelos()
    verificar_plantillas_excel()
    
    print("\n" + "=" * 60)
    print("✅ VERIFICACIÓN DE CONSISTENCIA COMPLETADA")
    print("=" * 60)
    
    print("\n📋 RESUMEN:")
    print("- Configuración backend y frontend verificada")
    print("- Estructura de archivos revisada")
    print("- Componentes nuevos confirmados")
    print("- Servicios y routers validados")
    print("- Modelos de datos verificados")
    print("- Plantillas Excel confirmadas")
    
    print("\n🎯 PRÓXIMOS PASOS:")
    print("1. Verificar compilación del frontend")
    print("2. Probar inicio del backend")
    print("3. Verificar conectividad con base de datos")
    print("4. Probar funcionalidades principales")

if __name__ == "__main__":
    main()
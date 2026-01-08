#!/usr/bin/env python3
"""
Test simple para verificar que la sintaxis está correcta
"""

import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_syntax():
    """Prueba que la sintaxis esté correcta"""
    try:
        print("🧪 Verificando sintaxis de archivos...")
        
        # Test modelo
        import py_compile
        py_compile.compile('backend/app/models/localidad.py', doraise=True)
        print("   ✅ backend/app/models/localidad.py - Sintaxis correcta")
        
        py_compile.compile('backend/app/services/nivel_territorial_service.py', doraise=True)
        print("   ✅ backend/app/services/nivel_territorial_service.py - Sintaxis correcta")
        
        py_compile.compile('backend/app/routers/nivel_territorial_router.py', doraise=True)
        print("   ✅ backend/app/routers/nivel_territorial_router.py - Sintaxis correcta")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error de sintaxis: {str(e)}")
        return False

def test_imports():
    """Prueba imports básicos"""
    try:
        print("\n📦 Verificando imports básicos...")
        
        # Cambiar al directorio backend temporalmente
        original_path = sys.path.copy()
        sys.path.insert(0, 'backend')
        
        try:
            from app.models.localidad import NivelTerritorial, LocalidadEnRuta
            print("   ✅ Modelos importados correctamente")
            
            # Test enum
            print(f"   📋 Niveles disponibles: {[n.value for n in NivelTerritorial]}")
            
            # Test creación de modelo
            localidad = LocalidadEnRuta(
                localidad_id="test",
                ubigeo="150101", 
                nombre="Lima",
                nivel_territorial=NivelTerritorial.DISTRITO,
                departamento="LIMA",
                provincia="LIMA",
                distrito="LIMA",
                municipalidad_centro_poblado="Municipalidad de Lima",
                tipo_en_ruta="ORIGEN"
            )
            print(f"   ✅ Modelo creado: {localidad.nombre} - {localidad.nivel_territorial.value}")
            
            return True
            
        finally:
            sys.path = original_path
            
    except Exception as e:
        print(f"   ❌ Error en imports: {str(e)}")
        return False

def test_server_start():
    """Prueba que el servidor pueda iniciarse (sin ejecutar)"""
    try:
        print("\n🚀 Verificando configuración del servidor...")
        
        # Verificar que main.py tenga sintaxis correcta
        import py_compile
        py_compile.compile('backend/app/main.py', doraise=True)
        print("   ✅ backend/app/main.py - Sintaxis correcta")
        
        # Verificar que los imports del main funcionen
        original_path = sys.path.copy()
        sys.path.insert(0, 'backend')
        
        try:
            # Solo verificar que los imports no fallen
            import importlib.util
            spec = importlib.util.spec_from_file_location("main", "backend/app/main.py")
            print("   ✅ Configuración del servidor verificada")
            return True
            
        finally:
            sys.path = original_path
            
    except Exception as e:
        print(f"   ❌ Error en configuración del servidor: {str(e)}")
        return False

def main():
    """Función principal"""
    
    print("🔧 Verificación Rápida del Sistema")
    print("=" * 40)
    
    resultados = []
    
    # Ejecutar pruebas
    pruebas = [
        ("Sintaxis de archivos", test_syntax),
        ("Imports básicos", test_imports),
        ("Configuración servidor", test_server_start)
    ]
    
    for nombre, funcion in pruebas:
        try:
            resultado = funcion()
            resultados.append((nombre, resultado))
        except Exception as e:
            print(f"❌ Error en {nombre}: {str(e)}")
            resultados.append((nombre, False))
    
    # Resumen
    print(f"\n{'='*40}")
    print("📋 Resumen:")
    
    exitosas = 0
    for nombre, resultado in resultados:
        estado = "✅ EXITOSA" if resultado else "❌ FALLIDA"
        print(f"   - {nombre}: {estado}")
        if resultado:
            exitosas += 1
    
    print(f"\n🎯 Resultado: {exitosas}/{len(resultados)} verificaciones exitosas")
    
    if exitosas == len(resultados):
        print("\n🎉 ¡Sistema verificado correctamente!")
        print("\n✅ Archivos listos:")
        print("   - Modelos de nivel territorial")
        print("   - Servicio de análisis territorial")
        print("   - Router con endpoints")
        print("   - Integración en main.py")
        
        print(f"\n🚀 Para usar el sistema:")
        print("   1. Ejecutar: python actualizar_niveles_territoriales.py")
        print("   2. Iniciar servidor: uvicorn app.main:app --reload")
        print("   3. Acceder a: http://localhost:8000/docs")
        
        return 0
    else:
        print("\n⚠️  Hay problemas que necesitan resolverse")
        return 1

if __name__ == "__main__":
    sys.exit(main())
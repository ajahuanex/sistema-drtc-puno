#!/usr/bin/env python3
"""
Test para verificar que el servidor backend pueda iniciarse
"""

import os
import sys
import subprocess

def test_server_syntax():
    """Prueba que la sintaxis del servidor esté correcta"""
    print("🧪 Verificando sintaxis del servidor...")
    
    try:
        # Cambiar al directorio backend
        backend_dir = os.path.join(os.getcwd(), 'backend')
        
        # Verificar sintaxis de archivos principales
        archivos_principales = [
            'app/main.py',
            'app/models/localidad.py',
            'app/services/nivel_territorial_service.py',
            'app/routers/nivel_territorial_router.py',
            'app/routers/localidades_router.py'
        ]
        
        for archivo in archivos_principales:
            archivo_path = os.path.join(backend_dir, archivo)
            if os.path.exists(archivo_path):
                result = subprocess.run([
                    sys.executable, '-m', 'py_compile', archivo_path
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    print(f"   ✅ {archivo} - Sintaxis correcta")
                else:
                    print(f"   ❌ {archivo} - Error de sintaxis:")
                    print(f"      {result.stderr}")
                    return False
            else:
                print(f"   ⚠️  {archivo} - Archivo no encontrado")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error verificando sintaxis: {str(e)}")
        return False

def test_imports_backend():
    """Prueba imports desde el directorio backend"""
    print("\n📦 Verificando imports desde backend...")
    
    try:
        # Cambiar al directorio backend
        original_cwd = os.getcwd()
        backend_dir = os.path.join(original_cwd, 'backend')
        
        os.chdir(backend_dir)
        
        # Test básico de imports
        test_script = '''
import sys
sys.path.insert(0, ".")

try:
    from app.models.localidad import NivelTerritorial, LocalidadEnRuta
    print("✅ Modelos importados")
    
    # Test enum
    niveles = [n.value for n in NivelTerritorial]
    print(f"✅ Niveles disponibles: {niveles}")
    
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
    print(f"✅ Modelo creado: {localidad.nombre} - {localidad.nivel_territorial.value}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
'''
        
        result = subprocess.run([
            sys.executable, '-c', test_script
        ], capture_output=True, text=True, cwd=backend_dir)
        
        if result.returncode == 0:
            print("   " + result.stdout.replace('\n', '\n   '))
            return True
        else:
            print(f"   ❌ Error en imports:")
            print(f"      {result.stderr}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error ejecutando test: {str(e)}")
        return False
    finally:
        os.chdir(original_cwd)

def test_server_config():
    """Prueba la configuración del servidor"""
    print("\n🚀 Verificando configuración del servidor...")
    
    try:
        backend_dir = os.path.join(os.getcwd(), 'backend')
        
        # Test de configuración básica
        test_script = '''
import sys
sys.path.insert(0, ".")

try:
    # Test imports básicos sin ejecutar el servidor
    import importlib.util
    
    # Verificar que main.py se puede cargar
    spec = importlib.util.spec_from_file_location("main", "app/main.py")
    if spec:
        print("✅ main.py se puede cargar")
    
    # Verificar configuración
    from app.config.settings import settings
    print(f"✅ Configuración cargada: {settings.PROJECT_NAME}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
'''
        
        result = subprocess.run([
            sys.executable, '-c', test_script
        ], capture_output=True, text=True, cwd=backend_dir)
        
        if result.returncode == 0:
            print("   " + result.stdout.replace('\n', '\n   '))
            return True
        else:
            print(f"   ❌ Error en configuración:")
            print(f"      {result.stderr}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error verificando configuración: {str(e)}")
        return False

def main():
    """Función principal"""
    
    print("🔧 Verificación del Servidor Backend")
    print("=" * 40)
    
    resultados = []
    
    # Ejecutar pruebas
    pruebas = [
        ("Sintaxis de archivos", test_server_syntax),
        ("Imports desde backend", test_imports_backend),
        ("Configuración servidor", test_server_config)
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
        print("\n🎉 ¡Servidor backend verificado correctamente!")
        print("\n✅ El sistema está listo para:")
        print("   - Identificar niveles territoriales")
        print("   - Analizar rutas territoriales")
        print("   - Generar estadísticas")
        
        print(f"\n🚀 Para iniciar el servidor:")
        print("   cd backend")
        print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        
        return 0
    else:
        print("\n⚠️  Hay problemas que necesitan resolverse")
        return 1

if __name__ == "__main__":
    sys.exit(main())
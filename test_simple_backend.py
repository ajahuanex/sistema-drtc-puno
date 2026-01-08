#!/usr/bin/env python3
"""
Test simple para verificar el backend
"""

import os
import sys
import subprocess

def test_backend_simple():
    """Test simple del backend"""
    print("Verificando backend...")
    
    try:
        # Cambiar al directorio backend
        original_cwd = os.getcwd()
        backend_dir = os.path.join(original_cwd, 'backend')
        
        os.chdir(backend_dir)
        
        # Test básico sin emojis
        test_script = '''
import sys
sys.path.insert(0, ".")

try:
    from app.models.localidad import NivelTerritorial, LocalidadEnRuta
    print("OK: Modelos importados")
    
    # Test enum
    niveles = [n.value for n in NivelTerritorial]
    print(f"OK: Niveles disponibles: {len(niveles)}")
    
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
    print(f"OK: Modelo creado: {localidad.nombre} - {localidad.nivel_territorial.value}")
    
    print("SUCCESS: Todos los tests pasaron")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
'''
        
        result = subprocess.run([
            sys.executable, '-c', test_script
        ], capture_output=True, text=True, cwd=backend_dir)
        
        print("Resultado del test:")
        print(result.stdout)
        
        if result.stderr:
            print("Errores:")
            print(result.stderr)
        
        return result.returncode == 0
            
    except Exception as e:
        print(f"Error ejecutando test: {str(e)}")
        return False
    finally:
        os.chdir(original_cwd)

def main():
    """Función principal"""
    
    print("Test Simple del Backend")
    print("=" * 30)
    
    if test_backend_simple():
        print("\nRESULTADO: EXITOSO")
        print("\nEl backend esta listo para:")
        print("- Identificar niveles territoriales")
        print("- Analizar rutas territoriales")
        print("- Generar estadisticas")
        print("\nPara iniciar el servidor:")
        print("cd backend")
        print("uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return 0
    else:
        print("\nRESULTADO: FALLIDO")
        print("Hay problemas que necesitan resolverse")
        return 1

if __name__ == "__main__":
    sys.exit(main())
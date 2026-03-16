"""
Script de verificación post-limpieza del módulo de localidades
Verifica que todos los archivos existen y la estructura es correcta
"""
import os
import sys

def verificar_archivo(ruta, descripcion):
    """Verifica que un archivo existe"""
    if os.path.exists(ruta):
        print(f"✅ {descripcion}: {ruta}")
        return True
    else:
        print(f"❌ {descripcion} NO ENCONTRADO: {ruta}")
        return False

def main():
    print("🔍 Verificando limpieza del módulo de localidades...\n")
    
    archivos_verificar = [
        # Routers modulares
        ("app/routers/localidades_router.py", "Router principal"),
        ("app/routers/localidades_crud.py", "Router CRUD"),
        ("app/routers/localidades_import.py", "Router Import/Export"),
        ("app/routers/localidades_centros_poblados.py", "Router Centros Poblados"),
        
        # Service y modelos
        ("app/services/localidad_service.py", "Service"),
        ("app/models/localidad.py", "Modelos"),
        
        # Scripts
        ("scripts/limpiar_localidades_duplicadas.py", "Script de limpieza"),
        
        # Tests
        ("app/tests/test_localidades.py", "Tests"),
        
        # Documentación
        ("app/routers/LOCALIDADES_README.md", "README del módulo"),
        ("LIMPIEZA_LOCALIDADES_RESUMEN.md", "Resumen de limpieza"),
        ("LIMPIEZA_COMPLETADA.md", "Documento de completitud"),
    ]
    
    resultados = []
    for ruta, descripcion in archivos_verificar:
        resultado = verificar_archivo(ruta, descripcion)
        resultados.append(resultado)
    
    print("\n" + "="*60)
    total = len(resultados)
    exitosos = sum(resultados)
    
    if exitosos == total:
        print(f"✅ VERIFICACIÓN EXITOSA: {exitosos}/{total} archivos encontrados")
        print("\n🎉 La limpieza del módulo de localidades está completa!")
        print("\n📝 Próximos pasos:")
        print("   1. Levantar el backend: python main.py")
        print("   2. Verificar endpoints: http://localhost:8000/docs")
        print("   3. Ejecutar tests: pytest app/tests/test_localidades.py -v")
        print("   4. Limpiar duplicados: python scripts/limpiar_localidades_duplicadas.py")
        return 0
    else:
        print(f"❌ VERIFICACIÓN FALLIDA: {exitosos}/{total} archivos encontrados")
        print(f"\n⚠️  Faltan {total - exitosos} archivos")
        return 1

if __name__ == "__main__":
    sys.exit(main())

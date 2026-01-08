#!/usr/bin/env python3
"""
Test rápido de sintaxis y funcionalidad básica
"""

def test_imports():
    """Prueba que todos los imports funcionen correctamente"""
    try:
        print("🧪 Probando imports...")
        
        # Test modelo de localidad
        from backend.app.models.localidad import (
            NivelTerritorial, 
            LocalidadEnRuta, 
            AnalisisNivelTerritorial
        )
        print("   ✅ Modelos de localidad importados")
        
        # Test servicio
        from backend.app.services.nivel_territorial_service import nivel_territorial_service
        print("   ✅ Servicio de nivel territorial importado")
        
        # Test router
        from backend.app.routers.nivel_territorial_router import router
        print("   ✅ Router de nivel territorial importado")
        
        # Test enums
        print(f"   📋 Niveles territoriales disponibles:")
        for nivel in NivelTerritorial:
            print(f"      - {nivel.value}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error en imports: {str(e)}")
        return False

def test_determinacion_nivel():
    """Prueba la determinación de nivel territorial"""
    try:
        print("\n🔍 Probando determinación de nivel territorial...")
        
        from backend.app.services.nivel_territorial_service import nivel_territorial_service
        from backend.app.models.localidad import NivelTerritorial
        
        # Casos de prueba
        casos = [
            {
                "localidad": {
                    "ubigeo": "150000",
                    "municipalidad_centro_poblado": "Gobierno Regional de Lima"
                },
                "esperado": NivelTerritorial.DEPARTAMENTO
            },
            {
                "localidad": {
                    "ubigeo": "150100", 
                    "municipalidad_centro_poblado": "Municipalidad Provincial de Lima"
                },
                "esperado": NivelTerritorial.PROVINCIA
            },
            {
                "localidad": {
                    "ubigeo": "150101",
                    "municipalidad_centro_poblado": "Municipalidad Distrital de Lima"
                },
                "esperado": NivelTerritorial.DISTRITO
            }
        ]
        
        correctos = 0
        for i, caso in enumerate(casos, 1):
            nivel = nivel_territorial_service.determinar_nivel_territorial(caso["localidad"])
            esperado = caso["esperado"]
            
            if nivel == esperado:
                print(f"   ✅ Caso {i}: {nivel.value} (correcto)")
                correctos += 1
            else:
                print(f"   ❌ Caso {i}: {nivel.value} (esperado: {esperado.value})")
        
        print(f"   📊 Resultado: {correctos}/{len(casos)} casos correctos")
        return correctos == len(casos)
        
    except Exception as e:
        print(f"   ❌ Error en determinación: {str(e)}")
        return False

def test_modelos():
    """Prueba la creación de modelos"""
    try:
        print("\n📋 Probando creación de modelos...")
        
        from backend.app.models.localidad import (
            LocalidadEnRuta, 
            NivelTerritorial,
            FiltroRutasPorNivel
        )
        
        # Crear LocalidadEnRuta
        localidad = LocalidadEnRuta(
            localidad_id="test_id",
            ubigeo="150101",
            nombre="Lima",
            nivel_territorial=NivelTerritorial.DISTRITO,
            departamento="LIMA",
            provincia="LIMA",
            distrito="LIMA",
            municipalidad_centro_poblado="Municipalidad Distrital de Lima",
            tipo_en_ruta="ORIGEN"
        )
        print(f"   ✅ LocalidadEnRuta creada: {localidad.nombre} ({localidad.nivel_territorial.value})")
        
        # Crear filtro
        filtro = FiltroRutasPorNivel(
            nivel_origen=NivelTerritorial.DISTRITO,
            departamento_origen="LIMA"
        )
        print(f"   ✅ FiltroRutasPorNivel creado: origen {filtro.nivel_origen.value}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error creando modelos: {str(e)}")
        return False

def main():
    """Función principal"""
    
    print("🚀 Test Rápido de Sintaxis y Funcionalidad")
    print("=" * 50)
    
    resultados = []
    
    # Ejecutar pruebas
    pruebas = [
        ("Imports", test_imports),
        ("Determinación de nivel", test_determinacion_nivel),
        ("Creación de modelos", test_modelos)
    ]
    
    for nombre, funcion in pruebas:
        try:
            resultado = funcion()
            resultados.append((nombre, resultado))
        except Exception as e:
            print(f"❌ Error en {nombre}: {str(e)}")
            resultados.append((nombre, False))
    
    # Resumen
    print(f"\n{'='*50}")
    print("📋 Resumen:")
    
    exitosas = 0
    for nombre, resultado in resultados:
        estado = "✅ EXITOSA" if resultado else "❌ FALLIDA"
        print(f"   - {nombre}: {estado}")
        if resultado:
            exitosas += 1
    
    print(f"\n🎯 Resultado: {exitosas}/{len(resultados)} pruebas exitosas")
    
    if exitosas == len(resultados):
        print("🎉 ¡Todo funciona correctamente!")
        print("\n✅ El sistema está listo para:")
        print("   - Identificar niveles territoriales automáticamente")
        print("   - Analizar rutas con información territorial")
        print("   - Filtrar rutas por criterios territoriales")
        print("   - Generar estadísticas territoriales")
        return 0
    else:
        print("⚠️  Hay problemas que necesitan resolverse")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
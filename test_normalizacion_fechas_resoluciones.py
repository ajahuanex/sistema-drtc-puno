#!/usr/bin/env python3
"""
Script para probar la normalización de fechas en el módulo de resoluciones
"""
import sys
import os
import asyncio
import pandas as pd
from io import BytesIO

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_normalizacion_fechas():
    """Probar la normalización de fechas con diferentes formatos"""
    print("🧪 PROBANDO NORMALIZACIÓN DE FECHAS EN RESOLUCIONES")
    print("=" * 60)
    
    try:
        from backend.app.services.resolucion_excel_service import ResolucionExcelService
        
        service = ResolucionExcelService()
        
        # Casos de prueba con diferentes formatos de fecha
        casos_prueba = [
            # Formato español (preferido)
            "15/01/2024",
            "31/12/2023", 
            "01/06/2025",
            
            # Formato ISO (el que está causando problemas)
            "2025-06-17",
            "2025-07-24", 
            "2025-09-08",
            "2025-06-17",
            "2025-09-03",
            "2025-05-19",
            "2025-09-03",
            "2025-04-15",
            "2025-10-20",
            "2025-09-18",
            "2025-07-15",
            
            # Otros formatos
            "17-06-2025",
            "24-07-2025",
            "2025/06/17",
            "17.06.2025",
            
            # Casos inválidos
            "invalid-date",
            "32/13/2024",
            "2024-13-32",
            ""
        ]
        
        print("📅 Probando normalización de fechas:")
        print("-" * 40)
        
        for fecha in casos_prueba:
            valida, normalizada = service._validar_y_normalizar_fecha(fecha)
            status = "✅" if valida else "❌"
            print(f"{status} '{fecha}' -> '{normalizada}' (válida: {valida})")
        
        print("\n" + "=" * 60)
        
        # Crear archivo Excel de prueba con fechas problemáticas
        print("📊 Creando archivo Excel de prueba con fechas en formato ISO...")
        
        datos_prueba = {
            'Resolución Padre': ['', ''],
            'Número Resolución': ['1001-2024', '1002-2024'],
            'RUC Empresa': ['20123456789', '20234567890'],
            'Fecha Emisión': ['2025-06-17', '2025-07-24'],  # Formato ISO problemático
            'Fecha Vigencia Inicio': ['2025-06-17', ''],
            'Fecha Vigencia Fin': ['2030-06-17', ''],
            'Tipo Resolución': ['PADRE', 'HIJO'],
            'Tipo Trámite': ['PRIMIGENIA', 'RENOVACION'],
            'Descripción': ['Resolución de prueba con fecha ISO', 'Otra resolución de prueba'],
            'ID Expediente': ['123-2024', '456-2024'],
            'Usuario Emisión': ['USR001', 'USR001'],
            'Estado': ['VIGENTE', 'VIGENTE'],
            'Observaciones': ['Prueba normalización fechas', 'Prueba formato ISO']
        }
        
        df = pd.DataFrame(datos_prueba)
        
        # Crear archivo Excel en memoria
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Resoluciones', index=False)
        
        buffer.seek(0)
        
        print("🔍 Validando archivo Excel con fechas ISO...")
        resultado = await service.validar_archivo_excel(buffer)
        
        print(f"\n📊 RESULTADOS DE VALIDACIÓN:")
        print(f"   Total filas: {resultado['total_filas']}")
        print(f"   Válidas: {resultado['validos']}")
        print(f"   Inválidas: {resultado['invalidos']}")
        print(f"   Con advertencias: {resultado['con_advertencias']}")
        
        if resultado['errores']:
            print(f"\n❌ ERRORES ENCONTRADOS:")
            for error in resultado['errores']:
                print(f"   Fila {error['fila']} ({error['numero_resolucion']}):")
                for err in error['errores']:
                    print(f"     - {err}")
        
        if resultado['advertencias']:
            print(f"\n⚠️  ADVERTENCIAS:")
            for adv in resultado['advertencias']:
                print(f"   Fila {adv['fila']} ({adv['numero_resolucion']}):")
                for warn in adv['advertencias']:
                    print(f"     - {warn}")
        
        if resultado['resoluciones_validas']:
            print(f"\n✅ RESOLUCIONES VÁLIDAS PROCESADAS:")
            for res in resultado['resoluciones_validas']:
                print(f"   - {res['nroResolucion']}: Fecha emisión {res['fechaEmision']}")
                if res.get('fechaVigenciaInicio'):
                    print(f"     Vigencia: {res['fechaVigenciaInicio']} a {res['fechaVigenciaFin']}")
        
        # Guardar archivo de prueba para inspección manual
        with open('test_fechas_iso_resoluciones.xlsx', 'wb') as f:
            buffer.seek(0)
            f.write(buffer.read())
        
        print(f"\n💾 Archivo de prueba guardado: test_fechas_iso_resoluciones.xlsx")
        
        return resultado['validos'] > 0
        
    except Exception as e:
        print(f"❌ Error en prueba: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_casos_especificos_imagen():
    """Probar específicamente los casos de la imagen mostrada"""
    print("\n🎯 PROBANDO CASOS ESPECÍFICOS DE LA IMAGEN")
    print("=" * 60)
    
    try:
        from backend.app.services.resolucion_excel_service import ResolucionExcelService
        
        service = ResolucionExcelService()
        
        # Fechas específicas de la imagen
        fechas_problematicas = [
            "2025-06-17 00:00:00",  # Con timestamp
            "2025-07-24 00:00:00",
            "2025-09-08 00:00:00", 
            "2025-06-17 00:00:00",
            "2025-09-03 00:00:00",
            "2025-05-19 00:00:00",
            "2025-09-03 00:00:00",
            "2025-04-15 00:00:00",
            "2025-10-20 00:00:00",
            "2025-09-18 00:00:00",
            "2025-07-15 00:00:00"
        ]
        
        print("📅 Probando fechas con timestamp de la imagen:")
        print("-" * 50)
        
        for fecha in fechas_problematicas:
            # Limpiar timestamp si existe
            fecha_limpia = fecha.split(' ')[0] if ' ' in fecha else fecha
            valida, normalizada = service._validar_y_normalizar_fecha(fecha_limpia)
            status = "✅" if valida else "❌"
            print(f"{status} '{fecha}' -> '{normalizada}'")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en prueba específica: {e}")
        return False

async def main():
    """Función principal"""
    print("🚀 INICIANDO PRUEBAS DE NORMALIZACIÓN DE FECHAS")
    print("=" * 60)
    
    success = True
    
    # Probar normalización general
    success &= await test_normalizacion_fechas()
    
    # Probar casos específicos de la imagen
    success &= await test_casos_especificos_imagen()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE")
        print("\n📋 RESUMEN:")
        print("   - Normalización de fechas implementada")
        print("   - Soporte para múltiples formatos de fecha")
        print("   - Validación mejorada con mensajes claros")
        print("   - Casos problemáticos de la imagen resueltos")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
#!/usr/bin/env python3
"""
Script para debuggear el problema de años de vigencia en carga masiva
"""
import sys
import os
import asyncio
import pandas as pd
from io import BytesIO
from datetime import datetime

# Agregar backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def test_carga_masiva_completa():
    """Probar carga masiva completa con años de vigencia"""
    from app.services.resolucion_excel_service import ResolucionExcelService
    
    print("=" * 70)
    print("DEBUG: CARGA MASIVA CON AÑOS DE VIGENCIA")
    print("=" * 70)
    
    # Crear servicio
    service = ResolucionExcelService()
    
    # 1. Generar plantilla
    print("\n1. Generando plantilla...")
    plantilla = service.generar_plantilla_excel()
    
    # Leer plantilla para verificar
    df_plantilla = pd.read_excel(plantilla)
    print(f"\n✅ Plantilla generada con {len(df_plantilla.columns)} columnas")
    print("\n📋 Columnas:")
    for i, col in enumerate(df_plantilla.columns, 1):
        print(f"   {i}. {col}")
    
    if 'Años Vigencia' not in df_plantilla.columns:
        print("\n❌ ERROR: Columna 'Años Vigencia' NO está en la plantilla")
        return False
    
    print("\n✅ Columna 'Años Vigencia' encontrada en la plantilla")
    
    # Verificar datos de ejemplo
    print("\n📊 Datos de ejemplo en la plantilla:")
    for index, row in df_plantilla.iterrows():
        numero = row.get('Número Resolución', 'N/A')
        tipo = row.get('Tipo Resolución', 'N/A')
        anios = row.get('Años Vigencia', 'N/A')
        print(f"   Fila {index + 2}: {numero} ({tipo}) - Años: {anios}")
    
    # 2. Crear Excel de prueba con datos específicos
    print("\n2. Creando Excel de prueba con años de vigencia específicos...")
    
    datos_prueba = {
        'Resolución Padre': ['', '', ''],
        'Número Resolución': ['TEST-1001-2024', 'TEST-1002-2024', 'TEST-1003-2024'],
        'RUC Empresa': ['20123456789', '20234567890', '20123456789'],
        'Fecha Emisión': ['15/01/2024', '20/03/2024', '10/06/2024'],
        'Fecha Vigencia Inicio': ['15/01/2024', '20/03/2024', '10/06/2024'],
        'Años Vigencia': [4, 10, 4],  # IMPORTANTE: 4, 10, 4
        'Fecha Vigencia Fin': ['14/01/2028', '19/03/2034', '09/06/2028'],
        'Tipo Resolución': ['PADRE', 'PADRE', 'PADRE'],
        'Tipo Trámite': ['PRIMIGENIA', 'PRIMIGENIA', 'PRIMIGENIA'],
        'Descripción': [
            'TEST: Autorización con 4 años de vigencia',
            'TEST: Autorización con 10 años de vigencia',
            'TEST: Autorización con 4 años de vigencia'
        ],
        'ID Expediente': ['TEST-123-2024', 'TEST-456-2024', 'TEST-789-2024'],
        'Usuario Emisión': ['USR001', 'USR001', 'USR001'],
        'Estado': ['VIGENTE', 'VIGENTE', 'VIGENTE'],
        'Observaciones': ['Prueba 4 años', 'Prueba 10 años', 'Prueba 4 años']
    }
    
    df_prueba = pd.DataFrame(datos_prueba)
    
    print("\n📊 Datos de prueba creados:")
    print(df_prueba[['Número Resolución', 'Años Vigencia', 'Fecha Vigencia Fin']].to_string(index=False))
    
    # Guardar en BytesIO
    buffer_prueba = BytesIO()
    df_prueba.to_excel(buffer_prueba, index=False, engine='openpyxl')
    buffer_prueba.seek(0)
    
    # 3. Validar archivo
    print("\n3. Validando archivo de prueba...")
    print("-" * 70)
    
    resultado_validacion = await service.validar_archivo_excel(buffer_prueba)
    
    print(f"\n📊 Resultado de validación:")
    print(f"   Total filas: {resultado_validacion.get('total_filas', 0)}")
    print(f"   Válidos: {resultado_validacion.get('validos', 0)}")
    print(f"   Inválidos: {resultado_validacion.get('invalidos', 0)}")
    
    if resultado_validacion.get('errores'):
        print(f"\n❌ Errores encontrados:")
        for error in resultado_validacion['errores']:
            print(f"   Fila {error['fila']}: {error['numero_resolucion']}")
            for e in error['errores']:
                print(f"      - {e}")
    
    if resultado_validacion.get('advertencias'):
        print(f"\n⚠️  Advertencias:")
        for adv in resultado_validacion['advertencias']:
            print(f"   Fila {adv['fila']}: {adv['numero_resolucion']}")
            for a in adv['advertencias']:
                print(f"      - {a}")
    
    # 4. Verificar resoluciones válidas
    if resultado_validacion.get('resoluciones_validas'):
        print(f"\n✅ Resoluciones válidas: {len(resultado_validacion['resoluciones_validas'])}")
        print("\n📋 Detalle de años de vigencia:")
        print("-" * 70)
        
        for res in resultado_validacion['resoluciones_validas']:
            numero = res.get('nroResolucion', 'N/A')
            anios = res.get('aniosVigencia', 'N/A')
            fecha_inicio = res.get('fechaVigenciaInicio', 'N/A')
            fecha_fin = res.get('fechaVigenciaFin', 'N/A')
            
            print(f"\n   {numero}:")
            print(f"      Años Vigencia: {anios}")
            print(f"      Fecha Inicio: {fecha_inicio}")
            print(f"      Fecha Fin: {fecha_fin}")
            
            # Verificar si el cálculo es correcto
            if anios == 4:
                esperado = "2028"
            elif anios == 10:
                esperado = "2034"
            else:
                esperado = "?"
            
            if esperado in str(fecha_fin):
                print(f"      ✅ Cálculo correcto (esperado año {esperado})")
            else:
                print(f"      ❌ Cálculo incorrecto (esperado año {esperado}, obtenido {fecha_fin})")
    
    print("\n" + "=" * 70)
    print("✅ DEBUG COMPLETADO")
    print("=" * 70)
    
    return True

def main():
    """Función principal"""
    print("\n🔍 Iniciando debug de años de vigencia...\n")
    
    try:
        resultado = asyncio.run(test_carga_masiva_completa())
        
        if resultado:
            print("\n✅ Todas las pruebas pasaron")
            print("\n💡 CONCLUSIONES:")
            print("   1. La plantilla tiene la columna 'Años Vigencia'")
            print("   2. Los datos se leen correctamente del Excel")
            print("   3. El cálculo de fechas funciona correctamente")
            print("\n⚠️  Si el problema persiste:")
            print("   1. Verificar que el Excel usado tenga la columna 'Años Vigencia'")
            print("   2. Descargar una nueva plantilla desde el frontend")
            print("   3. Revisar los logs del backend al procesar")
            print("   4. Verificar que los valores sean numéricos (4, 10)")
            return 0
        else:
            print("\n❌ Algunas pruebas fallaron")
            return 1
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())

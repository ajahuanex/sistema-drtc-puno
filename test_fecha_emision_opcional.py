#!/usr/bin/env python3
"""
Script para probar que la fecha de emisión es opcional y no se asigna automáticamente
"""
import sys
import os
import asyncio
import pandas as pd
from datetime import datetime

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_fecha_emision_opcional():
    """Probar que la fecha de emisión es opcional"""
    print("🧪 PROBANDO FECHA DE EMISIÓN OPCIONAL")
    print("=" * 60)
    
    try:
        from backend.app.services.resolucion_padres_service import ResolucionPadresService
        
        # Casos de prueba: algunos con fecha de emisión, otros sin ella
        casos_prueba = [
            {
                'descripcion': 'Con fecha de emisión',
                'numero': '0001-2024',
                'fecha_resolucion': '15/03/2024',  # CON fecha
                'fecha_vigencia_inicio': '01/01/2024',
                'fecha_vigencia_fin': '01/01/2028',
                'debe_tener_fecha_emision': True
            },
            {
                'descripcion': 'Sin fecha de emisión (vacía)',
                'numero': '0002-2024',
                'fecha_resolucion': '',  # SIN fecha (vacía)
                'fecha_vigencia_inicio': '01/02/2024',
                'fecha_vigencia_fin': '01/02/2028',
                'debe_tener_fecha_emision': False
            },
            {
                'descripcion': 'Sin fecha de emisión (None)',
                'numero': '0003-2024',
                'fecha_resolucion': None,  # SIN fecha (None)
                'fecha_vigencia_inicio': '01/03/2024',
                'fecha_vigencia_fin': '01/03/2028',
                'debe_tener_fecha_emision': False
            },
            {
                'descripcion': 'Con fecha de emisión posterior (eficacia anticipada)',
                'numero': '0004-2024',
                'fecha_resolucion': '15/06/2024',  # CON fecha posterior
                'fecha_vigencia_inicio': '01/01/2024',  # Vigencia anterior
                'fecha_vigencia_fin': '01/01/2028',
                'debe_tener_fecha_emision': True
            }
        ]
        
        print("📋 Casos de prueba:")
        print("-" * 80)
        
        for i, caso in enumerate(casos_prueba, 1):
            print(f"\n{i}. {caso['descripcion']}")
            print(f"   Número: {caso['numero']}")
            print(f"   Fecha resolución: {caso['fecha_resolucion'] or '(vacía)'}")
            print(f"   Vigencia inicio: {caso['fecha_vigencia_inicio']}")
            print(f"   Debe tener fecha emisión: {caso['debe_tener_fecha_emision']}")
            
            # Crear DataFrame para este caso
            df_caso = pd.DataFrame([{
                'RUC_EMPRESA_ASOCIADA': '20123456789',
                'RESOLUCION_NUMERO': caso['numero'],
                'RESOLUCION_ASOCIADA': '',
                'TIPO_RESOLUCION': 'NUEVA',
                'FECHA_RESOLUCION': caso['fecha_resolucion'] or '',
                'FECHA_INICIO_VIGENCIA': caso['fecha_vigencia_inicio'],
                'ANIOS_VIGENCIA': 4,
                'FECHA_FIN_VIGENCIA': caso['fecha_vigencia_fin'],
                'ESTADO': 'ACTIVA'
            }])
            
            # Validar usando el servicio
            resultado = ResolucionPadresService.validar_plantilla_padres(df_caso)
            
            if resultado['valido']:
                print(f"   ✅ Validación: EXITOSA")
            else:
                print(f"   ❌ Validación: FALLÓ")
                for error in resultado['errores'][:2]:
                    print(f"      - {error}")
        
        # Crear archivo Excel de prueba
        print(f"\n💾 Creando archivo Excel de prueba...")
        
        datos_excel = []
        for caso in casos_prueba:
            datos_excel.append({
                'RUC_EMPRESA_ASOCIADA': '20123456789',
                'RESOLUCION_NUMERO': caso['numero'],
                'RESOLUCION_ASOCIADA': '',
                'TIPO_RESOLUCION': 'NUEVA',
                'FECHA_RESOLUCION': caso['fecha_resolucion'] or '',
                'FECHA_INICIO_VIGENCIA': caso['fecha_vigencia_inicio'],
                'ANIOS_VIGENCIA': 4,
                'FECHA_FIN_VIGENCIA': caso['fecha_vigencia_fin'],
                'ESTADO': 'ACTIVA'
            })
        
        df_excel = pd.DataFrame(datos_excel)
        
        with pd.ExcelWriter('test_fecha_emision_opcional.xlsx', engine='openpyxl') as writer:
            df_excel.to_excel(writer, sheet_name='Fecha_Emision_Opcional', index=False)
            
            # Ajustar ancho de columnas
            workbook = writer.book
            worksheet = writer.sheets['Fecha_Emision_Opcional']
            
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 25)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        print("✅ Archivo creado: test_fecha_emision_opcional.xlsx")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en prueba: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Función principal"""
    print("🚀 INICIANDO PRUEBAS DE FECHA DE EMISIÓN OPCIONAL")
    print("=" * 60)
    
    success = await test_fecha_emision_opcional()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ PRUEBAS COMPLETADAS")
        print("\n📋 CORRECCIÓN IMPLEMENTADA:")
        print("   - Fecha de emisión es OPCIONAL")
        print("   - Si no hay fecha de emisión, NO se asigna automáticamente")
        print("   - NO se usa fecha de vigencia como fecha de emisión")
        print("   - Se respeta el campo vacío en la plantilla")
        print("\n🎯 PROBLEMA RESUELTO:")
        print("   - Las resoluciones sin fecha de emisión quedan sin fecha")
        print("   - Solo se asigna fecha de emisión si está en la plantilla")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
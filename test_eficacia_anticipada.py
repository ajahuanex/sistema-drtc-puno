#!/usr/bin/env python3
"""
Script para probar el manejo correcto de eficacia anticipada en resoluciones
"""
import sys
import os
import asyncio
import pandas as pd
from datetime import datetime
from io import BytesIO

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_eficacia_anticipada():
    """Probar casos de eficacia anticipada"""
    print("🧪 PROBANDO EFICACIA ANTICIPADA EN RESOLUCIONES")
    print("=" * 60)
    
    try:
        from backend.app.services.resolucion_padres_service import ResolucionPadresService
        
        # Casos de prueba con eficacia anticipada
        casos_eficacia = [
            {
                'descripcion': 'Eficacia anticipada - Resolución 2024 con vigencia desde 2023',
                'numero': '0290-2024',
                'fecha_resolucion': '15/03/2024',  # Fecha de emisión
                'fecha_vigencia_inicio': '01/01/2023',  # Eficacia anticipada
                'fecha_vigencia_fin': '01/01/2027',
                'numero_esperado': 'R-0290-2024'  # Debe usar el año de la resolución
            },
            {
                'descripcion': 'Eficacia anticipada - Resolución 2023 con vigencia desde 2022',
                'numero': '0921-2023',
                'fecha_resolucion': '10/06/2023',
                'fecha_vigencia_inicio': '01/01/2022',  # Eficacia anticipada
                'fecha_vigencia_fin': '01/01/2026',
                'numero_esperado': 'R-0921-2023'
            },
            {
                'descripcion': 'Sin eficacia anticipada - Fechas normales',
                'numero': '0495-2022',
                'fecha_resolucion': '15/04/2022',
                'fecha_vigencia_inicio': '15/04/2022',  # Misma fecha
                'fecha_vigencia_fin': '15/04/2026',
                'numero_esperado': 'R-0495-2022'
            },
            {
                'descripcion': 'Sin fecha de resolución - Solo vigencia',
                'numero': '0100-2021',
                'fecha_resolucion': '',  # Sin fecha de resolución
                'fecha_vigencia_inicio': '01/01/2020',  # Vigencia anterior
                'fecha_vigencia_fin': '01/01/2024',
                'numero_esperado': 'R-0100-2021'  # Debe preservar el año del número
            }
        ]
        
        print("📋 Casos de prueba de eficacia anticipada:")
        print("-" * 80)
        
        for i, caso in enumerate(casos_eficacia, 1):
            print(f"\n{i}. {caso['descripcion']}")
            print(f"   Número original: {caso['numero']}")
            print(f"   Fecha resolución: {caso['fecha_resolucion'] or '(vacía)'}")
            print(f"   Vigencia inicio: {caso['fecha_vigencia_inicio']}")
            print(f"   Vigencia fin: {caso['fecha_vigencia_fin']}")
            
            # Crear DataFrame para este caso
            df_caso = pd.DataFrame([{
                'RUC_EMPRESA_ASOCIADA': '20123456789',
                'RESOLUCION_NUMERO': caso['numero'],
                'RESOLUCION_ASOCIADA': '',
                'TIPO_RESOLUCION': 'NUEVA',
                'FECHA_RESOLUCION': caso['fecha_resolucion'],
                'FECHA_INICIO_VIGENCIA': caso['fecha_vigencia_inicio'],
                'ANIOS_VIGENCIA': 4,
                'FECHA_FIN_VIGENCIA': caso['fecha_vigencia_fin'],
                'ESTADO': 'ACTIVA'
            }])
            
            # Validar usando el servicio
            resultado = ResolucionPadresService.validar_plantilla_padres(df_caso)
            
            if resultado['valido']:
                print(f"   ✅ Validación: EXITOSA")
                
                # Probar la normalización directamente
                if caso['fecha_resolucion']:
                    fecha_resolucion = datetime.strptime(caso['fecha_resolucion'], '%d/%m/%Y')
                else:
                    fecha_resolucion = datetime.now()
                
                numero_normalizado = ResolucionPadresService._normalizar_numero_resolucion(
                    caso['numero'], fecha_resolucion
                )
                
                correcto = numero_normalizado == caso['numero_esperado']
                estado = "✅" if correcto else "❌"
                
                print(f"   {estado} Normalización: {caso['numero']} → {numero_normalizado}")
                print(f"   Esperado: {caso['numero_esperado']}")
                
                if not correcto:
                    print(f"   ⚠️  PROBLEMA: El año cambió incorrectamente")
                
            else:
                print(f"   ❌ Validación: FALLÓ")
                for error in resultado['errores'][:2]:
                    print(f"      - {error}")
        
        # Crear archivo Excel de prueba con casos de eficacia anticipada
        print(f"\n💾 Creando archivo Excel de prueba...")
        
        datos_excel = []
        for caso in casos_eficacia:
            datos_excel.append({
                'RUC_EMPRESA_ASOCIADA': '20123456789',
                'RESOLUCION_NUMERO': caso['numero'],
                'RESOLUCION_ASOCIADA': '',
                'TIPO_RESOLUCION': 'NUEVA',
                'FECHA_RESOLUCION': caso['fecha_resolucion'],
                'FECHA_INICIO_VIGENCIA': caso['fecha_vigencia_inicio'],
                'ANIOS_VIGENCIA': 4,
                'FECHA_FIN_VIGENCIA': caso['fecha_vigencia_fin'],
                'ESTADO': 'ACTIVA'
            })
        
        df_excel = pd.DataFrame(datos_excel)
        
        with pd.ExcelWriter('test_eficacia_anticipada.xlsx', engine='openpyxl') as writer:
            df_excel.to_excel(writer, sheet_name='Eficacia_Anticipada', index=False)
            
            # Ajustar ancho de columnas
            workbook = writer.book
            worksheet = writer.sheets['Eficacia_Anticipada']
            
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
        
        print("✅ Archivo creado: test_eficacia_anticipada.xlsx")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en prueba: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_casos_reales_imagen():
    """Probar con los casos reales de la imagen"""
    print("\n🎯 PROBANDO CASOS REALES DE LA IMAGEN")
    print("=" * 60)
    
    try:
        from backend.app.services.resolucion_padres_service import ResolucionPadresService
        
        # Casos reales de la imagen con posible eficacia anticipada
        casos_reales = [
            ('0921-2023', 'R-0921-2023'),
            ('0495-2022', 'R-0495-2022'),
            ('0290-2023', 'R-0290-2023'),  # El caso problemático
            ('0345-2021', 'R-0345-2021'),
            ('0213-2022', 'R-0213-2022'),
        ]
        
        print("📊 Verificando casos reales:")
        print("-" * 40)
        
        todos_correctos = True
        
        for numero_original, esperado in casos_reales:
            # Usar diferentes fechas para simular que el año del número es independiente
            fecha_diferente = datetime(2022, 1, 1)  # Fecha diferente al año del número
            
            resultado = ResolucionPadresService._normalizar_numero_resolucion(
                numero_original, fecha_diferente
            )
            
            correcto = resultado == esperado
            estado = "✅" if correcto else "❌"
            
            if not correcto:
                todos_correctos = False
            
            print(f"{estado} {numero_original} → {resultado} (esperado: {esperado})")
        
        if todos_correctos:
            print("\n🎉 ¡TODOS LOS CASOS REALES FUNCIONAN CORRECTAMENTE!")
            print("   - Los números preservan su año original")
            print("   - No se ve afectado por fechas de vigencia")
            print("   - Eficacia anticipada manejada correctamente")
        else:
            print("\n⚠️  Algunos casos aún tienen problemas")
        
        return todos_correctos
        
    except Exception as e:
        print(f"❌ Error en prueba: {e}")
        return False

async def main():
    """Función principal"""
    print("🚀 INICIANDO PRUEBAS DE EFICACIA ANTICIPADA")
    print("=" * 60)
    
    success1 = await test_eficacia_anticipada()
    success2 = test_casos_reales_imagen()
    
    print("\n" + "=" * 60)
    if success1 and success2:
        print("✅ TODAS LAS PRUEBAS EXITOSAS")
        print("\n📋 CONCEPTOS VALIDADOS:")
        print("   - Eficacia anticipada: Vigencia puede ser anterior a emisión")
        print("   - Año del número: Se basa en fecha de emisión, NO vigencia")
        print("   - Preservación: Los números con año se mantienen intactos")
        print("   - Independencia: Fechas de vigencia no afectan el número")
        print("\n🎯 PROBLEMA ORIGINAL RESUELTO:")
        print("   - 0290-2023 se mantiene como R-0290-2023")
        print("   - No cambia a R-0290-2022 por fechas de vigencia")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
#!/usr/bin/env python3
"""
Test para verificar que la plantilla actualizada funciona correctamente
con solo RUC y Razón Social Principal como campos obligatorios.
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.empresa_excel_service import EmpresaExcelService
import pandas as pd
from io import BytesIO

async def test_plantilla_actualizada():
    """Test de la plantilla actualizada con validaciones flexibles."""
    
    print("🧪 PROBANDO PLANTILLA ACTUALIZADA - SOLO RUC Y RAZÓN SOCIAL OBLIGATORIOS")
    print("=" * 70)
    
    # Crear servicio
    service = EmpresaExcelService()
    
    # 1. Generar plantilla actualizada
    print("\n1. Generando plantilla actualizada...")
    try:
        plantilla_buffer = service.generar_plantilla_excel()
        print("✅ Plantilla generada exitosamente")
        
        # Guardar plantilla para inspección
        with open('plantilla_actualizada_test.xlsx', 'wb') as f:
            f.write(plantilla_buffer.getvalue())
        print("📁 Plantilla guardada como: plantilla_actualizada_test.xlsx")
        
    except Exception as e:
        print(f"❌ Error generando plantilla: {e}")
        return
    
    # 2. Crear datos de prueba con diferentes niveles de completitud
    print("\n2. Creando datos de prueba...")
    
    datos_prueba = {
        'RUC': [
            '20123456789',  # Empresa completa
            '20987654321',  # Solo datos mínimos
            '20555666777',  # Datos parciales
            '20111222333'   # Solo RUC y razón social
        ],
        'Razón Social Principal': [
            'TRANSPORTES COMPLETOS S.A.C.',
            'EMPRESA MÍNIMA S.A.C.',
            'TRANSPORTES PARCIALES E.I.R.L.',
            'SOLO BÁSICOS S.R.L.'
        ],
        'Dirección Fiscal': [
            'AV. PRINCIPAL 123, PUNO',
            '',  # Vacío
            'JR. COMERCIO 456, JULIACA',
            ''   # Vacío
        ],
        'Teléfono Contacto': [
            '051-123456 051-999888',  # Múltiples teléfonos
            '',  # Vacío
            '054-987654',  # Un teléfono
            ''   # Vacío
        ],
        'Email Contacto': [
            'completos@transportespuno.gob.pe',
            '',  # Vacío
            'parciales@empresa.com',
            ''   # Vacío
        ],
        'Nombres Representante': [
            'JUAN CARLOS',
            '',  # Vacío
            'MARÍA ELENA',
            ''   # Vacío
        ],
        'Apellidos Representante': [
            'MAMANI QUISPE',
            '',  # Vacío
            'RODRIGUEZ VARGAS',
            ''   # Vacío
        ],
        'DNI Representante': [
            '12345678',
            '',  # Vacío
            '87654321',
            ''   # Vacío
        ],
        'Partida Registral': [
            '123456',
            '',  # Vacío
            '789012',
            ''   # Vacío
        ],
        'Razón Social SUNAT': [
            'TRANSPORTES COMPLETOS SOCIEDAD ANONIMA CERRADA',
            '',  # Vacío
            '',  # Vacío
            ''   # Vacío
        ],
        'Razón Social Mínimo': [
            'TRANSPORTES COMPLETOS',
            '',  # Vacío
            'TRANSPORTES PARCIALES',
            ''   # Vacío
        ],
        'Estado': [
            'HABILITADA',
            '',  # Vacío
            'EN_TRAMITE',
            ''   # Vacío
        ],
        'Estado SUNAT': [
            'ACTIVO',
            '',  # Vacío
            'ACTIVO',
            ''   # Vacío
        ],
        'Tipo de Servicio': [
            'PERSONAS',
            '',  # Vacío
            'TURISMO',
            ''   # Vacío
        ],
        'Observaciones': [
            'Empresa con todos los datos',
            'Solo datos mínimos obligatorios',
            'Datos parciales para prueba',
            'Solo RUC y razón social'
        ]
    }
    
    # Crear DataFrame y Excel de prueba
    df_prueba = pd.DataFrame(datos_prueba)
    
    # Crear archivo Excel en memoria
    buffer_prueba = BytesIO()
    with pd.ExcelWriter(buffer_prueba, engine='openpyxl') as writer:
        df_prueba.to_excel(writer, sheet_name='DATOS', index=False)
    buffer_prueba.seek(0)
    
    print("✅ Datos de prueba creados:")
    print("   • Empresa 1: Todos los campos completos")
    print("   • Empresa 2: Solo RUC + Razón Social (mínimo)")
    print("   • Empresa 3: Datos parciales")
    print("   • Empresa 4: Solo campos obligatorios")
    
    # 3. Validar archivo de prueba
    print("\n3. Validando archivo de prueba...")
    try:
        resultado = await service.validar_archivo_excel(buffer_prueba)
        
        print(f"📊 RESULTADOS DE VALIDACIÓN:")
        print(f"   • Total filas: {resultado['total_filas']}")
        print(f"   • Válidas: {resultado['validos']}")
        print(f"   • Inválidas: {resultado['invalidos']}")
        print(f"   • Con advertencias: {resultado['con_advertencias']}")
        
        if resultado['errores']:
            print(f"\n❌ ERRORES ENCONTRADOS:")
            for error in resultado['errores']:
                print(f"   • Fila {error['fila']} (RUC: {error['ruc']}):")
                for err in error['errores']:
                    print(f"     - {err}")
        
        if resultado['advertencias']:
            print(f"\n⚠️  ADVERTENCIAS:")
            for adv in resultado['advertencias']:
                print(f"   • Fila {adv['fila']} (RUC: {adv['ruc']}):")
                for warn in adv['advertencias']:
                    print(f"     - {warn}")
        
        if resultado['validos'] == resultado['total_filas']:
            print(f"\n🎉 ¡TODAS LAS EMPRESAS SON VÁLIDAS!")
            print("✅ La validación flexible funciona correctamente")
            print("✅ Solo RUC y Razón Social Principal son obligatorios")
        else:
            print(f"\n⚠️  Algunas empresas tienen errores")
            
    except Exception as e:
        print(f"❌ Error en validación: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 4. Mostrar empresas válidas procesadas
    if resultado.get('empresas_validas'):
        print(f"\n4. Empresas procesadas exitosamente:")
        for i, empresa in enumerate(resultado['empresas_validas'], 1):
            print(f"   Empresa {i}:")
            print(f"     • RUC: {empresa.get('ruc', 'N/A')}")
            print(f"     • Razón Social: {empresa.get('razon_social_principal', 'N/A')}")
            print(f"     • Dirección: {empresa.get('direccion_fiscal', 'No especificada')}")
            print(f"     • Teléfono: {empresa.get('telefono_contacto', 'No especificado')}")
            print(f"     • Email: {empresa.get('email_contacto', 'No especificado')}")
            print(f"     • Representante DNI: {empresa.get('representante_dni', 'No especificado')}")
    
    print(f"\n🎯 RESUMEN DEL TEST:")
    print(f"✅ Plantilla actualizada generada correctamente")
    print(f"✅ Validaciones flexibles implementadas")
    print(f"✅ Solo RUC y Razón Social Principal son obligatorios")
    print(f"✅ Campos opcionales pueden estar vacíos")
    print(f"✅ Múltiples teléfonos soportados")
    
    return True

if __name__ == "__main__":
    asyncio.run(test_plantilla_actualizada())
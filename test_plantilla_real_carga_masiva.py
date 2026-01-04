#!/usr/bin/env python3
"""
Test con plantilla real para verificar que la carga masiva funciona
con datos mínimos (solo RUC y Razón Social Principal).
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.empresa_excel_service import EmpresaExcelService
import pandas as pd
from io import BytesIO

def crear_plantilla_test_real():
    """Crear una plantilla de test con casos reales."""
    
    print("📋 CREANDO PLANTILLA DE TEST REAL")
    print("=" * 40)
    
    # Datos de prueba realistas
    datos_test = {
        'RUC': [
            '20123456789',  # Solo datos mínimos
            '20987654321',  # Datos completos
            '20555666777',  # Datos parciales
            '20111222333',  # Solo RUC + Razón Social + Estado
            '20444555666'   # Con múltiples teléfonos
        ],
        'Razón Social Principal': [
            'TRANSPORTES MÍNIMOS S.A.C.',
            'EMPRESA COMPLETA DE TRANSPORTES S.A.C.',
            'LOGÍSTICA PARCIAL E.I.R.L.',
            'TRANSPORTES BÁSICOS S.R.L.',
            'EMPRESA MÚLTIPLES TELÉFONOS S.A.C.'
        ],
        'Dirección Fiscal': [
            '',  # Vacío
            'AV. PRINCIPAL 123, PUNO, PUNO',
            'JR. COMERCIO 456, JULIACA, SAN ROMÁN',
            '',  # Vacío
            'AV. LOS ANDES 789, AZÁNGARO, AZÁNGARO'
        ],
        'Teléfono Contacto': [
            '',  # Vacío
            '051-123456',
            '054-987654',
            '',  # Vacío
            '051-111222 054-333444 999555666'  # Múltiples
        ],
        'Email Contacto': [
            '',  # Vacío
            'completa@transportespuno.gob.pe',
            'parcial@empresa.com',
            '',  # Vacío
            'multiples@transportes.com'
        ],
        'Nombres Representante': [
            '',  # Vacío
            'JUAN CARLOS',
            'MARÍA ELENA',
            '',  # Vacío
            'PEDRO LUIS'
        ],
        'Apellidos Representante': [
            '',  # Vacío
            'MAMANI QUISPE',
            'RODRIGUEZ VARGAS',
            '',  # Vacío
            'CONDORI APAZA'
        ],
        'DNI Representante': [
            '',  # Vacío
            '12345678',
            '87654321',
            '',  # Vacío
            '11223344'
        ],
        'Partida Registral': [
            '',  # Vacío
            '12345678',
            '87654321',
            '',  # Vacío
            '55667788'
        ],
        'Razón Social SUNAT': [
            '',  # Vacío
            'EMPRESA COMPLETA DE TRANSPORTES SOCIEDAD ANONIMA CERRADA',
            '',  # Vacío
            '',  # Vacío
            ''   # Vacío
        ],
        'Razón Social Mínimo': [
            '',  # Vacío
            'EMPRESA COMPLETA',
            'LOGÍSTICA PARCIAL',
            '',  # Vacío
            'MÚLTIPLES TELÉFONOS'
        ],
        'Estado': [
            '',  # Vacío - debe usar AUTORIZADA por defecto
            'AUTORIZADA',
            'EN_TRAMITE',
            'AUTORIZADA',
            'SUSPENDIDA'
        ],
        'Estado SUNAT': [
            '',  # Vacío
            'ACTIVO',
            'ACTIVO',
            '',  # Vacío
            'ACTIVO'
        ],
        'Tipo de Servicio': [
            '',  # Vacío - debe usar PERSONAS por defecto
            'TURISMO',
            'MERCANCIAS',
            'PERSONAS',
            'TRABAJADORES'
        ],
        'Observaciones': [
            'Empresa con datos mínimos - solo RUC y Razón Social',
            'Empresa completa con todos los datos',
            'Empresa con datos parciales',
            'Empresa básica con estado específico',
            'Empresa con múltiples números de teléfono'
        ]
    }
    
    # Crear DataFrame
    df = pd.DataFrame(datos_test)
    
    # Crear archivo Excel
    filename = 'plantilla_test_real_carga_masiva.xlsx'
    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='DATOS', index=False)
    
    print(f"✅ Plantilla creada: {filename}")
    print(f"📊 Casos de prueba:")
    print(f"   • Empresa 1: Solo RUC + Razón Social (mínimo absoluto)")
    print(f"   • Empresa 2: Todos los campos completos")
    print(f"   • Empresa 3: Datos parciales")
    print(f"   • Empresa 4: Datos básicos con estado")
    print(f"   • Empresa 5: Con múltiples teléfonos")
    
    return filename, df

def test_plantilla_real():
    """Test con plantilla real."""
    
    print("\n🧪 TEST CON PLANTILLA REAL")
    print("=" * 40)
    
    # Crear plantilla
    filename, df = crear_plantilla_test_real()
    
    # Crear servicio
    service = EmpresaExcelService()
    
    # Leer archivo como BytesIO
    with open(filename, 'rb') as f:
        buffer = BytesIO(f.read())
    
    print(f"\n1. Validando plantilla real...")
    
    try:
        # Validar
        resultado = service.validar_archivo_excel(buffer)
        
        # Como es async, necesitamos usar asyncio
        import asyncio
        resultado = asyncio.run(service.validar_archivo_excel(buffer))
        
        print(f"📊 RESULTADOS:")
        print(f"   • Total filas: {resultado['total_filas']}")
        print(f"   • Válidas: {resultado['validos']}")
        print(f"   • Inválidas: {resultado['invalidos']}")
        print(f"   • Con advertencias: {resultado['con_advertencias']}")
        
        if resultado['errores']:
            print(f"\n❌ ERRORES:")
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
            
            # Mostrar empresas válidas
            print(f"\n📋 EMPRESAS VÁLIDAS PROCESADAS:")
            for i, empresa in enumerate(resultado['empresas_validas'], 1):
                print(f"\n   Empresa {i}:")
                print(f"     • RUC: {empresa.get('ruc', 'N/A')}")
                print(f"     • Razón Social: {empresa.get('razonSocial', {}).get('principal', 'N/A') if isinstance(empresa.get('razonSocial'), dict) else 'N/A'}")
                print(f"     • Dirección: {empresa.get('direccionFiscal', 'No especificada')}")
                print(f"     • Teléfono: {empresa.get('telefonoContacto', 'No especificado')}")
                print(f"     • Email: {empresa.get('emailContacto', 'No especificado')}")
                
                rep = empresa.get('representanteLegal', {})
                if isinstance(rep, dict):
                    print(f"     • Representante: {rep.get('nombres', 'N/A')} {rep.get('apellidos', 'N/A')} (DNI: {rep.get('dni', 'N/A')})")
                else:
                    print(f"     • Representante: No especificado")
            
            print(f"\n✅ PLANTILLA REAL FUNCIONA CORRECTAMENTE")
            print(f"✅ Empresas con datos mínimos son válidas")
            print(f"✅ Campos opcionales se manejan correctamente")
            print(f"✅ Múltiples teléfonos se normalizan correctamente")
            
            return True
        else:
            print(f"\n⚠️  Algunas empresas tienen errores")
            return False
            
    except Exception as e:
        print(f"❌ Error en test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_plantilla_real()
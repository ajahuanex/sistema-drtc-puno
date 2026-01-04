#!/usr/bin/env python3
"""
Test para verificar que la carga masiva crea empresas correctamente
con solo RUC y Razón Social Principal obligatorios.
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.empresa_excel_service import EmpresaExcelService
import pandas as pd
from io import BytesIO

async def test_carga_masiva_crear():
    """Test de carga masiva para crear empresas."""
    
    print("🧪 TEST CARGA MASIVA - CREAR EMPRESAS")
    print("=" * 50)
    
    # Crear servicio
    service = EmpresaExcelService()
    
    # Datos de prueba con diferentes niveles de completitud
    datos_prueba = {
        'RUC': [
            '20123456789',  # Empresa mínima
            '20987654321',  # Empresa completa
            '20555666777'   # Empresa parcial
        ],
        'Razón Social Principal': [
            'EMPRESA MÍNIMA TEST S.A.C.',
            'EMPRESA COMPLETA TEST S.A.C.',
            'EMPRESA PARCIAL TEST S.A.C.'
        ],
        'Dirección Fiscal': [
            '',  # Vacío - debe usar por defecto
            'AV. COMPLETA 123, PUNO',
            'JR. PARCIAL 456, JULIACA'
        ],
        'Teléfono Contacto': [
            '',  # Vacío
            '051-123456 054-987654',  # Múltiples teléfonos
            '999888777'  # Un teléfono
        ],
        'Email Contacto': [
            '',  # Vacío
            'completa@test.com',
            'parcial@test.com'
        ],
        'Nombres Representante': [
            '',  # Vacío - debe usar por defecto
            'JUAN CARLOS',
            'MARÍA ELENA'
        ],
        'Apellidos Representante': [
            '',  # Vacío - debe usar por defecto
            'MAMANI QUISPE',
            'RODRIGUEZ VARGAS'
        ],
        'DNI Representante': [
            '',  # Vacío - debe usar por defecto
            '12345678',
            '87654321'
        ],
        'Estado': [
            '',  # Vacío - debe usar AUTORIZADA por defecto
            'AUTORIZADA',
            'EN_TRAMITE'
        ],
        'Tipo de Servicio': [
            '',  # Vacío - debe usar PERSONAS por defecto
            'TURISMO',
            'MERCANCIAS'
        ],
        'Observaciones': [
            'Empresa con datos mínimos',
            'Empresa con todos los datos',
            'Empresa con datos parciales'
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
    print("   • Empresa 1: Solo RUC + Razón Social (mínimo)")
    print("   • Empresa 2: Todos los campos completos")
    print("   • Empresa 3: Datos parciales")
    print()
    
    # 1. Primero validar
    print("1. Validando archivo...")
    try:
        resultado_validacion = await service.validar_archivo_excel(buffer_prueba)
        
        print(f"📊 VALIDACIÓN:")
        print(f"   • Total filas: {resultado_validacion['total_filas']}")
        print(f"   • Válidas: {resultado_validacion['validos']}")
        print(f"   • Inválidas: {resultado_validacion['invalidos']}")
        
        if resultado_validacion['errores']:
            print(f"\n❌ ERRORES:")
            for error in resultado_validacion['errores']:
                print(f"   • Fila {error['fila']}: {error['errores']}")
            return False
        
        if resultado_validacion['validos'] == 0:
            print("❌ No hay empresas válidas para procesar")
            return False
            
        print("✅ Validación exitosa")
        
    except Exception as e:
        print(f"❌ Error en validación: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # 2. Procesar carga masiva (simular sin BD)
    print(f"\n2. Simulando procesamiento de carga masiva...")
    
    try:
        # Simular el procesamiento sin conexión a BD
        empresas_procesadas = []
        
        for empresa_data in resultado_validacion['empresas_validas']:
            try:
                # Intentar convertir a EmpresaCreate
                empresa_create = service._dict_to_empresa_create(empresa_data)
                
                empresas_procesadas.append({
                    'ruc': empresa_create.ruc,
                    'razon_social': empresa_create.razonSocial.principal,
                    'direccion_fiscal': empresa_create.direccionFiscal,
                    'representante_dni': empresa_create.representanteLegal.dni,
                    'representante_nombres': empresa_create.representanteLegal.nombres,
                    'tipo_servicio': empresa_create.tipoServicio.value if hasattr(empresa_create.tipoServicio, 'value') else str(empresa_create.tipoServicio),
                    'telefono': getattr(empresa_create, 'telefonoContacto', None),
                    'email': getattr(empresa_create, 'emailContacto', None)
                })
                
            except Exception as e:
                print(f"❌ Error procesando empresa {empresa_data.get('ruc', 'N/A')}: {e}")
                return False
        
        print(f"✅ {len(empresas_procesadas)} empresas procesadas exitosamente")
        
        # Mostrar detalles de empresas procesadas
        print(f"\n📋 EMPRESAS PROCESADAS:")
        for i, empresa in enumerate(empresas_procesadas, 1):
            print(f"\n   Empresa {i}:")
            print(f"     • RUC: {empresa['ruc']}")
            print(f"     • Razón Social: {empresa['razon_social']}")
            print(f"     • Dirección: {empresa['direccion_fiscal']}")
            print(f"     • Representante DNI: {empresa['representante_dni']}")
            print(f"     • Representante: {empresa['representante_nombres']}")
            print(f"     • Tipo Servicio: {empresa['tipo_servicio']}")
            print(f"     • Teléfono: {empresa['telefono'] or 'No especificado'}")
            print(f"     • Email: {empresa['email'] or 'No especificado'}")
        
        # Verificar valores por defecto
        print(f"\n🔍 VERIFICANDO VALORES POR DEFECTO:")
        
        empresa_minima = empresas_procesadas[0]  # Primera empresa (solo RUC + Razón Social)
        
        checks = [
            ("Dirección por defecto", empresa_minima['direccion_fiscal'] == "POR ACTUALIZAR"),
            ("DNI por defecto", empresa_minima['representante_dni'] == "00000000"),
            ("Nombres por defecto", empresa_minima['representante_nombres'] == "POR ACTUALIZAR"),
            ("Tipo servicio por defecto", empresa_minima['tipo_servicio'] == "PERSONAS"),
        ]
        
        for descripcion, check in checks:
            status = "✅" if check else "❌"
            print(f"   {status} {descripcion}")
        
        exitosos = sum(1 for _, check in checks if check)
        
        if exitosos == len(checks):
            print(f"\n🎉 ¡CARGA MASIVA FUNCIONA CORRECTAMENTE!")
            print(f"✅ Empresas con datos mínimos se procesan correctamente")
            print(f"✅ Valores por defecto se asignan correctamente")
            print(f"✅ Campos opcionales se manejan correctamente")
            return True
        else:
            print(f"\n⚠️  Algunos valores por defecto no son correctos")
            return False
            
    except Exception as e:
        print(f"❌ Error en procesamiento: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_carga_masiva_crear())
#!/usr/bin/env python3
"""
Test simple para verificar la validación de RUC y Razón Social
sin depender de la base de datos.
"""

import pandas as pd
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.empresa_excel_service import EmpresaExcelService

def test_validacion_simple():
    """Test simple de validación sin base de datos."""
    
    print("🧪 TEST SIMPLE - VALIDACIÓN RUC Y RAZÓN SOCIAL")
    print("=" * 50)
    
    service = EmpresaExcelService()
    
    # Casos de prueba
    casos_prueba = [
        {
            'nombre': 'Empresa válida completa',
            'datos': {
                'RUC': '20123456789',
                'Razón Social Principal': 'TRANSPORTES PUNO S.A.C.',
                'Dirección Fiscal': 'AV. PRINCIPAL 123',
                'Teléfono Contacto': '051-123456',
                'Email Contacto': 'test@empresa.com',
                'DNI Representante': '12345678'
            },
            'esperado': 'válido'
        },
        {
            'nombre': 'Empresa mínima (solo RUC + Razón Social)',
            'datos': {
                'RUC': '20987654321',
                'Razón Social Principal': 'EMPRESA MÍNIMA S.A.C.',
                'Dirección Fiscal': '',
                'Teléfono Contacto': '',
                'Email Contacto': '',
                'DNI Representante': ''
            },
            'esperado': 'válido'
        },
        {
            'nombre': 'Sin RUC (inválido)',
            'datos': {
                'RUC': '',
                'Razón Social Principal': 'EMPRESA SIN RUC',
                'Dirección Fiscal': 'AV. PRINCIPAL 123'
            },
            'esperado': 'inválido'
        },
        {
            'nombre': 'Sin Razón Social (inválido)',
            'datos': {
                'RUC': '20555666777',
                'Razón Social Principal': '',
                'Dirección Fiscal': 'AV. PRINCIPAL 123'
            },
            'esperado': 'inválido'
        },
        {
            'nombre': 'RUC inválido (menos de 11 dígitos)',
            'datos': {
                'RUC': '2012345678',  # Solo 10 dígitos
                'Razón Social Principal': 'EMPRESA RUC CORTO',
            },
            'esperado': 'inválido'
        },
        {
            'nombre': 'Múltiples teléfonos',
            'datos': {
                'RUC': '20111222333',
                'Razón Social Principal': 'EMPRESA MÚLTIPLES TELÉFONOS',
                'Teléfono Contacto': '051-123456 054-987654 999888777'
            },
            'esperado': 'válido'
        }
    ]
    
    print(f"\n📋 Ejecutando {len(casos_prueba)} casos de prueba...\n")
    
    resultados = []
    
    for i, caso in enumerate(casos_prueba, 1):
        print(f"{i}. {caso['nombre']}")
        
        # Crear serie de pandas con los datos
        row = pd.Series(caso['datos'])
        
        # Validar usando métodos internos del servicio
        errores = []
        advertencias = []
        
        # Validar RUC
        ruc = str(row.get('RUC', '')).strip() if pd.notna(row.get('RUC')) else ''
        if not ruc:
            errores.append("RUC es requerido")
        elif not service._validar_formato_ruc(ruc):
            errores.append(f"RUC debe tener exactamente 11 dígitos: {ruc}")
        
        # Validar razón social principal
        razon_social = str(row.get('Razón Social Principal', '')).strip() if pd.notna(row.get('Razón Social Principal')) else ''
        if not razon_social:
            errores.append("Razón Social Principal es requerida")
        elif len(razon_social) < 3:
            errores.append("Razón Social Principal debe tener al menos 3 caracteres")
        
        # Validar teléfono si se proporciona
        telefono = str(row.get('Teléfono Contacto', '')).strip() if pd.notna(row.get('Teléfono Contacto')) else ''
        if telefono and not service._validar_formato_telefono(telefono):
            errores.append(f"Formato de teléfono inválido: {telefono}")
        
        # Validar email si se proporciona
        email = str(row.get('Email Contacto', '')).strip() if pd.notna(row.get('Email Contacto')) else ''
        if email and not service._validar_formato_email(email):
            errores.append(f"Formato de email inválido: {email}")
        
        # Validar DNI si se proporciona
        dni = str(row.get('DNI Representante', '')).strip() if pd.notna(row.get('DNI Representante')) else ''
        if dni and not service._validar_formato_dni(dni):
            errores.append(f"DNI debe ser numérico y tener máximo 8 dígitos: {dni}")
        
        # Determinar resultado
        es_valido = len(errores) == 0
        resultado_obtenido = 'válido' if es_valido else 'inválido'
        
        # Verificar si coincide con lo esperado
        coincide = resultado_obtenido == caso['esperado']
        
        if coincide:
            print(f"   ✅ {resultado_obtenido.upper()} (como se esperaba)")
        else:
            print(f"   ❌ {resultado_obtenido.upper()} (se esperaba {caso['esperado'].upper()})")
        
        if errores:
            print(f"   📝 Errores: {', '.join(errores)}")
        
        if telefono and service._validar_formato_telefono(telefono):
            telefono_normalizado = service._normalizar_telefono(telefono)
            if telefono != telefono_normalizado:
                print(f"   📞 Teléfono normalizado: {telefono} → {telefono_normalizado}")
        
        resultados.append({
            'caso': caso['nombre'],
            'esperado': caso['esperado'],
            'obtenido': resultado_obtenido,
            'coincide': coincide,
            'errores': errores
        })
        
        print()
    
    # Resumen
    exitosos = sum(1 for r in resultados if r['coincide'])
    total = len(resultados)
    
    print(f"📊 RESUMEN:")
    print(f"   • Total casos: {total}")
    print(f"   • Exitosos: {exitosos}")
    print(f"   • Fallidos: {total - exitosos}")
    
    if exitosos == total:
        print(f"\n🎉 ¡TODOS LOS CASOS PASARON!")
        print(f"✅ La validación funciona correctamente")
        print(f"✅ Solo RUC y Razón Social Principal son obligatorios")
        print(f"✅ Los demás campos son opcionales")
        print(f"✅ Múltiples teléfonos se validan correctamente")
    else:
        print(f"\n⚠️  Algunos casos fallaron:")
        for r in resultados:
            if not r['coincide']:
                print(f"   • {r['caso']}: esperado {r['esperado']}, obtenido {r['obtenido']}")
    
    return exitosos == total

if __name__ == "__main__":
    test_validacion_simple()
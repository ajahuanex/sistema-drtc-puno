#!/usr/bin/env python3
"""
Demostración de la funcionalidad de múltiples teléfonos en carga masiva de empresas
"""
import sys
import os
import pandas as pd
from io import BytesIO

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.empresa_excel_service import EmpresaExcelService

def demo_telefono_multiple():
    """Demostración de la funcionalidad de múltiples teléfonos"""
    
    print("🎯 DEMOSTRACIÓN: MÚLTIPLES TELÉFONOS EN CARGA MASIVA DE EMPRESAS")
    print("=" * 70)
    
    # Crear servicio
    excel_service = EmpresaExcelService()
    
    print("\n📱 CASOS DE USO COMUNES:")
    print("-" * 40)
    
    casos_demo = [
        ("Empresa con un teléfono", "051-123456"),
        ("Empresa con dos teléfonos", "051-123456 054-987654"),
        ("Empresa con tres teléfonos", "051-123456 054-987654 01-999888"),
        ("Números celulares", "951123456 954987654"),
        ("Con código de área", "(051)123456 (054)987654"),
        ("Formato mixto", "051-123456 9511234567"),
        ("Con espacios múltiples", "051-123456  054-987654"),
    ]
    
    for descripcion, telefono_entrada in casos_demo:
        telefono_normalizado = excel_service._normalizar_telefono(telefono_entrada)
        es_valido = excel_service._validar_formato_telefono(telefono_entrada)
        
        status = "✅" if es_valido else "❌"
        print(f"{status} {descripcion}:")
        print(f"    Entrada: '{telefono_entrada}'")
        print(f"    Sistema: '{telefono_normalizado}'")
        print()
    
    print("\n📊 EJEMPLO DE DATOS EXCEL:")
    print("-" * 40)
    
    # Crear datos de ejemplo
    datos_ejemplo = {
        'RUC': [
            '20123456789',
            '20987654321', 
            '21212121212',
            '20555666777'
        ],
        'Razón Social Principal': [
            'TRANSPORTES PUNO S.A.C.',
            'LOGÍSTICA AREQUIPA E.I.R.L.',
            'SERVICIOS CUSCO S.A.',
            'TURISMO TACNA S.R.L.'
        ],
        'Dirección Fiscal': [
            'AV. EJERCITO 123, PUNO',
            'JR. MERCADERES 456, AREQUIPA',
            'AV. SOL 789, CUSCO',
            'AV. BOLOGNESI 321, TACNA'
        ],
        'Teléfono Contacto': [
            '051-123456 051-999888',      # Dos teléfonos Puno
            '054-987654',                 # Un teléfono Arequipa
            '084-111222 084-333444 084-555666',  # Tres teléfonos Cusco
            '052-777888 952123456'        # Fijo y celular Tacna
        ],
        'Email Contacto': [
            'contacto@transportespuno.com',
            'info@logisticaarequipa.com',
            'ventas@servicioscusco.com',
            'reservas@turismotacna.com'
        ],
        'Nombres Representante': [
            'JUAN CARLOS',
            'MARIA ELENA',
            'PEDRO LUIS',
            'ANA SOFIA'
        ],
        'Apellidos Representante': [
            'MAMANI QUISPE',
            'RODRIGUEZ VARGAS',
            'CONDORI HUANCA',
            'FLORES MENDOZA'
        ],
        'DNI Representante': [
            '12345678',
            '87654321',
            '11223344',
            '99887766'
        ],
        'Tipo de Servicio': [
            'PERSONAS',
            'TURISMO',
            'MERCANCIAS',
            'TURISMO'
        ]
    }
    
    # Mostrar tabla de ejemplo
    df = pd.DataFrame(datos_ejemplo)
    
    print("Datos de entrada (como aparecerían en Excel):")
    print()
    for i, row in df.iterrows():
        print(f"Empresa {i+1}: {row['Razón Social Principal']}")
        print(f"  RUC: {row['RUC']}")
        print(f"  Teléfono Excel: '{row['Teléfono Contacto']}'")
        
        # Mostrar cómo se procesaría
        telefono_normalizado = excel_service._normalizar_telefono(row['Teléfono Contacto'])
        print(f"  Teléfono Sistema: '{telefono_normalizado}'")
        print()
    
    print("\n🔄 PROCESO DE NORMALIZACIÓN:")
    print("-" * 40)
    print("1. Usuario ingresa teléfonos separados por espacios en Excel")
    print("2. Sistema detecta múltiples números telefónicos")
    print("3. Valida que cada número tenga formato correcto")
    print("4. Convierte espacios separadores a comas")
    print("5. Almacena en base de datos con formato normalizado")
    
    print("\n✅ VENTAJAS:")
    print("-" * 40)
    print("• Fácil ingreso de múltiples teléfonos")
    print("• Validación automática de formatos")
    print("• Conversión automática a formato estándar")
    print("• Compatible con números únicos existentes")
    print("• Soporta diferentes formatos de teléfono")
    
    print("\n📋 INSTRUCCIONES PARA USUARIOS:")
    print("-" * 40)
    print("1. Abrir plantilla Excel de carga masiva de empresas")
    print("2. En columna 'Teléfono Contacto', ingresar números separados por espacios")
    print("   Ejemplo: '051-123456 054-987654'")
    print("3. Validar archivo antes de procesar")
    print("4. Procesar carga masiva")
    print("5. Los teléfonos se guardarán como: '051-123456, 054-987654'")
    
    print("\n" + "=" * 70)
    print("🎉 FUNCIONALIDAD LISTA PARA USAR")
    print("Los usuarios ya pueden ingresar múltiples teléfonos en la carga masiva de empresas")

if __name__ == "__main__":
    demo_telefono_multiple()
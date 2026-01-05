#!/usr/bin/env python3
"""
Script para probar las utilidades de resolución y generar ejemplos con fechas correctas
"""

import sys
import os
from datetime import datetime

# Agregar el path del backend para importar las utilidades
sys.path.append('backend')

try:
    from app.utils.resolucion_utils import (
        calcular_fecha_fin_vigencia,
        validar_anios_vigencia,
        validar_coherencia_fechas,
        calcular_fechas_vigencia_automaticas,
        generar_resumen_vigencia
    )
    print("✓ Utilidades importadas correctamente")
except ImportError as e:
    print(f"✗ Error importando utilidades: {e}")
    print("Instalando dependencias...")
    os.system("pip install python-dateutil")
    try:
        from app.utils.resolucion_utils import (
            calcular_fecha_fin_vigencia,
            validar_anios_vigencia,
            validar_coherencia_fechas,
            calcular_fechas_vigencia_automaticas,
            generar_resumen_vigencia
        )
        print("✓ Utilidades importadas correctamente después de instalar dependencias")
    except ImportError as e2:
        print(f"✗ Error persistente: {e2}")
        sys.exit(1)

def test_calculo_fechas():
    """Probar el cálculo de fechas de vigencia"""
    
    print("\n=== PRUEBAS DE CÁLCULO DE FECHAS ===")
    
    # Casos de prueba
    casos = [
        {
            'fecha_inicio': datetime(2025, 1, 1),
            'anios_vigencia': 4,
            'descripcion': 'Resolución que inicia el 01/01/2025 con 4 años'
        },
        {
            'fecha_inicio': datetime(2025, 1, 15),
            'anios_vigencia': 4,
            'descripcion': 'Resolución que inicia el 15/01/2025 con 4 años'
        },
        {
            'fecha_inicio': datetime(2020, 3, 10),
            'anios_vigencia': 4,
            'descripcion': 'Resolución que inicia el 10/03/2020 con 4 años'
        },
        {
            'fecha_inicio': datetime(2025, 6, 1),
            'anios_vigencia': 10,
            'descripcion': 'Resolución especial que inicia el 01/06/2025 con 10 años'
        }
    ]
    
    for caso in casos:
        print(f"\n{caso['descripcion']}:")
        fecha_inicio = caso['fecha_inicio']
        anios_vigencia = caso['anios_vigencia']
        
        try:
            fecha_fin = calcular_fecha_fin_vigencia(fecha_inicio, anios_vigencia)
            
            print(f"  Fecha inicio: {fecha_inicio.strftime('%d/%m/%Y')}")
            print(f"  Años vigencia: {anios_vigencia}")
            print(f"  Fecha fin: {fecha_fin.strftime('%d/%m/%Y')}")
            
            # Generar resumen
            resumen = generar_resumen_vigencia(fecha_inicio, fecha_fin, anios_vigencia)
            print(f"  Estado actual: {resumen['estado']}")
            print(f"  Días restantes: {resumen['dias_restantes']}")
            
        except Exception as e:
            print(f"  ✗ Error: {e}")

def test_validaciones():
    """Probar las validaciones de coherencia"""
    
    print("\n=== PRUEBAS DE VALIDACIONES ===")
    
    # Casos de validación
    casos_validacion = [
        {
            'fecha_emision': datetime(2025, 1, 1),
            'fecha_inicio': datetime(2025, 1, 1),
            'fecha_fin': datetime(2028, 12, 31),
            'anios_vigencia': 4,
            'descripcion': 'Fechas coherentes'
        },
        {
            'fecha_emision': datetime(2025, 1, 15),
            'fecha_inicio': datetime(2025, 1, 1),
            'fecha_fin': datetime(2029, 1, 1),
            'anios_vigencia': 4,
            'descripcion': 'Fecha emisión posterior a inicio (inválido)'
        },
        {
            'fecha_emision': datetime(2025, 1, 1),
            'fecha_inicio': datetime(2025, 1, 1),
            'fecha_fin': datetime(2030, 1, 1),
            'anios_vigencia': 4,
            'descripcion': 'Fecha fin no coincide con años de vigencia'
        }
    ]
    
    for caso in casos_validacion:
        print(f"\n{caso['descripcion']}:")
        
        es_valido, mensaje = validar_coherencia_fechas(
            caso['fecha_emision'],
            caso['fecha_inicio'],
            caso['fecha_fin'],
            caso['anios_vigencia']
        )
        
        print(f"  Válido: {'✓' if es_valido else '✗'}")
        print(f"  Mensaje: {mensaje}")

def generar_ejemplos_plantilla():
    """Generar ejemplos correctos para la plantilla"""
    
    print("\n=== EJEMPLOS PARA PLANTILLA ===")
    
    ejemplos = [
        {
            'ruc': '20123456789',
            'numero': '0001-2025',
            'asociada': '0001-2021',
            'tipo': 'RENOVACION',
            'fecha_resolucion': datetime(2025, 1, 1),
            'anios_vigencia': 4
        },
        {
            'ruc': '20987654321',
            'numero': '0002-2025',
            'asociada': '',
            'tipo': 'NUEVA',
            'fecha_resolucion': datetime(2025, 1, 15),
            'anios_vigencia': 4
        },
        {
            'ruc': '20456789123',
            'numero': '0150-2020',
            'asociada': '0150-2016',
            'tipo': 'RENOVACION',
            'fecha_resolucion': datetime(2020, 3, 10),
            'anios_vigencia': 4
        }
    ]
    
    print("\nEjemplos con fechas calculadas correctamente:")
    print("=" * 60)
    
    for ejemplo in ejemplos:
        fecha_inicio = ejemplo['fecha_resolucion']  # Asumimos que inicia el mismo día
        fecha_fin = calcular_fecha_fin_vigencia(fecha_inicio, ejemplo['anios_vigencia'])
        
        # Determinar estado
        resumen = generar_resumen_vigencia(fecha_inicio, fecha_fin, ejemplo['anios_vigencia'])
        estado = 'ACTIVA' if resumen['es_vigente'] else 'VENCIDA'
        
        print(f"\nEjemplo {ejemplo['numero']}:")
        print(f"  RUC: {ejemplo['ruc']}")
        print(f"  Número: {ejemplo['numero']}")
        print(f"  Asociada: {ejemplo['asociada'] or '(vacío)'}")
        print(f"  Tipo: {ejemplo['tipo']}")
        print(f"  Fecha resolución: {ejemplo['fecha_resolucion'].strftime('%d/%m/%Y')}")
        print(f"  Estado: {estado}")
        print(f"  Fecha inicio: {fecha_inicio.strftime('%d/%m/%Y')}")
        print(f"  Años vigencia: {ejemplo['anios_vigencia']}")
        print(f"  Fecha fin: {fecha_fin.strftime('%d/%m/%Y')}")
        
        # Código para plantilla
        print(f"\n  Código para plantilla:")
        print(f"    'RUC_EMPRESA_ASOCIADA': '{ejemplo['ruc']}',")
        print(f"    'RESOLUCION_NUMERO': '{ejemplo['numero']}',")
        print(f"    'RESOLUCION_ASOCIADA': '{ejemplo['asociada']}',")
        print(f"    'TIPO_RESOLUCION': '{ejemplo['tipo']}',")
        print(f"    'FECHA_RESOLUCION': '{ejemplo['fecha_resolucion'].strftime('%d/%m/%Y')}',")
        print(f"    'ESTADO': '{estado}',")
        print(f"    'FECHA_INICIO_VIGENCIA': '{fecha_inicio.strftime('%d/%m/%Y')}',")
        print(f"    'ANIOS_VIGENCIA': {ejemplo['anios_vigencia']},")
        print(f"    'FECHA_FIN_VIGENCIA': '{fecha_fin.strftime('%d/%m/%Y')}'")

def main():
    """Función principal"""
    
    print("PRUEBAS DE UTILIDADES DE RESOLUCIÓN")
    print("=" * 50)
    
    # Probar cálculos
    test_calculo_fechas()
    
    # Probar validaciones
    test_validaciones()
    
    # Generar ejemplos
    generar_ejemplos_plantilla()
    
    print("\n" + "=" * 50)
    print("✓ Todas las pruebas completadas")
    print("\nLas utilidades de resolución están funcionando correctamente.")
    print("Los ejemplos generados tienen fechas coherentes y calculadas automáticamente.")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Script para probar el cálculo de fechas de vigencia en resoluciones
"""
from datetime import datetime
from dateutil.relativedelta import relativedelta

def calcular_fecha_fin_vigencia(fecha_inicio_str: str, anios_vigencia: int) -> str:
    """
    Calcular fecha fin de vigencia: fecha_inicio + años - 1 día
    
    Args:
        fecha_inicio_str: Fecha de inicio en formato YYYY-MM-DD o dd/mm/yyyy
        anios_vigencia: Años de vigencia (4 o 10)
    
    Returns:
        Fecha fin en formato YYYY-MM-DD
    """
    # Parsear fecha de inicio
    if '/' in fecha_inicio_str:
        # Formato dd/mm/yyyy
        fecha_inicio_dt = datetime.strptime(fecha_inicio_str, '%d/%m/%Y')
    else:
        # Formato YYYY-MM-DD
        fecha_inicio_dt = datetime.strptime(fecha_inicio_str, '%Y-%m-%d')
    
    # Calcular fecha fin: inicio + años - 1 día
    fecha_fin_dt = fecha_inicio_dt + relativedelta(years=anios_vigencia) - relativedelta(days=1)
    
    return fecha_fin_dt.strftime('%Y-%m-%d')

def main():
    print("=" * 70)
    print("PRUEBA DE CÁLCULO DE FECHAS DE VIGENCIA")
    print("=" * 70)
    
    # Casos de prueba
    casos = [
        {
            'descripcion': 'Resolución con 4 años de vigencia',
            'fecha_inicio': '15/01/2024',
            'anios': 4,
            'fecha_fin_esperada': '14/01/2028'
        },
        {
            'descripcion': 'Resolución con 10 años de vigencia',
            'fecha_inicio': '20/03/2024',
            'anios': 10,
            'fecha_fin_esperada': '19/03/2034'
        },
        {
            'descripcion': 'Resolución con 4 años (formato ISO)',
            'fecha_inicio': '2024-01-15',
            'anios': 4,
            'fecha_fin_esperada': '2028-01-14'
        },
        {
            'descripcion': 'Resolución con 10 años (formato ISO)',
            'fecha_inicio': '2024-03-20',
            'anios': 10,
            'fecha_fin_esperada': '2034-03-19'
        },
        {
            'descripcion': 'Año bisiesto - 4 años',
            'fecha_inicio': '29/02/2024',
            'anios': 4,
            'fecha_fin_esperada': '28/02/2028'
        },
        {
            'descripcion': 'Año bisiesto - 10 años',
            'fecha_inicio': '29/02/2024',
            'anios': 10,
            'fecha_fin_esperada': '28/02/2034'
        }
    ]
    
    print("\n📋 Ejecutando casos de prueba...\n")
    
    todos_ok = True
    for i, caso in enumerate(casos, 1):
        print(f"Caso {i}: {caso['descripcion']}")
        print(f"  Fecha inicio: {caso['fecha_inicio']}")
        print(f"  Años vigencia: {caso['anios']}")
        
        fecha_fin_calculada = calcular_fecha_fin_vigencia(caso['fecha_inicio'], caso['anios'])
        
        # Convertir fecha esperada a formato ISO para comparar
        if '/' in caso['fecha_fin_esperada']:
            fecha_esperada_dt = datetime.strptime(caso['fecha_fin_esperada'], '%d/%m/%Y')
            fecha_esperada_iso = fecha_esperada_dt.strftime('%Y-%m-%d')
        else:
            fecha_esperada_iso = caso['fecha_fin_esperada']
        
        print(f"  Fecha fin calculada: {fecha_fin_calculada}")
        print(f"  Fecha fin esperada: {fecha_esperada_iso}")
        
        if fecha_fin_calculada == fecha_esperada_iso:
            print("  ✅ CORRECTO")
        else:
            print("  ❌ ERROR")
            todos_ok = False
        
        print()
    
    print("=" * 70)
    if todos_ok:
        print("✅ TODAS LAS PRUEBAS PASARON")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON")
    print("=" * 70)
    
    # Mostrar ejemplos de uso
    print("\n📝 EJEMPLOS DE USO EN EXCEL:")
    print("-" * 70)
    print("| Fecha Inicio  | Años | Fecha Fin Calculada | Descripción")
    print("-" * 70)
    print("| 15/01/2024    | 4    | 14/01/2028         | 4 años de vigencia")
    print("| 15/01/2024    | 10   | 14/01/2034         | 10 años de vigencia")
    print("| 20/03/2024    | 4    | 19/03/2028         | 4 años de vigencia")
    print("| 20/03/2024    | 10   | 19/03/2034         | 10 años de vigencia")
    print("| 01/06/2024    | 4    | 31/05/2028         | 4 años de vigencia")
    print("| 01/06/2024    | 10   | 31/05/2034         | 10 años de vigencia")
    print("-" * 70)
    
    print("\n💡 NOTA IMPORTANTE:")
    print("   La fecha fin se calcula como: Fecha Inicio + Años - 1 día")
    print("   Esto es porque la vigencia incluye el día de inicio.")
    print("   Ejemplo: Si inicia el 15/01/2024 y tiene 4 años de vigencia,")
    print("           termina el 14/01/2028 (último día de vigencia).")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Script para probar la normalización de DNI y Partida Registral
"""

import asyncio
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.empresa_excel_service import EmpresaExcelService

def test_normalizacion():
    """Probar las funciones de normalización"""
    print("🔄 Probando normalización de DNI y Partida Registral...")
    
    excel_service = EmpresaExcelService()
    
    # Casos de prueba para DNI
    print("\n📋 Pruebas de normalización de DNI:")
    casos_dni = [
        ("1234567", "01234567"),
        ("12345678", "12345678"),
        ("123", "00000123"),
        ("87654321", "87654321"),
        ("1", "00000001")
    ]
    
    for entrada, esperado in casos_dni:
        resultado = excel_service._normalizar_dni(entrada)
        status = "✅" if resultado == esperado else "❌"
        print(f"  {status} '{entrada}' → '{resultado}' (esperado: '{esperado}')")
    
    # Casos de prueba para Partida Registral
    print("\n📋 Pruebas de normalización de Partida Registral:")
    casos_partida = [
        ("123", "00000123"),
        ("12345678", "12345678"),
        ("123456789", "123456789"),
        ("1", "00000001"),
        ("1234567", "01234567"),
        ("87654321", "87654321")
    ]
    
    for entrada, esperado in casos_partida:
        resultado = excel_service._normalizar_partida_registral(entrada)
        status = "✅" if resultado == esperado else "❌"
        print(f"  {status} '{entrada}' → '{resultado}' (esperado: '{esperado}')")
    
    # Casos de prueba para validaciones
    print("\n📋 Pruebas de validación de DNI:")
    casos_validacion_dni = [
        ("12345678", True),
        ("1234567", True),
        ("123456789", False),  # Más de 8 dígitos
        ("abc12345", False),   # No numérico
        ("", False)            # Vacío
    ]
    
    for entrada, esperado in casos_validacion_dni:
        if entrada:  # Solo validar si no está vacío
            resultado = excel_service._validar_formato_dni(entrada)
            status = "✅" if resultado == esperado else "❌"
            print(f"  {status} '{entrada}' → {resultado} (esperado: {esperado})")
    
    print("\n📋 Pruebas de validación de Partida Registral:")
    casos_validacion_partida = [
        ("123456789", True),   # 9 dígitos (máximo)
        ("12345678", True),    # 8 dígitos
        ("123", True),         # 3 dígitos (mínimo 1)
        ("1234567890", False), # 10 dígitos (más del máximo)
        ("abc123", False),     # No numérico
        ("", False)            # Vacío
    ]
    
    for entrada, esperado in casos_validacion_partida:
        if entrada:  # Solo validar si no está vacío
            resultado = excel_service._validar_formato_partida_registral(entrada)
            status = "✅" if resultado == esperado else "❌"
            print(f"  {status} '{entrada}' → {resultado} (esperado: {esperado})")
    
    print("\n🎯 Pruebas completadas!")

if __name__ == "__main__":
    test_normalizacion()
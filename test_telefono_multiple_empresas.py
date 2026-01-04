#!/usr/bin/env python3
"""
Test para verificar la funcionalidad de múltiples teléfonos en carga masiva de empresas
"""
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.empresa_excel_service import EmpresaExcelService

def test_telefono_multiple():
    """Test de normalización de teléfonos múltiples"""
    
    print("🧪 TESTING NORMALIZACIÓN DE TELÉFONOS MÚLTIPLES")
    print("=" * 60)
    
    # Crear servicio
    excel_service = EmpresaExcelService()
    
    # Test casos de normalización
    casos_test = [
        ("051-123456", "051-123456"),  # Un solo teléfono
        ("051-123456 054-987654", "051-123456, 054-987654"),  # Dos teléfonos con espacio
        ("051-123456  054-987654", "051-123456, 054-987654"),  # Dos teléfonos con espacios múltiples
        ("051-123456 054-987654 01-999888", "051-123456, 054-987654, 01-999888"),  # Tres teléfonos
        ("051-123456", "051-123456"),  # Sin espacios separadores
        ("", ""),  # Vacío
        ("9511234567 9549876543", "9511234567, 9549876543"),  # Números celulares
        ("(051)123456 (054)987654", "(051)123456, (054)987654"),  # Con paréntesis sin espacios internos
    ]
    
    print("\n📞 Probando normalización de teléfonos:")
    print("-" * 50)
    
    todos_exitosos = True
    
    for entrada, esperado in casos_test:
        resultado = excel_service._normalizar_telefono(entrada)
        exito = resultado == esperado
        
        if not exito:
            todos_exitosos = False
        
        status = "✅" if exito else "❌"
        print(f"{status} '{entrada}' -> '{resultado}' (esperado: '{esperado}')")
    
    print("\n📋 Probando validación de teléfonos:")
    print("-" * 50)
    
    casos_validacion = [
        ("051-123456", True),  # Válido simple
        ("051-123456 054-987654", True),  # Válidos múltiples
        ("051-123456  054-987654", True),  # Válidos con espacios múltiples
        ("abc-123456", False),  # Inválido con letras
        ("051-123456 abc-987654", False),  # Uno válido, uno inválido
        ("", True),  # Vacío es válido
        ("051-123456 054-987654 01-999888", True),  # Tres válidos
        ("123", False),  # Muy corto
        ("123456789012345678901", False),  # Muy largo
        ("9511234567 9549876543", True),  # Números celulares válidos
    ]
    
    for telefono, esperado in casos_validacion:
        resultado = excel_service._validar_formato_telefono(telefono)
        exito = resultado == esperado
        
        if not exito:
            todos_exitosos = False
        
        status = "✅" if exito else "❌"
        print(f"{status} '{telefono}' -> {resultado} (esperado: {esperado})")
    
    print("\n" + "=" * 60)
    if todos_exitosos:
        print("✅ TODOS LOS TESTS PASARON - Funcionalidad de teléfonos múltiples implementada correctamente")
        return True
    else:
        print("❌ ALGUNOS TESTS FALLARON - Revisar implementación")
        return False

if __name__ == "__main__":
    success = test_telefono_multiple()
    if success:
        print("\n🎯 La funcionalidad está lista para usar")
        print("📋 Los usuarios pueden ahora:")
        print("   • Ingresar múltiples teléfonos separados por espacios en Excel")
        print("   • El sistema los convertirá automáticamente a formato separado por comas")
        print("   • Ejemplo: '051-123456 054-987654' se convierte en '051-123456, 054-987654'")
        sys.exit(0)
    else:
        print("\n❌ Funcionalidad necesita correcciones")
        sys.exit(1)
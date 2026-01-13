#!/usr/bin/env python3
"""
Script para probar la normalización de números de resolución
"""
import sys
import os
from datetime import datetime

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_normalizacion_numeros():
    """Probar la normalización de números de resolución"""
    print("🧪 PROBANDO NORMALIZACIÓN DE NÚMEROS DE RESOLUCIÓN")
    print("=" * 60)
    
    try:
        from backend.app.services.resolucion_padres_service import ResolucionPadresService
        
        # Casos de prueba basados en el problema reportado
        casos_prueba = [
            # Formato: (numero_original, fecha_emision, resultado_esperado)
            ("0290-2023", datetime(2022, 1, 1), "R-0290-2023"),  # Debe preservar 2023, no usar 2022
            ("0921-2023", datetime(2022, 6, 1), "R-0921-2023"),  # Debe preservar 2023
            ("0405-2022", datetime(2023, 1, 1), "R-0405-2022"),  # Debe preservar 2022
            ("0300-2023", datetime(2022, 12, 1), "R-0300-2023"), # Debe preservar 2023
            ("0405-2021", datetime(2022, 1, 1), "R-0405-2021"),  # Debe preservar 2021
            
            # Casos sin año (debe usar año de fecha)
            ("0290", datetime(2023, 1, 1), "R-0290-2023"),
            ("921", datetime(2023, 1, 1), "R-0921-2023"),
            ("45", datetime(2023, 1, 1), "R-0045-2023"),
            
            # Casos ya normalizados
            ("R-0290-2023", datetime(2022, 1, 1), "R-0290-2023"),
            ("R-0921-2023", datetime(2022, 1, 1), "R-0921-2023"),
            
            # Casos con R- pero sin año
            ("R-0290", datetime(2023, 1, 1), "R-0290-2023"),
            ("R-921", datetime(2023, 1, 1), "R-0921-2023"),
        ]
        
        print("📋 Casos de prueba:")
        print("-" * 60)
        print(f"{'Original':<15} {'Fecha':<12} {'Esperado':<15} {'Resultado':<15} {'Estado'}")
        print("-" * 60)
        
        todos_correctos = True
        
        for numero_original, fecha_emision, esperado in casos_prueba:
            try:
                resultado = ResolucionPadresService._normalizar_numero_resolucion(numero_original, fecha_emision)
                correcto = resultado == esperado
                estado = "✅" if correcto else "❌"
                
                if not correcto:
                    todos_correctos = False
                
                fecha_str = fecha_emision.strftime('%Y-%m-%d')
                print(f"{numero_original:<15} {fecha_str:<12} {esperado:<15} {resultado:<15} {estado}")
                
            except Exception as e:
                print(f"{numero_original:<15} {fecha_emision.strftime('%Y-%m-%d'):<12} {esperado:<15} ERROR: {str(e):<15} ❌")
                todos_correctos = False
        
        print("-" * 60)
        
        if todos_correctos:
            print("✅ TODOS LOS CASOS PASARON CORRECTAMENTE")
            print("\n🎯 PROBLEMA RESUELTO:")
            print("   - Los números con año se preservan correctamente")
            print("   - 0290-2023 → R-0290-2023 (NO cambia a 2022)")
            print("   - Solo se usa el año de la fecha cuando no hay año en el número")
        else:
            print("❌ ALGUNOS CASOS FALLARON")
            print("   - Revisar la lógica de normalización")
        
        return todos_correctos
        
    except Exception as e:
        print(f"❌ Error en prueba: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_casos_especificos_imagen():
    """Probar específicamente los casos de la imagen"""
    print("\n🎯 PROBANDO CASOS ESPECÍFICOS DE LA IMAGEN")
    print("=" * 60)
    
    try:
        from backend.app.services.resolucion_padres_service import ResolucionPadresService
        
        # Casos específicos de la imagen donde se ve el problema
        casos_imagen = [
            ("0921-2023", "R-0921-2023"),
            ("0495-2022", "R-0495-2022"),
            ("0290-2023", "R-0290-2023"),  # Este era el problemático
            ("0345-2021", "R-0345-2021"),
            ("0213-2022", "R-0213-2022"),
            ("0616-2022", "R-0616-2022"),
            ("0100-2021", "R-0100-2021"),
            ("0839-2022", "R-0839-2022"),
        ]
        
        print("📊 Casos de la imagen:")
        print("-" * 40)
        
        # Usar una fecha de emisión diferente para probar que se preserva el año original
        fecha_prueba = datetime(2022, 1, 1)  # Fecha diferente a los años de las resoluciones
        
        todos_correctos = True
        
        for numero_original, esperado in casos_imagen:
            resultado = ResolucionPadresService._normalizar_numero_resolucion(numero_original, fecha_prueba)
            correcto = resultado == esperado
            estado = "✅" if correcto else "❌"
            
            if not correcto:
                todos_correctos = False
            
            print(f"{estado} {numero_original} → {resultado} (esperado: {esperado})")
        
        if todos_correctos:
            print("\n🎉 ¡TODOS LOS CASOS DE LA IMAGEN CORREGIDOS!")
        else:
            print("\n⚠️  Algunos casos aún tienen problemas")
        
        return todos_correctos
        
    except Exception as e:
        print(f"❌ Error en prueba específica: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 INICIANDO PRUEBAS DE NORMALIZACIÓN")
    print("=" * 60)
    
    success1 = test_normalizacion_numeros()
    success2 = test_casos_especificos_imagen()
    
    print("\n" + "=" * 60)
    if success1 and success2:
        print("✅ TODAS LAS PRUEBAS EXITOSAS")
        print("\n📋 CORRECCIÓN IMPLEMENTADA:")
        print("   - La función ahora preserva el año original del número")
        print("   - 0290-2023 se mantiene como R-0290-2023")
        print("   - Solo usa el año de la fecha cuando no hay año en el número")
        print("   - Maneja correctamente todos los formatos de entrada")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON")
        print("   - Revisar la implementación de la normalización")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
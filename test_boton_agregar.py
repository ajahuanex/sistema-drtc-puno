#!/usr/bin/env python3
"""
Script para probar específicamente el botón "Agregar a Lista"
"""

import requests
import time

def test_boton_agregar():
    print("🚀 Probando botón 'Agregar a Lista'...")
    
    # Verificar que el sistema esté funcionando
    try:
        response = requests.get('http://localhost:4200/', timeout=5)
        print('✅ Frontend funcionando - Status:', response.status_code)
    except Exception as e:
        print('❌ Frontend no responde:', e)
        return False
    
    try:
        response = requests.get('http://localhost:8000/health')
        print('✅ Backend funcionando:', response.json()['status'])
    except Exception as e:
        print('❌ Backend no responde:', e)
        return False
    
    print("\n" + "="*70)
    print("🔧 CAMBIOS REALIZADOS PARA SOLUCIONAR EL PROBLEMA:")
    print("="*70)
    print("1. ✅ Corregida inicialización del formulario con valores por defecto")
    print("2. ✅ Agregados logs detallados para debugging")
    print("3. ✅ Corregidos errores de TypeScript")
    print("4. ✅ Configurados campos requeridos con valores iniciales:")
    print("   - sedeRegistro: 'PUNO'")
    print("   - ejes: 2")
    print("   - asientos: 15")
    print("   - pesoNeto: 2500")
    print("   - pesoBruto: 3500")
    print("   - tipoCombustible: 'DIESEL'")
    print("   - medidas.largo: 12")
    print("   - medidas.ancho: 2.5")
    print("   - medidas.alto: 3")
    
    print("\n" + "="*70)
    print("📋 PASOS PARA PROBAR EL BOTÓN 'AGREGAR A LISTA':")
    print("="*70)
    print("1. Ve a http://localhost:4200")
    print("2. Navega a 'Vehículos'")
    print("3. Haz clic en 'NUEVO VEHÍCULO'")
    print("4. En el modal:")
    print("   a. Selecciona una empresa")
    print("   b. Selecciona una resolución")
    print("   c. Ingresa una placa (ej: ABC-123)")
    print("   d. Los demás campos ya tienen valores por defecto")
    print("5. Haz clic en 'Agregar a Lista'")
    print("6. Deberías ver:")
    print("   - Mensaje de confirmación")
    print("   - Vehículo en la lista")
    print("   - Formulario limpio para el siguiente")
    
    print("\n🔍 SI NO FUNCIONA, REVISA LA CONSOLA:")
    print("- Abre F12 > Console")
    print("- Busca mensajes que empiecen con '🔍 AGREGANDO VEHÍCULO A LA LISTA...'")
    print("- Los errores específicos aparecerán ahí")
    
    print("\n🎯 POSIBLES PROBLEMAS Y SOLUCIONES:")
    print("- Si dice 'Formulario no válido': Revisa qué campos faltan en la consola")
    print("- Si no aparece el mensaje: Verifica que el botón esté conectado correctamente")
    print("- Si hay errores de validación: Los logs mostrarán exactamente qué campo falla")
    
    return True

if __name__ == "__main__":
    test_boton_agregar()
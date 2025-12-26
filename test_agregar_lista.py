#!/usr/bin/env python3
"""
Script para probar la funcionalidad de "Agregar a Lista" en el modal de vehículos
"""

import requests
import time

def test_agregar_lista():
    print("🚀 Probando funcionalidad 'Agregar a Lista'...")
    
    # 1. Verificar que el frontend esté funcionando
    try:
        response = requests.get('http://localhost:4200/', timeout=5)
        print('✅ Frontend funcionando - Status:', response.status_code)
    except Exception as e:
        print('❌ Frontend no responde:', e)
        return False
    
    # 2. Verificar que el backend esté funcionando
    try:
        response = requests.get('http://localhost:8000/health')
        health = response.json()
        print('✅ Backend funcionando:', health['status'])
    except Exception as e:
        print('❌ Backend no responde:', e)
        return False
    
    # 3. Verificar que las empresas estén disponibles
    try:
        response = requests.get('http://localhost:8000/api/v1/empresas')
        empresas = response.json()
        print(f'✅ Empresas disponibles: {len(empresas)}')
        if empresas:
            print(f'   - Primera empresa: {empresas[0].get("razonSocial", {}).get("principal", "N/A")}')
    except Exception as e:
        print('❌ Error obteniendo empresas:', e)
        return False
    
    # 4. Verificar que las resoluciones estén disponibles
    try:
        response = requests.get('http://localhost:8000/api/v1/resoluciones')
        resoluciones = response.json()
        print(f'✅ Resoluciones disponibles: {len(resoluciones)}')
    except Exception as e:
        print('❌ Error obteniendo resoluciones:', e)
        return False
    
    print("\n" + "="*60)
    print("📋 INSTRUCCIONES PARA PROBAR 'AGREGAR A LISTA':")
    print("="*60)
    print("1. Ve a http://localhost:4200")
    print("2. Navega al módulo de 'Vehículos'")
    print("3. Haz clic en 'NUEVO VEHÍCULO'")
    print("4. En el modal que se abre:")
    print("   a. Selecciona una empresa")
    print("   b. Selecciona una resolución")
    print("   c. Ingresa una placa (ej: ABC-123)")
    print("   d. Selecciona 'PUNO' como sede de registro")
    print("   e. Completa los campos requeridos en 'Datos Técnicos':")
    print("      - Ejes: 2")
    print("      - Asientos: 15")
    print("      - Peso Neto: 2500")
    print("      - Peso Bruto: 3500")
    print("      - Tipo de Combustible: DIESEL")
    print("      - Medidas: Largo=12, Ancho=2.5, Alto=3")
    print("5. Haz clic en 'Agregar a Lista'")
    print("6. Deberías ver:")
    print("   - Un mensaje de confirmación")
    print("   - El vehículo aparece en la lista de vehículos creados")
    print("   - El formulario se limpia para agregar otro vehículo")
    print("7. Puedes agregar más vehículos a la lista")
    print("8. Finalmente, haz clic en 'Guardar Vehículos' para guardar todos")
    print("\n🔍 DEBUGGING:")
    print("- Abre las herramientas de desarrollador (F12)")
    print("- Ve a la pestaña 'Console'")
    print("- Busca mensajes que empiecen con '🔍 AGREGANDO VEHÍCULO A LA LISTA...'")
    print("- Si hay errores, aparecerán en la consola")
    
    return True

if __name__ == "__main__":
    test_agregar_lista()
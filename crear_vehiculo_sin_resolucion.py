#!/usr/bin/env python3
"""
Script para crear un vehículo sin resolución asociada para probar el panel expandible
"""

import requests
import json

def crear_vehiculo_sin_resolucion():
    """Crear un vehículo que no esté asociado a ninguna resolución"""
    
    print("🚗 CREANDO VEHÍCULO SIN RESOLUCIÓN ASOCIADA")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. Obtener empresa de prueba
        print("\n1️⃣ OBTENIENDO EMPRESA DE PRUEBA...")
        empresas_response = requests.get(f"{base_url}/api/v1/empresas")
        if empresas_response.status_code == 200:
            empresas = empresas_response.json()
            empresa_prueba = next((e for e in empresas if e.get('ruc') == '21212121212'), None)
            
            if empresa_prueba:
                print(f"   ✅ Empresa encontrada: {empresa_prueba['razonSocial']['principal']}")
                
                # 2. Crear vehículo sin asociar a resolución
                print(f"\n2️⃣ CREANDO VEHÍCULO SIN RESOLUCIÓN...")
                
                vehiculo_data = {
                    "placa": "ZZZ-999",
                    "marca": "Toyota",
                    "modelo": "Hiace",
                    "anioFabricacion": 2020,
                    "categoria": "M3",
                    "estado": "ACTIVO",
                    "empresaActualId": empresa_prueba['id'],
                    "datosTecnicos": {
                        "motor": "2TR-FE",
                        "chasis": "TRH200-0123456",
                        "tipoCombustible": "DIESEL",
                        "cilindros": 4,
                        "ejes": 2,
                        "asientos": 15,
                        "pesoNeto": 2500,
                        "pesoBruto": 3500,
                        "cilindrada": 2700,
                        "potencia": 150,
                        "medidas": {
                            "largo": 5380,
                            "ancho": 1880,
                            "alto": 2280
                        }
                    },
                    "sedeRegistro": "PUNO"
                }
                
                vehiculo_response = requests.post(f"{base_url}/api/v1/vehiculos", json=vehiculo_data)
                
                if vehiculo_response.status_code == 201:
                    vehiculo_creado = vehiculo_response.json()
                    print(f"   ✅ Vehículo creado exitosamente:")
                    print(f"      🚗 Placa: {vehiculo_creado['placa']}")
                    print(f"      🆔 ID: {vehiculo_creado['id']}")
                    print(f"      🏢 Empresa: {empresa_prueba['razonSocial']['principal']}")
                    print(f"      ⚠️ Estado: SIN RESOLUCIÓN ASOCIADA")
                    
                    # 3. Verificar que no está en ninguna resolución
                    print(f"\n3️⃣ VERIFICANDO QUE NO ESTÁ EN NINGUNA RESOLUCIÓN...")
                    
                    resoluciones_response = requests.get(f"{base_url}/api/v1/resoluciones")
                    if resoluciones_response.status_code == 200:
                        todas_resoluciones = resoluciones_response.json()
                        resoluciones_empresa = [r for r in todas_resoluciones if r.get('empresaId') == empresa_prueba['id']]
                        
                        vehiculo_en_resolucion = False
                        for resolucion in resoluciones_empresa:
                            if vehiculo_creado['id'] in resolucion.get('vehiculosHabilitadosIds', []):
                                vehiculo_en_resolucion = True
                                print(f"   ⚠️ Vehículo encontrado en resolución: {resolucion['nroResolucion']}")
                                break
                        
                        if not vehiculo_en_resolucion:
                            print(f"   ✅ Confirmado: Vehículo NO está en ninguna resolución")
                            print(f"   🎯 Perfecto para probar el panel expandible")
                    
                    # 4. Mostrar estado actual
                    print(f"\n4️⃣ ESTADO ACTUAL DE VEHÍCULOS:")
                    
                    vehiculos_response = requests.get(f"{base_url}/api/v1/vehiculos")
                    if vehiculos_response.status_code == 200:
                        todos_vehiculos = vehiculos_response.json()
                        
                        vehiculos_con_resolucion = 0
                        vehiculos_sin_resolucion = 0
                        
                        for vehiculo in todos_vehiculos:
                            tiene_resolucion = False
                            for resolucion in resoluciones_empresa:
                                if vehiculo['id'] in resolucion.get('vehiculosHabilitadosIds', []):
                                    tiene_resolucion = True
                                    break
                            
                            if tiene_resolucion:
                                vehiculos_con_resolucion += 1
                                print(f"   ✅ {vehiculo['placa']} - CON resolución")
                            else:
                                vehiculos_sin_resolucion += 1
                                print(f"   ⚠️ {vehiculo['placa']} - SIN resolución")
                        
                        print(f"\n   📊 RESUMEN:")
                        print(f"      ✅ Vehículos con resolución: {vehiculos_con_resolucion}")
                        print(f"      ⚠️ Vehículos sin resolución: {vehiculos_sin_resolucion}")
                    
                    return vehiculo_creado
                else:
                    print(f"   ❌ Error creando vehículo: {vehiculo_response.status_code}")
                    print(f"   📝 Respuesta: {vehiculo_response.text}")
            else:
                print("   ❌ Empresa de prueba no encontrada")
        else:
            print(f"   ❌ Error obteniendo empresas: {empresas_response.status_code}")
    
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return None

if __name__ == "__main__":
    vehiculo = crear_vehiculo_sin_resolucion()
    
    if vehiculo:
        print(f"\n🎯 VEHÍCULO CREADO EXITOSAMENTE:")
        print(f"   🚗 Placa: {vehiculo['placa']}")
        print(f"   🆔 ID: {vehiculo['id']}")
        
        print(f"\n📋 INSTRUCCIONES PARA PROBAR:")
        print(f"   1. Ir a: http://localhost:4200")
        print(f"   2. Navegar: Empresas → Ver Detalles (empresa VVVVVV)")
        print(f"   3. Ir a pestaña: Vehículos")
        print(f"   4. Verificar:")
        print(f"      • Tabla principal con vehículos QQQ-111 y QQQ-222 (con resolución)")
        print(f"      • Panel expandible amarillo con vehículo {vehiculo['placa']} (sin resolución)")
        print(f"      • Botón 'Gestionar Rutas' deshabilitado para {vehiculo['placa']}")
        print(f"      • Botón 'Asociar' disponible para {vehiculo['placa']}")
        
        print(f"\n✅ LISTO PARA PROBAR LA NUEVA FUNCIONALIDAD")
    else:
        print(f"\n❌ NO SE PUDO CREAR EL VEHÍCULO")
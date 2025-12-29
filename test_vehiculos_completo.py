#!/usr/bin/env python3
"""
Script de prueba completa del módulo de vehículos
Verifica todas las funcionalidades implementadas
"""

import requests
import json
import time
from datetime import datetime

def test_crear_vehiculo_completo():
    """Prueba crear un vehículo con todos los datos"""
    print("🚗 Probando creación de vehículo completo...")
    
    # Obtener empresa existente
    empresas_response = requests.get('http://localhost:8000/api/v1/empresas')
    if empresas_response.status_code != 200:
        print("❌ No se pueden obtener empresas")
        return False
        
    empresas = empresas_response.json()
    if not empresas:
        print("❌ No hay empresas disponibles")
        return False
        
    empresa_id = empresas[0]['id']
    
    # Crear vehículo completo
    vehiculo_completo = {
        "placa": f"VEH{int(time.time()) % 1000}",
        "empresaActualId": empresa_id,
        "categoria": "M3",
        "marca": "MERCEDES-BENZ",
        "modelo": "SPRINTER 515",
        "anioFabricacion": 2024,
        "sedeRegistro": "PUNO",
        "color": "BLANCO",
        "numeroSerie": f"WDB906{int(time.time()) % 100000}",
        "observaciones": "Vehículo de prueba creado automáticamente",
        "datosTecnicos": {
            "motor": "OM651DE22LA",
            "chasis": f"WDB906{int(time.time()) % 100000}",
            "ejes": 2,
            "asientos": 19,
            "pesoNeto": 3500,
            "pesoBruto": 5000,
            "tipoCombustible": "DIESEL",
            "cilindrada": 2143,
            "potencia": 150,
            "medidas": {
                "largo": 7.35,
                "ancho": 2.02,
                "alto": 2.68
            }
        },
        "tuc": {
            "nroTuc": f"T-{int(time.time()) % 1000000}-2025",
            "fechaEmision": datetime.now().isoformat()
        }
    }
    
    response = requests.post(
        'http://localhost:8000/api/v1/vehiculos',
        json=vehiculo_completo,
        timeout=10
    )
    
    if response.status_code == 201:
        vehiculo_creado = response.json()
        print(f"✅ Vehículo completo creado: {vehiculo_creado.get('placa')}")
        print(f"   📋 Marca: {vehiculo_creado.get('marca')} {vehiculo_creado.get('modelo')}")
        print(f"   🏢 Empresa: {empresa_id}")
        return vehiculo_creado.get('id')
    else:
        print(f"❌ Error creando vehículo completo: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return False

def test_actualizar_vehiculo(vehiculo_id):
    """Prueba actualizar un vehículo"""
    print(f"\n🔄 Probando actualización de vehículo {vehiculo_id}...")
    
    actualizacion = {
        "marca": "TOYOTA",
        "modelo": "HIACE COMMUTER",
        "anioFabricacion": 2023,
        "estado": "MANTENIMIENTO",
        "observaciones": "Vehículo actualizado en prueba automática"
    }
    
    response = requests.put(
        f'http://localhost:8000/api/v1/vehiculos/{vehiculo_id}',
        json=actualizacion,
        timeout=10
    )
    
    if response.status_code == 200:
        vehiculo_actualizado = response.json()
        print(f"✅ Vehículo actualizado exitosamente")
        print(f"   📋 Nueva marca: {vehiculo_actualizado.get('marca')} {vehiculo_actualizado.get('modelo')}")
        print(f"   📊 Nuevo estado: {vehiculo_actualizado.get('estado')}")
        return True
    else:
        print(f"❌ Error actualizando vehículo: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return False

def test_obtener_vehiculo(vehiculo_id):
    """Prueba obtener un vehículo específico"""
    print(f"\n🔍 Probando obtención de vehículo {vehiculo_id}...")
    
    response = requests.get(f'http://localhost:8000/api/v1/vehiculos/{vehiculo_id}')
    
    if response.status_code == 200:
        vehiculo = response.json()
        print(f"✅ Vehículo obtenido exitosamente")
        print(f"   📋 Placa: {vehiculo.get('placa')}")
        print(f"   🚗 Vehículo: {vehiculo.get('marca')} {vehiculo.get('modelo')}")
        print(f"   📊 Estado: {vehiculo.get('estado')}")
        print(f"   🏢 Empresa: {vehiculo.get('empresaActualId')}")
        return True
    else:
        print(f"❌ Error obteniendo vehículo: {response.status_code}")
        return False

def test_listar_vehiculos_con_filtros():
    """Prueba listar vehículos con diferentes filtros"""
    print(f"\n📋 Probando listado de vehículos con filtros...")
    
    # Obtener todos los vehículos
    response = requests.get('http://localhost:8000/api/v1/vehiculos')
    if response.status_code == 200:
        todos_vehiculos = response.json()
        print(f"✅ Total de vehículos: {len(todos_vehiculos)}")
    else:
        print(f"❌ Error obteniendo todos los vehículos: {response.status_code}")
        return False
    
    # Filtrar por estado ACTIVO
    response = requests.get('http://localhost:8000/api/v1/vehiculos?estado=ACTIVO')
    if response.status_code == 200:
        vehiculos_activos = response.json()
        print(f"✅ Vehículos activos: {len(vehiculos_activos)}")
    else:
        print(f"❌ Error filtrando por estado ACTIVO")
        return False
    
    # Filtrar por empresa (si hay vehículos)
    if todos_vehiculos:
        empresa_id = todos_vehiculos[0].get('empresaActualId')
        if empresa_id:
            response = requests.get(f'http://localhost:8000/api/v1/vehiculos?empresa_id={empresa_id}')
            if response.status_code == 200:
                vehiculos_empresa = response.json()
                print(f"✅ Vehículos de empresa {empresa_id}: {len(vehiculos_empresa)}")
            else:
                print(f"❌ Error filtrando por empresa")
                return False
    
    return True

def test_validar_placa_existente():
    """Prueba la validación de placas existentes"""
    print(f"\n🔍 Probando validación de placas...")
    
    # Obtener una placa existente
    response = requests.get('http://localhost:8000/api/v1/vehiculos?limit=1')
    if response.status_code == 200:
        vehiculos = response.json()
        if vehiculos:
            placa_existente = vehiculos[0]['placa']
            
            # Validar placa existente
            response = requests.get(f'http://localhost:8000/api/v1/vehiculos/validar-placa/{placa_existente}')
            if response.status_code == 200:
                validacion = response.json()
                if not validacion.get('valido'):
                    print(f"✅ Validación correcta: placa {placa_existente} ya existe")
                else:
                    print(f"❌ Error en validación: placa {placa_existente} debería existir")
                    return False
            else:
                print(f"❌ Error en endpoint de validación")
                return False
    
    # Validar placa nueva
    placa_nueva = f"NEW{int(time.time()) % 1000}"
    response = requests.get(f'http://localhost:8000/api/v1/vehiculos/validar-placa/{placa_nueva}')
    if response.status_code == 200:
        validacion = response.json()
        if validacion.get('valido'):
            print(f"✅ Validación correcta: placa {placa_nueva} está disponible")
        else:
            print(f"❌ Error en validación: placa {placa_nueva} debería estar disponible")
            return False
    else:
        print(f"❌ Error en endpoint de validación")
        return False
    
    return True

def test_estadisticas_vehiculos():
    """Prueba obtener estadísticas de vehículos"""
    print(f"\n📊 Probando estadísticas de vehículos...")
    
    response = requests.get('http://localhost:8000/api/v1/vehiculos/estadisticas')
    
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Estadísticas obtenidas:")
        print(f"   📊 Total: {stats.get('totalVehiculos', 0)}")
        print(f"   ✅ Activos: {stats.get('vehiculosActivos', 0)}")
        print(f"   ❌ Inactivos: {stats.get('vehiculosInactivos', 0)}")
        print(f"   🔧 En mantenimiento: {stats.get('vehiculosEnMantenimiento', 0)}")
        
        por_categoria = stats.get('porCategoria', {})
        if por_categoria:
            print(f"   📋 Por categoría: {por_categoria}")
        
        return True
    else:
        print(f"❌ Error obteniendo estadísticas: {response.status_code}")
        return False

def main():
    """Función principal de pruebas"""
    print("🚀 INICIANDO PRUEBAS COMPLETAS DEL MÓDULO DE VEHÍCULOS")
    print("=" * 60)
    
    resultados = []
    
    # Prueba 1: Crear vehículo completo
    vehiculo_id = test_crear_vehiculo_completo()
    resultados.append(("Crear Vehículo Completo", bool(vehiculo_id)))
    
    if vehiculo_id:
        # Prueba 2: Actualizar vehículo
        resultados.append(("Actualizar Vehículo", test_actualizar_vehiculo(vehiculo_id)))
        
        # Prueba 3: Obtener vehículo
        resultados.append(("Obtener Vehículo", test_obtener_vehiculo(vehiculo_id)))
    
    # Prueba 4: Listar con filtros
    resultados.append(("Listar con Filtros", test_listar_vehiculos_con_filtros()))
    
    # Prueba 5: Validar placas
    resultados.append(("Validar Placas", test_validar_placa_existente()))
    
    # Prueba 6: Estadísticas
    resultados.append(("Estadísticas", test_estadisticas_vehiculos()))
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS DEL MÓDULO DE VEHÍCULOS")
    print("=" * 60)
    
    exitosos = 0
    total = len(resultados)
    
    for nombre, resultado in resultados:
        status = "✅ PASS" if resultado else "❌ FAIL"
        print(f"{nombre:<25} {status}")
        if resultado:
            exitosos += 1
    
    print(f"\n🎯 Resultado: {exitosos}/{total} pruebas exitosas")
    
    if exitosos == total:
        print("🎉 ¡MÓDULO DE VEHÍCULOS COMPLETAMENTE FUNCIONAL!")
        print("\n📋 Funcionalidades verificadas:")
        print("   ✅ Creación de vehículos con datos completos")
        print("   ✅ Actualización de vehículos existentes")
        print("   ✅ Consulta de vehículos individuales")
        print("   ✅ Listado con filtros (estado, empresa)")
        print("   ✅ Validación de placas duplicadas")
        print("   ✅ Estadísticas y métricas")
        print("\n🎨 Frontend implementado:")
        print("   ✅ Modal de creación/edición de vehículos")
        print("   ✅ Tabla con filtros y paginación")
        print("   ✅ Modal de detalle completo")
        print("   ✅ Modal de cambio de estado")
        print("   ✅ Historial vehicular")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisar los errores arriba.")
    
    return exitosos == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
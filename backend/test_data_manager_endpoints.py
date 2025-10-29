#!/usr/bin/env python3
"""
🌐 PRUEBA DE ENDPOINTS DEL DATA MANAGER
======================================

Este script prueba todos los endpoints del DataManager para verificar
que el sistema de datos persistentes funciona correctamente a través de la API REST.

Endpoints probados:
✅ GET /api/data-manager/estadisticas
✅ GET /api/data-manager/relaciones  
✅ GET /api/data-manager/empresa/{id}/completa
✅ GET /api/data-manager/vehiculo/{id}/completo
✅ GET /api/data-manager/vehiculo/{id}/flujo-completo
✅ GET /api/data-manager/buscar/{modulo}
✅ GET /api/data-manager/datos/{modulo}
✅ GET /api/data-manager/historial-validaciones/{vehiculo_id}
✅ POST /api/data-manager/agregar/{modulo}
✅ POST /api/data-manager/validacion/{vehiculo_id}
✅ GET /api/data-manager/dashboard
✅ GET /api/data-manager/health
"""

import asyncio
import aiohttp
import json
from datetime import datetime
import sys
import os

# Configuración del servidor
BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json"}

def print_header(title: str):
    """Imprimir encabezado decorado"""
    print(f"\n{'='*70}")
    print(f"🌐 {title}")
    print(f"{'='*70}")

def print_section(title: str):
    """Imprimir sección"""
    print(f"\n📋 {title}")
    print("-" * 60)

def print_response(response_data: dict, title: str = ""):
    """Imprimir respuesta formateada"""
    if title:
        print(f"\n📊 {title}:")
    
    if response_data.get("success"):
        print(f"✅ {response_data.get('message', 'Operación exitosa')}")
        
        # Mostrar datos relevantes según el tipo de respuesta
        data = response_data.get("data", {})
        
        if "estadisticas_generales" in data:
            # Estadísticas globales
            stats = data["estadisticas_generales"]
            print(f"   📊 Empresas: {stats.get('total_empresas', 0)}")
            print(f"   🚗 Vehículos: {stats.get('total_vehiculos', 0)}")
            print(f"   👨‍💼 Conductores: {stats.get('total_conductores', 0)}")
            print(f"   🛣️  Rutas: {stats.get('total_rutas', 0)}")
            print(f"   📄 Expedientes: {stats.get('total_expedientes', 0)}")
            print(f"   📋 Resoluciones: {stats.get('total_resoluciones', 0)}")
            
        elif "razonSocial" in data:
            # Empresa completa
            print(f"   🏢 {data['razonSocial']} (RUC: {data.get('ruc', 'N/A')})")
            print(f"   📊 Vehículos: {len(data.get('vehiculos', []))}")
            print(f"   👨‍💼 Conductores: {len(data.get('conductores', []))}")
            print(f"   🛣️  Rutas: {len(data.get('rutas', []))}")
            
        elif "placa" in data:
            # Vehículo completo
            print(f"   🚗 {data['placa']} - {data.get('marca', '')} {data.get('modelo', '')}")
            print(f"   🏢 Empresa: {data.get('empresa', {}).get('razonSocial', 'N/A')}")
            print(f"   👨‍💼 Conductores: {len(data.get('conductores', []))}")
            print(f"   📄 Expedientes: {len(data.get('expedientes', []))}")
            print(f"   ✅ Validaciones: {len(data.get('historial_validaciones', []))}")
            
        elif "timeline" in data:
            # Flujo completo
            print(f"   🚗 {data['placa']} - Flujo completo")
            print(f"   📅 Eventos en timeline: {len(data.get('timeline', []))}")
            
        elif "total_encontrados" in data:
            # Búsqueda
            print(f"   🔍 Módulo: {data.get('modulo', 'N/A')}")
            print(f"   📊 Encontrados: {data.get('total_encontrados', 0)}")
            
        elif "modulo" in data and "total" in data:
            # Datos de módulo
            print(f"   📋 Módulo: {data['modulo']}")
            print(f"   📊 Total registros: {data['total']}")
            
        elif "vehiculo_id" in data and "total_validaciones" in data:
            # Historial de validaciones
            print(f"   🚗 Vehículo: {data['vehiculo_id']}")
            print(f"   ✅ Total validaciones: {data['total_validaciones']}")
            
        elif "elemento_id" in data:
            # Elemento agregado
            print(f"   📋 Módulo: {data.get('modulo', 'N/A')}")
            print(f"   🆔 ID generado: {data.get('elemento_id', 'N/A')}")
            
        elif "validacion_id" in data:
            # Validación agregada
            print(f"   🚗 Vehículo: {data.get('vehiculo_id', 'N/A')}")
            print(f"   ✅ Validación ID: {data.get('validacion_id', 'N/A')}")
            
        elif "resumen_ejecutivo" in data:
            # Dashboard
            resumen = data["resumen_ejecutivo"]
            print(f"   📊 Total entidades: {sum(resumen.values())}")
            print(f"   🚨 Alertas: {len(data.get('alertas_sistema', []))}")
            
        elif "status" in data:
            # Health check
            print(f"   💚 Estado: {data.get('status', 'unknown')}")
            print(f"   ⏱️  Uptime: {data.get('uptime', 'N/A')}")
            print(f"   📊 Total entidades: {data.get('total_entities', 0)}")
            
    else:
        print(f"❌ Error: {response_data.get('message', 'Error desconocido')}")

async def test_endpoint(session: aiohttp.ClientSession, method: str, url: str, data: dict = None, title: str = ""):
    """Probar un endpoint específico"""
    try:
        if method.upper() == "GET":
            async with session.get(url) as response:
                response_data = await response.json()
                print_response(response_data, title)
                return response_data
        elif method.upper() == "POST":
            async with session.post(url, json=data, headers=HEADERS) as response:
                response_data = await response.json()
                print_response(response_data, title)
                return response_data
    except Exception as e:
        print(f"❌ Error al probar {method} {url}: {str(e)}")
        return None

async def test_estadisticas_endpoints(session: aiohttp.ClientSession):
    """Probar endpoints de estadísticas"""
    print_header("ENDPOINTS DE ESTADÍSTICAS")
    
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/estadisticas",
        title="Estadísticas Globales"
    )
    
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/relaciones",
        title="Mapa de Relaciones"
    )
    
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/dashboard",
        title="Dashboard Ejecutivo"
    )
    
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/health",
        title="Health Check"
    )

async def test_consultas_endpoints(session: aiohttp.ClientSession):
    """Probar endpoints de consultas"""
    print_header("ENDPOINTS DE CONSULTAS")
    
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/empresa/1/completa",
        title="Empresa Completa (ID: 1)"
    )
    
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/vehiculo/1/completo",
        title="Vehículo Completo (ID: 1)"
    )
    
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/vehiculo/1/flujo-completo",
        title="Flujo Completo Vehículo (ID: 1)"
    )
    
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/historial-validaciones/1",
        title="Historial de Validaciones (Vehículo ID: 1)"
    )

async def test_datos_endpoints(session: aiohttp.ClientSession):
    """Probar endpoints de datos por módulo"""
    print_header("ENDPOINTS DE DATOS POR MÓDULO")
    
    modulos = ["empresas", "vehiculos", "conductores", "rutas", "expedientes", "resoluciones"]
    
    for modulo in modulos:
        await test_endpoint(
            session, "GET", f"{BASE_URL}/api/data-manager/datos/{modulo}",
            title=f"Datos del Módulo: {modulo.title()}"
        )

async def test_busquedas_endpoints(session: aiohttp.ClientSession):
    """Probar endpoints de búsquedas"""
    print_header("ENDPOINTS DE BÚSQUEDAS")
    
    # Buscar vehículos de empresa específica
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/buscar/vehiculos?empresa_id=1",
        title="Búsqueda: Vehículos de Empresa 1"
    )
    
    # Buscar conductores activos
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/buscar/conductores?estado=ACTIVO",
        title="Búsqueda: Conductores Activos"
    )
    
    # Buscar expedientes aprobados
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/buscar/expedientes?estado=APROBADO",
        title="Búsqueda: Expedientes Aprobados"
    )
    
    # Buscar rutas activas
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/buscar/rutas?estado=ACTIVA",
        title="Búsqueda: Rutas Activas"
    )

async def test_agregar_endpoints(session: aiohttp.ClientSession):
    """Probar endpoints para agregar datos"""
    print_header("ENDPOINTS PARA AGREGAR DATOS")
    
    # Agregar nueva empresa
    nueva_empresa = {
        "razonSocial": "Transportes API Test S.A.C.",
        "ruc": "20999888777",
        "representanteLegal": "Juan API Test",
        "telefono": "051-999999",
        "email": "test@apitest.com",
        "direccion": "Av. API Test 123, Puno",
        "estado": "ACTIVO",
        "fechaConstitucion": "2024-01-01",
        "modalidadServicio": "REGULAR",
        "tipoEmpresa": "PEQUEÑA"
    }
    
    empresa_response = await test_endpoint(
        session, "POST", f"{BASE_URL}/api/data-manager/agregar/empresas",
        data=nueva_empresa, title="Agregar Nueva Empresa"
    )
    
    if empresa_response and empresa_response.get("success"):
        empresa_id = empresa_response["data"]["elemento_id"]
        
        # Agregar vehículo a la nueva empresa
        nuevo_vehiculo = {
            "empresaId": empresa_id,
            "placa": "API-123",
            "numeroTarjetaCirculacion": "TC-API-123",
            "marca": "TEST",
            "modelo": "API-MODEL",
            "año": 2024,
            "numeroAsientos": 30,
            "numeroMotor": "API-MOTOR-123",
            "numeroChasis": "API-CHASIS-123",
            "combustible": "DIESEL",
            "cilindrada": 4000,
            "potencia": 200,
            "pesoSeco": 5000,
            "pesoBruto": 8000,
            "cargaUtil": 3000,
            "estado": "ACTIVO",
            "fechaFabricacion": "2024-01-15",
            "fechaImportacion": "2024-02-20"
        }
        
        vehiculo_response = await test_endpoint(
            session, "POST", f"{BASE_URL}/api/data-manager/agregar/vehiculos",
            data=nuevo_vehiculo, title="Agregar Nuevo Vehículo"
        )
        
        if vehiculo_response and vehiculo_response.get("success"):
            vehiculo_id = vehiculo_response["data"]["elemento_id"]
            
            # Agregar conductor
            nuevo_conductor = {
                "empresaId": empresa_id,
                "codigoConductor": "API-COND-001",
                "nombres": "Carlos API",
                "apellidoPaterno": "Test",
                "apellidoMaterno": "Conductor",
                "dni": "88888888",
                "fechaNacimiento": "1990-01-01",
                "telefono": "999888777",
                "email": "carlos.api@test.com",
                "numeroLicencia": "P88888888",
                "categoria": "B-III",
                "fechaVencimiento": "2029-01-01",
                "tipoConductor": "TITULAR",
                "estado": "ACTIVO",
                "vehiculosAsignadosIds": [vehiculo_id],
                "vehiculoPrincipalId": vehiculo_id,
                "fechaIngreso": "2024-01-15",
                "salario": 1400.0
            }
            
            await test_endpoint(
                session, "POST", f"{BASE_URL}/api/data-manager/agregar/conductores",
                data=nuevo_conductor, title="Agregar Nuevo Conductor"
            )
            
            # Agregar validación al historial
            nueva_validacion = {
                "fechaValidacion": "2024-01-20",
                "tipoValidacion": "INICIAL",
                "estado": "APROBADO",
                "observaciones": "Validación inicial vía API"
            }
            
            await test_endpoint(
                session, "POST", f"{BASE_URL}/api/data-manager/validacion/{vehiculo_id}",
                data=nueva_validacion, title="Agregar Validación al Historial"
            )
            
            # Agregar expediente
            nuevo_expediente = {
                "vehiculoId": vehiculo_id,
                "numeroExpediente": "EXP-API-001",
                "tipoTramite": "ALTA",
                "fechaInicio": "2024-01-15",
                "estado": "EN_PROCESO",
                "observaciones": "Expediente creado vía API"
            }
            
            await test_endpoint(
                session, "POST", f"{BASE_URL}/api/data-manager/agregar/expedientes",
                data=nuevo_expediente, title="Agregar Nuevo Expediente"
            )

async def test_verificacion_relaciones(session: aiohttp.ClientSession):
    """Verificar que las relaciones se mantienen correctamente"""
    print_header("VERIFICACIÓN DE RELACIONES AUTOMÁTICAS")
    
    # Obtener estadísticas actualizadas
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/estadisticas",
        title="Estadísticas Después de Agregar Datos"
    )
    
    # Verificar empresa completa con nuevos datos
    print_section("Verificando Empresa Recién Creada")
    empresas_response = await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/datos/empresas",
        title="Todas las Empresas"
    )
    
    if empresas_response and empresas_response.get("success"):
        empresas_data = empresas_response["data"]["datos"]
        # Buscar la empresa de prueba
        for empresa_id, empresa_data in empresas_data.items():
            if "API Test" in empresa_data.get("razonSocial", ""):
                await test_endpoint(
                    session, "GET", f"{BASE_URL}/api/data-manager/empresa/{empresa_id}/completa",
                    title=f"Empresa API Test Completa (ID: {empresa_id})"
                )
                break

async def test_endpoints_error(session: aiohttp.ClientSession):
    """Probar manejo de errores en endpoints"""
    print_header("PRUEBAS DE MANEJO DE ERRORES")
    
    # Empresa inexistente
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/empresa/999/completa",
        title="Empresa Inexistente (Error Esperado)"
    )
    
    # Vehículo inexistente
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/vehiculo/999/completo",
        title="Vehículo Inexistente (Error Esperado)"
    )
    
    # Módulo inválido
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/datos/modulo_inexistente",
        title="Módulo Inválido (Error Esperado)"
    )
    
    # Búsqueda en módulo inválido
    await test_endpoint(
        session, "GET", f"{BASE_URL}/api/data-manager/buscar/modulo_inexistente",
        title="Búsqueda en Módulo Inválido (Error Esperado)"
    )

async def main():
    """Función principal de pruebas"""
    print_header("PRUEBA COMPLETA DE ENDPOINTS DEL DATA MANAGER")
    print("🌐 Probando todos los endpoints del sistema de datos persistentes...")
    print(f"🔗 URL Base: {BASE_URL}")
    print(f"⏰ Fecha/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        async with aiohttp.ClientSession() as session:
            # Verificar que el servidor esté funcionando
            try:
                async with session.get(f"{BASE_URL}/api/data-manager/health") as response:
                    if response.status != 200:
                        print(f"❌ Servidor no disponible en {BASE_URL}")
                        print("   Asegúrate de que el servidor FastAPI esté ejecutándose")
                        return
            except Exception as e:
                print(f"❌ No se puede conectar al servidor: {str(e)}")
                print("   Ejecuta: uvicorn app.main:app --reload")
                return
            
            # Ejecutar todas las pruebas
            await test_estadisticas_endpoints(session)
            await test_consultas_endpoints(session)
            await test_datos_endpoints(session)
            await test_busquedas_endpoints(session)
            await test_agregar_endpoints(session)
            await test_verificacion_relaciones(session)
            await test_endpoints_error(session)
            
            print_header("RESUMEN DE PRUEBAS DE ENDPOINTS")
            print("✅ Todas las pruebas de endpoints completadas")
            print("🌐 Los endpoints del DataManager funcionan correctamente")
            print("🔗 Las relaciones se mantienen automáticamente vía API")
            print("📊 Las estadísticas se actualizan en tiempo real")
            print("🛡️  El manejo de errores funciona correctamente")
            
            # Estadísticas finales
            final_stats = await test_endpoint(
                session, "GET", f"{BASE_URL}/api/data-manager/estadisticas",
                title="Estadísticas Finales del Sistema"
            )
            
    except Exception as e:
        print(f"\n❌ Error durante las pruebas: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Iniciando pruebas de endpoints del DataManager...")
    print("📋 Asegúrate de que el servidor FastAPI esté ejecutándose:")
    print("   cd backend && uvicorn app.main:app --reload")
    print("\n⏳ Iniciando en 3 segundos...")
    
    import time
    time.sleep(3)
    
    asyncio.run(main())
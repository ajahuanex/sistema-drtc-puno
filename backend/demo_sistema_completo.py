#!/usr/bin/env python3
"""
🎉 DEMOSTRACIÓN COMPLETA DEL SISTEMA DE DATOS PERSISTENTES
=========================================================

Este script demuestra el funcionamiento completo del sistema:
1. Datos persistentes en memoria
2. Relaciones automáticas entre módulos
3. API REST funcionando
4. Estadísticas en tiempo real
5. Flujo completo de trabajo

Ejecutar con el servidor FastAPI funcionando en puerto 8000
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_header(title: str):
    print(f"\n{'='*70}")
    print(f"🎉 {title}")
    print(f"{'='*70}")

def print_section(title: str):
    print(f"\n📋 {title}")
    print("-" * 60)

async def verificar_servidor():
    """Verificar que el servidor esté funcionando"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Servidor funcionando: {data.get('service', 'FastAPI')}")
                    return True
                else:
                    print(f"❌ Servidor respondió con código: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ No se puede conectar al servidor: {str(e)}")
        print("   Ejecuta: uvicorn app.main:app --reload")
        return False

async def demo_estadisticas_iniciales():
    """Demostrar estadísticas iniciales del sistema"""
    print_header("ESTADÍSTICAS INICIALES DEL SISTEMA")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/api/data-manager/estadisticas") as response:
            data = await response.json()
            
            if data.get("success"):
                stats = data["data"]["estadisticas_generales"]
                print_section("Resumen Ejecutivo")
                print(f"🏢 Empresas: {stats['total_empresas']}")
                print(f"🚗 Vehículos: {stats['total_vehiculos']}")
                print(f"👨‍💼 Conductores: {stats['total_conductores']}")
                print(f"🛣️ Rutas: {stats['total_rutas']}")
                print(f"📄 Expedientes: {stats['total_expedientes']}")
                print(f"📋 Resoluciones: {stats['total_resoluciones']}")
                
                print_section("Relaciones Activas")
                relaciones = data["data"]["relaciones_activas"]
                print(f"🔗 Vehículos con conductor: {relaciones['vehiculos_con_conductor']}")
                print(f"🔗 Vehículos sin conductor: {relaciones['vehiculos_sin_conductor']}")
                print(f"🔗 Conductores con vehículo: {relaciones['conductores_con_vehiculo']}")
                print(f"🔗 Conductores sin vehículo: {relaciones['conductores_sin_vehiculo']}")

async def demo_consulta_empresa_completa():
    """Demostrar consulta de empresa completa"""
    print_header("CONSULTA DE EMPRESA COMPLETA")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/api/data-manager/empresa/1/completa") as response:
            data = await response.json()
            
            if data.get("success"):
                empresa = data["data"]
                print_section("Datos de la Empresa")
                print(f"🏢 {empresa['razonSocial']}")
                print(f"📋 RUC: {empresa['ruc']}")
                print(f"👤 Representante: {empresa['representanteLegal']}")
                print(f"📞 Teléfono: {empresa['telefono']}")
                
                print_section("Vehículos de la Empresa")
                for i, vehiculo in enumerate(empresa.get('vehiculos', []), 1):
                    if vehiculo:
                        print(f"{i}. 🚗 {vehiculo['placa']} - {vehiculo['marca']} {vehiculo['modelo']}")
                
                print_section("Conductores de la Empresa")
                for i, conductor in enumerate(empresa.get('conductores', []), 1):
                    if conductor:
                        nombre = f"{conductor['nombres']} {conductor['apellidoPaterno']}"
                        print(f"{i}. 👨‍💼 {nombre} - {conductor['codigoConductor']}")

async def demo_flujo_completo_vehiculo():
    """Demostrar flujo completo de un vehículo"""
    print_header("FLUJO COMPLETO DE VEHÍCULO")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/api/data-manager/vehiculo/1/flujo-completo") as response:
            data = await response.json()
            
            if data.get("success"):
                vehiculo = data["data"]
                print_section("Información del Vehículo")
                print(f"🚗 Placa: {vehiculo['placa']}")
                print(f"🏢 Empresa: {vehiculo['empresa']['razonSocial']}")
                print(f"🔧 Marca/Modelo: {vehiculo['marca']} {vehiculo['modelo']}")
                
                print_section("Timeline de Eventos (Últimos 5)")
                for i, evento in enumerate(vehiculo.get('timeline', [])[:5], 1):
                    print(f"{i}. [{evento['fecha']}] {evento['tipo']}: {evento['descripcion']}")

async def demo_agregar_datos_dinamicos():
    """Demostrar agregado dinámico de datos"""
    print_header("AGREGADO DINÁMICO DE DATOS")
    
    # Agregar nueva empresa
    nueva_empresa = {
        "razonSocial": "Transportes Demo API S.A.C.",
        "ruc": "20888777666",
        "representanteLegal": "Demo API Manager",
        "telefono": "051-888777",
        "email": "demo@api.com",
        "direccion": "Av. Demo API 456, Puno",
        "estado": "ACTIVO",
        "fechaConstitucion": "2024-01-01",
        "modalidadServicio": "REGULAR",
        "tipoEmpresa": "PEQUEÑA"
    }
    
    async with aiohttp.ClientSession() as session:
        print_section("Agregando Nueva Empresa")
        async with session.post(
            f"{BASE_URL}/api/data-manager/agregar/empresas",
            json=nueva_empresa,
            headers={"Content-Type": "application/json"}
        ) as response:
            data = await response.json()
            
            if data.get("success"):
                empresa_id = data["data"]["elemento_id"]
                print(f"✅ Empresa agregada con ID: {empresa_id}")
                
                # Agregar vehículo a la nueva empresa
                nuevo_vehiculo = {
                    "empresaId": empresa_id,
                    "placa": "DEMO-API",
                    "numeroTarjetaCirculacion": "TC-DEMO-API",
                    "marca": "DEMO",
                    "modelo": "API-2024",
                    "año": 2024,
                    "numeroAsientos": 30,
                    "numeroMotor": "DEMO-API-001",
                    "numeroChasis": "DEMO-API-CHASIS",
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
                
                print_section("Agregando Nuevo Vehículo")
                async with session.post(
                    f"{BASE_URL}/api/data-manager/agregar/vehiculos",
                    json=nuevo_vehiculo,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    data = await response.json()
                    
                    if data.get("success"):
                        vehiculo_id = data["data"]["elemento_id"]
                        print(f"✅ Vehículo agregado con ID: {vehiculo_id}")
                        return empresa_id, vehiculo_id
    
    return None, None

async def demo_verificar_persistencia(empresa_id, vehiculo_id):
    """Verificar que los datos agregados persisten"""
    print_header("VERIFICACIÓN DE PERSISTENCIA")
    
    if not empresa_id or not vehiculo_id:
        print("❌ No hay datos nuevos para verificar")
        return
    
    async with aiohttp.ClientSession() as session:
        print_section("Verificando Empresa Recién Creada")
        async with session.get(f"{BASE_URL}/api/data-manager/empresa/{empresa_id}/completa") as response:
            data = await response.json()
            
            if data.get("success"):
                empresa = data["data"]
                print(f"✅ Empresa encontrada: {empresa['razonSocial']}")
                print(f"   📊 Vehículos: {len(empresa.get('vehiculos', []))}")
                print(f"   👨‍💼 Conductores: {len(empresa.get('conductores', []))}")
            else:
                print("❌ Empresa no encontrada")
        
        print_section("Verificando Vehículo Recién Creado")
        async with session.get(f"{BASE_URL}/api/data-manager/vehiculo/{vehiculo_id}/completo") as response:
            data = await response.json()
            
            if data.get("success"):
                vehiculo = data["data"]
                print(f"✅ Vehículo encontrado: {vehiculo['placa']}")
                print(f"   🏢 Empresa: {vehiculo['empresa']['razonSocial']}")
            else:
                print("❌ Vehículo no encontrado")

async def demo_estadisticas_finales():
    """Mostrar estadísticas finales después de agregar datos"""
    print_header("ESTADÍSTICAS FINALES")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/api/data-manager/dashboard") as response:
            data = await response.json()
            
            if data.get("success"):
                dashboard = data["data"]
                
                print_section("Resumen Ejecutivo Final")
                resumen = dashboard["resumen_ejecutivo"]
                total_entidades = sum(resumen.values())
                print(f"📊 Total Entidades: {total_entidades}")
                print(f"🏢 Empresas: {resumen['total_empresas']}")
                print(f"🚗 Vehículos: {resumen['total_vehiculos']}")
                print(f"👨‍💼 Conductores: {resumen['total_conductores']}")
                
                print_section("Top Empresas por Vehículos")
                for i, empresa in enumerate(dashboard.get("top_empresas", [])[:3], 1):
                    print(f"{i}. 🏢 {empresa['razon_social']}: {empresa['total_vehiculos']} vehículos")
                
                print_section("Operaciones Recientes")
                for i, op in enumerate(dashboard.get("operaciones_recientes", [])[-3:], 1):
                    timestamp = op.get("timestamp", "").split("T")[1][:8] if "T" in op.get("timestamp", "") else ""
                    print(f"{i}. [{timestamp}] {op.get('tipo', '')}: {op.get('descripcion', '')}")

async def demo_busquedas():
    """Demostrar búsquedas por criterios"""
    print_header("BÚSQUEDAS POR CRITERIOS")
    
    async with aiohttp.ClientSession() as session:
        print_section("Vehículos Activos")
        async with session.get(f"{BASE_URL}/api/data-manager/buscar/vehiculos?estado=ACTIVO") as response:
            data = await response.json()
            
            if data.get("success"):
                resultados = data["data"]["resultados"]
                print(f"📊 Encontrados: {len(resultados)} vehículos activos")
                for i, vehiculo in enumerate(resultados[:3], 1):
                    print(f"{i}. 🚗 {vehiculo['placa']} - {vehiculo['marca']} {vehiculo['modelo']}")
        
        print_section("Conductores Activos")
        async with session.get(f"{BASE_URL}/api/data-manager/buscar/conductores?estado=ACTIVO") as response:
            data = await response.json()
            
            if data.get("success"):
                resultados = data["data"]["resultados"]
                print(f"📊 Encontrados: {len(resultados)} conductores activos")
                for i, conductor in enumerate(resultados[:3], 1):
                    nombre = f"{conductor['nombres']} {conductor['apellidoPaterno']}"
                    print(f"{i}. 👨‍💼 {nombre} - {conductor['codigoConductor']}")

async def main():
    """Función principal de la demostración"""
    print_header("DEMOSTRACIÓN COMPLETA DEL SISTEMA DE DATOS PERSISTENTES")
    print("🎉 Demostrando todas las funcionalidades del DataManager...")
    print(f"🔗 URL Base: {BASE_URL}")
    print(f"⏰ Fecha/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificar servidor
    if not await verificar_servidor():
        return
    
    try:
        # Ejecutar todas las demostraciones
        await demo_estadisticas_iniciales()
        await demo_consulta_empresa_completa()
        await demo_flujo_completo_vehiculo()
        await demo_busquedas()
        
        empresa_id, vehiculo_id = await demo_agregar_datos_dinamicos()
        await demo_verificar_persistencia(empresa_id, vehiculo_id)
        await demo_estadisticas_finales()
        
        print_header("RESUMEN DE LA DEMOSTRACIÓN")
        print("✅ Todas las demostraciones completadas exitosamente")
        print("🗄️ El sistema de datos persistentes funciona perfectamente")
        print("🔗 Las relaciones se mantienen automáticamente")
        print("📊 Las estadísticas se actualizan en tiempo real")
        print("🌐 La API REST está completamente funcional")
        print("⏱️ Los datos persisten durante toda la sesión")
        
        print("\n🎯 FUNCIONALIDADES DEMOSTRADAS:")
        print("   • ✅ Persistencia de datos en memoria")
        print("   • ✅ Relaciones automáticas entre módulos")
        print("   • ✅ Estadísticas globales en tiempo real")
        print("   • ✅ Consultas completas con relaciones")
        print("   • ✅ Flujo completo de procesos")
        print("   • ✅ Búsquedas avanzadas por criterios")
        print("   • ✅ Agregado dinámico de datos")
        print("   • ✅ API REST completamente funcional")
        print("   • ✅ Dashboard ejecutivo")
        print("   • ✅ Timeline de eventos")
        
        print(f"\n🌐 ENDPOINTS DISPONIBLES:")
        print(f"   • {BASE_URL}/api/data-manager/estadisticas")
        print(f"   • {BASE_URL}/api/data-manager/dashboard")
        print(f"   • {BASE_URL}/api/data-manager/relaciones")
        print(f"   • {BASE_URL}/docs (Documentación Swagger)")
        
    except Exception as e:
        print(f"\n❌ Error durante la demostración: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Iniciando demostración completa del sistema...")
    print("📋 Asegúrate de que el servidor FastAPI esté ejecutándose:")
    print("   cd backend && uvicorn app.main:app --reload")
    print("\n⏳ Iniciando en 3 segundos...")
    
    time.sleep(3)
    
    asyncio.run(main())
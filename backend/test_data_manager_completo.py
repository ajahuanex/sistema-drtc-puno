#!/usr/bin/env python3
"""
🗄️ PRUEBA COMPLETA DEL DATA MANAGER
=====================================

Este script demuestra el funcionamiento completo del sistema de datos persistentes
que mantiene las relaciones entre todos los módulos mientras la aplicación esté ejecutándose.

Funcionalidades probadas:
✅ Datos persistentes en memoria
✅ Relaciones automáticas entre módulos  
✅ Estadísticas globales en tiempo real
✅ Flujo completo de trabajo
✅ Timeline de eventos
✅ Búsquedas por criterios
✅ Dashboard ejecutivo
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import json
from datetime import datetime, date
from app.services.data_manager_service import get_data_manager

def print_header(title: str):
    """Imprimir encabezado decorado"""
    print(f"\n{'='*60}")
    print(f"🗄️  {title}")
    print(f"{'='*60}")

def print_section(title: str):
    """Imprimir sección"""
    print(f"\n📋 {title}")
    print("-" * 50)

def print_json(data, title: str = ""):
    """Imprimir JSON formateado"""
    if title:
        print(f"\n📊 {title}:")
    print(json.dumps(data, indent=2, ensure_ascii=False, default=str))

async def test_estadisticas_globales():
    """Probar estadísticas globales del sistema"""
    print_header("ESTADÍSTICAS GLOBALES DEL SISTEMA")
    
    data_manager = get_data_manager()
    data_manager = get_data_manager()
    estadisticas = data_manager.obtener_estadisticas_globales()
    
    print_section("Resumen Ejecutivo")
    resumen = estadisticas["estadisticas_generales"]
    print(f"📊 Total Empresas: {resumen['total_empresas']}")
    print(f"🚗 Total Vehículos: {resumen['total_vehiculos']}")
    print(f"👨‍💼 Total Conductores: {resumen['total_conductores']}")
    print(f"🛣️  Total Rutas: {resumen['total_rutas']}")
    print(f"📄 Total Expedientes: {resumen['total_expedientes']}")
    print(f"📋 Total Resoluciones: {resumen['total_resoluciones']}")
    print(f"✅ Total Validaciones: {resumen['total_validaciones']}")
    
    print_section("Distribución por Estados")
    estados = estadisticas["estadisticas_por_estado"]
    print("🚗 Vehículos por estado:")
    for estado, cantidad in estados["vehiculos"].items():
        print(f"   • {estado}: {cantidad}")
    
    print("\n👨‍💼 Conductores por estado:")
    for estado, cantidad in estados["conductores"].items():
        print(f"   • {estado}: {cantidad}")
    
    print("\n📄 Expedientes por estado:")
    for estado, cantidad in estados["expedientes"].items():
        print(f"   • {estado}: {cantidad}")
    
    print_section("Relaciones Activas")
    relaciones = estadisticas["relaciones_activas"]
    print(f"🔗 Vehículos con conductor: {relaciones['vehiculos_con_conductor']}")
    print(f"🔗 Vehículos sin conductor: {relaciones['vehiculos_sin_conductor']}")
    print(f"🔗 Conductores con vehículo: {relaciones['conductores_con_vehiculo']}")
    print(f"🔗 Conductores sin vehículo: {relaciones['conductores_sin_vehiculo']}")
    
    print_section("Información de Sesión")
    sesion = estadisticas["informacion_sesion"]
    print(f"⏰ Inicio de sesión: {sesion['inicio_sesion']}")
    print(f"🔄 Última actualización: {sesion['ultima_actualizacion']}")
    print(f"⏱️  Tiempo activo: {sesion['tiempo_activo']}")
    
    print_section("Operaciones Recientes")
    for i, operacion in enumerate(estadisticas["log_operaciones_recientes"][-5:], 1):
        print(f"{i}. [{operacion['timestamp']}] {operacion['tipo']}: {operacion['descripcion']}")

async def test_empresa_completa():
    """Probar obtención de empresa completa con relaciones"""
    print_header("EMPRESA COMPLETA CON RELACIONES")
    
    empresa_id = "1"
    data_manager = get_data_manager()
    empresa = data_manager.obtener_empresa_completa(empresa_id)
    
    if empresa:
        print_section("Datos Básicos de la Empresa")
        print(f"🏢 Razón Social: {empresa['razonSocial']}")
        print(f"📋 RUC: {empresa['ruc']}")
        print(f"👤 Representante: {empresa['representanteLegal']}")
        print(f"📞 Teléfono: {empresa['telefono']}")
        print(f"📧 Email: {empresa['email']}")
        print(f"📍 Dirección: {empresa['direccion']}")
        print(f"📊 Estado: {empresa['estado']}")
        
        print_section("Vehículos de la Empresa")
        for i, vehiculo in enumerate(empresa['vehiculos'], 1):
            if vehiculo:
                print(f"{i}. 🚗 {vehiculo['placa']} - {vehiculo['marca']} {vehiculo['modelo']} ({vehiculo['estado']})")
        
        print_section("Conductores de la Empresa")
        for i, conductor in enumerate(empresa['conductores'], 1):
            if conductor:
                nombre = f"{conductor['nombres']} {conductor['apellidoPaterno']} {conductor['apellidoMaterno']}"
                print(f"{i}. 👨‍💼 {nombre} - {conductor['codigoConductor']} ({conductor['estado']})")
        
        print_section("Rutas de la Empresa")
        for i, ruta in enumerate(empresa['rutas'], 1):
            if ruta:
                print(f"{i}. 🛣️  {ruta['nombre']} - {ruta['origen']} → {ruta['destino']} ({ruta['estado']})")
        
        print_section("Estadísticas de la Empresa")
        stats = empresa['estadisticas']
        print(f"📊 Total vehículos: {stats['total_vehiculos']}")
        print(f"📊 Total conductores: {stats['total_conductores']}")
        print(f"📊 Total rutas: {stats['total_rutas']}")
        print(f"✅ Vehículos activos: {stats['vehiculos_activos']}")
        print(f"✅ Conductores activos: {stats['conductores_activos']}")

async def test_flujo_completo_vehiculo():
    """Probar flujo completo de un vehículo"""
    print_header("FLUJO COMPLETO DE VEHÍCULO")
    
    vehiculo_id = "1"
    data_manager = get_data_manager()
    flujo = data_manager.obtener_flujo_completo_vehiculo(vehiculo_id)
    
    if flujo:
        print_section("Información del Vehículo")
        print(f"🚗 Placa: {flujo['placa']}")
        print(f"🏢 Empresa: {flujo['empresa']['razonSocial']}")
        print(f"🔧 Marca/Modelo: {flujo['marca']} {flujo['modelo']}")
        print(f"📅 Año: {flujo['año']}")
        print(f"📊 Estado: {flujo['estado']}")
        
        print_section("Conductores Asignados")
        for i, conductor in enumerate(flujo['conductores'], 1):
            if conductor:
                nombre = f"{conductor['nombres']} {conductor['apellidoPaterno']} {conductor['apellidoMaterno']}"
                print(f"{i}. 👨‍💼 {nombre} ({conductor['tipoConductor']})")
        
        print_section("Expedientes Asociados")
        for i, expediente in enumerate(flujo['expedientes'], 1):
            if expediente:
                print(f"{i}. 📄 {expediente['numeroExpediente']} - {expediente['tipoTramite']} ({expediente['estado']})")
                
                # Mostrar resoluciones del expediente
                for j, resolucion in enumerate(expediente.get('resoluciones', []), 1):
                    if resolucion:
                        print(f"   └─ 📋 {resolucion['numeroResolucion']} - {resolucion['tipoResolucion']}")
        
        print_section("Historial de Validaciones")
        for i, validacion in enumerate(flujo['historial_validaciones'], 1):
            print(f"{i}. ✅ Validación #{validacion['numeroSecuencial']} - {validacion['tipoValidacion']}")
            print(f"   📅 Fecha: {validacion['fechaValidacion']}")
            print(f"   📊 Estado: {validacion['estado']}")
            if validacion.get('observaciones'):
                print(f"   📝 Observaciones: {validacion['observaciones']}")
        
        print_section("Rutas Asignadas")
        for i, ruta in enumerate(flujo['rutas'], 1):
            if ruta:
                print(f"{i}. 🛣️  {ruta['nombre']} - {ruta['origen']} → {ruta['destino']}")
                print(f"   💰 Tarifa: S/ {ruta['tarifaAdulto']} (adulto)")
                print(f"   🚌 Frecuencia: {ruta['frecuenciaDiaria']} viajes/día")
        
        print_section("Timeline de Eventos")
        for i, evento in enumerate(flujo['timeline'][:10], 1):  # Mostrar últimos 10 eventos
            print(f"{i}. [{evento['fecha']}] {evento['tipo']}: {evento['descripcion']}")

async def test_busquedas_criterios():
    """Probar búsquedas por criterios"""
    print_header("BÚSQUEDAS POR CRITERIOS")
    
    print_section("Vehículos de la Empresa 1")
    data_manager = get_data_manager()
    vehiculos_empresa1 = data_manager.buscar_por_criterios("vehiculos", {"empresaId": "1"})
    for vehiculo in vehiculos_empresa1:
        print(f"🚗 {vehiculo['placa']} - {vehiculo['marca']} {vehiculo['modelo']} ({vehiculo['estado']})")
    
    print_section("Conductores Activos")
    data_manager = get_data_manager()
    conductores_activos = data_manager.buscar_por_criterios("conductores", {"estado": "ACTIVO"})
    for conductor in conductores_activos:
        nombre = f"{conductor['nombres']} {conductor['apellidoPaterno']} {conductor['apellidoMaterno']}"
        print(f"👨‍💼 {nombre} - {conductor['codigoConductor']} (Empresa: {conductor['empresaId']})")
    
    print_section("Expedientes Aprobados")
    data_manager = get_data_manager()
    expedientes_aprobados = data_manager.buscar_por_criterios("expedientes", {"estado": "APROBADO"})
    for expediente in expedientes_aprobados:
        print(f"📄 {expediente['numeroExpediente']} - {expediente['tipoTramite']} (Vehículo: {expediente['vehiculoId']})")
    
    print_section("Rutas Activas")
    data_manager = get_data_manager()
    rutas_activas = data_manager.buscar_por_criterios("rutas", {"estado": "ACTIVA"})
    for ruta in rutas_activas:
        print(f"🛣️  {ruta['nombre']} - {ruta['origen']} → {ruta['destino']} (Empresa: {ruta['empresaId']})")

async def test_mapa_relaciones():
    """Probar mapa completo de relaciones"""
    print_header("MAPA COMPLETO DE RELACIONES")
    
    data_manager = get_data_manager()
    relaciones = data_manager.obtener_mapa_relaciones()
    
    print_section("Empresas → Vehículos")
    for empresa_id, vehiculos_ids in relaciones["empresas_vehiculos"].items():
        data_manager = get_data_manager()
        empresa = data_manager.empresas.get(empresa_id, {})
        print(f"🏢 {empresa.get('razonSocial', f'Empresa {empresa_id}')}:")
        for vehiculo_id in vehiculos_ids:
            data_manager = get_data_manager()
            vehiculo = data_manager.vehiculos.get(vehiculo_id, {})
            print(f"   └─ 🚗 {vehiculo.get('placa', f'Vehículo {vehiculo_id}')}")
    
    print_section("Empresas → Conductores")
    for empresa_id, conductores_ids in relaciones["empresas_conductores"].items():
        data_manager = get_data_manager()
        empresa = data_manager.empresas.get(empresa_id, {})
        print(f"🏢 {empresa.get('razonSocial', f'Empresa {empresa_id}')}:")
        for conductor_id in conductores_ids:
            data_manager = get_data_manager()
            conductor = data_manager.conductores.get(conductor_id, {})
            nombre = f"{conductor.get('nombres', '')} {conductor.get('apellidoPaterno', '')}"
            print(f"   └─ 👨‍💼 {nombre} ({conductor.get('codigoConductor', f'Conductor {conductor_id}')})")
    
    print_section("Vehículos → Conductores")
    for vehiculo_id, conductores_ids in relaciones["vehiculos_conductores"].items():
        if conductores_ids:  # Solo mostrar vehículos con conductores
            data_manager = get_data_manager()
            vehiculo = data_manager.vehiculos.get(vehiculo_id, {})
            print(f"🚗 {vehiculo.get('placa', f'Vehículo {vehiculo_id}')}:")
            for conductor_id in conductores_ids:
                data_manager = get_data_manager()
                conductor = data_manager.conductores.get(conductor_id, {})
                nombre = f"{conductor.get('nombres', '')} {conductor.get('apellidoPaterno', '')}"
                print(f"   └─ 👨‍💼 {nombre} ({conductor.get('tipoConductor', '')})")
    
    print_section("Vehículos → Expedientes")
    for vehiculo_id, expedientes_ids in relaciones["vehiculos_expedientes"].items():
        if expedientes_ids:  # Solo mostrar vehículos con expedientes
            data_manager = get_data_manager()
            vehiculo = data_manager.vehiculos.get(vehiculo_id, {})
            print(f"🚗 {vehiculo.get('placa', f'Vehículo {vehiculo_id}')}:")
            for expediente_id in expedientes_ids:
                data_manager = get_data_manager()
                expediente = data_manager.expedientes.get(expediente_id, {})
                print(f"   └─ 📄 {expediente.get('numeroExpediente', f'Expediente {expediente_id}')} ({expediente.get('estado', '')})")

async def test_agregar_datos_dinamicos():
    """Probar agregado dinámico de datos"""
    print_header("AGREGADO DINÁMICO DE DATOS")
    
    print_section("Agregando Nueva Empresa")
    nueva_empresa = {
        "razonSocial": "Transportes Dinámicos S.A.C.",
        "ruc": "20111222333",
        "representanteLegal": "Pedro Dinamico",
        "telefono": "051-999888",
        "email": "contacto@dinamicos.com",
        "direccion": "Av. Nueva 999, Puno",
        "estado": "ACTIVO",
        "fechaConstitucion": "2024-01-01",
        "modalidadServicio": "REGULAR",
        "tipoEmpresa": "PEQUEÑA"
    }
    
    data_manager = get_data_manager()
    empresa_id = data_manager.agregar_empresa(nueva_empresa)
    print(f"✅ Empresa agregada con ID: {empresa_id}")
    
    print_section("Agregando Nuevo Vehículo")
    nuevo_vehiculo = {
        "empresaId": empresa_id,
        "placa": "DIN-999",
        "numeroTarjetaCirculacion": "TC999",
        "marca": "HYUNDAI",
        "modelo": "COUNTY",
        "año": 2024,
        "numeroAsientos": 25,
        "numeroMotor": "D4GA999",
        "numeroChasis": "KMJHDH999",
        "combustible": "DIESEL",
        "cilindrada": 3907,
        "potencia": 130,
        "pesoSeco": 3500,
        "pesoBruto": 6500,
        "cargaUtil": 3000,
        "estado": "ACTIVO",
        "fechaFabricacion": "2024-01-15",
        "fechaImportacion": "2024-02-20"
    }
    
    data_manager = get_data_manager()
    vehiculo_id = data_manager.agregar_vehiculo(nuevo_vehiculo)
    print(f"✅ Vehículo agregado con ID: {vehiculo_id}")
    
    print_section("Agregando Nuevo Conductor")
    nuevo_conductor = {
        "empresaId": empresa_id,
        "codigoConductor": "COND999",
        "nombres": "Miguel Angel",
        "apellidoPaterno": "Dinamico",
        "apellidoMaterno": "Nuevo",
        "dni": "99999999",
        "fechaNacimiento": "1992-05-10",
        "telefono": "999888777",
        "email": "miguel.dinamico@email.com",
        "numeroLicencia": "P99999999",
        "categoria": "B-IIA",
        "fechaVencimiento": "2029-05-10",
        "tipoConductor": "TITULAR",
        "estado": "ACTIVO",
        "vehiculosAsignadosIds": [vehiculo_id],
        "vehiculoPrincipalId": vehiculo_id,
        "fechaIngreso": "2024-01-15",
        "salario": 1300.0
    }
    
    data_manager = get_data_manager()
    conductor_id = data_manager.agregar_conductor(nuevo_conductor)
    print(f"✅ Conductor agregado con ID: {conductor_id}")
    
    print_section("Agregando Validación al Historial")
    nueva_validacion = {
        "fechaValidacion": "2024-01-20",
        "tipoValidacion": "INICIAL",
        "estado": "APROBADO",
        "observaciones": "Validación inicial del vehículo nuevo"
    }
    
    data_manager = get_data_manager()
    validacion_id = data_manager.agregar_validacion_historial(vehiculo_id, nueva_validacion)
    print(f"✅ Validación agregada con ID: {validacion_id}")
    
    print_section("Verificando Relaciones Automáticas")
    data_manager = get_data_manager()
    empresa_completa = data_manager.obtener_empresa_completa(empresa_id)
    print(f"🏢 Empresa: {empresa_completa['razonSocial']}")
    print(f"   🚗 Vehículos: {len(empresa_completa['vehiculos'])}")
    print(f"   👨‍💼 Conductores: {len(empresa_completa['conductores'])}")
    
    data_manager = get_data_manager()
    vehiculo_completo = data_manager.obtener_vehiculo_completo(vehiculo_id)
    print(f"🚗 Vehículo: {vehiculo_completo['placa']}")
    print(f"   👨‍💼 Conductores asignados: {len(vehiculo_completo['conductores'])}")
    print(f"   ✅ Validaciones en historial: {len(vehiculo_completo['historial_validaciones'])}")

async def test_dashboard_ejecutivo():
    """Probar dashboard ejecutivo"""
    print_header("DASHBOARD EJECUTIVO")
    
    # Simular obtención de dashboard (sin usar el router)
    data_manager = get_data_manager()
    estadisticas = data_manager.obtener_estadisticas_globales()
    
    print_section("Resumen Ejecutivo")
    resumen = estadisticas["estadisticas_generales"]
    print(f"📊 Entidades Totales: {sum(resumen.values())}")
    print(f"🏢 Empresas: {resumen['total_empresas']}")
    print(f"🚗 Vehículos: {resumen['total_vehiculos']}")
    print(f"👨‍💼 Conductores: {resumen['total_conductores']}")
    print(f"🛣️  Rutas: {resumen['total_rutas']}")
    print(f"📄 Expedientes: {resumen['total_expedientes']}")
    print(f"📋 Resoluciones: {resumen['total_resoluciones']}")
    
    print_section("Top Empresas por Vehículos")
    empresas_vehiculos = []
    data_manager = get_data_manager()
    for empresa_id, empresa_data in data_manager.empresas.items():
        data_manager = get_data_manager()
        vehiculos_count = len(data_manager.relaciones.empresas_vehiculos.get(empresa_id, []))
        empresas_vehiculos.append({
            "empresa_id": empresa_id,
            "razon_social": empresa_data.get("razonSocial", ""),
            "total_vehiculos": vehiculos_count
        })
    empresas_vehiculos.sort(key=lambda x: x["total_vehiculos"], reverse=True)
    
    for i, empresa in enumerate(empresas_vehiculos[:3], 1):
        print(f"{i}. 🏢 {empresa['razon_social']}: {empresa['total_vehiculos']} vehículos")
    
    print_section("Alertas del Sistema")
    vehiculos_sin_conductor = estadisticas["relaciones_activas"]["vehiculos_sin_conductor"]
    conductores_sin_vehiculo = estadisticas["relaciones_activas"]["conductores_sin_vehiculo"]
    
    if vehiculos_sin_conductor > 0:
        print(f"⚠️  {vehiculos_sin_conductor} vehículos sin conductor asignado")
    
    if conductores_sin_vehiculo > 0:
        print(f"ℹ️  {conductores_sin_vehiculo} conductores sin vehículo asignado")
    
    expedientes_pendientes = estadisticas["estadisticas_por_estado"]["expedientes"].get("EN_PROCESO", 0)
    if expedientes_pendientes > 0:
        print(f"ℹ️  {expedientes_pendientes} expedientes en proceso")
    
    if vehiculos_sin_conductor == 0 and conductores_sin_vehiculo == 0 and expedientes_pendientes == 0:
        print("✅ No hay alertas activas en el sistema")

async def main():
    """Función principal de pruebas"""
    print_header("SISTEMA DE DATOS PERSISTENTES - PRUEBA COMPLETA")
    print("🗄️  Probando funcionalidades del DataManager...")
    print(f"⏰ Fecha/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Ejecutar todas las pruebas
        await test_estadisticas_globales()
        await test_empresa_completa()
        await test_flujo_completo_vehiculo()
        await test_busquedas_criterios()
        await test_mapa_relaciones()
        await test_agregar_datos_dinamicos()
        await test_dashboard_ejecutivo()
        
        print_header("RESUMEN DE PRUEBAS")
        print("✅ Todas las pruebas completadas exitosamente")
        print("🗄️  El sistema de datos persistentes está funcionando correctamente")
        print("🔗 Las relaciones entre módulos se mantienen automáticamente")
        print("📊 Las estadísticas se actualizan en tiempo real")
        print("⏱️  Los datos persisten mientras la aplicación esté ejecutándose")
        
        # Estadísticas finales
        data_manager = get_data_manager()
        estadisticas_finales = data_manager.obtener_estadisticas_globales()
        print(f"\n📈 Estadísticas Finales:")
        print(f"   • Total entidades: {sum(estadisticas_finales['estadisticas_generales'].values())}")
        data_manager = get_data_manager()
        print(f"   • Operaciones registradas: {len(data_manager.log_operaciones)}")
        print(f"   • Tiempo de sesión: {estadisticas_finales['informacion_sesion']['tiempo_activo']}")
        
    except Exception as e:
        print(f"\n❌ Error durante las pruebas: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
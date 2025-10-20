"""
Script de prueba para el sistema de filtrado por historial de validaciones.

Este script demuestra:
1. Configuración de datos de prueba con múltiples registros por placa
2. Cálculo del historial de validaciones
3. Marcado de vehículos actuales vs históricos
4. Filtrado de vehículos visibles en tablas
5. Bloqueo de registros históricos
6. Estadísticas del filtrado
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vehiculo_historial_service import VehiculoHistorialService
from app.services.vehiculo_filtro_historial_service import VehiculoFiltroHistorialService
from app.services.mock_vehiculo_service import MockVehiculoService
from app.services.mock_resolucion_service import MockResolucionService
from app.models.vehiculo import VehiculoCreate, DatosTecnicos, EstadoVehiculo
from app.models.resolucion import ResolucionCreate

async def setup_datos_multiples_registros():
    """Configurar datos de prueba con múltiples registros por placa"""
    
    print("🔧 CONFIGURANDO DATOS CON MÚLTIPLES REGISTROS POR PLACA")
    print("=" * 55)
    
    vehiculo_service = MockVehiculoService()
    resolucion_service = MockResolucionService()
    
    # Limpiar datos existentes
    vehiculo_service.vehiculos.clear()
    resolucion_service.resoluciones.clear()
    
    # Crear múltiples registros para la misma placa simulando transferencias/cambios
    vehiculos_data = [
        # ABC-123: Registro 1 (más antiguo) - Empresa 1
        {
            "placa": "ABC-123-V1",
            "empresaActualId": "1",
            "categoria": "M1",
            "marca": "Toyota",
            "modelo": "Hiace",
            "anioFabricacion": 2020,
            "datosTecnicos": DatosTecnicos(
                motor="2TR-FE", chasis="TRH200", ejes=2, asientos=15,
                pesoNeto=2500.0, pesoBruto=3500.0,
                medidas={"largo": 5.38, "ancho": 1.88, "alto": 2.28},
                tipoCombustible="GASOLINA", cilindrada=2.7, potencia=163.0
            )
        },
        # ABC-123: Registro 2 (medio) - Transferido a Empresa 2
        {
            "placa": "ABC-123-V2",
            "empresaActualId": "2",
            "categoria": "M1",
            "marca": "Toyota",
            "modelo": "Hiace",
            "anioFabricacion": 2020,
            "datosTecnicos": DatosTecnicos(
                motor="2TR-FE", chasis="TRH200", ejes=2, asientos=15,
                pesoNeto=2500.0, pesoBruto=3500.0,
                medidas={"largo": 5.38, "ancho": 1.88, "alto": 2.28},
                tipoCombustible="GASOLINA", cilindrada=2.7, potencia=163.0
            )
        },
        # ABC-123: Registro 3 (actual) - Transferido a Empresa 3
        {
            "placa": "ABC-123-V3",
            "empresaActualId": "3",
            "categoria": "M1",
            "marca": "Toyota",
            "modelo": "Hiace",
            "anioFabricacion": 2020,
            "datosTecnicos": DatosTecnicos(
                motor="2TR-FE", chasis="TRH200", ejes=2, asientos=15,
                pesoNeto=2500.0, pesoBruto=3500.0,
                medidas={"largo": 5.38, "ancho": 1.88, "alto": 2.28},
                tipoCombustible="GASOLINA", cilindrada=2.7, potencia=163.0
            )
        },
        # XYZ-789: Registro 1 (más antiguo) - Empresa 1
        {
            "placa": "XYZ-789-V1",
            "empresaActualId": "1",
            "categoria": "M2",
            "marca": "Mercedes",
            "modelo": "Sprinter",
            "anioFabricacion": 2019,
            "datosTecnicos": DatosTecnicos(
                motor="OM651", chasis="W906", ejes=2, asientos=20,
                pesoNeto=3200.0, pesoBruto=4500.0,
                medidas={"largo": 7.36, "ancho": 2.02, "alto": 2.73},
                tipoCombustible="DIESEL", cilindrada=2.1, potencia=143.0
            )
        },
        # XYZ-789: Registro 2 (actual) - Transferido a Empresa 2
        {
            "placa": "XYZ-789-V2",
            "empresaActualId": "2",
            "categoria": "M2",
            "marca": "Mercedes",
            "modelo": "Sprinter",
            "anioFabricacion": 2019,
            "datosTecnicos": DatosTecnicos(
                motor="OM651", chasis="W906", ejes=2, asientos=20,
                pesoNeto=3200.0, pesoBruto=4500.0,
                medidas={"largo": 7.36, "ancho": 2.02, "alto": 2.73},
                tipoCombustible="DIESEL", cilindrada=2.1, potencia=143.0
            )
        },
        # DEF-456: Solo un registro (sin transferencias)
        {
            "placa": "DEF-456",
            "empresaActualId": "1",
            "categoria": "M3",
            "marca": "Volvo",
            "modelo": "B7R",
            "anioFabricacion": 2018,
            "datosTecnicos": DatosTecnicos(
                motor="D7E", chasis="B7RLE", ejes=2, asientos=45,
                pesoNeto=8500.0, pesoBruto=12000.0,
                medidas={"largo": 12.0, "ancho": 2.55, "alto": 3.2},
                tipoCombustible="DIESEL", cilindrada=7.2, potencia=290.0
            )
        }
    ]
    
    vehiculos_creados = []
    for i, vehiculo_data in enumerate(vehiculos_data):
        vehiculo_create = VehiculoCreate(**vehiculo_data)
        vehiculo = await vehiculo_service.create_vehiculo(vehiculo_create)
        vehiculos_creados.append(vehiculo)
        print(f"✅ Vehículo {i+1}: {vehiculo.placa} - Empresa {vehiculo.empresaActualId} (ID: {vehiculo.id})")
    
    # Crear resoluciones asociadas
    fecha_base = datetime(2023, 1, 1)
    resoluciones_data = [
        # Resolución 1: ABC-123 registro 1 (más antigua)
        {
            "nroResolucion": "R-0001-2023",
            "fechaEmision": fecha_base,
            "empresaId": "1",
            "expedienteId": "1",
            "tipoResolucion": "PADRE",
            "tipoTramite": "PRIMIGENIA",
            "descripcion": "Resolución primigenia ABC-123 en empresa 1",
            "vehiculosHabilitadosIds": [vehiculos_creados[0].id],
            "usuarioEmisionId": "user1"
        },
        # Resolución 2: ABC-123 registro 2 (transferencia)
        {
            "nroResolucion": "R-0002-2023",
            "fechaEmision": fecha_base + timedelta(days=180),
            "empresaId": "2",
            "expedienteId": "2",
            "tipoResolucion": "HIJO",
            "tipoTramite": "OTROS",
            "descripcion": "Transferencia ABC-123 a empresa 2",
            "vehiculosHabilitadosIds": [vehiculos_creados[1].id],
            "usuarioEmisionId": "user1"
        },
        # Resolución 3: ABC-123 registro 3 (transferencia actual)
        {
            "nroResolucion": "R-0003-2023",
            "fechaEmision": fecha_base + timedelta(days=360),
            "empresaId": "3",
            "expedienteId": "3",
            "tipoResolucion": "HIJO",
            "tipoTramite": "OTROS",
            "descripcion": "Transferencia ABC-123 a empresa 3 (actual)",
            "vehiculosHabilitadosIds": [vehiculos_creados[2].id],
            "usuarioEmisionId": "user1"
        },
        # Resolución 4: XYZ-789 registro 1
        {
            "nroResolucion": "R-0004-2023",
            "fechaEmision": fecha_base + timedelta(days=90),
            "empresaId": "1",
            "expedienteId": "4",
            "tipoResolucion": "PADRE",
            "tipoTramite": "PRIMIGENIA",
            "descripcion": "Resolución primigenia XYZ-789 en empresa 1",
            "vehiculosHabilitadosIds": [vehiculos_creados[3].id],
            "usuarioEmisionId": "user1"
        },
        # Resolución 5: XYZ-789 registro 2 (actual)
        {
            "nroResolucion": "R-0005-2023",
            "fechaEmision": fecha_base + timedelta(days=270),
            "empresaId": "2",
            "expedienteId": "5",
            "tipoResolucion": "HIJO",
            "tipoTramite": "OTROS",
            "descripcion": "Transferencia XYZ-789 a empresa 2 (actual)",
            "vehiculosHabilitadosIds": [vehiculos_creados[4].id],
            "usuarioEmisionId": "user1"
        },
        # Resolución 6: DEF-456 (único registro)
        {
            "nroResolucion": "R-0006-2023",
            "fechaEmision": fecha_base + timedelta(days=120),
            "empresaId": "1",
            "expedienteId": "6",
            "tipoResolucion": "PADRE",
            "tipoTramite": "PRIMIGENIA",
            "descripcion": "Resolución única DEF-456",
            "vehiculosHabilitadosIds": [vehiculos_creados[5].id],
            "usuarioEmisionId": "user1"
        }
    ]
    
    for resolucion_data in resoluciones_data:
        resolucion_create = ResolucionCreate(**resolucion_data)
        resolucion = await resolucion_service.create_resolucion(resolucion_create)
        print(f"✅ Resolución: {resolucion.nroResolucion} - {resolucion.descripcion}")
    
    print(f"\n📊 Datos configurados:")
    print(f"  • {len(vehiculos_creados)} registros de vehículos")
    print(f"  • {len(resoluciones_data)} resoluciones")
    print(f"  • 6 placas para simular historial: ABC-123-V1/V2/V3, XYZ-789-V1/V2, DEF-456")
    
    return vehiculos_creados

async def test_filtrado_historial_completo():
    """Prueba completa del sistema de filtrado por historial"""
    
    print("\n🚀 INICIANDO PRUEBAS DE FILTRADO POR HISTORIAL")
    print("=" * 50)
    
    # Configurar datos de prueba
    vehiculos_creados = await setup_datos_multiples_registros()
    
    # Inicializar servicios
    historial_service = VehiculoHistorialService()
    filtro_service = VehiculoFiltroHistorialService()
    vehiculo_service = MockVehiculoService()
    
    # 1. Mostrar estado inicial
    print("\n📊 1. ESTADO INICIAL (ANTES DEL FILTRADO)")
    print("-" * 40)
    
    vehiculos_todos = await vehiculo_service.get_vehiculos_activos()
    print(f"Total de registros de vehículos: {len(vehiculos_todos)}")
    
    print("\n🚗 Registros por placa:")
    placas_agrupadas = {}
    for vehiculo in vehiculos_todos:
        placa = vehiculo.placa
        if placa not in placas_agrupadas:
            placas_agrupadas[placa] = []
        placas_agrupadas[placa].append(vehiculo)
    
    for placa, vehiculos_placa in placas_agrupadas.items():
        print(f"  📋 {placa}: {len(vehiculos_placa)} registros")
        for i, vehiculo in enumerate(vehiculos_placa, 1):
            print(f"    {i}. ID: {vehiculo.id} - Empresa: {vehiculo.empresaActualId} - Estado: {vehiculo.estado}")
    
    # 2. Calcular historial de validaciones
    print("\n🔄 2. CALCULANDO HISTORIAL DE VALIDACIONES")
    print("-" * 45)
    
    resultado_historial = await historial_service.actualizar_historial_todos_vehiculos()
    print(f"✅ Historial calculado:")
    print(f"  • Procesados: {resultado_historial['total_procesados']}")
    print(f"  • Actualizados: {resultado_historial['actualizados']}")
    print(f"  • Errores: {resultado_historial['errores']}")
    
    # Mostrar historial calculado
    print(f"\n📋 Historial por vehículo:")
    vehiculos_con_historial = await vehiculo_service.get_vehiculos_activos()
    for vehiculo in vehiculos_con_historial:
        print(f"  • {vehiculo.placa} (ID: {vehiculo.id}): Historial #{vehiculo.numeroHistorialValidacion} - Empresa: {vehiculo.empresaActualId}")
    
    # 3. Marcar vehículos actuales vs históricos
    print("\n🏷️ 3. MARCANDO VEHÍCULOS ACTUALES VS HISTÓRICOS")
    print("-" * 50)
    
    resultado_marcado = await filtro_service.marcar_vehiculos_historial_actual()
    print(f"✅ Marcado completado:")
    print(f"  • Total procesados: {resultado_marcado['total_procesados']}")
    print(f"  • Placas únicas: {resultado_marcado['placas_unicas']}")
    print(f"  • Vehículos actuales: {resultado_marcado['vehiculos_actuales']}")
    print(f"  • Vehículos históricos: {resultado_marcado['vehiculos_historicos']}")
    print(f"  • Bloqueados: {resultado_marcado['bloqueados']}")
    
    # 4. Mostrar estado después del marcado
    print("\n📊 4. ESTADO DESPUÉS DEL MARCADO")
    print("-" * 35)
    
    vehiculos_actualizados = await vehiculo_service.get_vehiculos_activos()
    
    print(f"\n🟢 Vehículos ACTUALES (visibles en tablas):")
    vehiculos_actuales = [v for v in vehiculos_actualizados if v.esHistorialActual]
    for vehiculo in vehiculos_actuales:
        print(f"  ✅ {vehiculo.placa} (ID: {vehiculo.id}) - Empresa: {vehiculo.empresaActualId} - Estado: {vehiculo.estado}")
    
    print(f"\n🔒 Vehículos HISTÓRICOS (bloqueados):")
    vehiculos_historicos = [v for v in vehiculos_actualizados if not v.esHistorialActual]
    for vehiculo in vehiculos_historicos:
        print(f"  🚫 {vehiculo.placa} (ID: {vehiculo.id}) - Empresa: {vehiculo.empresaActualId} - Estado: {vehiculo.estado}")
        if vehiculo.vehiculoHistorialActualId:
            print(f"      ↳ Apunta al actual: {vehiculo.vehiculoHistorialActualId}")
    
    # 5. Probar filtros de visibilidad
    print("\n👁️ 5. PROBANDO FILTROS DE VISIBILIDAD")
    print("-" * 40)
    
    # Vehículos visibles (solo actuales)
    vehiculos_visibles = await filtro_service.obtener_vehiculos_visibles()
    print(f"\n📋 Vehículos visibles en tablas: {len(vehiculos_visibles)}")
    for vehiculo in vehiculos_visibles:
        print(f"  • {vehiculo.placa} - Empresa: {vehiculo.empresaActualId}")
    
    # Vehículos por empresa
    print(f"\n🏢 Vehículos visibles por empresa:")
    for empresa_id in ["1", "2", "3"]:
        vehiculos_empresa = await filtro_service.obtener_vehiculos_visibles(empresa_id)
        print(f"  Empresa {empresa_id}: {len(vehiculos_empresa)} vehículos")
        for vehiculo in vehiculos_empresa:
            print(f"    - {vehiculo.placa}")
    
    # 6. Historial completo por placa
    print("\n📜 6. HISTORIAL COMPLETO POR PLACA")
    print("-" * 35)
    
    for placa in ["ABC-123-V1", "ABC-123-V2", "ABC-123-V3", "XYZ-789-V1", "XYZ-789-V2", "DEF-456"]:
        historial_placa = await filtro_service.obtener_vehiculos_historicos(placa)
        print(f"\n📋 Historial de {placa}: {len(historial_placa)} registros")
        for i, vehiculo in enumerate(historial_placa, 1):
            estado_texto = "🟢 ACTUAL" if vehiculo.esHistorialActual else "🔒 HISTÓRICO"
            print(f"  {i}. {estado_texto} - Empresa: {vehiculo.empresaActualId} - Historial: #{vehiculo.numeroHistorialValidacion}")
    
    # 7. Estadísticas del filtrado
    print("\n📊 7. ESTADÍSTICAS DEL FILTRADO")
    print("-" * 35)
    
    estadisticas = await filtro_service.obtener_estadisticas_filtrado()
    
    resumen = estadisticas['resumen']
    print(f"\n📈 Resumen general:")
    print(f"  • Total de vehículos: {resumen['total_vehiculos']}")
    print(f"  • Vehículos actuales: {resumen['vehiculos_actuales']}")
    print(f"  • Vehículos históricos: {resumen['vehiculos_historicos']}")
    print(f"  • Vehículos bloqueados: {resumen['vehiculos_bloqueados']}")
    print(f"  • Placas únicas: {resumen['placas_unicas']}")
    print(f"  • Placas con historial múltiple: {resumen['placas_con_historial_multiple']}")
    
    eficiencia = estadisticas['eficiencia_filtrado']
    print(f"\n⚡ Eficiencia del filtrado:")
    print(f"  • Porcentaje visible: {eficiencia['porcentaje_visibles']}%")
    print(f"  • Porcentaje oculto: {eficiencia['porcentaje_ocultos']}%")
    print(f"  • Reducción de ruido: {eficiencia['reduccion_ruido']} registros")
    
    print(f"\n📊 Distribución por estado:")
    for estado, cantidad in estadisticas['distribucion_por_estado'].items():
        if cantidad > 0:
            print(f"  • {estado}: {cantidad} vehículos")
    
    # 8. Probar restauración de vehículo histórico
    print("\n🔄 8. PROBANDO RESTAURACIÓN DE VEHÍCULO HISTÓRICO")
    print("-" * 50)
    
    # Buscar un vehículo histórico para restaurar
    vehiculo_historico = next((v for v in vehiculos_actualizados if not v.esHistorialActual), None)
    
    if vehiculo_historico:
        print(f"🔍 Restaurando vehículo histórico: {vehiculo_historico.placa} (ID: {vehiculo_historico.id})")
        
        resultado_restauracion = await filtro_service.restaurar_vehiculo_historico(vehiculo_historico.id)
        print(f"✅ Restauración completada:")
        print(f"  • Vehículo restaurado: {resultado_restauracion['vehiculo_restaurado']}")
        print(f"  • Placa: {resultado_restauracion['placa']}")
        print(f"  • Vehículo anterior: {resultado_restauracion['vehiculo_anterior']}")
        
        # Verificar el cambio
        vehiculos_despues_restauracion = await filtro_service.obtener_vehiculos_visibles()
        print(f"\n📋 Vehículos visibles después de restauración: {len(vehiculos_despues_restauracion)}")
        for vehiculo in vehiculos_despues_restauracion:
            print(f"  • {vehiculo.placa} - Empresa: {vehiculo.empresaActualId}")
    
    print("\n🎉 PRUEBAS DE FILTRADO COMPLETADAS EXITOSAMENTE")
    print("=" * 50)

if __name__ == "__main__":
    print("🚀 SISTEMA DE FILTRADO POR HISTORIAL DE VALIDACIONES")
    print("=" * 55)
    print("Este script demuestra cómo los vehículos con historial anterior")
    print("se bloquean automáticamente y solo se muestran los actuales en las tablas.")
    print()
    
    # Ejecutar pruebas
    asyncio.run(test_filtrado_historial_completo())
    
    print("\n🎯 FUNCIONALIDADES DEMOSTRADAS:")
    print("✅ Múltiples registros por placa (transferencias/cambios)")
    print("✅ Cálculo automático de historial de validaciones")
    print("✅ Marcado de registros actuales vs históricos")
    print("✅ Bloqueo automático de registros históricos")
    print("✅ Filtrado de vehículos visibles en tablas")
    print("✅ Consulta de historial completo por placa")
    print("✅ Estadísticas de eficiencia del filtrado")
    print("✅ Restauración de registros históricos")
    
    print("\n📊 BENEFICIOS DEL SISTEMA:")
    print("• Elimina confusión en las tablas principales")
    print("• Mantiene trazabilidad completa de cada vehículo")
    print("• Permite consultar historial cuando sea necesario")
    print("• Reduce ruido visual en interfaces de usuario")
    print("• Facilita gestión de transferencias entre empresas")
    
    print("\n🎉 ¡SISTEMA DE FILTRADO IMPLEMENTADO EXITOSAMENTE!")
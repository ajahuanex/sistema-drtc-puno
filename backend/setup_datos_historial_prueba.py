"""
Script para configurar datos de prueba realistas para el historial de validaciones.

Este script:
1. Crea vehículos con resoluciones asociadas
2. Establece relaciones correctas entre vehículos y resoluciones
3. Simula un escenario real con múltiples trámites por vehículo
4. Permite probar el sistema de historial de validaciones
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.mock_vehiculo_service import MockVehiculoService
from app.services.mock_resolucion_service import MockResolucionService
from app.models.vehiculo import VehiculoCreate, DatosTecnicos
from app.models.resolucion import ResolucionCreate

async def setup_datos_prueba():
    """Configurar datos de prueba realistas"""
    
    print("🔧 CONFIGURANDO DATOS DE PRUEBA PARA HISTORIAL DE VALIDACIONES")
    print("=" * 65)
    
    vehiculo_service = MockVehiculoService()
    resolucion_service = MockResolucionService()
    
    # Limpiar datos existentes
    vehiculo_service.vehiculos.clear()
    resolucion_service.resoluciones.clear()
    
    print("🧹 Datos existentes limpiados")
    
    # 1. Crear vehículos de prueba
    print("\n🚗 1. CREANDO VEHÍCULOS DE PRUEBA")
    print("-" * 35)
    
    vehiculos_data = [
        {
            "placa": "ABC-123",
            "empresaActualId": "1",
            "categoria": "M1",
            "marca": "Toyota",
            "modelo": "Hiace",
            "anioFabricacion": 2020,
            "datosTecnicos": DatosTecnicos(
                motor="2TR-FE",
                chasis="TRH200",
                ejes=2,
                asientos=15,
                pesoNeto=2500.0,
                pesoBruto=3500.0,
                medidas={"largo": 5.38, "ancho": 1.88, "alto": 2.28},
                tipoCombustible="GASOLINA",
                cilindrada=2.7,
                potencia=163.0
            )
        },
        {
            "placa": "XYZ-789",
            "empresaActualId": "1",
            "categoria": "M2",
            "marca": "Mercedes",
            "modelo": "Sprinter",
            "anioFabricacion": 2019,
            "datosTecnicos": DatosTecnicos(
                motor="OM651",
                chasis="W906",
                ejes=2,
                asientos=20,
                pesoNeto=3200.0,
                pesoBruto=4500.0,
                medidas={"largo": 7.36, "ancho": 2.02, "alto": 2.73},
                tipoCombustible="DIESEL",
                cilindrada=2.1,
                potencia=143.0
            )
        },
        {
            "placa": "DEF-456",
            "empresaActualId": "2",
            "categoria": "M3",
            "marca": "Volvo",
            "modelo": "B7R",
            "anioFabricacion": 2018,
            "datosTecnicos": DatosTecnicos(
                motor="D7E",
                chasis="B7RLE",
                ejes=2,
                asientos=45,
                pesoNeto=8500.0,
                pesoBruto=12000.0,
                medidas={"largo": 12.0, "ancho": 2.55, "alto": 3.2},
                tipoCombustible="DIESEL",
                cilindrada=7.2,
                potencia=290.0
            )
        },
        {
            "placa": "GHI-789",
            "empresaActualId": "2",
            "categoria": "N1",
            "marca": "Isuzu",
            "modelo": "NPR",
            "anioFabricacion": 2021,
            "datosTecnicos": DatosTecnicos(
                motor="4JJ1",
                chasis="NPR75",
                ejes=2,
                asientos=3,
                pesoNeto=2800.0,
                pesoBruto=7500.0,
                medidas={"largo": 6.2, "ancho": 2.0, "alto": 2.5},
                tipoCombustible="DIESEL",
                cilindrada=3.0,
                potencia=150.0
            )
        },
        {
            "placa": "JKL-012",
            "empresaActualId": "3",
            "categoria": "M1",
            "marca": "Hyundai",
            "modelo": "H1",
            "anioFabricacion": 2022,
            "datosTecnicos": DatosTecnicos(
                motor="D4CB",
                chasis="TQ",
                ejes=2,
                asientos=12,
                pesoNeto=2200.0,
                pesoBruto=3200.0,
                medidas={"largo": 5.13, "ancho": 1.92, "alto": 1.99},
                tipoCombustible="DIESEL",
                cilindrada=2.5,
                potencia=170.0
            )
        }
    ]
    
    vehiculos_creados = {}
    for vehiculo_data in vehiculos_data:
        vehiculo_create = VehiculoCreate(**vehiculo_data)
        vehiculo = await vehiculo_service.create_vehiculo(vehiculo_create)
        vehiculos_creados[vehiculo.placa] = vehiculo
        print(f"✅ Vehículo creado: {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}")
    
    print(f"\n📊 Total de vehículos creados: {len(vehiculos_creados)}")
    
    # 2. Crear resoluciones con vehículos asociados
    print("\n🏛️ 2. CREANDO RESOLUCIONES CON VEHÍCULOS ASOCIADOS")
    print("-" * 50)
    
    # Fechas base para simular cronología
    fecha_base = datetime(2023, 1, 1)
    
    resoluciones_data = [
        # Resolución 1: Primigenia para ABC-123 (más antigua)
        {
            "numero": "0001",
            "fechaEmision": fecha_base,
            "empresaId": "1",
            "expedienteId": "1",
            "tipoResolucion": "PADRE",
            "tipoTramite": "PRIMIGENIA",
            "descripcion": "Resolución primigenia para vehículo ABC-123",
            "vehiculosHabilitadosIds": [vehiculos_creados["ABC-123"].id],
            "rutasAutorizadasIds": ["1"]
        },
        # Resolución 2: Incremento para ABC-123 y XYZ-789
        {
            "numero": "0002",
            "fechaEmision": fecha_base + timedelta(days=90),
            "empresaId": "1",
            "expedienteId": "2",
            "tipoResolucion": "HIJO",
            "tipoTramite": "INCREMENTO",
            "descripcion": "Incremento de flota - ABC-123 y XYZ-789",
            "vehiculosHabilitadosIds": [vehiculos_creados["ABC-123"].id, vehiculos_creados["XYZ-789"].id],
            "rutasAutorizadasIds": ["1", "2"]
        },
        # Resolución 3: Primigenia para DEF-456
        {
            "numero": "0003",
            "fechaEmision": fecha_base + timedelta(days=120),
            "empresaId": "2",
            "expedienteId": "3",
            "tipoResolucion": "PADRE",
            "tipoTramite": "PRIMIGENIA",
            "descripcion": "Resolución primigenia para vehículo DEF-456",
            "vehiculosHabilitadosIds": [vehiculos_creados["DEF-456"].id],
            "rutasAutorizadasIds": ["3"]
        },
        # Resolución 4: Renovación para ABC-123 (tercera resolución para este vehículo)
        {
            "numero": "0004",
            "fechaEmision": fecha_base + timedelta(days=180),
            "empresaId": "1",
            "expedienteId": "4",
            "tipoResolucion": "HIJO",
            "tipoTramite": "RENOVACION",
            "descripcion": "Renovación de autorización para ABC-123",
            "vehiculosHabilitadosIds": [vehiculos_creados["ABC-123"].id],
            "rutasAutorizadasIds": ["1"]
        },
        # Resolución 5: Incremento para GHI-789 y JKL-012
        {
            "numero": "0005",
            "fechaEmision": fecha_base + timedelta(days=240),
            "empresaId": "2",
            "expedienteId": "5",
            "tipoResolucion": "HIJO",
            "tipoTramite": "INCREMENTO",
            "descripcion": "Incremento de flota - GHI-789 y JKL-012",
            "vehiculosHabilitadosIds": [vehiculos_creados["GHI-789"].id, vehiculos_creados["JKL-012"].id],
            "rutasAutorizadasIds": ["4", "5"]
        },
        # Resolución 6: Sustitución para XYZ-789 (segunda resolución para este vehículo)
        {
            "numero": "0006",
            "fechaEmision": fecha_base + timedelta(days=300),
            "empresaId": "1",
            "expedienteId": "6",
            "tipoResolucion": "HIJO",
            "tipoTramite": "SUSTITUCION",
            "descripcion": "Sustitución de vehículo XYZ-789",
            "vehiculosHabilitadosIds": [vehiculos_creados["XYZ-789"].id],
            "rutasAutorizadasIds": ["2"]
        },
        # Resolución 7: Otros para DEF-456 (segunda resolución para este vehículo)
        {
            "numero": "0007",
            "fechaEmision": fecha_base + timedelta(days=360),
            "empresaId": "2",
            "expedienteId": "7",
            "tipoResolucion": "HIJO",
            "tipoTramite": "OTROS",
            "descripcion": "Modificación de rutas para DEF-456",
            "vehiculosHabilitadosIds": [vehiculos_creados["DEF-456"].id],
            "rutasAutorizadasIds": ["3", "6"]
        }
    ]
    
    resoluciones_creadas = {}
    for i, resolucion_data in enumerate(resoluciones_data, 1):
        # Crear la resolución
        numero_completo = f"R-{resolucion_data['numero']}-2023"
        resolucion_create = ResolucionCreate(
            nroResolucion=numero_completo,
            fechaEmision=resolucion_data["fechaEmision"],
            fechaVigenciaInicio=resolucion_data["fechaEmision"],
            fechaVigenciaFin=resolucion_data["fechaEmision"] + timedelta(days=1825),  # 5 años
            empresaId=resolucion_data["empresaId"],
            expedienteId=resolucion_data["expedienteId"],
            tipoResolucion=resolucion_data["tipoResolucion"],
            tipoTramite=resolucion_data["tipoTramite"],
            descripcion=resolucion_data["descripcion"],
            vehiculosHabilitadosIds=resolucion_data["vehiculosHabilitadosIds"],
            rutasAutorizadasIds=resolucion_data["rutasAutorizadasIds"],
            usuarioEmisionId="user1"  # Usuario por defecto
        )
        
        resolucion = await resolucion_service.create_resolucion(resolucion_create)
        resoluciones_creadas[f"R-{resolucion_data['numero']}-2023"] = resolucion
        
        # Mostrar información de la resolución creada
        vehiculos_placas = []
        for vehiculo_id in resolucion_data["vehiculosHabilitadosIds"]:
            for placa, vehiculo in vehiculos_creados.items():
                if vehiculo.id == vehiculo_id:
                    vehiculos_placas.append(placa)
                    break
        
        print(f"✅ Resolución {i}: R-{resolucion_data['numero']}-2023")
        print(f"   📅 Fecha: {resolucion_data['fechaEmision'].strftime('%Y-%m-%d')}")
        print(f"   🚗 Vehículos: {', '.join(vehiculos_placas)}")
        print(f"   📋 Tipo: {resolucion_data['tipoTramite']}")
    
    print(f"\n📊 Total de resoluciones creadas: {len(resoluciones_creadas)}")
    
    # 3. Mostrar resumen de relaciones
    print("\n📊 3. RESUMEN DE RELACIONES VEHÍCULO-RESOLUCIÓN")
    print("-" * 50)
    
    print("🔗 Relaciones por vehículo (orden cronológico esperado):")
    
    # ABC-123: 3 resoluciones (R-0001, R-0002, R-0004)
    print("  🚗 ABC-123 (Toyota Hiace):")
    print("    1️⃣ R-0001-2023 (2023-01-01) - PRIMIGENIA")
    print("    2️⃣ R-0002-2023 (2023-04-01) - INCREMENTO")
    print("    3️⃣ R-0004-2023 (2023-06-29) - RENOVACION")
    print("    📈 Historial esperado: #3")
    
    # XYZ-789: 2 resoluciones (R-0002, R-0006)
    print("  🚗 XYZ-789 (Mercedes Sprinter):")
    print("    1️⃣ R-0002-2023 (2023-04-01) - INCREMENTO")
    print("    2️⃣ R-0006-2023 (2023-10-27) - SUSTITUCION")
    print("    📈 Historial esperado: #2")
    
    # DEF-456: 2 resoluciones (R-0003, R-0007)
    print("  🚗 DEF-456 (Volvo B7R):")
    print("    1️⃣ R-0003-2023 (2023-05-01) - PRIMIGENIA")
    print("    2️⃣ R-0007-2023 (2023-12-26) - OTROS")
    print("    📈 Historial esperado: #2")
    
    # GHI-789: 1 resolución (R-0005)
    print("  🚗 GHI-789 (Isuzu NPR):")
    print("    1️⃣ R-0005-2023 (2023-08-28) - INCREMENTO")
    print("    📈 Historial esperado: #1")
    
    # JKL-012: 1 resolución (R-0005)
    print("  🚗 JKL-012 (Hyundai H1):")
    print("    1️⃣ R-0005-2023 (2023-08-28) - INCREMENTO")
    print("    📈 Historial esperado: #1")
    
    print("\n✅ DATOS DE PRUEBA CONFIGURADOS EXITOSAMENTE")
    print("🎯 El sistema ahora tiene datos realistas para probar el historial de validaciones")
    
    return vehiculos_creados, resoluciones_creadas

if __name__ == "__main__":
    print("🔧 CONFIGURADOR DE DATOS DE PRUEBA")
    print("=" * 40)
    print("Este script configura datos realistas para probar el historial de validaciones")
    print()
    
    # Ejecutar configuración
    vehiculos, resoluciones = asyncio.run(setup_datos_prueba())
    
    print(f"\n📋 RESUMEN FINAL:")
    print(f"✅ {len(vehiculos)} vehículos creados")
    print(f"✅ {len(resoluciones)} resoluciones creadas")
    print(f"✅ Relaciones vehículo-resolución establecidas")
    print(f"✅ Cronología de trámites simulada")
    
    print(f"\n🚀 SIGUIENTE PASO:")
    print(f"Ejecuta: python backend/test_historial_validaciones.py")
    print(f"Para probar el sistema de historial con estos datos realistas")
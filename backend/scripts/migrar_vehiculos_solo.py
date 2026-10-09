"""
Script de Migración: Vehiculo → VehiculoSolo
Migra datos existentes del módulo administrativo al módulo técnico

@author Sistema DRTC
@version 1.0.0
"""

import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.database import SessionLocal, engine
from app.schemas.vehiculo_solo import (
    VehiculoSolo, CategoriaVehiculo, TipoCarroceria,
    TipoCombustible, EstadoFisicoVehiculo, FuenteDatos
)


def mapear_categoria(categoria_str: str) -> CategoriaVehiculo:
    """Mapear categoría de string a enum"""
    mapeo = {
        'M1': CategoriaVehiculo.M1,
        'M2': CategoriaVehiculo.M2,
        'M3': CategoriaVehiculo.M3,
        'N1': CategoriaVehiculo.N1,
        'N2': CategoriaVehiculo.N2,
        'N3': CategoriaVehiculo.N3,
        'L': CategoriaVehiculo.L,
        'O': CategoriaVehiculo.O,
    }
    return mapeo.get(categoria_str.upper(), CategoriaVehiculo.M1)


def mapear_carroceria(carroceria_str: str) -> TipoCarroceria:
    """Mapear carrocería de string a enum"""
    if not carroceria_str:
        return TipoCarroceria.SEDAN
    
    carroceria_upper = carroceria_str.upper().replace(' ', '_')
    
    try:
        return TipoCarroceria[carroceria_upper]
    except KeyError:
        # Mapeos comunes
        mapeo = {
            'AUTOMOVIL': TipoCarroceria.SEDAN,
            'CAMIONETA_RURAL': TipoCarroceria.STATION_WAGON,
            'OMNIBUS': TipoCarroceria.BUS,
            'MICROBUS': TipoCarroceria.MINIBUS,
        }
        return mapeo.get(carroceria_upper, TipoCarroceria.OTRO)


def mapear_combustible(combustible_str: str) -> TipoCombustible:
    """Mapear combustible de string a enum"""
    if not combustible_str:
        return TipoCombustible.GASOLINA
    
    combustible_upper = combustible_str.upper()
    
    mapeo = {
        'GASOLINA': TipoCombustible.GASOLINA,
        'DIESEL': TipoCombustible.DIESEL,
        'PETROLEO': TipoCombustible.DIESEL,
        'GLP': TipoCombustible.GLP,
        'GNV': TipoCombustible.GNV,
        'GAS': TipoCombustible.GNV,
        'ELECTRICO': TipoCombustible.ELECTRICO,
        'HIBRIDO': TipoCombustible.HIBRIDO,
    }
    
    return mapeo.get(combustible_upper, TipoCombustible.GASOLINA)


def generar_vin_temporal(placa: str, numero_serie: str) -> str:
    """Generar VIN temporal si no existe"""
    # Si el número de serie tiene 17 dígitos, usarlo como VIN
    if numero_serie and len(numero_serie) == 17:
        return numero_serie.upper()
    
    # Generar VIN temporal basado en placa
    # Formato: TEMP + placa (sin guiones) + padding
    placa_limpia = placa.replace('-', '').replace(' ', '')
    vin_temp = f"TEMP{placa_limpia}"
    
    # Rellenar hasta 17 caracteres
    while len(vin_temp) < 17:
        vin_temp += '0'
    
    return vin_temp[:17].upper()


def migrar_vehiculo(vehiculo: Vehiculo, db: Session, usuario_migracion: str = "sistema_migracion") -> VehiculoSolo:
    """
    Migrar un vehículo del modelo administrativo al técnico
    """
    
    # Verificar si ya existe
    existe = db.query(VehiculoSolo).filter(
        VehiculoSolo.placa_actual == vehiculo.placa
    ).first()
    
    if existe:
        print(f"  ⚠️  Vehículo {vehiculo.placa} ya migrado, actualizando referencia...")
        return existe
    
    # Extraer datos técnicos
    datos_tec = vehiculo.datosTecnicos if hasattr(vehiculo, 'datosTecnicos') else {}
    
    # Generar VIN
    numero_serie = vehiculo.numeroSerie or datos_tec.get('chasis', '')
    vin = generar_vin_temporal(vehiculo.placa, numero_serie)
    
    # Crear VehiculoSolo
    vehiculo_solo = VehiculoSolo(
        id=str(uuid.uuid4()),
        
        # Identificación
        placa_actual=vehiculo.placa.upper(),
        vin=vin,
        numero_serie=numero_serie or vehiculo.placa,
        numero_motor=datos_tec.get('motor', 'NO_ESPECIFICADO'),
        
        # Datos Técnicos
        marca=vehiculo.marca.upper(),
        modelo=vehiculo.modelo.upper(),
        version=None,
        anio_fabricacion=vehiculo.anioFabricacion or datetime.now().year,
        anio_modelo=vehiculo.anioFabricacion or datetime.now().year,
        categoria=mapear_categoria(vehiculo.categoria),
        clase=vehiculo.categoria.upper(),
        carroceria=mapear_carroceria(vehiculo.carroceria) if hasattr(vehiculo, 'carroceria') else TipoCarroceria.SEDAN,
        color=vehiculo.color.upper() if hasattr(vehiculo, 'color') and vehiculo.color else 'NO_ESPECIFICADO',
        color_secundario=None,
        combustible=mapear_combustible(datos_tec.get('tipoCombustible', 'GASOLINA')),
        
        # Capacidades
        numero_asientos=datos_tec.get('asientos', 5),
        numero_pasajeros=datos_tec.get('numeroPasajeros', datos_tec.get('asientos', 5)),
        numero_ejes=datos_tec.get('ejes', 2),
        numero_ruedas=datos_tec.get('ruedas', 4),
        peso_seco=datos_tec.get('pesoNeto', 1000.0),
        peso_bruto=datos_tec.get('pesoBruto', 1500.0),
        carga_util=datos_tec.get('cargaUtil', datos_tec.get('pesoBruto', 1500.0) - datos_tec.get('pesoNeto', 1000.0)),
        longitud=datos_tec.get('medidas', {}).get('largo'),
        ancho=datos_tec.get('medidas', {}).get('ancho'),
        altura=datos_tec.get('medidas', {}).get('alto'),
        
        # Motor
        cilindrada=datos_tec.get('cilindrada', 1500),
        potencia=datos_tec.get('potencia'),
        transmision=None,
        traccion=None,
        
        # Origen
        pais_origen='PERU',
        pais_procedencia='PERU',
        fecha_importacion=None,
        aduana_ingreso=None,
        
        # Estado
        estado_fisico=EstadoFisicoVehiculo.BUENO,
        kilometraje=None,
        
        # Observaciones
        observaciones=vehiculo.observaciones if hasattr(vehiculo, 'observaciones') else None,
        caracteristicas_especiales=None,
        
        # Metadatos
        fecha_creacion=vehiculo.fechaRegistro if hasattr(vehiculo, 'fechaRegistro') else datetime.utcnow(),
        fecha_actualizacion=datetime.utcnow(),
        creado_por=usuario_migracion,
        actualizado_por=usuario_migracion,
        fuente_datos=FuenteDatos.MANUAL,
        ultima_actualizacion_externa=None
    )
    
    db.add(vehiculo_solo)
    db.flush()  # Para obtener el ID
    
    return vehiculo_solo


def actualizar_referencia_vehiculo(vehiculo: Vehiculo, vehiculo_solo_id: str, db: Session):
    """
    Actualizar el vehículo administrativo con la referencia al VehiculoSolo
    """
    vehiculo.vehiculoSoloId = vehiculo_solo_id
    db.flush()


def migrar_todos_vehiculos(db: Session, limite: int = None, solo_sin_referencia: bool = True):
    """
    Migrar todos los vehículos
    
    Args:
        db: Sesión de base de datos
        limite: Límite de vehículos a migrar (None = todos)
        solo_sin_referencia: Solo migrar vehículos que no tienen vehiculoSoloId
    """
    
    print("=" * 80)
    print("🚗 MIGRACIÓN DE VEHÍCULOS A VEHICULO SOLO")
    print("=" * 80)
    print()
    
    # Obtener vehículos a migrar
    query = db.query(Vehiculo)
    
    if solo_sin_referencia:
        query = query.filter(
            (Vehiculo.vehiculoSoloId == None) | (Vehiculo.vehiculoSoloId == '')
        )
    
    if limite:
        query = query.limit(limite)
    
    vehiculos = query.all()
    total = len(vehiculos)
    
    print(f"📊 Total de vehículos a migrar: {total}")
    print()
    
    if total == 0:
        print("✅ No hay vehículos para migrar")
        return
    
    # Confirmar
    respuesta = input(f"¿Desea continuar con la migración de {total} vehículos? (s/n): ")
    if respuesta.lower() != 's':
        print("❌ Migración cancelada")
        return
    
    print()
    print("🔄 Iniciando migración...")
    print()
    
    migrados = 0
    errores = 0
    
    for i, vehiculo in enumerate(vehiculos, 1):
        try:
            print(f"[{i}/{total}] Migrando {vehiculo.placa}...", end=" ")
            
            # Migrar
            vehiculo_solo = migrar_vehiculo(vehiculo, db)
            
            # Actualizar referencia
            actualizar_referencia_vehiculo(vehiculo, vehiculo_solo.id, db)
            
            # Commit cada 10 vehículos
            if i % 10 == 0:
                db.commit()
                print(f"✅ (Guardado)")
            else:
                print("✅")
            
            migrados += 1
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            errores += 1
            db.rollback()
    
    # Commit final
    try:
        db.commit()
        print()
        print("=" * 80)
        print("✅ MIGRACIÓN COMPLETADA")
        print("=" * 80)
        print(f"✅ Migrados exitosamente: {migrados}")
        print(f"❌ Errores: {errores}")
        print()
        
    except Exception as e:
        print(f"❌ Error en commit final: {str(e)}")
        db.rollback()


def main():
    """Función principal"""
    print()
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "SCRIPT DE MIGRACIÓN VEHICULO SOLO" + " " * 25 + "║")
    print("╚" + "=" * 78 + "╝")
    print()
    
    # Crear sesión
    db = SessionLocal()
    
    try:
        # Opciones
        print("Opciones:")
        print("1. Migrar todos los vehículos sin referencia")
        print("2. Migrar primeros 10 vehículos (prueba)")
        print("3. Migrar todos los vehículos (forzar)")
        print()
        
        opcion = input("Seleccione una opción (1-3): ")
        print()
        
        if opcion == '1':
            migrar_todos_vehiculos(db, solo_sin_referencia=True)
        elif opcion == '2':
            migrar_todos_vehiculos(db, limite=10, solo_sin_referencia=True)
        elif opcion == '3':
            migrar_todos_vehiculos(db, solo_sin_referencia=False)
        else:
            print("❌ Opción inválida")
            
    except KeyboardInterrupt:
        print()
        print("❌ Migración interrumpida por el usuario")
        db.rollback()
        
    except Exception as e:
        print(f"❌ Error fatal: {str(e)}")
        db.rollback()
        
    finally:
        db.close()
        print()
        print("👋 Sesión cerrada")
        print()


if __name__ == "__main__":
    main()

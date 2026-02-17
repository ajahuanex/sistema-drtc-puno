"""
Router para VehiculoSolo (MongoDB)
Endpoints para gestión de datos vehiculares puros
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import openpyxl
from openpyxl.styles import Font, PatternFill
import tempfile
import io

from app.dependencies.db import get_database
from app.schemas.vehiculo_solo_schemas import (
    VehiculoSoloCreate,
    VehiculoSoloUpdate,
    VehiculoSoloInDB,
    VehiculoSoloResponse,
    FiltrosVehiculoSolo,
    EstadisticasVehiculoSolo,
    HistorialPlacaCreate,
    HistorialPlacaInDB,
    PropietarioRegistralCreate,
    PropietarioRegistralInDB,
    InspeccionTecnicaCreate,
    InspeccionTecnicaInDB
)

router = APIRouter(
    prefix="/vehiculos-solo",
    tags=["Vehículos Solo - Datos Técnicos"]
)


def vehiculo_helper(vehiculo) -> dict:
    """Helper para convertir documento MongoDB a dict y calcular completitud"""
    
    # Campos principales para calcular completitud (22 campos)
    campos_principales = [
        'placa_actual', 'vin', 'numero_motor',  # Identificación
        'marca', 'modelo', 'anio_fabricacion', 'color', 'categoria', 'carroceria', 'combustible',  # Técnicos
        'numero_asientos', 'numero_pasajeros', 'cilindrada', 'numero_ejes', 'numero_ruedas',  # Capacidades
        'peso_bruto', 'peso_seco', 'carga_util', 'longitud', 'ancho', 'altura',  # Dimensiones
        'observaciones'  # Observaciones
    ]
    
    # Calcular campos completados
    campos_completados = 0
    for campo in campos_principales:
        valor = vehiculo.get(campo)
        if valor is not None and valor != '' and valor != 0:
            campos_completados += 1
    
    # Calcular porcentaje
    porcentaje_completitud = round((campos_completados / len(campos_principales)) * 100, 1)
    
    return {
        "id": str(vehiculo["_id"]),  # Cambiar _id a id para el frontend
        "_id": str(vehiculo["_id"]),  # Mantener _id por compatibilidad
        "placa_actual": vehiculo.get("placa_actual"),
        "vin": vehiculo.get("vin"),
        "numero_serie": vehiculo.get("numero_serie"),
        "numero_motor": vehiculo.get("numero_motor"),
        "marca": vehiculo.get("marca"),
        "modelo": vehiculo.get("modelo"),
        "version": vehiculo.get("version"),
        "anio_fabricacion": vehiculo.get("anio_fabricacion"),
        "anio_modelo": vehiculo.get("anio_modelo"),
        "color": vehiculo.get("color"),
        "color_secundario": vehiculo.get("color_secundario"),
        "categoria": vehiculo.get("categoria"),
        "clase": vehiculo.get("clase"),
        "tipo_carroceria": vehiculo.get("tipo_carroceria"),
        "cilindrada": vehiculo.get("cilindrada"),
        "potencia": vehiculo.get("potencia"),
        "combustible": vehiculo.get("combustible"),
        "traccion": vehiculo.get("traccion"),
        "transmision": vehiculo.get("transmision"),
        "longitud": vehiculo.get("longitud"),
        "ancho": vehiculo.get("ancho"),
        "altura": vehiculo.get("altura"),
        "peso_seco": vehiculo.get("peso_seco"),
        "peso_bruto": vehiculo.get("peso_bruto"),
        "carga_util": vehiculo.get("carga_util"),
        "numero_asientos": vehiculo.get("numero_asientos"),
        "numero_pasajeros": vehiculo.get("numero_pasajeros"),
        "numero_ejes": vehiculo.get("numero_ejes"),
        "numero_ruedas": vehiculo.get("numero_ruedas"),
        "estado_fisico": vehiculo.get("estado_fisico"),
        "pais_origen": vehiculo.get("pais_origen"),
        "pais_procedencia": vehiculo.get("pais_procedencia"),
        "fecha_importacion": vehiculo.get("fecha_importacion"),
        "aduana_ingreso": vehiculo.get("aduana_ingreso"),
        "kilometraje": vehiculo.get("kilometraje"),
        "observaciones": vehiculo.get("observaciones"),
        "caracteristicas_especiales": vehiculo.get("caracteristicas_especiales"),
        "fuente_datos": vehiculo.get("fuente_datos", "MANUAL"),
        "fecha_registro": vehiculo.get("fecha_registro"),
        "fecha_actualizacion": vehiculo.get("fecha_actualizacion"),
        "activo": vehiculo.get("activo", True),
        # Datos calculados
        "porcentaje_completitud": porcentaje_completitud,
        "campos_completados": campos_completados,
        "total_campos": len(campos_principales)
    }


# ========================================
# RUTAS ESPECÍFICAS (ANTES DE LAS RUTAS CON PARÁMETROS)
# ========================================

# TEMPORALMENTE DESHABILITADO - Requiere openpyxl
# @router.get("/plantilla")
# async def descargar_plantilla():
#     """Descargar plantilla Excel para carga masiva"""
#     pass

# TEMPORALMENTE DESHABILITADO - Requiere openpyxl  
# @router.post("/carga-masiva")
# async def carga_masiva(
#     file: UploadFile = File(...),
#     db = Depends(get_database)
# ):
#     """Carga masiva de vehículos desde Excel"""
#     pass


@router.get("/estadisticas/resumen")
async def obtener_estadisticas(
    db = Depends(get_database)
):
    """Obtener estadísticas de vehículos solo"""
    
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    
    collection = db["vehiculos_solo"]
    
    # Total
    total = await collection.count_documents({"activo": True})
    
    # Por categoría
    pipeline_categoria = [
        {"$match": {"activo": True}},
        {"$group": {"_id": "$categoria", "count": {"$sum": 1}}}
    ]
    por_categoria = {doc["_id"]: doc["count"] async for doc in collection.aggregate(pipeline_categoria)}
    
    # Por marca
    pipeline_marca = [
        {"$match": {"activo": True}},
        {"$group": {"_id": "$marca", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    por_marca = {doc["_id"]: doc["count"] async for doc in collection.aggregate(pipeline_marca)}
    
    # Por año
    pipeline_anio = [
        {"$match": {"activo": True, "anio_fabricacion": {"$ne": None}}},
        {"$group": {"_id": "$anio_fabricacion", "count": {"$sum": 1}}},
        {"$sort": {"_id": -1}}
    ]
    por_anio = {str(doc["_id"]): doc["count"] async for doc in collection.aggregate(pipeline_anio)}
    
    # Por estado físico
    pipeline_estado = [
        {"$match": {"activo": True}},
        {"$group": {"_id": "$estado_fisico", "count": {"$sum": 1}}}
    ]
    por_estado_fisico = {doc["_id"]: doc["count"] async for doc in collection.aggregate(pipeline_estado)}
    
    # Por fuente de datos
    pipeline_fuente = [
        {"$match": {"activo": True}},
        {"$group": {"_id": "$fuente_datos", "count": {"$sum": 1}}}
    ]
    por_fuente_datos = {doc["_id"]: doc["count"] async for doc in collection.aggregate(pipeline_fuente)}
    
    return {
        "total_vehiculos": total,
        "por_categoria": por_categoria,
        "por_marca": por_marca,
        "por_anio": por_anio,
        "por_estado_fisico": por_estado_fisico,
        "por_fuente_datos": por_fuente_datos
    }


@router.get("/placa/{placa}")
async def buscar_por_placa(
    placa: str,
    db = Depends(get_database)
):
    """Buscar vehículo por placa (búsqueda exacta optimizada)"""
    
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    
    # Normalizar placa para búsqueda
    placa_normalizada = placa.strip().upper()
    
    # Búsqueda exacta usando índice único (muy rápida)
    vehiculo = await db["vehiculos_solo"].find_one({
        "placa_actual": placa_normalizada,
        "activo": True
    })
    
    if not vehiculo:
        raise HTTPException(status_code=404, detail=f"Vehículo con placa {placa} no encontrado")
    
    return vehiculo_helper(vehiculo)


@router.get("/buscar/placas")
async def autocompletar_placas(
    q: str = Query(..., min_length=1, description="Texto a buscar"),
    limit: int = Query(10, ge=1, le=50),
    db = Depends(get_database)
):
    """Autocompletar placas (búsqueda rápida para sugerencias)"""
    
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    
    collection = db["vehiculos_solo"]
    
    # Normalizar búsqueda
    q_normalizado = q.strip().upper()
    
    # Búsqueda optimizada con regex e índice
    # Busca placas que empiecen con el texto ingresado
    cursor = collection.find(
        {
            "placa_actual": {"$regex": f"^{q_normalizado}", "$options": "i"},
            "activo": True
        },
        {"placa_actual": 1, "marca": 1, "modelo": 1, "anio_fabricacion": 1}
    ).limit(limit)
    
    resultados = await cursor.to_list(length=limit)
    
    # Formatear resultados para autocompletado
    sugerencias = []
    for r in resultados:
        sugerencias.append({
            "placa": r.get("placa_actual"),
            "descripcion": f"{r.get('marca', '')} {r.get('modelo', '')} {r.get('anio_fabricacion', '')}".strip(),
            "id": str(r["_id"])
        })
    
    return {
        "query": q,
        "total": len(sugerencias),
        "sugerencias": sugerencias
    }


# ========================================
# CRUD BÁSICO
# ========================================

@router.get("")
async def obtener_vehiculos_solo(
    placa: Optional[str] = None,
    vin: Optional[str] = None,
    marca: Optional[str] = None,
    modelo: Optional[str] = None,
    categoria: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db = Depends(get_database)
):
    """Obtener lista de vehículos solo con filtros"""
    
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    
    collection = db["vehiculos_solo"]
    
    # Construir filtro
    filtro = {"activo": True}
    
    if placa:
        filtro["placa_actual"] = {"$regex": placa, "$options": "i"}
    if vin:
        filtro["vin"] = {"$regex": vin, "$options": "i"}
    if marca:
        filtro["marca"] = {"$regex": marca, "$options": "i"}
    if modelo:
        filtro["modelo"] = {"$regex": modelo, "$options": "i"}
    if categoria:
        filtro["categoria"] = categoria
    
    # Contar total
    total = await collection.count_documents(filtro)
    
    # Obtener documentos con paginación
    skip = (page - 1) * limit
    cursor = collection.find(filtro).skip(skip).limit(limit).sort("fecha_registro", -1)
    vehiculos = await cursor.to_list(length=limit)
    
    vehiculos_response = [vehiculo_helper(v) for v in vehiculos]
    
    return {
        "vehiculos": vehiculos_response,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def crear_vehiculo_solo(
    vehiculo_data: VehiculoSoloCreate,
    db = Depends(get_database)
):
    """Crear nuevo vehículo solo"""
    
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    
    collection = db["vehiculos_solo"]
    
    # Convertir a dict usando by_alias=False para mantener los nombres snake_case
    vehiculo_dict = vehiculo_data.model_dump(by_alias=False, exclude_unset=True)
    
    # Normalizar placa
    if "placa_actual" in vehiculo_dict:
        vehiculo_dict["placa_actual"] = vehiculo_dict["placa_actual"].upper()
    
    # Verificar unicidad de placa
    existe_placa = await collection.find_one({
        "placa_actual": vehiculo_dict.get("placa_actual", "").upper(),
        "activo": True
    })
    
    if existe_placa:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un vehículo con la placa {vehiculo_dict.get('placa_actual')}"
        )
    
    # Verificar unicidad de VIN (si se proporciona)
    if vehiculo_dict.get("vin"):
        existe_vin = await collection.find_one({
            "vin": vehiculo_dict["vin"],
            "activo": True
        })
        
        if existe_vin:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un vehículo con el VIN {vehiculo_dict['vin']}"
            )
    
    # Agregar metadatos
    vehiculo_dict["fecha_registro"] = datetime.now()
    vehiculo_dict["fecha_actualizacion"] = datetime.now()
    vehiculo_dict["activo"] = True
    
    # Insertar
    try:
        result = await collection.insert_one(vehiculo_dict)
    except Exception as e:
        # Capturar errores de índice único
        if "duplicate key error" in str(e).lower():
            if "placa_actual" in str(e):
                raise HTTPException(status_code=400, detail="La placa ya existe")
            elif "vin" in str(e):
                raise HTTPException(status_code=400, detail="El VIN ya existe")
        raise HTTPException(status_code=500, detail=f"Error al crear vehículo: {str(e)}")
    
    # Obtener el documento creado
    nuevo_vehiculo = await collection.find_one({"_id": result.inserted_id})
    
    return vehiculo_helper(nuevo_vehiculo)


@router.get("/{vehiculo_id}")
async def obtener_vehiculo_por_id(
    vehiculo_id: str,
    db = Depends(get_database)
):
    """Obtener vehículo por ID"""
    
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    
    try:
        vehiculo = await db["vehiculos_solo"].find_one({"_id": ObjectId(vehiculo_id)})
        
        if not vehiculo:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        
        return vehiculo_helper(vehiculo)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ID inválido: {str(e)}")


@router.put("/{vehiculo_id}")
async def actualizar_vehiculo_solo(
    vehiculo_id: str,
    vehiculo_data: VehiculoSoloUpdate,
    db = Depends(get_database)
):
    """Actualizar vehículo solo"""
    
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    
    collection = db["vehiculos_solo"]
    
    try:
        # Verificar que existe
        vehiculo = await collection.find_one({"_id": ObjectId(vehiculo_id)})
        if not vehiculo:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        
        # Preparar actualización
        update_data = {k: v for k, v in vehiculo_data.model_dump(exclude_unset=True).items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")
        
        update_data["fecha_actualizacion"] = datetime.now()
        
        # Actualizar
        await collection.update_one(
            {"_id": ObjectId(vehiculo_id)},
            {"$set": update_data}
        )
        
        # Obtener documento actualizado
        vehiculo_actualizado = await collection.find_one({"_id": ObjectId(vehiculo_id)})
        
        return vehiculo_helper(vehiculo_actualizado)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al actualizar: {str(e)}")


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_vehiculo_solo(
    vehiculo_id: str,
    db = Depends(get_database)
):
    """Eliminar (desactivar) vehículo solo"""
    
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    
    try:
        result = await db["vehiculos_solo"].update_one(
            {"_id": ObjectId(vehiculo_id)},
            {"$set": {"activo": False, "fecha_actualizacion": datetime.now()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        
        return None
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al eliminar: {str(e)}")

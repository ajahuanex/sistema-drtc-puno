"""
Router para gestión de VehiculoData (Datos Técnicos Puros)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.dependencies.db import get_database
from app.services.vehiculo_data_service import VehiculoDataService
from app.utils.exceptions import ValidationErrorException

router = APIRouter(prefix="/vehiculos-data", tags=["vehiculos-data"])


async def get_vehiculo_data_service():
    """Dependency para obtener el servicio"""
    db = await get_database()
    return VehiculoDataService(db)


@router.post("/", status_code=201)
async def create_vehiculo_data(
    vehiculo_data: dict,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Crear registro de datos técnicos"""
    try:
        result = await service.create_vehiculo_data(vehiculo_data)
        return {"success": True, "data": result}
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando datos técnicos: {str(e)}")

@router.post("/guardar-ficha")
async def guardar_ficha_tecnica(
    vehiculo_data: dict,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Crear o actualizar la ficha técnica del vehículo por placa"""
    try:
        result = await service.upsert_vehiculo_data(vehiculo_data)
        return {"success": True, "data": result}
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar ficha técnica: {str(e)}")


@router.get("/{vehiculo_data_id}")
async def get_vehiculo_data(
    vehiculo_data_id: str,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Obtener datos técnicos por ID"""
    vehiculo_data = await service.get_vehiculo_data(vehiculo_data_id)
    if not vehiculo_data:
        raise HTTPException(status_code=404, detail="Datos técnicos no encontrados")
    return {"success": True, "data": vehiculo_data}


@router.get("/buscar/placa/{placa}")
async def buscar_por_placa(
    placa: str,
    consultar_pcm: bool = Query(True, description="Si consultar API externa PCM si no está en BD"),
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Buscar datos técnicos por placa (DB local + API PCM externa)"""
    vehiculo_data = await service.get_vehiculo_data_by_placa(placa, consultar_pcm=consultar_pcm)
    if not vehiculo_data:
        return {"success": False, "origen": "MANUAL", "data": None, "message": "No se encontraron datos para esta placa"}
    return {
        "success": True,
        "origen": vehiculo_data.get("origen", "DB_LOCAL"),
        "data": vehiculo_data
    }


@router.get("/consultar-pcm/{placa}")
async def consultar_pcm(
    placa: str,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Consulta directa a la API PCM SUNARP de guillermo.pe"""
    vehiculo_data = await service.consultar_placa_pcm(placa)
    if not vehiculo_data:
        raise HTTPException(status_code=404, detail="No se encontraron datos en el servicio PCM SUNARP")
    return {"success": True, "origen": "PCM_API", "data": vehiculo_data}


@router.get("/buscar/vin/{vin}")
async def buscar_por_vin(
    vin: str,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Buscar datos técnicos por VIN"""
    vehiculo_data = await service.get_vehiculo_data_by_vin(vin)
    if not vehiculo_data:
        return {"success": True, "data": None, "message": "No se encontraron datos para este VIN"}
    return {"success": True, "data": vehiculo_data}


@router.put("/{vehiculo_data_id}")
async def update_vehiculo_data(
    vehiculo_data_id: str,
    update_data: dict,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Actualizar datos técnicos"""
    try:
        result = await service.update_vehiculo_data(vehiculo_data_id, update_data)
        if not result:
            raise HTTPException(status_code=404, detail="Datos técnicos no encontrados")
        return {"success": True, "data": result}
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando datos técnicos: {str(e)}")


@router.delete("/{vehiculo_data_id}", status_code=204)
async def delete_vehiculo_data(
    vehiculo_data_id: str,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Eliminar datos técnicos"""
    success = await service.delete_vehiculo_data(vehiculo_data_id)
    if not success:
        raise HTTPException(status_code=404, detail="Datos técnicos no encontrados")
    return None


@router.get("/")
async def list_vehiculos_data(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=20000),
    marca: Optional[str] = None,
    categoria: Optional[str] = None,
    q: Optional[str] = Query(None, description="Búsqueda de texto libre (placa, marca, modelo, VIN)"),
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Listar datos técnicos con filtros. Límite máximo 20,000 registros por petición."""
    vehiculos_data = await service.list_vehiculos_data(skip, limit, marca, categoria, q)
    total = await service.count_vehiculos_data(q, marca, categoria)
    
    return {
        "success": True,
        "data": vehiculos_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }


# ========================================
# ENDPOINTS PARA CARGA MASIVA DE DATOS TÉCNICOS
# ========================================
from fastapi import UploadFile, File, Body
import pandas as pd
import io
from app.services.vehiculo_data_excel_service import VehiculoDataExcelService


@router.post("/carga-masiva-preview-file")
async def carga_masiva_preview_file(
    file: UploadFile = File(...),
    db = Depends(get_database)
):
    """Generar vista previa desde un archivo Excel o CSV subido"""
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content), dtype=str)
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content), dtype=str)
        else:
            raise HTTPException(status_code=400, detail="Formato de archivo no soportado. Debe ser .xlsx, .xls o .csv")
            
        service = VehiculoDataExcelService(db)
        resultado = service.procesar_dataframe(df)
        return {"success": True, "data": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")


@router.post("/carga-masiva-preview-url")
async def carga_masiva_preview_url(
    payload: dict = Body(...),
    db = Depends(get_database)
):
    """Generar vista previa desde una URL pública de Google Sheets"""
    url = payload.get("url", "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="La URL de Google Sheets es requerida")
        
    try:
        service = VehiculoDataExcelService(db)
        csv_text = await service.descargar_google_sheet_csv(url)
        df = pd.read_csv(io.StringIO(csv_text), dtype=str)
        resultado = service.procesar_dataframe(df)
        return {"success": True, "data": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando Google Sheet: {str(e)}")


@router.post("/carga-masiva-ejecutar")
async def carga_masiva_ejecutar(
    payload: dict = Body(...),
    db = Depends(get_database)
):
    """Ejecutar la inserción/actualización masiva en MongoDB"""
    filas = payload.get("filas", [])
    if not filas:
        raise HTTPException(status_code=400, detail="No se proporcionaron filas para guardar")
        
    try:
        service = VehiculoDataExcelService(db)
        res = await service.guardar_carga_masiva(filas)
        return {"success": True, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la ejecución de carga masiva: {str(e)}")


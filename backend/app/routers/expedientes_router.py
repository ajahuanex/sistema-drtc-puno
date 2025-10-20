from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from io import BytesIO
from app.dependencies.auth import get_current_active_user
from app.services.expediente_excel_service import ExpedienteExcelService
from app.models.expediente import ExpedienteCreate, ExpedienteUpdate, Expediente, ExpedienteResponse
from app.utils.exceptions import (
    ValidationErrorException
)

router = APIRouter(prefix="/expedientes", tags=["expedientes"])

@router.get("/")
async def get_expedientes():
    """Obtener lista de expedientes"""
    return {"message": "Lista de expedientes - Endpoint básico"}

@router.post("/")
async def create_expediente():
    """Crear nuevo expediente"""
    return {"message": "Crear expediente - Endpoint básico"}

# ========================================
# ENDPOINTS DE CARGA MASIVA DESDE EXCEL
# ========================================

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_expedientes():
    """Descargar plantilla Excel para carga masiva de expedientes"""
    try:
        excel_service = ExpedienteExcelService()
        plantilla_buffer = excel_service.generar_plantilla_excel()
        
        return StreamingResponse(
            BytesIO(plantilla_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_expedientes.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar plantilla: {str(e)}")

@router.post("/carga-masiva/validar")
async def validar_archivo_expedientes(
    archivo: UploadFile = File(..., description="Archivo Excel con expedientes")
):
    """Validar archivo Excel de expedientes sin procesarlo"""
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser un Excel (.xlsx o .xls)"
        )
    
    try:
        # Leer archivo
        contenido = await archivo.read()
        archivo_buffer = BytesIO(contenido)
        
        # Validar con el servicio
        excel_service = ExpedienteExcelService()
        resultado = excel_service.validar_archivo_excel(archivo_buffer)
        
        return {
            "archivo": archivo.filename,
            "validacion": resultado,
            "mensaje": f"Archivo validado: {resultado['validos']} válidos, {resultado['invalidos']} inválidos"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al validar archivo: {str(e)}"
        )

@router.post("/carga-masiva/procesar")
async def procesar_carga_masiva_expedientes(
    archivo: UploadFile = File(..., description="Archivo Excel con expedientes"),
    solo_validar: bool = Query(False, description="Solo validar sin crear expedientes")
):
    """Procesar carga masiva de expedientes desde Excel"""
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser un Excel (.xlsx o .xls)"
        )
    
    try:
        # Leer archivo
        contenido = await archivo.read()
        archivo_buffer = BytesIO(contenido)
        
        # Procesar con el servicio
        excel_service = ExpedienteExcelService()
        
        if solo_validar:
            resultado = excel_service.validar_archivo_excel(archivo_buffer)
            mensaje = f"Validación completada: {resultado['validos']} válidos, {resultado['invalidos']} inválidos"
        else:
            resultado = excel_service.procesar_carga_masiva(archivo_buffer)
            mensaje = f"Procesamiento completado: {resultado.get('total_creadas', 0)} expedientes creados"
        
        return {
            "archivo": archivo.filename,
            "solo_validacion": solo_validar,
            "resultado": resultado,
            "mensaje": mensaje
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al procesar archivo: {str(e)}"
        )
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from io import BytesIO

from app.dependencies.auth import get_current_active_user
from app.dependencies.db import get_database
from app.services.expediente_service import ExpedienteService
from app.services.expediente_excel_service import ExpedienteExcelService
from app.models.expediente import ExpedienteCreate, ExpedienteUpdate, Expediente, ExpedienteResponse
from app.utils.exceptions import ValidationErrorException

router = APIRouter(prefix="/expedientes", tags=["expedientes"])

async def get_expediente_service():
    """Dependency para obtener el servicio de expedientes"""
    db = await get_database()
    return ExpedienteService(db)

# ========================================
# ENDPOINTS CRUD
# ========================================

@router.get("/", response_model=List[Expediente], response_model_by_alias=False)
async def get_expedientes(
    skip: int = 0, 
    limit: int = 100,
    service: ExpedienteService = Depends(get_expediente_service)
):
    """Obtener lista de expedientes"""
    return await service.get_expedientes(skip=skip, limit=limit)

@router.get("/{expediente_id}", response_model=Expediente, response_model_by_alias=False)
async def get_expediente(
    expediente_id: str,
    service: ExpedienteService = Depends(get_expediente_service)
):
    """Obtener expediente por ID"""
    expediente = await service.get_expediente_by_id(expediente_id)
    if not expediente:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    return expediente

@router.post("/", response_model=Expediente, response_model_by_alias=False)
async def create_expediente(
    expediente: ExpedienteCreate,
    service: ExpedienteService = Depends(get_expediente_service)
):
    """Crear nuevo expediente"""
    return await service.create_expediente(expediente)

@router.put("/{expediente_id}", response_model=Expediente, response_model_by_alias=False)
async def update_expediente(
    expediente_id: str,
    expediente_in: ExpedienteUpdate,
    service: ExpedienteService = Depends(get_expediente_service)
):
    """Actualizar expediente"""
    expediente = await service.update_expediente(expediente_id, expediente_in)
    if not expediente:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    return expediente

# ========================================
# ENDPOINTS DE VALIDACIÓN
# ========================================

@router.get("/validar/numero")
async def validar_numero_expediente(
    numero: str = Query(..., description="Número del expediente (ej: 0001)"),
    anio: int = Query(..., description="Año del expediente"),
    empresaId: Optional[str] = Query(None, description="ID de la empresa (opcional)"),
    expedienteIdExcluir: Optional[str] = Query(None, description="ID del expediente a excluir (para edición)"),
    service: ExpedienteService = Depends(get_expediente_service)
):
    """Validar que el número de expediente no esté duplicado"""
    
    # Formatear el número completo
    numero_formateado = numero.zfill(4)
    nro_expediente_completo = f"E-{numero_formateado}-{anio}"
    
    # Buscar expediente existente con ese número
    expediente_existente = await service.get_expediente_by_numero(nro_expediente_completo)
    
    # Si existe y no es el que estamos excluyendo, es inválido
    if expediente_existente:
        if expedienteIdExcluir and str(expediente_existente.get("_id")) == expedienteIdExcluir:
            # Es el mismo expediente que estamos editando, es válido
            return {
                "valido": True,
                "mensaje": f"El número de expediente {numero} está disponible para el año {año}"
            }
        else:
            # Es un expediente diferente, es inválido
            return {
                "valido": False,
                "mensaje": f"Ya existe un expediente con el número {numero} en el año {anio}",
                "expedienteExistente": {
                    "id": str(expediente_existente.get("_id")),
                    "nroExpediente": expediente_existente.get("nro_expediente"),
                    "empresaId": expediente_existente.get("empresa_id"),
                    "estado": expediente_existente.get("estado", "EN PROCESO"),
                    "fechaEmision": expediente_existente.get("fecha_emision"),
                    "tipoTramite": expediente_existente.get("tipo_tramite")
                },
                "conflictos": [
                    f"Expediente {nro_expediente_completo} ya existe",
                    f"Empresa ID: {expediente_existente.get('empresa_id', 'No especificada')}",
                    f"Estado: {expediente_existente.get('estado', 'EN PROCESO')}",
                    f"Tipo de Trámite: {expediente_existente.get('tipo_tramite', 'OTROS')}"
                ]
            }
    
    # No existe, es válido
    return {
        "valido": True,
        "mensaje": f"El número de expediente {numero} está disponible para el año {anio}"
    }

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
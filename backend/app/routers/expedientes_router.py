from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
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

@router.get("/", response_model=List[Dict[str, Any]])
async def get_expedientes(
    skip: int = 0, 
    limit: int = 100,
    service: ExpedienteService = Depends(get_expediente_service)
):
    """Obtener lista de expedientes"""
    return await service.get_expedientes(skip=skip, limit=limit)

@router.get("/{expediente_id}", response_model=Dict[str, Any])
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
                "mensaje": f"El número de expediente {numero} está disponible para el año {anio}"
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


# ========================================
# ENDPOINT DE INTEGRACIÓN PARA APPS EXTERNAS
# ========================================

class ExpedienteExternoRequest(BaseModel):
    nro_expediente: str = Field(..., alias="nroExpediente")
    ruc_solicitante: Optional[str] = Field(None, alias="ruc")
    razon_social: Optional[str] = Field(None, alias="razonSocial")
    tipo_tramite: Optional[str] = Field("OTROS", alias="tipoTramite")
    asunto: Optional[str] = Field(None, alias="descripcion")
    fecha_ingreso: Optional[str] = Field(None, alias="fechaIngreso")
    folio: Optional[int] = 1
    sistema_origen: Optional[str] = Field("TRAMITE_DOCUMENTARIO_EXTERNO", alias="origen")
    id_sistema_externo: Optional[str] = Field(None, alias="idExterno")
    documentos_adjuntos: Optional[List[dict]] = Field(default_factory=list, alias="documentosAdjuntos")
    observaciones: Optional[str] = None

    class Config:
        populate_by_name = True

@router.post("/ingreso-externo", summary="Recepción de Expedientes desde API externa (Mesa de Partes / SGD)")
async def registrar_expediente_externo(payload: ExpedienteExternoRequest):
    """
    Endpoint para que un sistema o aplicación externa (Mesa de Partes Virtual,
    Sistema de Gestión Documental SGD, etc.) ingrese expedientes directamente al SIRRETT.
    """
    db = await get_database()
    now = datetime.utcnow()
    nro_clean = payload.nro_expediente.strip().upper()
    
    # Buscar si la empresa existe por RUC
    empresa_id = None
    if payload.ruc_solicitante:
        emp = await db.empresas.find_one({"ruc": payload.ruc_solicitante.strip()})
        if emp:
            empresa_id = str(emp.get("_id"))
            
    doc = {
        "nro_expediente": nro_clean,
        "nroExpediente": nro_clean,
        "folio": payload.folio or 1,
        "tipo_tramite": payload.tipo_tramite,
        "tipoTramite": payload.tipo_tramite,
        "estado": "EN_PROCESO",
        "descripcion": payload.asunto or payload.observaciones or f"Ingreso desde {payload.sistema_origen}",
        "observaciones": payload.observaciones,
        "empresa_id": empresa_id,
        "empresaId": empresa_id,
        "ruc_solicitante": payload.ruc_solicitante,
        "razon_social": payload.razon_social,
        "sistema_origen": payload.sistema_origen,
        "id_sistema_externo": payload.id_sistema_externo,
        "documentos_adjuntos": payload.documentos_adjuntos or [],
        "fecha_emision": payload.fecha_ingreso or now.isoformat()[:10],
        "fechaEmision": payload.fecha_ingreso or now.isoformat()[:10],
        "fecha_registro": now,
        "fecha_actualizacion": now,
        "esta_activo": True,
        "es_externo": True
    }
    
    res = await db.expedientes.update_one(
        {"nro_expediente": nro_clean},
        {"$set": doc},
        upsert=True
    )
    
    return {
        "success": True,
        "mensaje": f"Expediente {nro_clean} registrado/sincronizado exitosamente desde {payload.sistema_origen}",
        "nro_expediente": nro_clean,
        "accion": "CREADO" if res.upserted_id else "ACTUALIZADO"
    }
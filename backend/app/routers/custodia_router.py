from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import json
import logging

from app.dependencies.auth import get_current_active_user, get_current_user_optional
from app.dependencies.db import get_database
from app.models.usuario import UsuarioInDB
from app.models.custodia import (
    DocumentoCustodiaCreate, DocumentoCustodiaUpdate,
    DocumentoCustodiaResponse, MovimientoPrestamo
)
from app.services.custodia_service import CustodiaService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/custodia", tags=["Custodia de Expedientes"])

async def get_custodia_service() -> CustodiaService:
    db = await get_database()
    return CustodiaService(db)

# ==========================================
# 1. LISTADO Y ESTADÍSTICAS
# ==========================================

@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
async def listar_documentos_custodia(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="Búsqueda por Memo, Expediente, Empresa, Asunto, etc."),
    estado: Optional[str] = Query(None, description="Filtrar por estado: EN_CUSTODIA, PRESTADO, etc."),
    area: Optional[str] = Query(None, description="Filtrar por Área Remitente"),
    tipo_tramite: Optional[str] = Query(None, description="Filtrar por Tipo de Trámite"),
    service: CustodiaService = Depends(get_custodia_service)
):
    """Obtiene la lista paginada y filtrada de expedientes y documentos en custodia"""
    return await service.get_documentos(
        skip=skip,
        limit=limit,
        search=search,
        estado=estado,
        area=area,
        tipo_tramite=tipo_tramite
    )

@router.get("/stats", response_model=Dict[str, Any])
async def obtener_estadisticas_custodia(
    service: CustodiaService = Depends(get_custodia_service)
):
    """Devuelve indicadores clave del archivo en custodia (totales, folios resguardados, préstamos activos)"""
    return await service.get_stats()

@router.get("/{doc_id}", response_model=Dict[str, Any])
async def obtener_documento_custodia(
    doc_id: str,
    service: CustodiaService = Depends(get_custodia_service)
):
    """Obtiene el detalle completo de un expediente en custodia"""
    doc = await service.get_documento_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento en custodia no encontrado")
    return doc

# ==========================================
# 2. CREACIÓN (JSON Y MULTIPART CON ARCHIVOS)
# ==========================================

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def crear_documento_custodia_json(
    data: DocumentoCustodiaCreate,
    service: CustodiaService = Depends(get_custodia_service),
    current_user: Optional[UsuarioInDB] = Depends(get_current_user_optional)
):
    """Crea un nuevo registro de expediente en custodia (vía JSON estándar)"""
    usuario_str = getattr(current_user, "dni", None) or getattr(current_user, "username", "MESA_CUSTODIA") if current_user else "MESA_CUSTODIA"
    return await service.create_documento(data, usuario=usuario_str)

@router.post("/con-archivos", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def crear_documento_con_archivos(
    # Documento de Remisión (Memo, Oficio, etc. - Opcional)
    nro_memorandum: Optional[str] = Form(None),
    fecha_memorandum: Optional[str] = Form(None),
    area_remitente: Optional[str] = Form("SUB DIRECCION DE TRANSPORTE TERRESTRE"),
    remitente_nombre: Optional[str] = Form("Lic. Edgar Burneo Gonzales"),
    asunto_memorandum: Optional[str] = Form(None),
    # Datos del Expediente o Documento Custodiado (Opcional)
    nro_expediente: Optional[str] = Form(None),
    fecha_expediente: Optional[str] = Form(None),
    nro_folios: int = Form(1),
    nro_tomos: int = Form(1),
    asunto_expediente: Optional[str] = Form(None),
    tipo_tramite: Optional[str] = Form("TRAMITE_GENERAL"),
    # Administrado / Empresa
    ruc: Optional[str] = Form(None),
    razon_social: Optional[str] = Form(None),
    nro_resolucion: Optional[str] = Form(None),
    # Ubicación física
    ubicacion_estante: Optional[str] = Form(None),
    ubicacion_archivador: Optional[str] = Form(None),
    codigo_ubicacion: Optional[str] = Form(None),
    estado_conservacion: Optional[str] = Form("BUENO"),
    observaciones: Optional[str] = Form(None),
    # Archivos
    archivo_memo: Optional[UploadFile] = File(None),
    archivo_expediente: Optional[UploadFile] = File(None),
    service: CustodiaService = Depends(get_custodia_service),
    current_user: Optional[UsuarioInDB] = Depends(get_current_user_optional)
):
    """Crea un nuevo registro en custodia adjuntando directamente el PDF del memo y del expediente"""
    usuario_str = getattr(current_user, "dni", None) or getattr(current_user, "username", "MESA_CUSTODIA") if current_user else "MESA_CUSTODIA"

    nuevo_doc = DocumentoCustodiaCreate(
        nro_memorandum=nro_memorandum.strip() if nro_memorandum else None,
        fecha_memorandum=fecha_memorandum.strip() if fecha_memorandum else None,
        area_remitente=area_remitente.strip() if area_remitente else "SUB DIRECCION DE TRANSPORTE TERRESTRE",
        remitente_nombre=remitente_nombre.strip() if remitente_nombre else "Lic. Edgar Burneo Gonzales",
        asunto_memorandum=asunto_memorandum.strip() if asunto_memorandum else None,
        nro_expediente=nro_expediente.strip() if nro_expediente else None,
        fecha_expediente=fecha_expediente.strip() if fecha_expediente else None,
        nro_folios=nro_folios,
        nro_tomos=nro_tomos,
        asunto_expediente=asunto_expediente.strip() if asunto_expediente else "Documento derivado a custodia",
        tipo_tramite=tipo_tramite.strip() if tipo_tramite else "TRAMITE_GENERAL",
        ruc=ruc.strip() if ruc else None,
        razon_social=razon_social.strip() if razon_social else None,
        nro_resolucion=nro_resolucion.strip() if nro_resolucion else None,
        ubicacion_estante=ubicacion_estante.strip() if ubicacion_estante else None,
        ubicacion_archivador=ubicacion_archivador.strip() if ubicacion_archivador else None,
        codigo_ubicacion=codigo_ubicacion.strip() if codigo_ubicacion else None,
        estado_conservacion=estado_conservacion.strip() if estado_conservacion else "BUENO",
        observaciones=observaciones.strip() if observaciones else None
    )

    doc_creado = await service.create_documento(nuevo_doc, usuario=usuario_str)
    doc_id = doc_creado["_id"]

    # Procesar archivo del Memorándum si fue enviado
    if archivo_memo and archivo_memo.filename:
        await service.guardar_archivo_adjunto(doc_id, "memo", archivo_memo)

    # Procesar archivo del Expediente si fue enviado
    if archivo_expediente and archivo_expediente.filename:
        await service.guardar_archivo_adjunto(doc_id, "expediente", archivo_expediente)

    return await service.get_documento_by_id(doc_id)

# ==========================================
# 3. ACTUALIZACIÓN Y ELIMINACIÓN
# ==========================================

@router.put("/{doc_id}", response_model=Dict[str, Any])
async def actualizar_documento_custodia(
    doc_id: str,
    data: DocumentoCustodiaUpdate,
    service: CustodiaService = Depends(get_custodia_service),
    current_user: Optional[UsuarioInDB] = Depends(get_current_user_optional)
):
    """Actualiza metadatos de un expediente en custodia"""
    usuario_str = getattr(current_user, "dni", None) or getattr(current_user, "username", "MESA_CUSTODIA") if current_user else "MESA_CUSTODIA"
    doc = await service.update_documento(doc_id, data, usuario=usuario_str)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento en custodia no encontrado")
    return doc

@router.delete("/{doc_id}")
async def eliminar_documento_custodia(
    doc_id: str,
    service: CustodiaService = Depends(get_custodia_service)
):
    """Elimina el registro de custodia y sus archivos asociados"""
    exito = await service.delete_documento(doc_id)
    if not exito:
        raise HTTPException(status_code=404, detail="Documento en custodia no encontrado o no pudo eliminarse")
    return {"message": "Documento en custodia eliminado satisfactoriamente"}

# ==========================================
# 4. SUBIDA INDEPENDIENTE DE ARCHIVOS (MEMO Y EXPEDIENTE)
# ==========================================

@router.post("/{doc_id}/upload-memo", response_model=Dict[str, Any])
async def subir_archivo_memo(
    doc_id: str,
    archivo: UploadFile = File(...),
    service: CustodiaService = Depends(get_custodia_service)
):
    """Sube o reemplaza el PDF del memorándum de remisión"""
    return await service.guardar_archivo_adjunto(doc_id, "memo", archivo)

@router.post("/{doc_id}/upload-expediente", response_model=Dict[str, Any])
async def subir_archivo_expediente(
    doc_id: str,
    archivo: UploadFile = File(...),
    service: CustodiaService = Depends(get_custodia_service)
):
    """Sube o reemplaza el PDF escaneado del expediente en custodia"""
    return await service.guardar_archivo_adjunto(doc_id, "expediente", archivo)

# ==========================================
# 5. CONTROL DE PRÉSTAMOS Y DEVOLUCIONES
# ==========================================

@router.post("/{doc_id}/prestamo", response_model=Dict[str, Any])
async def registrar_salida_prestamo(
    doc_id: str,
    prestamo: MovimientoPrestamo,
    service: CustodiaService = Depends(get_custodia_service),
    current_user: Optional[UsuarioInDB] = Depends(get_current_user_optional)
):
    """Registra la salida temporal de un expediente para préstamo o desarchive técnico"""
    usuario_str = getattr(current_user, "dni", None) or getattr(current_user, "username", "MESA_CUSTODIA") if current_user else "MESA_CUSTODIA"
    return await service.registrar_prestamo(doc_id, prestamo, usuario=usuario_str)

class DevolucionBody(BaseModel):
    observaciones_devolucion: Optional[str] = "Devolución conforme"

@router.post("/{doc_id}/devolucion", response_model=Dict[str, Any])
async def registrar_reingreso_devolucion(
    doc_id: str,
    body: Optional[DevolucionBody] = None,
    service: CustodiaService = Depends(get_custodia_service),
    current_user: Optional[UsuarioInDB] = Depends(get_current_user_optional)
):
    """Registra la devolución y reingreso físico del expediente a custodia"""
    usuario_str = getattr(current_user, "dni", None) or getattr(current_user, "username", "MESA_CUSTODIA") if current_user else "MESA_CUSTODIA"
    obs = body.observaciones_devolucion if body else "Devolución conforme"
    return await service.registrar_devolucion(doc_id, observaciones_devolucion=obs, usuario=usuario_str)

# ==========================================
# 6. ACUMULACIÓN DE DOCUMENTOS / ACTUADOS
# ==========================================

@router.post("/{doc_id}/acumular", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def acumular_documento_a_custodia(
    doc_id: str,
    nro_documento: Optional[str] = Form(None),
    fecha_documento: Optional[str] = Form(None),
    folios_agregados: int = Form(0),
    asunto: Optional[str] = Form(None),
    area_remitente: Optional[str] = Form("SUB DIRECCION DE TRANSPORTE TERRESTRE"),
    remitente_nombre: Optional[str] = Form("Lic. Edgar Burneo Gonzales"),
    archivo: Optional[UploadFile] = File(None),
    service: CustodiaService = Depends(get_custodia_service),
    current_user: Optional[UsuarioInDB] = Depends(get_current_user_optional)
):
    """Acumula o anexa un nuevo documento al registro principal de custodia existente"""
    usuario_str = getattr(current_user, "dni", None) or getattr(current_user, "username", "MESA_CUSTODIA") if current_user else "MESA_CUSTODIA"
    return await service.acumular_documento(
        doc_id=doc_id,
        nro_documento=nro_documento.strip() if nro_documento else None,
        fecha_documento=fecha_documento.strip() if fecha_documento else None,
        folios_agregados=folios_agregados,
        asunto=asunto.strip() if asunto else None,
        area_remitente=area_remitente.strip() if area_remitente else "SUB DIRECCION DE TRANSPORTE TERRESTRE",
        remitente_nombre=remitente_nombre.strip() if remitente_nombre else "Lic. Edgar Burneo Gonzales",
        archivo=archivo,
        usuario=usuario_str
    )


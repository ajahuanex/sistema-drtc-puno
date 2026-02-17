from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime
from io import BytesIO
from app.dependencies.auth import get_current_active_user
from app.dependencies.db import get_database
from app.services.resolucion_service import ResolucionService
from app.services.resolucion_excel_service import ResolucionExcelService
from app.services.resolucion_padres_service import ResolucionPadresService
from app.models.resolucion import ResolucionCreate, ResolucionUpdate, ResolucionInDB, ResolucionResponse, ResolucionFiltros
from app.utils.exceptions import (
    ResolucionNotFoundException, 
    ResolucionAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/resoluciones", tags=["resoluciones"])

async def get_resolucion_service():
    """Dependency para obtener el servicio de resoluciones"""
    db = await get_database()
    return ResolucionService(db)

def resolucion_to_response(resolucion) -> ResolucionResponse:
    """Convertir modelo Resolucion a ResolucionResponse"""
    import logging
    logger = logging.getLogger(__name__)
    
    # Log para debugging
    anios = getattr(resolucion, 'aniosVigencia', None)
    logger.info(f"🔍 Convirtiendo resolución {resolucion.nroResolucion}: aniosVigencia={anios}")
    
    return ResolucionResponse(
        id=resolucion.id,
        nroResolucion=resolucion.nroResolucion,
        fechaEmision=resolucion.fechaEmision,
        fechaVigenciaInicio=resolucion.fechaVigenciaInicio,
        fechaVigenciaFin=resolucion.fechaVigenciaFin,
        aniosVigencia=resolucion.aniosVigencia,
        tieneEficaciaAnticipada=getattr(resolucion, 'tieneEficaciaAnticipada', None),
        diasEficaciaAnticipada=getattr(resolucion, 'diasEficaciaAnticipada', None),
        tipoResolucion=resolucion.tipoResolucion,
        resolucionPadreId=resolucion.resolucionPadreId,
        tipoTramite=resolucion.tipoTramite,
        descripcion=resolucion.descripcion,
        empresaId=resolucion.empresaId,
        expedienteId=resolucion.expedienteId,
        vehiculosHabilitadosIds=resolucion.vehiculosHabilitadosIds,
        rutasAutorizadasIds=resolucion.rutasAutorizadasIds,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        estaActivo=resolucion.estaActivo,
        fechaRegistro=resolucion.fechaRegistro,
        fechaActualizacion=resolucion.fechaActualizacion,
        resolucionesHijasIds=resolucion.resolucionesHijasIds,
        documentoId=resolucion.documentoId,
        usuarioEmisionId=resolucion.usuarioEmisionId,
        motivoSuspension=resolucion.motivoSuspension,
        fechaSuspension=resolucion.fechaSuspension
    )

@router.post("", response_model=ResolucionResponse, status_code=201)
@router.post("/", response_model=ResolucionResponse, status_code=201)
async def create_resolucion(
    resolucion_data: ResolucionCreate,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
) -> ResolucionResponse:
    """Crear nueva resolución"""
    # Log para debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"📝 Recibiendo datos para crear resolución: {resolucion_data.model_dump()}")
    
    # Guard clauses al inicio
    if not resolucion_data.nroResolucion.strip():
        raise ValidationErrorException("Número", "El número de resolución no puede estar vacío")
    
    try:
        resolucion = await resolucion_service.create_resolucion(resolucion_data)
        return ResolucionResponse(
            id=resolucion.id,
            nroResolucion=resolucion.nroResolucion,
            fechaEmision=resolucion.fechaEmision,
            fechaVigenciaInicio=resolucion.fechaVigenciaInicio,
            fechaVigenciaFin=resolucion.fechaVigenciaFin,
            aniosVigencia=resolucion.aniosVigencia,  # ← AGREGADO
            tipoResolucion=resolucion.tipoResolucion,
            resolucionPadreId=resolucion.resolucionPadreId,
            tipoTramite=resolucion.tipoTramite,
            descripcion=resolucion.descripcion,
            empresaId=resolucion.empresaId,
            expedienteId=resolucion.expedienteId,
            vehiculosHabilitadosIds=resolucion.vehiculosHabilitadosIds,
            rutasAutorizadasIds=resolucion.rutasAutorizadasIds,
            estado=resolucion.estado,
            observaciones=resolucion.observaciones,
            estaActivo=resolucion.estaActivo,
            fechaRegistro=resolucion.fechaRegistro,
            fechaActualizacion=resolucion.fechaActualizacion,
            resolucionesHijasIds=resolucion.resolucionesHijasIds,
            documentoId=resolucion.documentoId,
            usuarioEmisionId=resolucion.usuarioEmisionId,
            motivoSuspension=resolucion.motivoSuspension,
            fechaSuspension=resolucion.fechaSuspension
        )
    except ValueError as e:
        if "número" in str(e).lower():
            raise ResolucionAlreadyExistsException(resolucion_data.nroResolucion)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/test")
async def test_resoluciones():
    """Endpoint de prueba para resoluciones"""
    return {"message": "Endpoint de resoluciones funcionando", "count": 0}

@router.get("", response_model=List[ResolucionResponse])
async def get_resoluciones(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_id: str = Query(None, description="Filtrar por empresa"),
    tipo_resolucion: str = Query(None, description="Filtrar por tipo de resolución"),
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
) -> List[ResolucionResponse]:
    """Obtener lista de resoluciones con filtros opcionales"""
    
    try:
        # Obtener resoluciones del servicio
        resoluciones = await resolucion_service.get_resoluciones_activas()
        
        # Aplicar filtros si se especifican
        if estado:
            resoluciones = [r for r in resoluciones if r.estado == estado]
        if empresa_id:
            resoluciones = [r for r in resoluciones if r.empresaId == empresa_id]
        if tipo_resolucion:
            resoluciones = [r for r in resoluciones if r.tipoResolucion == tipo_resolucion]
        
        # Aplicar paginación
        total = len(resoluciones)
        resoluciones_paginadas = resoluciones[skip:skip + limit]
        
        # Convertir a ResolucionResponse
        return [
            ResolucionResponse(
                id=r.id,
                nroResolucion=r.nroResolucion,
                fechaEmision=r.fechaEmision,
                fechaVigenciaInicio=r.fechaVigenciaInicio,
                fechaVigenciaFin=r.fechaVigenciaFin,
                aniosVigencia=r.aniosVigencia,  # ← AGREGADO
                tipoResolucion=r.tipoResolucion,
                resolucionPadreId=r.resolucionPadreId,
                tipoTramite=r.tipoTramite,
                descripcion=r.descripcion,
                empresaId=r.empresaId,
                expedienteId=r.expedienteId,
                vehiculosHabilitadosIds=r.vehiculosHabilitadosIds or [],
                rutasAutorizadasIds=r.rutasAutorizadasIds or [],
                estado=r.estado,
                observaciones=r.observaciones,
                estaActivo=r.estaActivo,
                fechaRegistro=r.fechaRegistro,
                fechaActualizacion=r.fechaActualizacion,
                resolucionesHijasIds=r.resolucionesHijasIds or [],
                documentoId=r.documentoId,
                usuarioEmisionId=r.usuarioEmisionId,
                motivoSuspension=r.motivoSuspension,
                fechaSuspension=r.fechaSuspension
            )
            for r in resoluciones_paginadas
        ]
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error en get_resoluciones: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/filtros", response_model=List[ResolucionResponse])
async def get_resoluciones_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    numero: Optional[str] = Query(None),
    tipo_resolucion: Optional[str] = Query(None),
    empresa_id: Optional[str] = Query(None),
    expediente_id: Optional[str] = Query(None),
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None),
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
) -> List[ResolucionResponse]:
    """Obtener resoluciones con filtros avanzados"""
    
    # Construir filtros
    filtros = {}
    if estado: filtros['estado'] = estado
    if numero: filtros['numero'] = numero
    if tipo_resolucion: filtros['tipo'] = tipo_resolucion
    if empresa_id: filtros['empresa_id'] = empresa_id
    if expediente_id: filtros['expediente_id'] = expediente_id
    if fecha_desde: filtros['fecha_desde'] = fecha_desde
    if fecha_hasta: filtros['fecha_hasta'] = fecha_hasta
    
    resoluciones = await resolucion_service.get_resoluciones_con_filtros(filtros)
    resoluciones = resoluciones[skip:skip + limit]
    
    return [
        resolucion_to_response(resolucion)
        for resolucion in resoluciones
    ]

@router.post("/filtradas", response_model=List[ResolucionResponse])
async def get_resoluciones_filtradas_post(
    filtros: ResolucionFiltros,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Obtener resoluciones filtradas (POST)"""
    import logging
    logger = logging.getLogger(__name__)
    
    filtros_servicio = {}
    if filtros.estado: filtros_servicio["estado"] = filtros.estado
    if filtros.nroResolucion: filtros_servicio["numero"] = filtros.nroResolucion
    if filtros.tipoResolucion: filtros_servicio["tipo"] = filtros.tipoResolucion
    if filtros.empresaId: filtros_servicio["empresa_id"] = filtros.empresaId
    if filtros.expedienteId: filtros_servicio["expediente_id"] = filtros.expedienteId
    if filtros.fechaEmisionDesde: filtros_servicio["fecha_desde"] = filtros.fechaEmisionDesde
    if filtros.fechaEmisionHasta: filtros_servicio["fecha_hasta"] = filtros.fechaEmisionHasta
    
    resoluciones = await resolucion_service.get_resoluciones_con_filtros(filtros_servicio)
    
    logger.info(f"📊 Total resoluciones obtenidas: {len(resoluciones)}")
    
    # Log de las primeras 10 resoluciones con sus años de vigencia
    for i, res in enumerate(resoluciones[:10]):
        anios = getattr(res, 'aniosVigencia', 'NO EXISTE')
        logger.info(f"  [{i+1}] {res.nroResolucion}: aniosVigencia={anios}")
    
    respuestas = [resolucion_to_response(resolucion) for resolucion in resoluciones]
    
    # Log de las respuestas convertidas
    logger.info(f"📤 Enviando {len(respuestas)} respuestas al frontend")
    for i, resp in enumerate(respuestas[:10]):
        logger.info(f"  [{i+1}] {resp.nroResolucion}: aniosVigencia={resp.aniosVigencia}")
    
    return respuestas

@router.get("/estadisticas")
async def get_estadisticas_resoluciones(
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Obtener estadísticas de resoluciones"""
    estadisticas = await resolucion_service.get_estadisticas()
    
    return {
        "totalResoluciones": estadisticas['total'],
        "resolucionesVigentes": estadisticas['vigentes'],
        "resolucionesVencidas": estadisticas['vencidas'],
        "resolucionesSuspendidas": estadisticas['suspendidas'],
        "porVencer": estadisticas['por_vencer'],
        "porTipo": estadisticas['por_tipo']
    }

@router.get("/vencidas", response_model=List[ResolucionResponse])
async def get_resoluciones_vencidas(
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Obtener resoluciones vencidas"""
    resoluciones = await resolucion_service.get_resoluciones_vencidas()
    
    return [
        ResolucionResponse(
            id=resolucion.id,
            nroResolucion=resolucion.nroResolucion,
            fechaEmision=resolucion.fechaEmision,
            fechaVigenciaInicio=resolucion.fechaVigenciaInicio,
            fechaVigenciaFin=resolucion.fechaVigenciaFin,
            tipoResolucion=resolucion.tipoResolucion,
            resolucionPadreId=resolucion.resolucionPadreId,
            tipoTramite=resolucion.tipoTramite,
            descripcion=resolucion.descripcion,
            empresaId=resolucion.empresaId,
            expedienteId=resolucion.expedienteId,
            vehiculosHabilitadosIds=resolucion.vehiculosHabilitadosIds,
            rutasAutorizadasIds=resolucion.rutasAutorizadasIds,
            estado=resolucion.estado,
            observaciones=resolucion.observaciones,
            estaActivo=resolucion.estaActivo,
            fechaRegistro=resolucion.fechaRegistro,
            fechaActualizacion=resolucion.fechaActualizacion,
            resolucionesHijasIds=resolucion.resolucionesHijasIds,
            documentoId=resolucion.documentoId,
            usuarioEmisionId=resolucion.usuarioEmisionId,
            motivoSuspension=resolucion.motivoSuspension,
            fechaSuspension=resolucion.fechaSuspension
        )
        for resolucion in resoluciones
    ]

@router.get("/{resolucion_id}", response_model=ResolucionResponse)
async def get_resolucion(
    resolucion_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
) -> ResolucionResponse:
    """Obtener resolución por ID"""
    
    resolucion = await resolucion_service.get_resolucion_by_id(resolucion_id)
    
    if not resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=resolucion.id,
        nroResolucion=resolucion.nroResolucion,
        fechaEmision=resolucion.fechaEmision,
        fechaVigenciaInicio=resolucion.fechaVigenciaInicio,
        fechaVigenciaFin=resolucion.fechaVigenciaFin,
        tipoResolucion=resolucion.tipoResolucion,
        resolucionPadreId=resolucion.resolucionPadreId,
        tipoTramite=resolucion.tipoTramite,
        descripcion=resolucion.descripcion,
        empresaId=resolucion.empresaId,
        expedienteId=resolucion.expedienteId,
        vehiculosHabilitadosIds=resolucion.vehiculosHabilitadosIds,
        rutasAutorizadasIds=resolucion.rutasAutorizadasIds,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        estaActivo=resolucion.estaActivo,
        fechaRegistro=resolucion.fechaRegistro,
        fechaActualizacion=resolucion.fechaActualizacion,
        resolucionesHijasIds=resolucion.resolucionesHijasIds,
        documentoId=resolucion.documentoId,
        usuarioEmisionId=resolucion.usuarioEmisionId,
        motivoSuspension=resolucion.motivoSuspension,
        fechaSuspension=resolucion.fechaSuspension
    )

@router.get("/numero/{numero}", response_model=ResolucionResponse)
async def get_resolucion_by_numero(
    numero: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
) -> ResolucionResponse:
    """Obtener resolución por número"""
    resolucion = await resolucion_service.get_resolucion_by_numero(numero)
    
    if not resolucion:
        raise ResolucionNotFoundException(f"Número {numero}")
    
    return ResolucionResponse(
        id=resolucion.id,
        nroResolucion=resolucion.nroResolucion,
        fechaEmision=resolucion.fechaEmision,
        fechaVigenciaInicio=resolucion.fechaVigenciaInicio,
        fechaVigenciaFin=resolucion.fechaVigenciaFin,
        tipoResolucion=resolucion.tipoResolucion,
        resolucionPadreId=resolucion.resolucionPadreId,
        tipoTramite=resolucion.tipoTramite,
        descripcion=resolucion.descripcion,
        empresaId=resolucion.empresaId,
        expedienteId=resolucion.expedienteId,
        vehiculosHabilitadosIds=resolucion.vehiculosHabilitadosIds,
        rutasAutorizadasIds=resolucion.rutasAutorizadasIds,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        estaActivo=resolucion.estaActivo,
        fechaRegistro=resolucion.fechaRegistro,
        fechaActualizacion=resolucion.fechaActualizacion,
        resolucionesHijasIds=resolucion.resolucionesHijasIds,
        documentoId=resolucion.documentoId,
        usuarioEmisionId=resolucion.usuarioEmisionId,
        motivoSuspension=resolucion.motivoSuspension,
        fechaSuspension=resolucion.fechaSuspension
    )

@router.get("/validar-numero/{numero}")
async def validar_numero_resolucion(
    numero: str,
    fecha_emision: datetime = Query(..., description="Fecha de emisión para validar unicidad por año"),
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Validar si un número de resolución está disponible para un año específico"""
    
    try:
        # Validar que el número sea único por año
        es_unico = await resolucion_service.validar_numero_unico_por_anio(numero, fecha_emision)
        anio = fecha_emision.year
        
        if es_unico:
            return {
                "disponible": True,
                "mensaje": f"El número {numero} está disponible para el año {anio}",
                "numeroCompleto": f"R-{numero}-{anio}"
            }
        else:
            return {
                "disponible": False,
                "mensaje": f"Ya existe una resolución con el número {numero} en el año {anio}",
                "numeroCompleto": f"R-{numero}-{anio}"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/siguiente-numero/{anio}")
async def obtener_siguiente_numero(
    anio: int,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Obtener el siguiente número de resolución disponible para un año específico"""
    
    try:
        fecha_emision = datetime(anio, 1, 1)  # Fecha de referencia para el año
        siguiente_numero = await resolucion_service.generar_siguiente_numero(fecha_emision)
        
        return {
            "siguienteNumero": siguiente_numero,
            "numeroCompleto": f"R-{siguiente_numero}-{anio}",
            "anio": anio
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{resolucion_id}", response_model=ResolucionResponse)
async def update_resolucion(
    resolucion_id: str,
    resolucion_data: ResolucionUpdate,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
) -> ResolucionResponse:
    """Actualizar resolución"""
    
    if not resolucion_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    updated_resolucion = await resolucion_service.update_resolucion(resolucion_id, resolucion_data)
    
    if not updated_resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=updated_resolucion.id,
        nroResolucion=updated_resolucion.nroResolucion,
        fechaEmision=updated_resolucion.fechaEmision,
        fechaVigenciaInicio=updated_resolucion.fechaVigenciaInicio,
        fechaVigenciaFin=updated_resolucion.fechaVigenciaFin,
        tipoResolucion=updated_resolucion.tipoResolucion,
        resolucionPadreId=updated_resolucion.resolucionPadreId,
        tipoTramite=updated_resolucion.tipoTramite,
        descripcion=updated_resolucion.descripcion,
        empresaId=updated_resolucion.empresaId,
        expedienteId=updated_resolucion.expedienteId,
        vehiculosHabilitadosIds=updated_resolucion.vehiculosHabilitadosIds,
        rutasAutorizadasIds=updated_resolucion.rutasAutorizadasIds,
        estado=updated_resolucion.estado,
        observaciones=updated_resolucion.observaciones,
        estaActivo=updated_resolucion.estaActivo,
        fechaRegistro=updated_resolucion.fechaRegistro,
        fechaActualizacion=updated_resolucion.fechaActualizacion,
        resolucionesHijasIds=updated_resolucion.resolucionesHijasIds,
        documentoId=updated_resolucion.documentoId,
        usuarioEmisionId=updated_resolucion.usuarioEmisionId,
        motivoSuspension=updated_resolucion.motivoSuspension,
        fechaSuspension=updated_resolucion.fechaSuspension
    )

@router.delete("/{resolucion_id}", status_code=204)
async def delete_resolucion(
    resolucion_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Desactivar resolución (borrado lógico)"""
    
    success = await resolucion_service.soft_delete_resolucion(resolucion_id)
    
    if not success:
        raise ResolucionNotFoundException(resolucion_id)

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_resoluciones(
    formato: str,
    estado: Optional[str] = Query(None),
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Exportar resoluciones en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    # Obtener resoluciones según filtros
    if estado:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
    else:
        resoluciones = await resolucion_service.get_resoluciones_activas()
    
    # Simular exportación
    if formato == 'excel':
        return {"message": f"Exportando {len(resoluciones)} resoluciones a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(resoluciones)} resoluciones a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(resoluciones)} resoluciones a CSV"} 

# ========================================
# ENDPOINTS DE CARGA MASIVA DESDE EXCEL
# ========================================

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_resoluciones():
    """Descargar plantilla Excel para carga masiva de resoluciones"""
    try:
        excel_service = ResolucionExcelService()
        plantilla_buffer = excel_service.generar_plantilla_excel()
        
        return StreamingResponse(
            BytesIO(plantilla_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_resoluciones.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar plantilla: {str(e)}")

@router.post("/carga-masiva/validar")
async def validar_archivo_resoluciones(
    archivo: UploadFile = File(..., description="Archivo Excel con resoluciones")
):
    """Validar archivo Excel de resoluciones sin procesarlo"""
    
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
        excel_service = ResolucionExcelService()
        resultado = await excel_service.validar_archivo_excel(archivo_buffer)
        
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
async def procesar_carga_masiva_resoluciones(
    archivo: UploadFile = File(..., description="Archivo Excel con resoluciones"),
    solo_validar: bool = Query(False, description="Solo validar sin crear resoluciones")
):
    """Procesar carga masiva de resoluciones desde Excel"""
    
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
        excel_service = ResolucionExcelService()
        
        if solo_validar:
            resultado = await excel_service.validar_archivo_excel(archivo_buffer)
            mensaje = f"Validación completada: {resultado['validos']} válidos, {resultado['invalidos']} inválidos"
        else:
            resultado = await excel_service.procesar_carga_masiva(archivo_buffer)
            mensaje = f"Procesamiento completado: {resultado.get('total_procesadas', 0)} resoluciones procesadas"
        
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
# ENDPOINTS DE RELACIONES
# ========================================

@router.get("/{resolucion_id}/vehiculos")
async def get_vehiculos_resolucion(
    resolucion_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Obtener todos los vehículos habilitados en una resolución"""
    try:
        vehiculos = await resolucion_service.get_vehiculos_resolucion(resolucion_id)
        return vehiculos
    except ResolucionNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener vehículos: {str(e)}")

@router.get("/{resolucion_id}/rutas")
async def get_rutas_resolucion(
    resolucion_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Obtener todas las rutas autorizadas en una resolución"""
    try:
        rutas = await resolucion_service.get_rutas_resolucion(resolucion_id)
        return rutas
    except ResolucionNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener rutas: {str(e)}")

@router.post("/{resolucion_id}/vehiculos/{vehiculo_id}")
async def agregar_vehiculo_resolucion(
    resolucion_id: str,
    vehiculo_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Agregar un vehículo a la resolución"""
    try:
        resultado = await resolucion_service.agregar_vehiculo(resolucion_id, vehiculo_id)
        return {"message": "Vehículo agregado exitosamente", "resolucion": resultado}
    except ResolucionNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al agregar vehículo: {str(e)}")

@router.delete("/{resolucion_id}/vehiculos/{vehiculo_id}")
async def remover_vehiculo_resolucion(
    resolucion_id: str,
    vehiculo_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Remover un vehículo de la resolución"""
    try:
        resultado = await resolucion_service.remover_vehiculo(resolucion_id, vehiculo_id)
        return {"message": "Vehículo removido exitosamente", "resolucion": resultado}
    except ResolucionNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al remover vehículo: {str(e)}")

@router.post("/{resolucion_id}/rutas/{ruta_id}")
async def agregar_ruta_resolucion(
    resolucion_id: str,
    ruta_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Agregar una ruta a la resolución"""
    try:
        resultado = await resolucion_service.agregar_ruta(resolucion_id, ruta_id)
        return {"message": "Ruta agregada exitosamente", "resolucion": resultado}
    except ResolucionNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al agregar ruta: {str(e)}")

@router.delete("/{resolucion_id}/rutas/{ruta_id}")
async def remover_ruta_resolucion(
    resolucion_id: str,
    ruta_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Remover una ruta de la resolución"""
    try:
        resultado = await resolucion_service.remover_ruta(resolucion_id, ruta_id)
        return {"message": "Ruta removida exitosamente", "resolucion": resultado}
    except ResolucionNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al remover ruta: {str(e)}")

@router.get("/{resolucion_id}/resumen")
async def get_resumen_resolucion(
    resolucion_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Obtener resumen completo de una resolución con sus vehículos y rutas"""
    try:
        resumen = await resolucion_service.get_resumen_completo(resolucion_id)
        return resumen
    except ResolucionNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener resumen: {str(e)}")

# ========================================
# ENDPOINTS PARA RESOLUCIONES PADRES
# ========================================

@router.get("/padres/plantilla")
async def descargar_plantilla_resoluciones_padres():
    """Descargar plantilla Excel para carga masiva de resoluciones padres"""
    try:
        from fastapi.responses import StreamingResponse
        from io import BytesIO
        import pandas as pd
        from datetime import datetime
        
        # Definir las columnas para la plantilla (ESTADO al final)
        columnas = [
            'RUC_EMPRESA_ASOCIADA',
            'RESOLUCION_NUMERO', 
            'RESOLUCION_ASOCIADA',
            'TIPO_RESOLUCION',
            'FECHA_RESOLUCION',
            'FECHA_INICIO_VIGENCIA',
            'ANIOS_VIGENCIA',
            'FECHA_FIN_VIGENCIA',
            'ESTADO'
        ]
        
        # Crear DataFrame con ejemplos (ESTADO al final, FECHA_RESOLUCION opcional)
        ejemplos = [
            {
                'RUC_EMPRESA_ASOCIADA': '20123456789',
                'RESOLUCION_NUMERO': '0001-2025',
                'RESOLUCION_ASOCIADA': '0001-2021',
                'TIPO_RESOLUCION': 'RENOVACION',
                'FECHA_RESOLUCION': '01/01/2025',
                'FECHA_INICIO_VIGENCIA': '01/01/2025',
                'ANIOS_VIGENCIA': 4,
                'FECHA_FIN_VIGENCIA': '31/12/2028',
                'ESTADO': 'ACTIVA'
            },
            {
                'RUC_EMPRESA_ASOCIADA': '20987654321',
                'RESOLUCION_NUMERO': '0002-2025',
                'RESOLUCION_ASOCIADA': '',
                'TIPO_RESOLUCION': 'NUEVA',
                'FECHA_RESOLUCION': '',  # Ejemplo sin fecha de resolución
                'FECHA_INICIO_VIGENCIA': '15/01/2025',
                'ANIOS_VIGENCIA': 4,
                'FECHA_FIN_VIGENCIA': '14/01/2029',
                'ESTADO': 'ACTIVA'
            },
            {
                'RUC_EMPRESA_ASOCIADA': '20456789123',
                'RESOLUCION_NUMERO': '0150-2020',
                'RESOLUCION_ASOCIADA': '0150-2016',
                'TIPO_RESOLUCION': 'RENOVACION',
                'FECHA_RESOLUCION': '10/03/2020',
                'FECHA_INICIO_VIGENCIA': '10/03/2020',
                'ANIOS_VIGENCIA': 4,
                'FECHA_FIN_VIGENCIA': '09/03/2024',
                'ESTADO': 'VENCIDA'
            }
        ]
        
        df_plantilla = pd.DataFrame(ejemplos)
        
        # Crear archivo Excel en memoria
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df_plantilla.to_excel(writer, sheet_name='Resoluciones_Padres', index=False)
            
            # Crear hoja de instrucciones
            instrucciones = [
                ['INSTRUCCIONES PARA PLANTILLA DE RESOLUCIONES PADRES'],
                [''],
                ['CAMPOS OBLIGATORIOS:'],
                ['- RUC_EMPRESA_ASOCIADA: RUC de la empresa (11 dígitos)'],
                ['- RESOLUCION_NUMERO: Número de la resolución (formato: XXXX-YYYY)'],
                ['- TIPO_RESOLUCION: NUEVA, RENOVACION, MODIFICACION'],
                ['- FECHA_INICIO_VIGENCIA: Fecha inicio vigencia (DD/MM/YYYY) - OBLIGATORIA para cálculos'],
                ['- ANIOS_VIGENCIA: Años de vigencia (número entero)'],
                ['- FECHA_FIN_VIGENCIA: Fecha fin vigencia (DD/MM/YYYY)'],
                ['- ESTADO: ACTIVA, VENCIDA, RENOVADA, ANULADA'],
                [''],
                ['CAMPOS OPCIONALES:'],
                ['- FECHA_RESOLUCION: Fecha de emisión (DD/MM/YYYY) - NO se usa para cálculos'],
                ['- RESOLUCION_ASOCIADA: Número de resolución anterior (para renovaciones)'],
                [''],
                ['NOTAS IMPORTANTES:'],
                ['- Las fechas deben estar en formato DD/MM/YYYY'],
                ['- El RUC debe tener exactamente 11 dígitos'],
                ['- Los años de vigencia son típicamente 4 años'],
                ['- FECHA_INICIO_VIGENCIA es OBLIGATORIA y se usa para calcular FECHA_FIN_VIGENCIA'],
                ['- FECHA_RESOLUCION es OPCIONAL y NO se usa para cálculos'],
                ['- Para resoluciones sin fecha de emisión, dejar el campo vacío'],
                ['- La columna ESTADO está al final para mejor organización']
            ]
            
            df_instrucciones = pd.DataFrame(instrucciones)
            df_instrucciones.to_excel(writer, sheet_name='Instrucciones', index=False, header=False)
        
        buffer.seek(0)
        
        # Generar nombre de archivo con timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"plantilla_resoluciones_padres_{timestamp}.xlsx"
        
        return StreamingResponse(
            BytesIO(buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar plantilla: {str(e)}")

@router.post("/padres/validar")
async def validar_archivo_resoluciones_padres(
    archivo: UploadFile = File(..., description="Archivo Excel con resoluciones padres"),
    current_user = Depends(get_current_active_user)
):
    """Validar archivo Excel de resoluciones padres sin procesarlo"""
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser un Excel (.xlsx o .xls)"
        )
    
    try:
        # Leer archivo
        contenido = await archivo.read()
        
        # Convertir a DataFrame manteniendo las fechas como texto
        import pandas as pd
        from io import BytesIO
        # Leer Excel manteniendo las fechas como texto para evitar conversión automática
        df = pd.read_excel(BytesIO(contenido), dtype=str, keep_default_na=False)
        # Reemplazar valores vacíos con cadenas vacías
        df = df.fillna('')
        
        # Validar usando el servicio
        resultado = ResolucionPadresService.validar_plantilla_padres(df)
        
        return {
            "archivo": archivo.filename,
            "validacion": resultado,
            "mensaje": f"Validación completada: {'Válido' if resultado['valido'] else 'Inválido'}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al validar archivo: {str(e)}"
        )

@router.post("/padres/procesar")
async def procesar_carga_masiva_resoluciones_padres(
    archivo: UploadFile = File(..., description="Archivo Excel con resoluciones padres"),
    solo_validar: bool = Query(False, description="Solo validar sin crear resoluciones"),
    current_user = Depends(get_current_active_user)
):
    """Procesar carga masiva de resoluciones padres desde Excel"""
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser un Excel (.xlsx o .xls)"
        )
    
    try:
        # Leer archivo
        contenido = await archivo.read()
        
        # Convertir a DataFrame manteniendo las fechas como texto
        import pandas as pd
        from io import BytesIO
        # Leer Excel manteniendo las fechas como texto para evitar conversión automática
        df = pd.read_excel(BytesIO(contenido), dtype=str, keep_default_na=False)
        # Reemplazar valores vacíos con cadenas vacías
        df = df.fillna('')
        
        if solo_validar:
            # Validar con base de datos para verificar empresas y resoluciones asociadas
            db = await get_database()
            servicio = ResolucionPadresService(db)
            resultado = await servicio.validar_plantilla_padres_con_db(df)
            mensaje = f"Validación completada: {'Válido' if resultado['valido'] else 'Inválido'}"
        else:
            # Procesar completamente con MongoDB
            db = await get_database()
            servicio = ResolucionPadresService(db)
            resultado = await servicio.procesar_plantilla_padres(df, current_user.id)
            mensaje = resultado['mensaje']
        
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

@router.get("/padres/reporte-estados")
async def obtener_reporte_estados_resoluciones(
    current_user = Depends(get_current_active_user)
):
    """Obtener reporte de estados de resoluciones padres"""
    
    try:
        db = await get_database()
        servicio = ResolucionPadresService(db)
        reporte = await servicio.generar_reporte_estados()
        
        return reporte
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al generar reporte: {str(e)}"
        )

# ========================================
# ENDPOINTS DE RESTORE/RECUPERACIÓN
# ========================================

@router.get("/eliminadas")
async def get_resoluciones_eliminadas(
    limit: int = Query(50, ge=1, le=100, description="Número máximo de resoluciones eliminadas a mostrar"),
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Obtener resoluciones eliminadas recientemente (últimos 30 días)"""
    try:
        resoluciones_eliminadas = await resolucion_service.get_resoluciones_eliminadas(limit)
        
        # Convertir a formato de respuesta
        return [
            {
                "id": r.id,
                "nroResolucion": r.nroResolucion,
                "empresaId": r.empresaId,
                "fechaEmision": r.fechaEmision,
                "fechaVigenciaInicio": r.fechaVigenciaInicio,
                "fechaVigenciaFin": r.fechaVigenciaFin,
                "tipoResolucion": r.tipoResolucion,
                "tipoTramite": r.tipoTramite,
                "descripcion": r.descripcion,
                "estado": r.estado,
                "fechaEliminacion": getattr(r, 'fechaEliminacion', None),
                "fechaRegistro": r.fechaRegistro,
                "estaActivo": r.estaActivo
            }
            for r in resoluciones_eliminadas
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener resoluciones eliminadas: {str(e)}"
        )

@router.post("/{resolucion_id}/restore")
async def restore_resolucion(
    resolucion_id: str,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Restaurar una resolución eliminada"""
    try:
        success = await resolucion_service.restore_resolucion(resolucion_id)
        
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="Resolución no encontrada o ya está activa"
            )
        
        # Obtener la resolución restaurada
        resolucion_restaurada = await resolucion_service.get_resolucion_by_id(resolucion_id)
        
        return {
            "message": "Resolución restaurada exitosamente",
            "resolucion": {
                "id": resolucion_restaurada.id,
                "nroResolucion": resolucion_restaurada.nroResolucion,
                "empresaId": resolucion_restaurada.empresaId,
                "estado": resolucion_restaurada.estado,
                "fechaRestauracion": datetime.utcnow().isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al restaurar resolución: {str(e)}"
        )

@router.post("/restore-multiple")
async def restore_resoluciones_multiples(
    resoluciones_ids: List[str],
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Restaurar múltiples resoluciones eliminadas"""
    try:
        resultados = []
        errores = []
        
        for resolucion_id in resoluciones_ids:
            try:
                success = await resolucion_service.restore_resolucion(resolucion_id)
                if success:
                    resolucion = await resolucion_service.get_resolucion_by_id(resolucion_id)
                    resultados.append({
                        "id": resolucion.id,
                        "nroResolucion": resolucion.nroResolucion,
                        "restaurada": True
                    })
                else:
                    errores.append({
                        "id": resolucion_id,
                        "error": "No se pudo restaurar (no encontrada o ya activa)"
                    })
            except Exception as e:
                errores.append({
                    "id": resolucion_id,
                    "error": str(e)
                })
        
        return {
            "message": f"Proceso completado: {len(resultados)} restauradas, {len(errores)} errores",
            "restauradas": resultados,
            "errores": errores,
            "total_procesadas": len(resoluciones_ids),
            "total_exitosas": len(resultados),
            "total_errores": len(errores)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error en restauración múltiple: {str(e)}"
        )
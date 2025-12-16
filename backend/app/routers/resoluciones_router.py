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

@router.post("/filtradas", response_model=List[ResolucionResponse])
async def get_resoluciones_filtradas_post(
    filtros: ResolucionFiltros,
    resolucion_service: ResolucionService = Depends(get_resolucion_service)
):
    """Obtener resoluciones filtradas (POST)"""
    
    filtros_servicio = {}
    if filtros.estado: filtros_servicio["estado"] = filtros.estado
    if filtros.nroResolucion: filtros_servicio["numero"] = filtros.nroResolucion
    if filtros.tipoResolucion: filtros_servicio["tipo"] = filtros.tipoResolucion
    if filtros.empresaId: filtros_servicio["empresa_id"] = filtros.empresaId
    if filtros.expedienteId: filtros_servicio["expediente_id"] = filtros.expedienteId
    if filtros.fechaEmisionDesde: filtros_servicio["fecha_desde"] = filtros.fechaEmisionDesde
    if filtros.fechaEmisionHasta: filtros_servicio["fecha_hasta"] = filtros.fechaEmisionHasta
    
    resoluciones = await resolucion_service.get_resoluciones_con_filtros(filtros_servicio)
    
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
            resultado = excel_service.validar_archivo_excel(archivo_buffer)
            mensaje = f"Validación completada: {resultado['validos']} válidos, {resultado['invalidos']} inválidos"
        else:
            resultado = excel_service.procesar_carga_masiva(archivo_buffer)
            mensaje = f"Procesamiento completado: {resultado.get('total_creadas', 0)} resoluciones creadas"
        
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

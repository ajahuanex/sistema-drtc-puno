from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from io import BytesIO
from app.dependencies.auth import get_current_active_user
from app.services.mock_resolucion_service import MockResolucionService
from app.services.resolucion_excel_service import ResolucionExcelService
from app.models.resolucion import ResolucionCreate, ResolucionUpdate, ResolucionInDB, ResolucionResponse
from app.utils.exceptions import (
    ResolucionNotFoundException, 
    ResolucionAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/resoluciones", tags=["resoluciones"])

@router.post("/", response_model=ResolucionResponse, status_code=201)
async def create_resolucion(
    resolucion_data: ResolucionCreate
) -> ResolucionResponse:
    """Crear nueva resolución"""
    # Guard clauses al inicio
    if not resolucion_data.nroResolucion.strip():
        raise ValidationErrorException("Número", "El número de resolución no puede estar vacío")
    
    resolucion_service = MockResolucionService()
    
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

@router.get("/", response_model=List[ResolucionResponse])
async def get_resoluciones(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_id: str = Query(None, description="Filtrar por empresa"),
    tipo_resolucion: str = Query(None, description="Filtrar por tipo de resolución")
) -> List[ResolucionResponse]:
    """Obtener lista de resoluciones con filtros opcionales"""
    resolucion_service = MockResolucionService()
    
    if estado and empresa_id and tipo_resolucion:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
        resoluciones = [r for r in resoluciones if r.empresaId == empresa_id and r.tipoResolucion == tipo_resolucion]
    elif estado and empresa_id:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
        resoluciones = [r for r in resoluciones if r.empresaId == empresa_id]
    elif estado and tipo_resolucion:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
        resoluciones = [r for r in resoluciones if r.tipoResolucion == tipo_resolucion]
    elif empresa_id and tipo_resolucion:
        resoluciones = await resolucion_service.get_resoluciones_por_empresa(empresa_id)
        resoluciones = [r for r in resoluciones if r.tipoResolucion == tipo_resolucion]
    elif estado:
        resoluciones = await resolucion_service.get_resoluciones_por_estado(estado)
    elif empresa_id:
        resoluciones = await resolucion_service.get_resoluciones_por_empresa(empresa_id)
    elif tipo_resolucion:
        resoluciones = await resolucion_service.get_resoluciones_por_tipo(tipo_resolucion)
    else:
        resoluciones = await resolucion_service.get_resoluciones_activas()
    
    # Aplicar paginación
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
    fecha_hasta: Optional[datetime] = Query(None)
) -> List[ResolucionResponse]:
    """Obtener resoluciones con filtros avanzados"""
    resolucion_service = MockResolucionService()
    
    # Construir filtros
    filtros = {}
    if estado:
        filtros['estado'] = estado
    if numero:
        filtros['numero'] = numero
    if tipo_resolucion:
        filtros['tipo'] = tipo_resolucion
    if empresa_id:
        filtros['empresa_id'] = empresa_id
    if expediente_id:
        filtros['expediente_id'] = expediente_id
    if fecha_desde:
        filtros['fecha_desde'] = fecha_desde
    if fecha_hasta:
        filtros['fecha_hasta'] = fecha_hasta
    
    resoluciones = await resolucion_service.get_resoluciones_con_filtros(filtros)
    resoluciones = resoluciones[skip:skip + limit]
    
    return [
        ResolucionResponse(
            id=resolucion.id,
            nro_resolucion=resolucion.nroResolucion,
            fecha_emision=resolucion.fechaEmision,
            fecha_vigencia_inicio=resolucion.fechaVigenciaInicio,
            fecha_vigencia_fin=resolucion.fechaVigenciaFin,
            tipo_resolucion=resolucion.tipoResolucion,
            resolucion_padre_id=resolucion.resolucionPadreId,
            tipo_tramite=resolucion.tipoTramite,
            descripcion=resolucion.descripcion,
            empresa_id=resolucion.empresaId,
            expediente_id=resolucion.expedienteId,
            vehiculos_habilitados_ids=resolucion.vehiculosHabilitadosIds,
            rutas_autorizadas_ids=resolucion.rutasAutorizadasIds,
            estado=resolucion.estado,
            observaciones=resolucion.observaciones,
            esta_activo=resolucion.estaActivo,
            fecha_registro=resolucion.fechaRegistro,
            fecha_actualizacion=resolucion.fechaActualizacion,
            resoluciones_hijas_ids=resolucion.resolucionesHijasIds,
            documento_id=resolucion.documentoId,
            usuario_emision_id=resolucion.usuarioEmisionId,
            usuario_aprobacion_id=resolucion.usuarioAprobacionId,
            fecha_aprobacion=resolucion.fechaAprobacion,
            motivo_suspension=resolucion.motivoSuspension,
            fecha_suspension=resolucion.fechaSuspension
        )
        for resolucion in resoluciones
    ]

@router.get("/estadisticas")
async def get_estadisticas_resoluciones():
    """Obtener estadísticas de resoluciones"""
    resolucion_service = MockResolucionService()
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
async def get_resoluciones_vencidas():
    """Obtener resoluciones vencidas"""
    resolucion_service = MockResolucionService()
    resoluciones = await resolucion_service.get_resoluciones_vencidas()
    
    return [
        ResolucionResponse(
            id=resolucion.id,
            nro_resolucion=resolucion.nro_resolucion,
            fecha_emision=resolucion.fecha_emision,
            fecha_vigencia_inicio=resolucion.fecha_vigencia_inicio,
            fecha_vigencia_fin=resolucion.fecha_vigencia_fin,
            tipo_resolucion=resolucion.tipo_resolucion,
            resolucion_padre_id=resolucion.resolucion_padre_id,
            tipo_tramite=resolucion.tipo_tramite,
            descripcion=resolucion.descripcion,
            empresa_id=resolucion.empresa_id,
            expediente_id=resolucion.expediente_id,
            vehiculos_habilitados_ids=resolucion.vehiculos_habilitados_ids,
            rutas_autorizadas_ids=resolucion.rutas_autorizadas_ids,
            estado=resolucion.estado,
            observaciones=resolucion.observaciones,
            esta_activo=resolucion.esta_activo,
            fecha_registro=resolucion.fecha_registro,
            fecha_actualizacion=resolucion.fecha_actualizacion,
            resoluciones_hijas_ids=resolucion.resoluciones_hijas_ids,
            documento_id=resolucion.documento_id,
            usuario_emision_id=resolucion.usuario_emision_id,
            usuario_aprobacion_id=resolucion.usuario_aprobacion_id,
            fecha_aprobacion=resolucion.fecha_aprobacion,
            motivo_suspension=resolucion.motivo_suspension,
            fecha_suspension=resolucion.fecha_suspension
        )
        for resolucion in resoluciones
    ]

@router.get("/{resolucion_id}", response_model=ResolucionResponse)
async def get_resolucion(
    resolucion_id: str
) -> ResolucionResponse:
    """Obtener resolución por ID"""
    # Guard clause
    if not resolucion_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de resolución inválido")
    
    resolucion_service = MockResolucionService()
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
    numero: str
) -> ResolucionResponse:
    """Obtener resolución por número"""
    resolucion_service = MockResolucionService()
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
        usuarioEmisionId=resolucion.usuarioEmisionId
    )

@router.get("/validar-numero/{numero}")
async def validar_numero_resolucion(
    numero: str,
    fecha_emision: datetime = Query(..., description="Fecha de emisión para validar unicidad por año")
):
    """Validar si un número de resolución está disponible para un año específico"""
    resolucion_service = MockResolucionService()
    
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
async def obtener_siguiente_numero(anio: int):
    """Obtener el siguiente número de resolución disponible para un año específico"""
    resolucion_service = MockResolucionService()
    
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
    resolucion_data: ResolucionUpdate
) -> ResolucionResponse:
    """Actualizar resolución"""
    # Guard clauses
    if not resolucion_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de resolución inválido")
    
    if not resolucion_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    resolucion_service = MockResolucionService()
    updated_resolucion = await resolucion_service.update_resolucion(resolucion_id, resolucion_data)
    
    if not updated_resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=updated_resolucion.id,
        nro_resolucion=updated_resolucion.nro_resolucion,
        fecha_emision=updated_resolucion.fecha_emision,
        fecha_vigencia_inicio=updated_resolucion.fecha_vigencia_inicio,
        fecha_vigencia_fin=updated_resolucion.fecha_vigencia_fin,
        tipo_resolucion=updated_resolucion.tipo_resolucion,
        resolucion_padre_id=updated_resolucion.resolucion_padre_id,
        tipo_tramite=updated_resolucion.tipo_tramite,
        descripcion=updated_resolucion.descripcion,
        empresa_id=updated_resolucion.empresa_id,
        expediente_id=updated_resolucion.expediente_id,
        vehiculos_habilitados_ids=updated_resolucion.vehiculos_habilitados_ids,
        rutas_autorizadas_ids=updated_resolucion.rutas_autorizadas_ids,
        estado=updated_resolucion.estado,
        observaciones=updated_resolucion.observaciones,
        esta_activo=updated_resolucion.esta_activo,
        fecha_registro=updated_resolucion.fecha_registro,
        usuario_emision_id=updated_resolucion.usuario_emision_id
    )

@router.delete("/{resolucion_id}", status_code=204)
async def delete_resolucion(
    resolucion_id: str
):
    """Desactivar resolución (borrado lógico)"""
    # Guard clause
    if not resolucion_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de resolución inválido")
    
    resolucion_service = MockResolucionService()
    success = await resolucion_service.soft_delete_resolucion(resolucion_id)
    
    if not success:
        raise ResolucionNotFoundException(resolucion_id)

# Endpoints para gestión de estados
@router.put("/{resolucion_id}/renovar", response_model=ResolucionResponse)
async def renovar_resolucion(
    resolucion_id: str,
    nueva_fecha_vigencia_fin: datetime
) -> ResolucionResponse:
    """Renovar resolución con nueva fecha de vigencia fin"""
    resolucion_service = MockResolucionService()
    resolucion = await resolucion_service.renovar_resolucion(resolucion_id, nueva_fecha_vigencia_fin)
    
    if not resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=resolucion.id,
        nro_resolucion=resolucion.nro_resolucion,
        fecha_emision=resolucion.fecha_emision,
        fecha_vigencia_inicio=resolucion.fecha_vigencia_inicio,
        fecha_vigencia_fin=resolucion.fecha_vigencia_fin,
        tipo_resolucion=resolucion.tipo_resolucion,
        resolucion_padre_id=resolucion.resolucion_padre_id,
        tipo_tramite=resolucion.tipo_tramite,
        descripcion=resolucion.descripcion,
        empresa_id=resolucion.empresa_id,
        expediente_id=resolucion.expediente_id,
        vehiculos_habilitados_ids=resolucion.vehiculos_habilitados_ids,
        rutas_autorizadas_ids=resolucion.rutas_autorizadas_ids,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        esta_activo=resolucion.esta_activo,
        fecha_registro=resolucion.fecha_registro,
        usuario_emision_id=resolucion.usuario_emision_id
    )

@router.put("/{resolucion_id}/suspender", response_model=ResolucionResponse)
async def suspender_resolucion(
    resolucion_id: str,
    motivo: str
) -> ResolucionResponse:
    """Suspender resolución"""
    resolucion_service = MockResolucionService()
    resolucion = await resolucion_service.suspender_resolucion(resolucion_id, motivo)
    
    if not resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=resolucion.id,
        nro_resolucion=resolucion.nro_resolucion,
        fecha_emision=resolucion.fecha_emision,
        fecha_vigencia_inicio=resolucion.fecha_vigencia_inicio,
        fecha_vigencia_fin=resolucion.fecha_vigencia_fin,
        tipo_resolucion=resolucion.tipo_resolucion,
        resolucion_padre_id=resolucion.resolucion_padre_id,
        tipo_tramite=resolucion.tipo_tramite,
        descripcion=resolucion.descripcion,
        empresa_id=resolucion.empresa_id,
        expediente_id=resolucion.expediente_id,
        vehiculos_habilitados_ids=resolucion.vehiculos_habilitados_ids,
        rutas_autorizadas_ids=resolucion.rutas_autorizadas_ids,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        esta_activo=resolucion.esta_activo,
        fecha_registro=resolucion.fecha_registro,
        usuario_emision_id=resolucion.usuario_emision_id
    )

@router.put("/{resolucion_id}/activar", response_model=ResolucionResponse)
async def activar_resolucion(
    resolucion_id: str
) -> ResolucionResponse:
    """Activar resolución suspendida"""
    resolucion_service = MockResolucionService()
    resolucion = await resolucion_service.activar_resolucion(resolucion_id)
    
    if not resolucion:
        raise ResolucionNotFoundException(resolucion_id)
    
    return ResolucionResponse(
        id=resolucion.id,
        nro_resolucion=resolucion.nro_resolucion,
        fecha_emision=resolucion.fecha_emision,
        fecha_vigencia_inicio=resolucion.fecha_vigencia_inicio,
        fecha_vigencia_fin=resolucion.fecha_vigencia_fin,
        tipo_resolucion=resolucion.tipo_resolucion,
        resolucion_padre_id=resolucion.resolucion_padre_id,
        tipo_tramite=resolucion.tipo_tramite,
        descripcion=resolucion.descripcion,
        empresa_id=resolucion.empresa_id,
        expediente_id=resolucion.expediente_id,
        vehiculos_habilitados_ids=resolucion.vehiculos_habilitados_ids,
        rutas_autorizadas_ids=resolucion.rutas_autorizadas_ids,
        estado=resolucion.estado,
        observaciones=resolucion.observaciones,
        esta_activo=resolucion.esta_activo,
        fecha_registro=resolucion.fecha_registro,
        usuario_emision_id=resolucion.usuario_emision_id
    )

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_resoluciones(
    formato: str,
    estado: Optional[str] = Query(None)
):
    """Exportar resoluciones en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    resolucion_service = MockResolucionService()
    
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
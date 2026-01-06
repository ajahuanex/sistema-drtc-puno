from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from io import BytesIO
from app.dependencies.auth import get_current_active_user
from app.dependencies.db import get_database
from app.services.empresa_service import EmpresaService
from app.services.empresa_excel_service import EmpresaExcelService
from app.repositories.empresa_repository import EmpresaRepository
from app.models.empresa import EmpresaCreate, EmpresaUpdate, EmpresaInDB, EmpresaResponse, EmpresaEstadisticas, EmpresaCambioEstado, CambioEstadoEmpresa, EmpresaCambioRepresentante, CambioRepresentanteLegal
from app.utils.exceptions import (
    EmpresaNotFoundException, 
    EmpresaAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/empresas", tags=["empresas"])

async def get_empresa_service():
    """Dependency para obtener el servicio de empresas"""
    db = await get_database()
    return EmpresaService(db)

def create_empresa_response(empresa: EmpresaInDB) -> EmpresaResponse:
    """Función helper para crear respuestas completas de EmpresaResponse"""
    return EmpresaResponse(
        id=empresa.id,
        ruc=empresa.ruc,
        razonSocial=empresa.razonSocial,
        direccionFiscal=empresa.direccionFiscal,
        estado=empresa.estado,
        tiposServicio=empresa.tiposServicio,
        estaActivo=empresa.estaActivo,
        fechaRegistro=empresa.fechaRegistro,
        fechaActualizacion=empresa.fechaActualizacion,
        representanteLegal=empresa.representanteLegal,
        emailContacto=empresa.emailContacto,
        telefonoContacto=empresa.telefonoContacto,
        sitioWeb=empresa.sitioWeb,
        documentos=empresa.documentos,
        auditoria=empresa.auditoria,
        historialEventos=empresa.historialEventos,
        historialEstados=empresa.historialEstados,
        historialRepresentantes=empresa.historialRepresentantes,
        resolucionesPrimigeniasIds=empresa.resolucionesPrimigeniasIds,
        vehiculosHabilitadosIds=empresa.vehiculosHabilitadosIds,
        conductoresHabilitadosIds=empresa.conductoresHabilitadosIds,
        rutasAutorizadasIds=empresa.rutasAutorizadasIds,
        datosSunat=empresa.datosSunat,
        ultimaValidacionSunat=empresa.ultimaValidacionSunat,
        scoreRiesgo=empresa.scoreRiesgo,
        observaciones=empresa.observaciones
    )

@router.post("/", response_model=EmpresaResponse, status_code=201)
async def create_empresa(
    empresa_data: EmpresaCreate,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Crear nueva empresa"""
    # Guard clauses al inicio
    if not empresa_data.ruc.strip():
        raise ValidationErrorException("RUC", "El RUC no puede estar vacío")
    
    try:
        # TODO: Get usuario_id from authenticated user
        usuario_id = "USR001"  # Usuario de prueba por ahora
        empresa = await empresa_service.create_empresa(empresa_data, usuario_id)
        return create_empresa_response(empresa)
    except ValueError as e:
        if "RUC" in str(e):
            raise EmpresaAlreadyExistsException(empresa_data.ruc)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/{empresa_id}/cambiar-representante", response_model=EmpresaResponse)
async def cambiar_representante_legal(
    empresa_id: str,
    cambio_representante: EmpresaCambioRepresentante,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Cambiar representante legal con validación de documento sustentatorio según tipo de cambio"""
    try:
        # Validar documento sustentatorio según tipo de cambio
        cambio_representante.validate_documento_sustentatorio()
        
        # TODO: Get usuario_id from authenticated user
        usuario_id = "USR001"  # Usuario de prueba por ahora
        
        empresa = await empresa_service.cambiar_representante_legal(
            empresa_id,
            cambio_representante.tipoCambio,
            cambio_representante.representanteNuevo,
            cambio_representante.motivo,
            usuario_id,
            cambio_representante.documentoSustentatorio,
            cambio_representante.tipoDocumentoSustentatorio,
            cambio_representante.urlDocumentoSustentatorio,
            cambio_representante.observaciones
        )
        return create_empresa_response(empresa)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{empresa_id}/historial-representantes")
async def get_historial_representantes_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Obtener historial de cambios de representante legal de una empresa"""
    try:
        empresa = await empresa_service.get_empresa_by_id(empresa_id)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        return {
            "empresaId": empresa_id,
            "representanteActual": empresa.representanteLegal,
            "historialRepresentantes": empresa.historialRepresentantes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{empresa_id}/cambiar-estado", response_model=EmpresaResponse)
async def cambiar_estado_empresa(
    empresa_id: str,
    cambio_estado: EmpresaCambioEstado,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Cambiar estado de empresa con motivo y documento sustentatorio"""
    try:
        # TODO: Get usuario_id from authenticated user
        usuario_id = "USR001"  # Usuario de prueba por ahora
        
        empresa = await empresa_service.cambiar_estado_empresa(
            empresa_id, 
            cambio_estado.estadoNuevo,
            cambio_estado.motivo,
            usuario_id,
            cambio_estado.documentoSustentatorio,
            cambio_estado.tipoDocumentoSustentatorio,
            cambio_estado.urlDocumentoSustentatorio,
            cambio_estado.observaciones
        )
        return create_empresa_response(empresa)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{empresa_id}/historial-completo")
async def get_historial_completo_empresa(
    empresa_id: str,
    tipo_evento: Optional[str] = Query(None, description="Filtrar por tipo de evento"),
    limit: int = Query(100, ge=1, le=500, description="Límite de eventos"),
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Obtener historial completo unificado de una empresa"""
    try:
        from app.models.empresa import TipoEventoEmpresa
        
        tipo_evento_enum = None
        if tipo_evento:
            try:
                tipo_evento_enum = TipoEventoEmpresa(tipo_evento)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Tipo de evento inválido: {tipo_evento}")
        
        eventos = await empresa_service.historial_service.obtener_historial_empresa(
            empresa_id=empresa_id,
            tipo_evento=tipo_evento_enum,
            limit=limit
        )
        
        estadisticas = await empresa_service.historial_service.obtener_estadisticas_historial(empresa_id)
        
        return {
            "empresaId": empresa_id,
            "eventos": [evento.dict() for evento in eventos],
            "estadisticas": estadisticas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{empresa_id}/operacion-vehicular")
async def registrar_operacion_vehicular(
    empresa_id: str,
    operacion: dict,  # Usar dict genérico por ahora
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Registrar operación vehicular (renovación, incremento, sustitución, etc.)"""
    try:
        from app.models.empresa import TipoEventoEmpresa, TipoDocumento
        
        # TODO: Get usuario_id from authenticated user
        usuario_id = "USR001"
        
        tipo_operacion = TipoEventoEmpresa(operacion["tipoOperacion"])
        tipo_documento = TipoDocumento(operacion["tipoDocumentoSustentatorio"])
        
        resultado = await empresa_service.historial_service.registrar_operacion_vehicular(
            empresa_id=empresa_id,
            usuario_id=usuario_id,
            tipo_operacion=tipo_operacion,
            vehiculo_id=operacion.get("vehiculoId"),
            vehiculos_ids=operacion.get("vehiculosIds"),
            motivo=operacion["motivo"],
            documento_sustentatorio=operacion["documentoSustentatorio"],
            tipo_documento=tipo_documento,
            url_documento=operacion.get("urlDocumentoSustentatorio"),
            observaciones=operacion.get("observaciones"),
            datos_adicionales=operacion.get("datosAdicionales")
        )
        
        return {"success": resultado, "message": "Operación vehicular registrada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{empresa_id}/operacion-rutas")
async def registrar_operacion_rutas(
    empresa_id: str,
    operacion: dict,  # Usar dict genérico por ahora
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Registrar operación de rutas"""
    try:
        from app.models.empresa import TipoEventoEmpresa, TipoDocumento
        
        # TODO: Get usuario_id from authenticated user
        usuario_id = "USR001"
        
        tipo_operacion = TipoEventoEmpresa(operacion["tipoOperacion"])
        tipo_documento = TipoDocumento(operacion["tipoDocumentoSustentatorio"]) if operacion.get("tipoDocumentoSustentatorio") else None
        
        resultado = await empresa_service.historial_service.registrar_operacion_rutas(
            empresa_id=empresa_id,
            usuario_id=usuario_id,
            tipo_operacion=tipo_operacion,
            ruta_id=operacion.get("rutaId"),
            rutas_ids=operacion.get("rutasIds"),
            motivo=operacion["motivo"],
            documento_sustentatorio=operacion.get("documentoSustentatorio"),
            tipo_documento=tipo_documento,
            url_documento=operacion.get("urlDocumentoSustentatorio"),
            observaciones=operacion.get("observaciones"),
            datos_adicionales=operacion.get("datosAdicionales")
        )
        
        return {"success": resultado, "message": "Operación de rutas registrada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{empresa_id}/historial-estados")
async def get_historial_estados_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Obtener historial de cambios de estado de una empresa"""
    try:
        empresa = await empresa_service.get_empresa_by_id(empresa_id)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        return {
            "empresaId": empresa_id,
            "estadoActual": empresa.estado,
            "historialEstados": empresa.historialEstados
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[EmpresaResponse])
async def get_empresas(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> List[EmpresaResponse]:
    """Obtener lista de empresas con filtros opcionales"""
    
    if estado:
        empresas = await empresa_service.get_empresas_por_estado(estado, skip, limit)
    else:
        empresas = await empresa_service.get_empresas_activas(skip, limit)
    
    return [
        create_empresa_response(empresa)
        for empresa in empresas
    ]

@router.get("/filtros", response_model=List[EmpresaResponse])
async def get_empresas_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    ruc: Optional[str] = Query(None),
    razon_social: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> List[EmpresaResponse]:
    """Obtener empresas con filtros avanzados"""
    
    # Crear objeto EmpresaFiltros
    from app.models.empresa import EmpresaFiltros
    from datetime import datetime
    
    # Convertir fechas si se proporcionan
    fecha_desde_dt = None
    fecha_hasta_dt = None
    
    if fecha_desde:
        try:
            fecha_desde_dt = datetime.fromisoformat(fecha_desde.replace('Z', '+00:00'))
        except:
            pass
    
    if fecha_hasta:
        try:
            fecha_hasta_dt = datetime.fromisoformat(fecha_hasta.replace('Z', '+00:00'))
        except:
            pass
    
    # Crear filtros
    filtros = EmpresaFiltros(
        ruc=ruc,
        razonSocial=razon_social,
        estado=estado,
        fechaDesde=fecha_desde_dt,
        fechaHasta=fecha_hasta_dt
    )
    
    empresas = await empresa_service.get_empresas_con_filtros(filtros)
    empresas = empresas[skip:skip + limit]
    
    return [
        create_empresa_response(empresa)
        for empresa in empresas
    ]

@router.get("/estadisticas", response_model=EmpresaEstadisticas)
async def get_estadisticas(
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaEstadisticas:
    """Obtener estadísticas de empresas"""
    return await empresa_service.get_estadisticas()

@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def get_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Obtener empresa por ID"""
    # Guard clause
    # if not empresa_id.isdigit():
    #    raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    empresa = await empresa_service.get_empresa_by_id(empresa_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.get("/ruc/{ruc}", response_model=EmpresaResponse)
async def get_empresa_by_ruc(
    ruc: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Obtener empresa por RUC"""
    empresa = await empresa_service.get_empresa_by_ruc(ruc)
    
    if not empresa:
        raise EmpresaNotFoundException(f"RUC {ruc}")
    
    return create_empresa_response(empresa)

@router.get("/validar-ruc/{ruc}")
async def validar_ruc(ruc: str, empresa_service: EmpresaService = Depends(get_empresa_service)):
    """Validar si un RUC ya existe"""
    empresa_existente = await empresa_service.get_empresa_by_ruc(ruc)
    
    return {
        "valido": not empresa_existente,
        "empresa": empresa_existente
    }


@router.put("/{empresa_id}", response_model=EmpresaResponse)
async def update_empresa(
    empresa_id: str,
    empresa_data: EmpresaUpdate,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Actualizar empresa"""
    # Guard clauses
    # if not empresa_id.isdigit():
    #    raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    if not empresa_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    # TODO: Get usuario_id from authenticated user
    usuario_id = "USR001"
    updated_empresa = await empresa_service.update_empresa(empresa_id, empresa_data, usuario_id)
    
    if not updated_empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(updated_empresa)

@router.delete("/{empresa_id}", status_code=204)
async def delete_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Desactivar empresa (borrado lógico)"""
    # Guard clause
    # if not empresa_id.isdigit():
    #    raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    # TODO: Get usuario_id from authenticated user
    usuario_id = "USR001"
    success = await empresa_service.soft_delete_empresa(empresa_id, usuario_id)
    
    if not success:
        raise EmpresaNotFoundException(empresa_id)

# Endpoints para gestión de vehículos
@router.post("/{empresa_id}/vehiculos/{vehiculo_id}", response_model=EmpresaResponse)
async def agregar_vehiculo_a_empresa(
    empresa_id: str,
    vehiculo_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Agregar vehículo a empresa"""
    empresa = await empresa_service.agregar_vehiculo_a_empresa(empresa_id, vehiculo_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/vehiculos/{vehiculo_id}", response_model=EmpresaResponse)
async def remover_vehiculo_de_empresa(
    empresa_id: str,
    vehiculo_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Remover vehículo de empresa"""
    empresa = await empresa_service.remover_vehiculo_de_empresa(empresa_id, vehiculo_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

# Endpoints para gestión de conductores
@router.post("/{empresa_id}/conductores/{conductor_id}", response_model=EmpresaResponse)
async def agregar_conductor_a_empresa(
    empresa_id: str,
    conductor_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Agregar conductor a empresa"""
    empresa = await empresa_service.agregar_conductor_a_empresa(empresa_id, conductor_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/conductores/{conductor_id}", response_model=EmpresaResponse)
async def remover_conductor_de_empresa(
    empresa_id: str,
    conductor_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Remover conductor de empresa"""
    empresa = await empresa_service.remover_conductor_de_empresa(empresa_id, conductor_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

# Endpoints para gestión de rutas
@router.post("/{empresa_id}/rutas/{ruta_id}", response_model=EmpresaResponse)
async def agregar_ruta_a_empresa(
    empresa_id: str,
    ruta_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Agregar ruta a empresa"""
    empresa = await empresa_service.agregar_ruta_a_empresa(empresa_id, ruta_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/rutas/{ruta_id}", response_model=EmpresaResponse)
async def remover_ruta_de_empresa(
    empresa_id: str,
    ruta_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Remover ruta de empresa"""
    empresa = await empresa_service.remover_ruta_de_empresa(empresa_id, ruta_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

# Endpoints para gestión de resoluciones
@router.post("/{empresa_id}/resoluciones/{resolucion_id}", response_model=EmpresaResponse)
async def agregar_resolucion_a_empresa(
    empresa_id: str,
    resolucion_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Agregar resolución a empresa"""
    empresa = await empresa_service.agregar_resolucion_a_empresa(empresa_id, resolucion_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/resoluciones/{resolucion_id}", response_model=EmpresaResponse)
async def remover_resolucion_de_empresa(
    empresa_id: str,
    resolucion_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """Remover resolución de empresa"""
    empresa = await empresa_service.remover_resolucion_de_empresa(empresa_id, resolucion_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.get("/{empresa_id}/resoluciones")
async def get_resoluciones_empresa(
    empresa_id: str,
    incluir_hijas: bool = Query(True, description="Incluir resoluciones hijas en la respuesta"),
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Obtener resoluciones de una empresa con estructura jerárquica simplificada"""
    from app.services.resolucion_service import ResolucionService
    
    try:
        # Verificar que la empresa existe
        empresa = await empresa_service.get_empresa_by_id(empresa_id)
        if not empresa:
            raise EmpresaNotFoundException(empresa_id)
        
        # Obtener resoluciones usando el servicio de resoluciones
        db = await get_database()
        resolucion_service = ResolucionService(db)
        todas_resoluciones = await resolucion_service.get_resoluciones_por_empresa(empresa_id)
        
        # Separar resoluciones padre e hijas
        resoluciones_padre = []
        resoluciones_hijas = []
        
        for resolucion in todas_resoluciones:
            if resolucion.tipoResolucion == "PADRE":
                resoluciones_padre.append(resolucion)
            else:
                resoluciones_hijas.append(resolucion)
        
        # Construir estructura jerárquica simplificada
        resoluciones_estructuradas = []
        
        for padre in resoluciones_padre:
            # Buscar hijas de esta resolución padre
            hijas_de_este_padre = []
            if incluir_hijas:
                hijas_de_este_padre = [
                    {
                        "id": hija.id,
                        "nroResolucion": hija.nroResolucion,
                        "tipoTramite": hija.tipoTramite,
                        "tipoResolucion": hija.tipoResolucion,
                        "fechaEmision": hija.fechaEmision.isoformat() if hija.fechaEmision else None,
                        "estado": hija.estado,
                        "descripcion": hija.descripcion or f"Resolución {hija.tipoTramite.lower()}"
                    }
                    for hija in resoluciones_hijas 
                    if hija.resolucionPadreId == padre.id
                ]
            
            # Agregar resolución padre con sus hijas
            resoluciones_estructuradas.append({
                "id": padre.id,
                "nroResolucion": padre.nroResolucion,
                "tipoTramite": padre.tipoTramite,
                "tipoResolucion": padre.tipoResolucion,
                "fechaEmision": padre.fechaEmision.isoformat() if padre.fechaEmision else None,
                "estado": padre.estado,
                "descripcion": padre.descripcion or f"Resolución {padre.tipoTramite.lower()}",
                "totalHijas": len(hijas_de_este_padre),
                "hijas": hijas_de_este_padre if incluir_hijas else []
            })
        
        return {
            "empresa_id": empresa_id,
            "resoluciones": resoluciones_estructuradas,
            "total_padre": len(resoluciones_padre),
            "total_hijas": len(resoluciones_hijas),
            "total": len(todas_resoluciones),
            "incluir_hijas": incluir_hijas
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener resoluciones: {str(e)}"
        )

@router.get("/{empresa_id}/rutas")
async def get_rutas_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Obtener rutas de una empresa"""
    from app.services.ruta_service import RutaService
    
    # Verificar que la empresa existe
    empresa = await empresa_service.get_empresa_by_id(empresa_id)
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    # Obtener rutas usando el servicio de rutas
    db = await get_database()
    ruta_service = RutaService(db)
    rutas = await ruta_service.get_rutas_por_empresa(empresa_id)
    
    return rutas

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_empresas(
    formato: str,
    estado: Optional[str] = Query(None),
    empresas_seleccionadas: Optional[str] = Query(None, description="IDs de empresas seleccionadas separados por coma"),
    columnas_visibles: Optional[str] = Query(None, description="Columnas visibles separadas por coma"),
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Exportar empresas en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    try:
        # Si hay empresas seleccionadas, exportar solo esas
        if empresas_seleccionadas:
            ids_seleccionados = [id.strip() for id in empresas_seleccionadas.split(',') if id.strip()]
            empresas = []
            for empresa_id in ids_seleccionados:
                empresa = await empresa_service.get_empresa_by_id(empresa_id)
                if empresa:
                    empresas.append(empresa)
        else:
            # Obtener empresas según filtros (sin paginación para exportar todas)
            if estado:
                empresas = await empresa_service.get_empresas_por_estado(estado, 0, 10000)
            else:
                empresas = await empresa_service.get_empresas_activas(0, 10000)
        
        # Procesar columnas visibles
        columnas_a_exportar = None
        if columnas_visibles:
            columnas_a_exportar = [col.strip() for col in columnas_visibles.split(',') if col.strip()]
        
        # Convertir empresas a diccionarios para el servicio Excel
        empresas_dict = []
        for empresa in empresas:
            if hasattr(empresa, 'model_dump'):
                empresas_dict.append(empresa.model_dump())
            elif hasattr(empresa, 'dict'):
                empresas_dict.append(empresa.dict())
            else:
                # Si es un diccionario, usarlo directamente
                empresas_dict.append(empresa)
        
        # Crear servicio Excel
        excel_service = EmpresaExcelService()
        
        if formato == 'excel':
            # Generar Excel con datos reales
            excel_buffer = excel_service.generar_excel_empresas(empresas_dict, columnas_a_exportar)
            
            return StreamingResponse(
                BytesIO(excel_buffer.read()),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": "attachment; filename=empresas_export.xlsx"}
            )
        elif formato == 'csv':
            # Generar CSV
            csv_content = excel_service.generar_csv_empresas(empresas_dict, columnas_a_exportar)
            return StreamingResponse(
                BytesIO(csv_content.encode('utf-8')),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=empresas_export.csv"}
            )
        else:
            # PDF no implementado aún
            return {"message": f"Exportando {len(empresas)} empresas a PDF (no implementado)"}
            
    except Exception as e:
        import traceback
        print(f"Error en exportar_empresas: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error al exportar empresas: {str(e)}") 

# ========================================
# ENDPOINTS DE CARGA MASIVA DESDE EXCEL
# ========================================

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_empresas():
    """Descargar plantilla Excel para carga masiva de empresas"""
    try:
        excel_service = EmpresaExcelService()
        plantilla_buffer = excel_service.generar_plantilla_excel()
        
        return StreamingResponse(
            BytesIO(plantilla_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_empresas.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar plantilla: {str(e)}")

@router.post("/carga-masiva/validar")
async def validar_archivo_empresas(
    archivo: UploadFile = File(..., description="Archivo Excel con empresas")
):
    """Validar archivo Excel de empresas sin procesarlo"""
    
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
        excel_service = EmpresaExcelService()
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
async def procesar_carga_masiva_empresas(
    archivo: UploadFile = File(..., description="Archivo Excel con empresas"),
    solo_validar: bool = Query(False, description="Solo validar sin crear empresas")
):
    """Procesar carga masiva de empresas desde Excel"""
    
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
        excel_service = EmpresaExcelService()
        
        if solo_validar:
            resultado = await excel_service.validar_archivo_excel(archivo_buffer)
            mensaje = f"Validación completada: {resultado['validos']} válidos, {resultado['invalidos']} inválidos"
        else:
            resultado = await excel_service.procesar_carga_masiva(archivo_buffer)
            mensaje = f"Procesamiento completado: {resultado.get('total_creadas', 0)} empresas creadas"
        
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

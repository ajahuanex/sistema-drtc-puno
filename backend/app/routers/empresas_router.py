from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Body, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional, Any, Dict
from bson import ObjectId
from datetime import datetime
from io import BytesIO
import httpx
import asyncio
import logging

import logging
import unicodedata

logger = logging.getLogger(__name__)
from app.dependencies.auth import get_current_active_user
from app.dependencies.db import get_database
from app.services.empresa_service import EmpresaService
from app.services.empresa_excel_service import EmpresaExcelService
from app.repositories.empresa_repository import EmpresaRepository
from app.models.empresa import EmpresaCreate, EmpresaUpdate, EmpresaInDB, EmpresaResponse, EmpresaEstadisticas, EmpresaCambioEstado, CambioEstadoEmpresa, EmpresaCambioRepresentante, CambioRepresentanteLegal, EstadoEmpresa
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

def create_empresa_response(empresa) -> EmpresaResponse:
    """Función helper para crear respuestas completas de EmpresaResponse"""
    # Aceptar tanto objetos como diccionarios
    if isinstance(empresa, dict):
        return EmpresaResponse(
            id=empresa.get('id'),
            ruc=empresa.get('ruc'),
            razonSocial=empresa.get('razonSocial'),
            direccionFiscal=empresa.get('direccionFiscal'),
            estado=empresa.get('estado'),
            tiposServicio=empresa.get('tiposServicio'),
            estaActivo=empresa.get('estaActivo'),
            fechaRegistro=empresa.get('fechaRegistro'),
            fechaActualizacion=empresa.get('fechaActualizacion'),
            representanteLegal=empresa.get('representanteLegal'),
            emailContacto=empresa.get('emailContacto'),
            telefonoContacto=empresa.get('telefonoContacto'),
            sitioWeb=empresa.get('sitioWeb'),
            documentos=empresa.get('documentos', []),
            auditoria=empresa.get('auditoria', []),
            historialEventos=empresa.get('historialEventos', []),
            historialEstados=empresa.get('historialEstados', []),
            historialRepresentantes=empresa.get('historialRepresentantes', []),
            resolucionesPrimigeniasIds=empresa.get('resolucionesPrimigeniasIds', []),
            vehiculosHabilitadosIds=empresa.get('vehiculosHabilitadosIds', []),
            conductoresHabilitadosIds=empresa.get('conductoresHabilitadosIds', []),
            rutasAutorizadasIds=empresa.get('rutasAutorizadasIds', []),
            datosSunat=empresa.get('datosSunat'),
            ultimaValidacionSunat=empresa.get('ultimaValidacionSunat'),
            scoreRiesgo=empresa.get('scoreRiesgo'),
            observaciones=empresa.get('observaciones'),
            socios=empresa.get('socios', [])
        )
    else:
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
            representanteLegal=getattr(empresa, 'representanteLegal', None),
            emailContacto=empresa.emailContacto,
            telefonoContacto=empresa.telefonoContacto,
            sitioWeb=empresa.sitioWeb,
            documentos=getattr(empresa, 'documentos', []),
            auditoria=getattr(empresa, 'auditoria', []),
            historialEventos=getattr(empresa, 'historialEventos', []),
            historialEstados=getattr(empresa, 'historialEstados', []),
            historialRepresentantes=getattr(empresa, 'historialRepresentantes', []),
            resolucionesPrimigeniasIds=getattr(empresa, 'resolucionesPrimigeniasIds', []),
            vehiculosHabilitadosIds=getattr(empresa, 'vehiculosHabilitadosIds', []),
            conductoresHabilitadosIds=getattr(empresa, 'conductoresHabilitadosIds', []),
            rutasAutorizadasIds=getattr(empresa, 'rutasAutorizadasIds', []),
            datosSunat=getattr(empresa, 'datosSunat', None),
            ultimaValidacionSunat=getattr(empresa, 'ultimaValidacionSunat', None),
            scoreRiesgo=getattr(empresa, 'scoreRiesgo', None),
            observaciones=empresa.observaciones,
            socios=getattr(empresa, 'socios', [])
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
            cambio_estado.numeroDocumentoSustentatorio,
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
    limit: int = Query(10000, ge=1, le=10000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> List[EmpresaResponse]:
    """Obtener lista de empresas con filtros opcionales"""
    
    try:
        # Obtener documentos crudos de MongoDB
        if estado:
            query = {"estado": estado, "estaActivo": True}
        else:
            query = {"estaActivo": True}
        
        cursor = empresa_service.collection.find(query).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        
        # Convertir documentos a respuestas
        respuestas = []
        for doc in docs:
            # Convertir _id a id
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
            respuestas.append(create_empresa_response(doc))
        
        return respuestas
    except Exception as e:
        print(f"Error en get_empresas: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener empresas: {str(e)}")

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

@router.get("/{empresa_id}/expediente-operativo")
async def get_expediente_operativo_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """
    Obtiene el expediente operativo integral y estadísticas de la empresa:
    - KPIs (Total Primigenias, Rutas, Flota Habilitada, Modificatorias)
    - Desglose por Resolución Primigenia con sus rutas, vehículos habilitados y resoluciones modificatorias (hijas)
    """
    from datetime import datetime
    db = await get_database()
    
    empresa = await empresa_service.get_empresa_by_id(empresa_id)
    if not empresa:
        empresa = await empresa_service.get_empresa_by_ruc(empresa_id)
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
        
    emp_id_str = str(empresa.get("id") or empresa.get("_id")) if isinstance(empresa, dict) else str(getattr(empresa, "id", getattr(empresa, "_id", "")))
    ruc = empresa.get("ruc") if isinstance(empresa, dict) else getattr(empresa, "ruc", "")
    tipos_srv = empresa.get("tiposServicio", []) if isinstance(empresa, dict) else getattr(empresa, "tiposServicio", [])
    servicio_defecto = tipos_srv[0] if tipos_srv else "PASAJEROS"
    
    # 1. Consultar colecciones
    primigenias_docs = await db["resoluciones_primigenias"].find({"ruc_empresa": ruc, "esta_activo": True}).to_list(1000)
    hijas_docs = await db["resoluciones_hijas"].find({"ruc_empresa": ruc, "esta_activo": True}).to_list(2000)
    flota_docs = await db["flota_empresa"].find({"ruc": ruc, "esta_activo": True}).to_list(2000)
    rutas_docs = await db["rutas"].find({
        "$or": [
            {"empresa.ruc": ruc},
            {"empresa.id": emp_id_str},
            {"empresaId": emp_id_str}
        ]
    }).to_list(2000)
    
    # 2. Mapear resoluciones primigenias registradas
    primigenias_map = {}
    now_dt = datetime.utcnow()
    for p in primigenias_docs:
        nro = str(p.get("nro_resolucion", "")).strip().upper()
        
        # Determinar estado efectivo
        estado_calc = p.get("estado", "VIGENTE")
        obs_upper = str(p.get("observaciones", "") or "").upper()
        f_fin_raw = p.get("fecha_fin_vigencia")
        
        if estado_calc not in ["CANCELADA", "SUSPENDIDA", "ANULADA"]:
            if "CANCELAD" in obs_upper:
                estado_calc = "CANCELADA"
            elif "RENOVAD" in obs_upper:
                estado_calc = "VENCIDA"
            elif f_fin_raw and isinstance(f_fin_raw, datetime) and f_fin_raw < now_dt:
                estado_calc = "VENCIDA"

        p_dict = {
            "id": str(p.get("_id")),
            "nro_resolucion": p.get("nro_resolucion"),
            "siglas": p.get("siglas"),
            "estado": estado_calc,
            "tipo_autorizacion": p.get("tipo_autorizacion", "PASAJEROS"),
            "anios_vigencia": p.get("anios_vigencia", 10),
            "fecha_resolucion": p.get("fecha_resolucion").isoformat() if isinstance(p.get("fecha_resolucion"), datetime) else p.get("fecha_resolucion"),
            "fecha_inicio_vigencia": p.get("fecha_inicio_vigencia").isoformat() if isinstance(p.get("fecha_inicio_vigencia"), datetime) else p.get("fecha_inicio_vigencia"),
            "fecha_fin_vigencia": p.get("fecha_fin_vigencia").isoformat() if isinstance(p.get("fecha_fin_vigencia"), datetime) else p.get("fecha_fin_vigencia"),
            "link_documento": p.get("link_documento"),
            "observaciones": p.get("observaciones"),
            "es_detectada": False,
            "rutas": [],
            "flota": [],
            "modificatorias": []
        }
        primigenias_map[nro] = p_dict

    # 3. Asociar rutas o detectar resoluciones desde rutas
    for r in rutas_docs:
        res_info = r.get("resolucion") or {}
        nro_res = str(res_info.get("nroResolucion", "")).strip().upper()
        if not nro_res:
            nro_res = "SIN_RESOLUCION"
            
        if nro_res not in primigenias_map:
            primigenias_map[nro_res] = {
                "id": str(res_info.get("id")) if res_info.get("id") else None,
                "nro_resolucion": res_info.get("nroResolucion") or "Resolución Pendiente",
                "siglas": None,
                "estado": res_info.get("estado", "VIGENTE"),
                "tipo_autorizacion": servicio_defecto,
                "anios_vigencia": 10,
                "fecha_resolucion": None,
                "fecha_inicio_vigencia": None,
                "fecha_fin_vigencia": None,
                "link_documento": None,
                "observaciones": "Resolución identificada a partir de las rutas autorizadas de la empresa",
                "es_detectada": True,
                "rutas": [],
                "flota": [],
                "modificatorias": []
            }
            
        r_item = {
            "id": str(r.get("_id")),
            "codigoRuta": r.get("codigoRuta"),
            "nombreRuta": r.get("nombreRuta"),
            "origen": r.get("origen", {}).get("nombre") if isinstance(r.get("origen"), dict) else r.get("origen"),
            "destino": r.get("destino", {}).get("nombre") if isinstance(r.get("destino"), dict) else r.get("destino"),
            "itinerario": [p.get("nombre") for p in r.get("itinerario", []) if isinstance(p, dict) and p.get("nombre")],
            "estado": r.get("estado", "ACTIVA"),
            "tipoServicio": r.get("tipoServicio", "PASAJEROS")
        }
        primigenias_map[nro_res]["rutas"].append(r_item)

    # 4. Asociar flota vehicular
    flota_activa_total = 0
    for f in flota_docs:
        placa = str(f.get("placa", "")).strip().upper()
        if not placa or placa == "-":
            continue
        estado_veh = str(f.get("estado", "ACTIVO")).upper()
        if estado_veh in ["ACTIVO", "HABILITADO", "VIGENTE"]:
            flota_activa_total += 1
            
        nro_prim = str(f.get("nro_resolucion_primigenia", "")).strip().upper()
        f_item = {
            "id": str(f.get("_id")),
            "placa": placa,
            "estado": estado_veh,
            "categoria": f.get("categoria"),
            "marca": f.get("marca"),
            "modelo": f.get("modelo"),
            "anio_fabricacion": f.get("anio_fabricacion"),
            "nro_tuc": f.get("nro_tuc")
        }
        if nro_prim in primigenias_map:
            primigenias_map[nro_prim]["flota"].append(f_item)
        elif len(primigenias_map) > 0:
            list(primigenias_map.values())[0]["flota"].append(f_item)

    # 5. Asociar modificatorias (resoluciones hijas)
    total_modificatorias = len(hijas_docs)
    for h in hijas_docs:
        nro_prim = str(h.get("nro_resolucion_primigenia", "")).strip().upper()
        h_item = {
            "id": str(h.get("_id")),
            "nro_resolucion": h.get("nro_resolucion"),
            "tipo_acto": h.get("tipo_acto", "OTROS"),
            "tipo_tramite_origen": h.get("tipo_tramite_origen"),
            "fecha_resolucion": h.get("fecha_resolucion").isoformat() if isinstance(h.get("fecha_resolucion"), datetime) else h.get("fecha_resolucion"),
            "vehiculos_ingresantes": h.get("vehiculos_ingresantes", []),
            "vehiculos_salientes": h.get("vehiculos_salientes", []),
            "rutas_modificadas_ids": h.get("rutas_modificadas_ids", []),
            "link_documento": h.get("link_documento"),
            "observaciones": h.get("observaciones")
        }
        if nro_prim in primigenias_map:
            primigenias_map[nro_prim]["modificatorias"].append(h_item)
        elif len(primigenias_map) > 0:
            list(primigenias_map.values())[0]["modificatorias"].append(h_item)

    lista_primigenias = list(primigenias_map.values())
    
    return {
        "kpis": {
            "total_primigenias": len(lista_primigenias),
            "total_rutas": len(rutas_docs),
            "total_vehiculos_habilitados": flota_activa_total,
            "total_modificatorias": total_modificatorias
        },
        "primigenias": lista_primigenias
    }

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


def normalizar_estado_empresa(val: Any) -> str:
    """
    Normaliza variantes de estado legal de empresa a los valores de EstadoEmpresa:
    AUTORIZADA, CANCELADA, SUSPENDIDA, EN_TRAMITE
    """
    if not val:
        return EstadoEmpresa.AUTORIZADA.value
    
    val_str = str(val).strip()
    norm = unicodedata.normalize('NFKD', val_str).encode('ASCII', 'ignore').decode('ASCII').upper().strip()
    
    # Cancelada / Baja / Denegada / Revocada / No Autorizada
    if any(k in norm for k in ['CANCEL', 'BAJA', 'REVOC', 'DENEG', 'ANULAD', 'NO AUTORIZ']):
        return EstadoEmpresa.CANCELADA.value
    # Suspendida
    if 'SUSPEND' in norm:
        return EstadoEmpresa.SUSPENDIDA.value
    # En trámite / Proceso
    if any(k in norm for k in ['TRAMIT', 'PROCESO', 'PENDIENT', 'EVALUA']):
        return EstadoEmpresa.EN_TRAMITE.value
    # Autorizada / Vigente / Habilitada / Activa
    if any(k in norm for k in ['AUTORIZ', 'VIGENT', 'HABILIT', 'ACTIV']):
        return EstadoEmpresa.AUTORIZADA.value
    
    return EstadoEmpresa.AUTORIZADA.value


@router.post("/carga-masiva/google-sheets")
async def procesar_carga_masiva_google_sheets(
    datos: List[dict] = Body(...),
    solo_validar: bool = Query(False, description="Solo validar sin crear empresas"),
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """
    Procesar carga masiva de empresas desde Google Sheets / JSON
    
    Espera una lista de empresas a procesar
    Si la empresa existe por RUC, la actualiza. Si no existe, la crea.
    """
    
    try:
        if not datos or not isinstance(datos, list):
            raise ValueError("No se proporcionaron datos de empresas válidos")
        
        resultado = {
            'total_filas': len(datos),
            'validos': 0,
            'invalidos': 0,
            'exitosas': 0,
            'fallidas': 0,
            'empresas_creadas': [],
            'empresas_actualizadas': [],
            'errores': [],
            'advertencias': [],
            'conteo_estados': {
                'AUTORIZADA': 0,
                'CANCELADA': 0,
                'SUSPENDIDA': 0,
                'EN_TRAMITE': 0,
                'OTROS': 0
            }
        }
        
        # TODO: Get usuario_id from authenticated user
        usuario_id = "USR001"
        
        for idx, empresa_data in enumerate(datos, 1):
            try:
                # Validar datos mínimos
                ruc = str(empresa_data.get('ruc', '')).strip()
                razon_social = str(empresa_data.get('razonSocial', '')).strip()
                direccion = str(empresa_data.get('direccionFiscal', '')).strip() or None
                
                if not ruc:
                    resultado['invalidos'] += 1
                    resultado['errores'].append({
                        'fila': idx,
                        'ruc': 'N/A',
                        'error': 'RUC es requerido'
                    })
                    continue
                
                if not razon_social:
                    resultado['invalidos'] += 1
                    resultado['errores'].append({
                        'fila': idx,
                        'ruc': ruc,
                        'error': 'Razón Social es requerida'
                    })
                    continue
                
                resultado['validos'] += 1
                
                # Normalizar y registrar estado legal
                estado_raw = (
                    empresa_data.get('estado') or 
                    empresa_data.get('estadoLegal') or 
                    empresa_data.get('situacion') or 
                    'AUTORIZADA'
                )
                estado_normalizado = normalizar_estado_empresa(estado_raw)
                
                if estado_normalizado in resultado['conteo_estados']:
                    resultado['conteo_estados'][estado_normalizado] += 1
                else:
                    resultado['conteo_estados']['OTROS'] += 1
                
                if solo_validar:
                    continue
                
                # Preparar datos de socios si existen
                socios = []
                
                # Obtener datos del representante - buscar en múltiples variaciones de nombres
                nombres_rep = (
                    str(empresa_data.get('nombresRepresentante', '')).strip() or
                    str(empresa_data.get('Nombres Representante', '')).strip() or
                    str(empresa_data.get('nombres_representante', '')).strip() or
                    ''
                )
                apellidos_rep = (
                    str(empresa_data.get('apellidosRepresentante', '')).strip() or
                    str(empresa_data.get('Apellidos Representante', '')).strip() or
                    str(empresa_data.get('apellidos_representante', '')).strip() or
                    ''
                )
                dni = (
                    str(empresa_data.get('dniRepresentante', '')).strip() or
                    str(empresa_data.get('DNI Representante', '')).strip() or
                    str(empresa_data.get('dni_representante', '')).strip() or
                    ''
                )
                
                # Si no hay nombres/apellidos separados, intentar obtener del campo representanteLegal
                if not nombres_rep and not apellidos_rep:
                    representante = (
                        str(empresa_data.get('representanteLegal', '')).strip() or
                        str(empresa_data.get('Representante Legal', '')).strip() or
                        str(empresa_data.get('representante_legal', '')).strip() or
                        ''
                    )
                    if representante:
                        # Separar nombres y apellidos
                        nombres_partes = representante.split()
                        apellidos_rep = nombres_partes[-1] if len(nombres_partes) > 0 else ''
                        nombres_rep = ' '.join(nombres_partes[:-1]) if len(nombres_partes) > 1 else ''
                
                # Normalizar DNI a 8 dígitos si existe
                if dni:
                    # Remover caracteres no numéricos
                    dni_numerico = ''.join(filter(str.isdigit, dni))
                    # Rellenar con ceros por delante hasta 8 dígitos
                    dni = dni_numerico.zfill(8)
                
                # Crear socio si hay al menos nombres o DNI
                if (nombres_rep or apellidos_rep or dni):
                    socios.append({
                        'dni': dni if dni else '',
                        'nombres': nombres_rep,
                        'apellidos': apellidos_rep,
                        'tipoSocio': 'REPRESENTANTE_LEGAL'
                    })
                
                # Obtener Razón Social SUNAT y Mínimo (opcionales)
                razon_social_sunat = str(empresa_data.get('razonSocialSunat', '')).strip() or None
                razon_social_minimo = str(empresa_data.get('razonSocialMinimo', '')).strip() or None
                
                # Obtener Partida Registral
                partida_raw = (
                    str(empresa_data.get('partidaRegistral', '')).strip() or
                    str(empresa_data.get('partida', '')).strip() or
                    str(empresa_data.get('partida_registral', '')).strip() or
                    str(empresa_data.get('Partida Registral', '')).strip() or
                    None
                )
                
                # Crear empresa con estado normalizado
                empresa_create = EmpresaCreate(
                    ruc=ruc,
                    razonSocial={
                        'principal': razon_social,
                        'sunat': razon_social_sunat,
                        'minimo': razon_social_minimo
                    },
                    direccionFiscal=direccion,
                    partidaRegistral=partida_raw,
                    estado=estado_normalizado,
                    tiposServicio=empresa_data.get('tiposServicio', ['PERSONAS']),
                    emailContacto=empresa_data.get('emailContacto'),
                    telefonoContacto=empresa_data.get('telefonoContacto'),
                    sitioWeb=empresa_data.get('sitioWeb'),
                    observaciones=empresa_data.get('observaciones'),
                    socios=socios
                )
                
                # Primero, buscar si la empresa ya existe por RUC
                empresa_existente = await empresa_service.get_empresa_by_ruc(ruc)
                
                if empresa_existente:
                    # La empresa existe, actualizar
                    try:
                        empresa_id = empresa_existente.get('id') if isinstance(empresa_existente, dict) else empresa_existente.id
                        
                        # Crear objeto de actualización
                        empresa_update = EmpresaUpdate(
                            razonSocial=empresa_create.razonSocial,
                            direccionFiscal=empresa_create.direccionFiscal,
                            partidaRegistral=partida_raw,
                            estado=estado_normalizado,
                            tiposServicio=empresa_create.tiposServicio,
                            emailContacto=empresa_create.emailContacto,
                            telefonoContacto=empresa_create.telefonoContacto,
                            sitioWeb=empresa_create.sitioWeb,
                            observaciones=empresa_create.observaciones,
                            socios=empresa_create.socios
                        )
                        
                        empresa = await empresa_service.update_empresa(str(empresa_id), empresa_update, usuario_id)
                        resultado['exitosas'] += 1
                        resultado['empresas_actualizadas'].append({
                            'ruc': empresa.ruc,
                            'razonSocial': empresa.razonSocial.get('principal', '') if isinstance(empresa.razonSocial, dict) else str(empresa.razonSocial),
                            'id': str(empresa.id),
                            'estado': empresa.estado
                        })
                    except Exception as e:
                        resultado['fallidas'] += 1
                        resultado['errores'].append({
                            'fila': idx,
                            'ruc': ruc,
                            'error': f'Error al actualizar: {str(e)}'
                        })
                else:
                    # La empresa no existe, crear
                    try:
                        empresa = await empresa_service.create_empresa_carga_masiva(empresa_create, usuario_id)
                        resultado['exitosas'] += 1
                        resultado['empresas_creadas'].append({
                            'ruc': empresa.ruc,
                            'razonSocial': empresa.razonSocial.get('principal', '') if isinstance(empresa.razonSocial, dict) else str(empresa.razonSocial),
                            'id': str(empresa.id),
                            'estado': empresa.estado
                        })
                    except (ValueError, EmpresaAlreadyExistsException) as e:
                        resultado['fallidas'] += 1
                        resultado['errores'].append({
                            'fila': idx,
                            'ruc': ruc,
                            'error': f'Error al crear: {str(e)}'
                        })
                
            except Exception as e:
                resultado['fallidas'] += 1
                resultado['errores'].append({
                    'fila': idx,
                    'ruc': str(empresa_data.get('ruc', 'N/A')),
                    'error': f'Error al procesar: {str(e)}'
                })
        
        return {
            'solo_validacion': solo_validar,
            'resultado': resultado,
            'mensaje': f"Procesamiento completado: {resultado['exitosas']} exitosas, {resultado['fallidas']} fallidas. ({resultado['conteo_estados']['AUTORIZADA']} autorizadas, {resultado['conteo_estados']['CANCELADA']} canceladas)"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar datos de Google Sheets: {str(e)}"
        )

# Endpoint de prueba para insertar datos de ejemplo
@router.post("/seed/crear-datos-prueba")
async def crear_datos_prueba(
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Crear datos de prueba para desarrollo"""
    from app.models.empresa import TipoSocio
    
    empresas_data = [
        {
            "ruc": "20123456789",
            "razonSocial": {
                "principal": "Empresa de Transporte Puno S.A.",
                "sunat": "EMPRESA DE TRANSPORTE PUNO SOCIEDAD ANONIMA",
                "minimo": "ETP S.A."
            },
            "direccionFiscal": "Av. Principal 123, Puno",
            "estado": "AUTORIZADA",
            "tiposServicio": ["PASAJEROS", "TURISMO"],
            "emailContacto": "contacto@etpuno.com",
            "telefonoContacto": "051-123456",
            "sitioWeb": "www.etpuno.com",
            "socios": [
                {
                    "dni": "12345678",
                    "nombres": "Juan",
                    "apellidos": "Pérez García",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "juan@etpuno.com"
                }
            ],
            "observaciones": "Empresa de transporte de pasajeros"
        },
        {
            "ruc": "20234567890",
            "razonSocial": {
                "principal": "Transportes Andinos del Sur E.I.R.L.",
                "sunat": "TRANSPORTES ANDINOS DEL SUR EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA",
                "minimo": "TAS E.I.R.L."
            },
            "direccionFiscal": "Calle Comercio 456, Puno",
            "estado": "AUTORIZADA",
            "tiposServicio": ["MERCANCIAS", "CARGA"],
            "emailContacto": "info@tas.com",
            "telefonoContacto": "051-234567",
            "sitioWeb": "www.tas.com",
            "socios": [
                {
                    "dni": "87654321",
                    "nombres": "María",
                    "apellidos": "López Quispe",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "maria@tas.com"
                }
            ],
            "observaciones": "Empresa de transporte de carga"
        },
        {
            "ruc": "20345678901",
            "razonSocial": {
                "principal": "Turismo Puno Express S.A.C.",
                "sunat": "TURISMO PUNO EXPRESS SOCIEDAD ANONIMA CERRADA",
                "minimo": "TPE S.A.C."
            },
            "direccionFiscal": "Jr. Turismo 789, Puno",
            "estado": "EN_TRAMITE",
            "tiposServicio": ["TURISMO"],
            "emailContacto": "reservas@tpexpress.com",
            "telefonoContacto": "051-345678",
            "sitioWeb": "www.tpexpress.com",
            "socios": [
                {
                    "dni": "11223344",
                    "nombres": "Carlos",
                    "apellidos": "Mamani Condori",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "carlos@tpexpress.com"
                }
            ],
            "observaciones": "Empresa de turismo en trámite de autorización"
        },
        {
            "ruc": "20456789012",
            "razonSocial": {
                "principal": "Transportes Mixtos Puno S.A.",
                "sunat": "TRANSPORTES MIXTOS PUNO SOCIEDAD ANONIMA",
                "minimo": "TMP S.A."
            },
            "direccionFiscal": "Av. Costanera 321, Puno",
            "estado": "AUTORIZADA",
            "tiposServicio": ["PASAJEROS", "MERCANCIAS", "MIXTO"],
            "emailContacto": "admin@tmixtos.com",
            "telefonoContacto": "051-456789",
            "sitioWeb": "www.tmixtos.com",
            "socios": [
                {
                    "dni": "55667788",
                    "nombres": "Pedro",
                    "apellidos": "Flores Huanca",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "pedro@tmixtos.com"
                }
            ],
            "observaciones": "Empresa de transporte mixto"
        },
        {
            "ruc": "20567890123",
            "razonSocial": {
                "principal": "Transportes Trabajadores Puno Ltda.",
                "sunat": "TRANSPORTES TRABAJADORES PUNO LIMITADA",
                "minimo": "TTP Ltda."
            },
            "direccionFiscal": "Calle Obrera 654, Puno",
            "estado": "SUSPENDIDA",
            "tiposServicio": ["TRABAJADORES"],
            "emailContacto": "contacto@ttp.com",
            "telefonoContacto": "051-567890",
            "sitioWeb": "www.ttp.com",
            "socios": [
                {
                    "dni": "99887766",
                    "nombres": "Rosa",
                    "apellidos": "Quispe Mamani",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "rosa@ttp.com"
                }
            ],
            "observaciones": "Empresa suspendida por incumplimiento"
        }
    ]
    
    usuario_id = "SEED_USER"
    exitosas = 0
    errores = 0
    
    for empresa_data in empresas_data:
        try:
            empresa_create = EmpresaCreate(**empresa_data)
            await empresa_service.create_empresa(empresa_create, usuario_id)
            exitosas += 1
        except Exception as e:
            print(f"Error: {str(e)}")
            errores += 1
    
    return {
        "exitosas": exitosas,
        "errores": errores,
        "mensaje": f"{exitosas} empresas creadas, {errores} errores"
    }


# Endpoint de prueba simple
@router.get("/test/ping")
async def ping():
    """Endpoint de prueba"""
    return {"status": "ok", "message": "Backend está funcionando"}

@router.get("/test/empresas-count")
async def empresas_count(
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """Contar empresas en la base de datos"""
    try:
        count = await empresa_service.collection.count_documents({"estaActivo": True})
        # Obtener una empresa para ver su estructura
        sample = await empresa_service.collection.find_one({"estaActivo": True})
        return {
            "count": count,
            "sample": sample,
            "status": "ok"
        }
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "status": "error"
        }

def _build_datos_sunat_payload(sunat_raw: dict, ahora: datetime) -> dict:
    estados_ruc = {
        '00': 'ACTIVO', '10': 'SUSPENSION TEMPORAL', '11': 'BAJA DE OFICIO',
        '12': 'BAJA DEFINITIVA', '20': 'BAJA PROVISIONAL',
        '21': 'BAJA PROV. POR OFICIO', '22': 'SUSPENSION PROVISIONAL'
    }
    ddp_nombre = (sunat_raw.get('ddp_nombre') or '').strip()
    ddp_estado = sunat_raw.get('ddp_estado') or ''
    desc_estado = sunat_raw.get('desc_estado') or estados_ruc.get(ddp_estado, ddp_estado)
    desc_flag22 = sunat_raw.get('desc_flag22') or ('HABIDO' if sunat_raw.get('ddp_flag22') == '00' else 'NO HABIDO')
    
    es_activo = (ddp_estado == '00' or str(desc_estado).upper() == 'ACTIVO')
    es_habido = ('HABIDO' in str(desc_flag22).upper() or sunat_raw.get('ddp_flag22') == '00')

    tip_via = sunat_raw.get('desc_tipvia', '') or ''
    nom_via = sunat_raw.get('ddp_nomvia', '') or ''
    num1 = sunat_raw.get('ddp_numer1', '') or ''
    tip_zon = sunat_raw.get('desc_tipzon', '') or ''
    nom_zon = sunat_raw.get('ddp_nomzon', '') or ''
    dist = sunat_raw.get('desc_dist', '') or ''
    prov = sunat_raw.get('desc_prov', '') or ''
    dep = sunat_raw.get('desc_dep', '') or ''

    partes_dir = [p for p in [f"{tip_via} {nom_via}".strip(), num1, f"{tip_zon} {nom_zon}".strip(), f"{dist} - {prov} - {dep}".strip()] if p and p != '-']
    direccion_completa = ", ".join(partes_dir)

    return {
        "ddp_nombre": ddp_nombre,
        "ddp_estado": ddp_estado,
        "desc_estado": desc_estado,
        "desc_flag22": desc_flag22,
        "esActivo": es_activo,
        "esHabido": es_habido,
        "desc_ciiu": sunat_raw.get('desc_ciiu', '') or '',
        "desc_tpoemp": sunat_raw.get('desc_tpoemp', '') or '',
        "desc_dep": dep,
        "desc_prov": prov,
        "desc_dist": dist,
        "direccionFiscalSunat": direccion_completa,
        "ddp_ubigeo": sunat_raw.get('ddp_ubigeo', '') or '',
        "ddp_ciiu": sunat_raw.get('ddp_ciiu', '') or '',
        "ddp_fecalt": sunat_raw.get('ddp_fecalt', '') or '',
        "ddp_fecact": sunat_raw.get('ddp_fecact', '') or '',
        "fechaConsulta": ahora.isoformat(),
        "raw": sunat_raw,
        "valido": es_activo,
        "razonSocial": ddp_nombre,
        "condicion": desc_flag22
    }


@router.get("/consulta-sunat/{ruc}")
async def consultar_sunat_proxy(
    ruc: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """
    Proxy para consultar la API de SUNAT y persistir automáticamente los datos en MongoDB
    si la empresa ya existe registrada.
    """
    if not ruc or len(ruc) != 11 or not ruc.isdigit():
        raise HTTPException(status_code=400, detail="RUC inválido")
        
    url = f"https://pcm.guillermo.pe/api/v1/consultas/sunat-ruc/datos-principales?transport=rest&rest_format=json&numruc={ruc}"
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Error en la API externa: {response.text}")
                
            res_json = response.json()
            if res_json and isinstance(res_json, dict) and 'data' in res_json:
                sunat_raw = res_json['data']
                ahora = datetime.utcnow()
                datos_sunat = _build_datos_sunat_payload(sunat_raw, ahora)
                
                # Persistir automáticamente en BD si la empresa existe
                empresa_db = await empresa_service.get_empresa_by_ruc(ruc)
                if empresa_db:
                    empresa_dict = empresa_db if isinstance(empresa_db, dict) else empresa_db.model_dump()
                    empresa_id = empresa_dict.get('id')
                    razon_actual = empresa_dict.get('razonSocial', {})
                    if isinstance(razon_actual, dict):
                        razon_actualizada = {**razon_actual, 'sunat': datos_sunat['ddp_nombre']}
                    else:
                        razon_actualizada = {'principal': str(razon_actual), 'sunat': datos_sunat['ddp_nombre']}
                    
                    update_data = EmpresaUpdate(
                        datosSunat=datos_sunat,
                        ultimaValidacionSunat=ahora,
                        razonSocial=razon_actualizada  # type: ignore
                    )
                    await empresa_service.update_empresa(empresa_id, update_data, "SISTEMA")
                    logger.info(f"✅ SUNAT persistido en MongoDB para RUC {ruc} vía consulta proxy")
                    
            return res_json
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error de conexión con la API externa: {str(e)}")


async def _fetch_sunat_data(ruc: str) -> Optional[dict]:
    """Consulta la API de SUNAT y retorna los datos crudos, o None si falla."""
    if not ruc or len(ruc) != 11 or not ruc.isdigit():
        return None
    url = f"https://pcm.guillermo.pe/api/v1/consultas/sunat-ruc/datos-principales?transport=rest&rest_format=json&numruc={ruc}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        logger.warning(f"Error consultando SUNAT para RUC {ruc}: {e}")
    return None


@router.put("/{empresa_id}/actualizar-sunat", response_model=EmpresaResponse)
async def actualizar_sunat_empresa(
    empresa_id: str,
    empresa_service: EmpresaService = Depends(get_empresa_service)
) -> EmpresaResponse:
    """
    Consulta la API de SUNAT para la empresa indicada y guarda los datos
    (nombre, estado, condición, dirección, ciiu, fecha de consulta) en la base de datos MongoDB.
    """
    empresa = await empresa_service.get_empresa_by_id(empresa_id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    ruc = empresa.get('ruc') if isinstance(empresa, dict) else empresa.ruc
    
    data = await _fetch_sunat_data(ruc)
    if not data or 'data' not in data:
        raise HTTPException(status_code=502, detail="No se obtuvo respuesta válida de la API SUNAT")
    
    sunat_raw = data['data']
    ahora = datetime.utcnow()
    datos_sunat = _build_datos_sunat_payload(sunat_raw, ahora)
    
    empresa_actual = empresa if isinstance(empresa, dict) else {
        'razonSocial': empresa.razonSocial.model_dump() if hasattr(empresa.razonSocial, 'model_dump') else empresa.razonSocial
    }
    razon_actual = empresa_actual.get('razonSocial', {})
    if isinstance(razon_actual, dict):
        razon_actualizada = {**razon_actual, 'sunat': datos_sunat['ddp_nombre']}
    else:
        razon_actualizada = {'principal': str(razon_actual), 'sunat': datos_sunat['ddp_nombre']}
    
    update_data = EmpresaUpdate(
        datosSunat=datos_sunat,
        ultimaValidacionSunat=ahora,
        razonSocial=razon_actualizada  # type: ignore
    )
    
    updated = await empresa_service.update_empresa(empresa_id, update_data, "SISTEMA")
    if not updated:
        raise HTTPException(status_code=500, detail="Error al guardar datos SUNAT en MongoDB")
    
    logger.info(f"✅ SUNAT actualizado y persistido para RUC {ruc}: {datos_sunat['desc_estado']}")
    return create_empresa_response(updated)


@router.post("/actualizar-sunat-masivo")
async def actualizar_sunat_masivo(
    background_tasks: BackgroundTasks,
    empresa_service: EmpresaService = Depends(get_empresa_service)
):
    """
    Dispara la actualización masiva de datos SUNAT para TODAS las empresas activas.
    La tarea se ejecuta en background para no bloquear la respuesta HTTP.
    """
    background_tasks.add_task(_tarea_actualizacion_masiva_sunat, empresa_service)
    return {
        "mensaje": "Actualización masiva SUNAT iniciada en background",
        "status": "procesando"
    }


async def _tarea_actualizacion_masiva_sunat(empresa_service: EmpresaService):
    """Tarea en background: actualiza datos SUNAT de todas las empresas activas."""
    logger.info("⌛ Iniciando actualización masiva SUNAT...")
    db_instance = await get_empresa_service.__wrapped__(empresa_service) if hasattr(get_empresa_service, '__wrapped__') else None
    
    # Obtener todas las empresas activas
    try:
        empresas = await empresa_service.get_all_empresas_activas()
    except Exception:
        # Fallback: obtener todas
        empresas = await empresa_service.get_empresas(skip=0, limit=99999)
    
    actualizadas = 0
    errores = 0
    
    for empresa in empresas:
        try:
            empresa_id = empresa.get('id') if isinstance(empresa, dict) else empresa.id
            ruc = empresa.get('ruc') if isinstance(empresa, dict) else empresa.ruc
            
            data = await _fetch_sunat_data(ruc)
            if not data or 'data' not in data:
                errores += 1
                continue
            
            sunat_raw = data['data']
            ahora = datetime.utcnow()
            estados_ruc = {
                '00': 'ACTIVO', '10': 'SUSPENSION TEMPORAL', '11': 'BAJA DE OFICIO',
                '12': 'BAJA DEFINITIVA', '20': 'BAJA PROVISIONAL',
                '21': 'BAJA PROV. POR OFICIO', '22': 'SUSPENSION PROVISIONAL'
            }
            datos_sunat = {
                "ddp_nombre": sunat_raw.get('ddp_nombre', ''),
                "ddp_estado": sunat_raw.get('ddp_estado', ''),
                "desc_estado": estados_ruc.get(sunat_raw.get('ddp_estado', ''), ''),
                "esActivo": sunat_raw.get('ddp_estado') == '00',
                "esHabido": sunat_raw.get('ddp_ubigeo') is not None and sunat_raw.get('ddp_ubigeo') != '',
                "ddp_ciiu": sunat_raw.get('ddp_ciiu', ''),
                "ddp_fecact": sunat_raw.get('ddp_fecact', ''),
                "fechaConsulta": ahora.isoformat()
            }
            
            razon_actual = empresa.get('razonSocial', {}) if isinstance(empresa, dict) else \
                (empresa.razonSocial.model_dump() if hasattr(empresa.razonSocial, 'model_dump') else {})
            razon_actualizada = {**razon_actual, 'sunat': datos_sunat['ddp_nombre']}
            
            update_data = EmpresaUpdate(
                datosSunat=datos_sunat,
                ultimaValidacionSunat=ahora,
                razonSocial=razon_actualizada  # type: ignore
            )
            await empresa_service.update_empresa(empresa_id, update_data, "SCHEDULER")
            actualizadas += 1
            
            # Respetar rate limits de la API
            await asyncio.sleep(0.5)
            
        except Exception as e:
            logger.warning(f"Error actualizando SUNAT para empresa: {e}")
            errores += 1
    
    logger.info(f"✅ Actualización masiva SUNAT completa: {actualizadas} ok, {errores} errores")

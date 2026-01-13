from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from app.dependencies.auth import get_current_user
# from app.dependencies.db import get_database
from app.models.oficina import (
    OficinaCreate, OficinaUpdate, OficinaResponse, 
    OficinaFiltros, OficinaResumen, OficinaEstadisticas
)
from app.models.expediente import ExpedienteResponse
from app.models.usuario import UsuarioInDB
from app.services.oficina_service import OficinaService
from app.utils.exceptions import (
    OficinaNotFoundException, OficinaAlreadyExistsException,
    ValidationErrorException, DatabaseErrorException
)

router = APIRouter(prefix="/oficinas", tags=["oficinas"])

@router.post("/", response_model=OficinaResponse, status_code=status.HTTP_201_CREATED)
async def create_oficina(
    oficina_data: OficinaCreate,
    current_user: UsuarioInDB = Depends(get_current_user),
    # db = Depends(get_database)
):
    """Crear una nueva oficina"""
    try:
        # Verificar permisos (solo ADMIN y SUPERVISOR pueden crear oficinas)
        if current_user.rol not in ["ADMIN", "SUPERVISOR"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para crear oficinas"
            )
        
        # TODO: Implementar OficinaService real
        # oficina_service = OficinaService(db)
        # return await oficina_service.create_oficina(oficina_data)
        
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Funcionalidad no implementada - falta OficinaService real"
        )
        
    except OficinaAlreadyExistsException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValidationErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except DatabaseErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[OficinaResponse])
async def get_oficinas(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    nombre: Optional[str] = Query(None, description="Filtrar por nombre de oficina"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de oficina"),
    responsable_id: Optional[str] = Query(None, alias="responsableId", description="Filtrar por ID del responsable"),
    ubicacion: Optional[str] = Query(None, description="Filtrar por ubicación"),
    estado: Optional[str] = Query(None, description="Filtrar por estado de la oficina"),
    prioridad: Optional[str] = Query(None, description="Filtrar por prioridad"),
    esta_activo: Optional[bool] = Query(None, alias="estaActivo", description="Filtrar por estado activo"),
    # db = Depends(get_database)
):
    """Obtener lista de oficinas con filtros opcionales"""
    try:
        # Construir filtros
        filtros = None
        if any([nombre, tipo, responsable_id, ubicacion, estado, prioridad, esta_activo is not None]):
            filtros = OficinaFiltros(
                nombre=nombre,
                tipo=tipo,
                responsableId=responsable_id,
                ubicacion=ubicacion,
                estado=estado,
                prioridad=prioridad,
                estaActivo=esta_activo
            )
        
        # TODO: Implementar OficinaService real
        # oficina_service = OficinaService(db)
        # return await oficina_service.get_oficinas(skip=skip, limit=limit, filtros=filtros)
        
        return []
        
    except DatabaseErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/resumen", response_model=List[OficinaResumen])
async def get_oficinas_resumen(
    # db = Depends(get_database)
):
    """Obtener resumen de todas las oficinas activas"""
    try:
        # TODO: Implementar OficinaService real
        # oficina_service = OficinaService(db)
        # return await oficina_service.get_oficinas_resumen()
        
        return []
        
    except DatabaseErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Endpoints para Flujo de Expedientes (DEBEN IR ANTES DE /{oficina_id})
@router.get("/flujo")
async def get_flujo_general(
    # db = Depends(get_database)
):
    """Obtener información general del flujo de expedientes"""
    try:
        # Por ahora retornamos datos simulados
        # En el futuro esto se implementaría con un servicio real
        return {
            "totalExpedientes": 2,
            "expedientesEnProceso": 1,
            "expedientesPendientes": 1,
            "expedientesCompletados": 0,
            "oficinasActivas": 3,
            "tiempoPromedioProcesamiento": 5.5,
            "ultimaActualizacion": "2024-01-20T14:30:00Z"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener información general del flujo: {str(e)}"
        )

@router.get("/flujo/estadisticas")
async def get_flujo_estadisticas(
    # db = Depends(get_database)
):
    """Obtener estadísticas del flujo de expedientes"""
    try:
        # Por ahora retornamos datos simulados
        # En el futuro esto se implementaría con un servicio real
        return {
            "totalExpedientes": 2,
            "expedientesEnProceso": 1,
            "expedientesPendientes": 1,
            "expedientesCompletados": 0,
            "oficinasActivas": 3,
            "tiempoPromedioProcesamiento": 5.5,
            "ultimaActualizacion": "2024-01-20T14:30:00Z",
            "estadisticasPorOficina": [
                {
                    "oficina": "OFICINA DE RECEPCIÓN",
                    "expedientesRecibidos": 2,
                    "expedientesEnviados": 1,
                    "tiempoPromedio": 2.0
                },
                {
                    "oficina": "OFICINA DE REVISIÓN TÉCNICA",
                    "expedientesRecibidos": 1,
                    "expedientesEnviados": 1,
                    "tiempoPromedio": 3.0
                },
                {
                    "oficina": "OFICINA LEGAL",
                    "expedientesRecibidos": 1,
                    "expedientesEnviados": 0,
                    "tiempoPromedio": 1.5
                }
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas del flujo: {str(e)}"
        )

@router.get("/flujo/expedientes")
async def get_flujo_expedientes(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    # db = Depends(get_database)
):
    """Obtener lista de flujos de expedientes"""
    try:
        # TODO: Implementar servicio real de expedientes
        # expediente_service = ExpedienteService(db)
        # return await expediente_service.get_flujos_expedientes(skip=skip, limit=limit)
        
        return {
            "expedientes": [],
            "total": 0,
            "skip": skip,
            "limit": limit,
            "mensaje": "Servicio de expedientes no implementado - use datos reales del sistema"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener flujos de expedientes: {str(e)}"
        )

@router.get("/flujo/{expediente_id}")
async def get_flujo_expediente(
    expediente_id: str,
    # db = Depends(get_database)
):
    """Obtener flujo de un expediente específico"""
    try:
        # Por ahora retornamos datos simulados
        # En el futuro esto se implementaría con un servicio real
        if expediente_id == "EXP001":
            return {
                "expedienteId": "EXP001",
                "numeroExpediente": "EXP-2024-001",
                "empresa": "EMPRESA TRANSPORTES ABC S.A.C.",
                "estadoActual": "EN_PROCESO",
                "oficinaActual": "OFICINA LEGAL",
                "fechaCreacion": "2024-01-15T08:00:00Z",
                "ultimaActualizacion": "2024-01-20T14:30:00Z",
                "movimientos": [
                    {
                        "id": "MOV001",
                        "expedienteId": "EXP001",
                        "tipo": "INGRESO",
                        "oficina": "OFICINA DE RECEPCIÓN",
                        "fecha": "2024-01-15T08:00:00Z",
                        "observacion": "Documentos recibidos y validados",
                        "esActual": False,
                        "oficinaDestinoId": "OFICINA DE RECEPCIÓN",
                        "motivo": "RECEPCIÓN INICIAL DE DOCUMENTOS",
                        "observaciones": "Documentos recibidos y validados",
                        "documentosRequeridos": ["SOLICITUD", "DNI REPRESENTANTE", "RUC EMPRESA"],
                        "documentosEntregados": ["SOLICITUD", "DNI REPRESENTANTE", "RUC EMPRESA"]
                    },
                    {
                        "id": "MOV002",
                        "expedienteId": "EXP001",
                        "tipo": "TRANSFERENCIA",
                        "oficina": "OFICINA DE REVISIÓN TÉCNICA",
                        "fecha": "2024-01-16T10:00:00Z",
                        "observacion": "Enviado para revisión técnica",
                        "esActual": False,
                        "oficinaDestinoId": "OFICINA DE REVISIÓN TÉCNICA",
                        "motivo": "REVISIÓN TÉCNICA REQUERIDA",
                        "observaciones": "Enviado para revisión técnica",
                        "documentosRequeridos": ["INFORME TÉCNICO", "ESPECIFICACIONES"],
                        "documentosEntregados": ["INFORME TÉCNICO"]
                    },
                    {
                        "id": "MOV003",
                        "expedienteId": "EXP001",
                        "tipo": "TRANSFERENCIA",
                        "oficina": "OFICINA LEGAL",
                        "fecha": "2024-01-20T14:30:00Z",
                        "observacion": "Enviado para revisión legal",
                        "esActual": True,
                        "oficinaDestinoId": "OFICINA LEGAL",
                        "motivo": "REVISIÓN LEGAL REQUERIDA",
                        "observaciones": "Enviado para revisión legal",
                        "documentosRequeridos": ["CONTRATO", "AVALÚO"],
                        "documentosEntregados": ["CONTRATO"]
                    }
                ]
            }
        elif expediente_id == "EXP002":
            return {
                "expedienteId": "EXP002",
                "numeroExpediente": "EXP-2024-002",
                "empresa": "EMPRESA TRANSPORTES XYZ S.A.C.",
                "estadoActual": "PENDIENTE",
                "oficinaActual": "OFICINA DE RECEPCIÓN",
                "fechaCreacion": "2024-01-18T09:00:00Z",
                "ultimaActualizacion": "2024-01-18T09:00:00Z",
                "movimientos": [
                    {
                        "id": "MOV004",
                        "expedienteId": "EXP002",
                        "tipo": "INGRESO",
                        "oficina": "OFICINA DE RECEPCIÓN",
                        "fecha": "2024-01-18T09:00:00Z",
                        "observacion": "Documentos recibidos, pendiente de validación",
                        "esActual": True,
                        "oficinaDestinoId": "OFICINA DE RECEPCIÓN",
                        "motivo": "RECEPCIÓN INICIAL DE DOCUMENTOS",
                        "observaciones": "Documentos recibidos, pendiente de validación",
                        "documentosRequeridos": ["SOLICITUD", "DNI REPRESENTANTE", "RUC EMPRESA"],
                        "documentosEntregados": ["SOLICITUD", "DNI REPRESENTANTE"]
                    }
                ]
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expediente no encontrado con ID: {expediente_id}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener flujo del expediente: {str(e)}"
        )

@router.get("/tipos/lista")
async def get_tipos_oficina():
    """Obtener lista de tipos de oficina disponibles"""
    return [
        {"value": "RECEPCION", "label": "RECEPCIÓN"},
        {"value": "REVISION_TECNICA", "label": "REVISIÓN TÉCNICA"},
        {"value": "LEGAL", "label": "LEGAL"},
        {"value": "FINANCIERA", "label": "FINANCIERA"},
        {"value": "ADMINISTRATIVA", "label": "ADMINISTRATIVA"}
    ]

@router.get("/estados/lista")
async def get_estados_oficina():
    """Obtener lista de estados de oficina disponibles"""
    return [
        {"value": "ACTIVA", "label": "ACTIVA"},
        {"value": "INACTIVA", "label": "INACTIVA"},
        {"value": "MANTENIMIENTO", "label": "MANTENIMIENTO"},
        {"value": "SUSPENDIDA", "label": "SUSPENDIDA"}
    ]

@router.get("/prioridades/lista")
async def get_prioridades_oficina():
    """Obtener lista de prioridades de oficina disponibles"""
    return [
        {"value": "ALTA", "label": "ALTA"},
        {"value": "MEDIA", "label": "MEDIA"},
        {"value": "BAJA", "label": "BAJA"}
    ]

@router.get("/{oficina_id}", response_model=OficinaResponse)
async def get_oficina(
    oficina_id: str,
    # db = Depends(get_database)
):
    """Obtener una oficina específica por ID"""
    try:
        # TODO: Implementar OficinaService real
        # oficina_service = OficinaService(db)
        # return await oficina_service.get_oficina(oficina_id)
        
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Funcionalidad no implementada - falta OficinaService real"
        )
        
    except OficinaNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except DatabaseErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{oficina_id}", response_model=OficinaResponse)
async def update_oficina(
    oficina_id: str,
    oficina_data: OficinaUpdate,
    current_user: UsuarioInDB = Depends(get_current_user),
    # db = Depends(get_database)
):
    """Actualizar una oficina existente"""
    try:
        # Verificar permisos (solo ADMIN y SUPERVISOR pueden actualizar oficinas)
        if current_user.rol not in ["ADMIN", "SUPERVISOR"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para actualizar oficinas"
            )
        
        # TODO: Implementar OficinaService real
        # oficina_service = OficinaService(db)
        # return await oficina_service.update_oficina(oficina_id, oficina_data)
        
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Funcionalidad no implementada - falta OficinaService real"
        )
        
    except OficinaNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except DatabaseErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{oficina_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_oficina(
    oficina_id: str,
    current_user: UsuarioInDB = Depends(get_current_user),
    # db = Depends(get_database)
):
    """Eliminar una oficina (desactivar)"""
    try:
        # Verificar permisos (solo ADMIN puede eliminar oficinas)
        if current_user.rol != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para eliminar oficinas"
            )
        
        # TODO: Implementar OficinaService real
        # oficina_service = OficinaService(db)
        # success = await oficina_service.delete_oficina(oficina_id)
        
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Funcionalidad no implementada - falta OficinaService real"
        )
        
    except OficinaNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except DatabaseErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{oficina_id}/expedientes", response_model=List[ExpedienteResponse])
async def get_expedientes_por_oficina(
    oficina_id: str,
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    # db = Depends(get_database)
):
    """Obtener expedientes que están en una oficina específica"""
    try:
        # TODO: Implementar OficinaService real
        # oficina_service = OficinaService(db)
        # return await oficina_service.get_expedientes_por_oficina(oficina_id, skip=skip, limit=limit)
        
        return []
        
    except DatabaseErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{oficina_id}/expedientes/{expediente_id}/mover")
async def mover_expediente(
    oficina_id: str,
    expediente_id: str,
    motivo: str,
    observaciones: Optional[str] = None,
    documentos_requeridos: Optional[List[str]] = None,
    documentos_entregados: Optional[List[str]] = None,
    current_user: UsuarioInDB = Depends(get_current_user),
    # db = Depends(get_database)
):
    """Mover un expediente a una nueva oficina"""
    try:
        # Verificar permisos (FUNCIONARIO, SUPERVISOR, ADMIN pueden mover expedientes)
        if current_user.rol not in ["FUNCIONARIO", "SUPERVISOR", "ADMIN"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para mover expedientes"
            )
        
        # oficina_service = OficinaService(db)
        # success = await oficina_service.mover_expediente(
        #     expediente_id=expediente_id,
        #     nueva_oficina_id=oficina_id,
        #     usuario_id=current_user.id,
        #     motivo=motivo,
        #     observaciones=observaciones,
        #     documentos_requeridos=documentos_requeridos,
        # TODO: Implementar servicio real de movimientos
        # movimiento_service = MovimientoService(db)
        # return await movimiento_service.create_movimiento(...)
        
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Funcionalidad no implementada - falta servicio real"
        )
        
    except ValidationErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except DatabaseErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{oficina_id}/estadisticas", response_model=OficinaEstadisticas)
async def get_estadisticas_oficina(
    oficina_id: str,
    # db = Depends(get_database)
):
    """Obtener estadísticas detalladas de una oficina"""
    try:
        # TODO: Implementar OficinaService real
        # oficina_service = OficinaService(db)
        # return await oficina_service.get_estadisticas_oficina(oficina_id)
        
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Funcionalidad no implementada - falta OficinaService real"
        )
        
    except OficinaNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except DatabaseErrorException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
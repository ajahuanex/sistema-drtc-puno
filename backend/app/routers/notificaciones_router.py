from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.notificacion import (
    NotificacionCreate, 
    NotificacionUpdate, 
    NotificacionResponse, 
    NotificacionFiltros,
    EstadoNotificacion,
    PrioridadNotificacion
)
from app.dependencies.auth import get_current_user
from app.models.usuario import UsuarioResponse
from app.dependencies.db import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])

@router.get("/health")
async def health_check():
    """
    Endpoint de salud para verificar que el servicio de notificaciones esté funcionando
    """
    return {
        "status": "healthy",
        "service": "notificaciones",
        "timestamp": datetime.utcnow().isoformat(),
        "total_notificaciones": len(MOCK_NOTIFICACIONES)
    }

# Mock data para notificaciones
MOCK_NOTIFICACIONES = [
    {
        "_id": "NOT001",
        "titulo": "Expediente Aprobado",
        "mensaje": "El expediente E-0001-2024 ha sido aprobado exitosamente",
        "tipo": "RESOLUCION_APROBADA",
        "prioridad": "MEDIA",
        "canal": "SISTEMA",
        "destinatario_id": "USR001",
        "tipo_destinatario": "usuario",
        "entidad_asociada_id": "EXP001",
        "tipo_entidad_asociada": "expediente",
        "fecha_envio_programado": None,
        "observaciones": "Notificación automática del sistema",
        "estado": "ENVIADA",
        "estaActivo": True,
        "fechaRegistro": datetime(2024, 1, 15, 8, 0, 0),
        "fechaActualizacion": datetime(2024, 1, 15, 8, 0, 0),
        "fechaEnvio": datetime(2024, 1, 15, 8, 0, 0),
        "fechaLectura": None,
        "usuarioRegistroId": "SISTEMA",
        "intentosEnvio": 1,
        "maxIntentos": 3,
        "errorEnvio": None,
        "metadata": {"expedienteId": "EXP001", "empresa": "EMPRESA ABC"},
        "notificacionesRelacionadasIds": []
    },
    {
        "_id": "NOT002",
        "titulo": "Documento por Vencer",
        "mensaje": "El documento de autorización vence en 30 días",
        "tipo": "VENCIMIENTO_DOCUMENTO",
        "prioridad": "ALTA",
        "canal": "EMAIL",
        "destinatario_id": "USR002",
        "tipo_destinatario": "usuario",
        "entidad_asociada_id": "DOC001",
        "tipo_entidad_asociada": "documento",
        "fecha_envio_programado": None,
        "observaciones": "Recordatorio de vencimiento",
        "estado": "PENDIENTE",
        "estaActivo": True,
        "fechaRegistro": datetime(2024, 1, 16, 9, 0, 0),
        "fechaActualizacion": datetime(2024, 1, 16, 9, 0, 0),
        "fechaEnvio": None,
        "fechaLectura": None,
        "usuarioRegistroId": "SISTEMA",
        "intentosEnvio": 0,
        "maxIntentos": 3,
        "errorEnvio": None,
        "metadata": {"documentoId": "DOC001", "fechaVencimiento": "2024-02-15"},
        "notificacionesRelacionadasIds": []
    },
    {
        "_id": "NOT003",
        "titulo": "Fiscalización Programada",
        "mensaje": "Se ha programado una fiscalización para la próxima semana",
        "tipo": "FISCALIZACION_PROGRAMADA",
        "prioridad": "MEDIA",
        "canal": "SISTEMA",
        "destinatario_id": "USR003",
        "tipo_destinatario": "usuario",
        "entidad_asociada_id": "FIS001",
        "tipo_entidad_asociada": "fiscalizacion",
        "fecha_envio_programado": None,
        "observaciones": "Notificación de fiscalización programada",
        "estado": "ENVIADA",
        "estaActivo": True,
        "fechaRegistro": datetime(2024, 1, 17, 10, 0, 0),
        "fechaActualizacion": datetime(2024, 1, 17, 10, 0, 0),
        "fechaEnvio": datetime(2024, 1, 17, 10, 0, 0),
        "fechaLectura": None,
        "usuarioRegistroId": "SISTEMA",
        "intentosEnvio": 1,
        "maxIntentos": 3,
        "errorEnvio": None,
        "metadata": {"fiscalizacionId": "FIS001", "fechaProgramada": "2024-01-24"},
        "notificacionesRelacionadasIds": []
    }
]

@router.get("/", response_model=List[NotificacionResponse])
async def get_notificaciones(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    destinatario_id: Optional[str] = Query(None, description="ID del destinatario"),
    tipo: Optional[str] = Query(None, description="Tipo de notificación"),
    prioridad: Optional[str] = Query(None, description="Prioridad de la notificación"),
    estado: Optional[str] = Query(None, description="Estado de la notificación"),
    no_leidas: Optional[bool] = Query(None, description="Solo notificaciones no leídas")
):
    """
    Obtener lista de notificaciones con filtros opcionales
    """
    try:
        # Filtrar notificaciones
        notificaciones_filtradas = MOCK_NOTIFICACIONES.copy()
        
        if destinatario_id:
            notificaciones_filtradas = [n for n in notificaciones_filtradas if n["destinatario_id"] == destinatario_id]
        
        if tipo:
            notificaciones_filtradas = [n for n in notificaciones_filtradas if n["tipo"] == tipo]
        
        if prioridad:
            notificaciones_filtradas = [n for n in notificaciones_filtradas if n["prioridad"] == prioridad]
        
        if estado:
            notificaciones_filtradas = [n for n in notificaciones_filtradas if n["estado"] == estado]
        
        if no_leidas is not None:
            if no_leidas:
                notificaciones_filtradas = [n for n in notificaciones_filtradas if n["fechaLectura"] is None]
            else:
                notificaciones_filtradas = [n for n in notificaciones_filtradas if n["fechaLectura"] is not None]
        
        # Aplicar paginación
        total = len(notificaciones_filtradas)
        notificaciones_paginadas = notificaciones_filtradas[skip:skip + limit]
        
        # Convertir a NotificacionResponse
        response = []
        for notif in notificaciones_paginadas:
            response.append(NotificacionResponse(
                id=notif["_id"],
                titulo=notif["titulo"],
                mensaje=notif["mensaje"],
                tipo=notif["tipo"],
                prioridad=notif["prioridad"],
                canal=notif["canal"],
                destinatario_id=notif["destinatario_id"],
                tipo_destinatario=notif["tipo_destinatario"],
                entidad_asociada_id=notif["entidad_asociada_id"],
                tipo_entidad_asociada=notif["tipo_entidad_asociada"],
                fecha_envio_programado=notif["fecha_envio_programado"],
                observaciones=notif["observaciones"],
                estado=notif["estado"],
                esta_activo=notif["estaActivo"],
                fecha_registro=notif["fechaRegistro"],
                fecha_actualizacion=notif["fechaActualizacion"],
                fecha_envio=notif["fechaEnvio"],
                fecha_lectura=notif["fechaLectura"],
                usuario_registro_id=notif["usuarioRegistroId"],
                intentos_envio=notif["intentosEnvio"],
                max_intentos=notif["maxIntentos"],
                error_envio=notif["errorEnvio"],
                metadata=notif["metadata"],
                notificaciones_relacionadas_ids=notif["notificacionesRelacionadasIds"]
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/sistema", response_model=List[NotificacionResponse])
async def get_notificaciones_sistema(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar")
):
    """
    Obtener notificaciones del sistema sin autenticación
    """
    try:
        # Filtrar solo notificaciones del sistema
        notificaciones_sistema = [
            n for n in MOCK_NOTIFICACIONES 
            if n["tipo"] in ["SISTEMA", "RESOLUCION_APROBADA", "RESOLUCION_RECHAZADA", "EXPEDIENTE_ACTUALIZADO"]
        ]
        
        # Aplicar paginación
        total = len(notificaciones_sistema)
        notificaciones_paginadas = notificaciones_sistema[skip:skip + limit]
        
        # Convertir a NotificacionResponse
        response = []
        for notif in notificaciones_paginadas:
            response.append(NotificacionResponse(
                id=notif["_id"],
                titulo=notif["titulo"],
                mensaje=notif["mensaje"],
                tipo=notif["tipo"],
                prioridad=notif["prioridad"],
                canal=notif["canal"],
                destinatario_id=notif["destinatario_id"],
                tipo_destinatario=notif["tipo_destinatario"],
                entidad_asociada_id=notif["entidad_asociada_id"],
                tipo_entidad_asociada=notif["tipo_entidad_asociada"],
                fecha_envio_programado=notif["fecha_envio_programado"],
                observaciones=notif["observaciones"],
                estado=notif["estado"],
                esta_activo=notif["estaActivo"],
                fecha_registro=notif["fechaRegistro"],
                fecha_actualizacion=notif["fechaActualizacion"],
                fecha_envio=notif["fechaEnvio"],
                fecha_lectura=notif["fechaLectura"],
                usuario_registro_id=notif["usuarioRegistroId"],
                intentos_envio=notif["intentosEnvio"],
                max_intentos=notif["maxIntentos"],
                error_envio=notif["errorEnvio"],
                metadata=notif["metadata"],
                notificaciones_relacionadas_ids=notif["notificacionesRelacionadasIds"]
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/{notificacion_id}", response_model=NotificacionResponse)
async def get_notificacion(
    notificacion_id: str,
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Obtener una notificación específica por ID
    """
    try:
        notificacion = next((n for n in MOCK_NOTIFICACIONES if n["_id"] == notificacion_id), None)
        
        if not notificacion:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
        return NotificacionResponse(
            id=notificacion["_id"],
            titulo=notificacion["titulo"],
            mensaje=notificacion["mensaje"],
            tipo=notificacion["tipo"],
            prioridad=notificacion["prioridad"],
            canal=notificacion["canal"],
            destinatario_id=notificacion["destinatario_id"],
            tipo_destinatario=notificacion["tipo_destinatario"],
            entidad_asociada_id=notificacion["entidad_asociada_id"],
            tipo_entidad_asociada=notificacion["tipo_entidad_asociada"],
            fecha_envio_programado=notificacion["fecha_envio_programado"],
            observaciones=notificacion["observaciones"],
            estado=notificacion["estado"],
            esta_activo=notificacion["estaActivo"],
            fecha_registro=notificacion["fechaRegistro"],
            fecha_actualizacion=notificacion["fechaActualizacion"],
            fecha_envio=notificacion["fechaEnvio"],
            fecha_lectura=notificacion["fechaLectura"],
            usuario_registro_id=notificacion["usuarioRegistroId"],
            intentos_envio=notificacion["intentosEnvio"],
            max_intentos=notificacion["maxIntentos"],
            error_envio=notificacion["errorEnvio"],
            metadata=notificacion["metadata"],
            notificaciones_relacionadas_ids=notificacion["notificacionesRelacionadasIds"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/", response_model=NotificacionResponse)
async def create_notificacion(
    notificacion: NotificacionCreate,
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Crear una nueva notificación
    """
    try:
        # Generar ID único
        new_id = f"NOT{str(len(MOCK_NOTIFICACIONES) + 1).zfill(3)}"
        
        nueva_notificacion = {
            "_id": new_id,
            "titulo": notificacion.titulo,
            "mensaje": notificacion.mensaje,
            "tipo": notificacion.tipo,
            "prioridad": notificacion.prioridad,
            "canal": notificacion.canal,
            "destinatario_id": notificacion.destinatario_id,
            "tipo_destinatario": notificacion.tipo_destinatario,
            "entidad_asociada_id": notificacion.entidad_asociada_id,
            "tipo_entidad_asociada": notificacion.tipo_entidad_asociada,
            "fecha_envio_programado": notificacion.fecha_envio_programado,
            "observaciones": notificacion.observaciones,
            "estado": EstadoNotificacion.PENDIENTE,
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow(),
            "fechaEnvio": None,
            "fechaLectura": None,
            "usuarioRegistroId": current_user.id,
            "intentosEnvio": 0,
            "maxIntentos": 3,
            "errorEnvio": None,
            "metadata": {},
            "notificacionesRelacionadasIds": []
        }
        
        MOCK_NOTIFICACIONES.append(nueva_notificacion)
        
        return NotificacionResponse(
            id=nueva_notificacion["_id"],
            titulo=nueva_notificacion["titulo"],
            mensaje=nueva_notificacion["mensaje"],
            tipo=nueva_notificacion["tipo"],
            prioridad=nueva_notificacion["prioridad"],
            canal=nueva_notificacion["canal"],
            destinatario_id=nueva_notificacion["destinatario_id"],
            tipo_destinatario=nueva_notificacion["tipo_destinatario"],
            entidad_asociada_id=nueva_notificacion["entidad_asociada_id"],
            tipo_entidad_asociada=nueva_notificacion["tipo_entidad_asociada"],
            fecha_envio_programado=nueva_notificacion["fecha_envio_programado"],
            observaciones=nueva_notificacion["observaciones"],
            estado=nueva_notificacion["estado"],
            esta_activo=nueva_notificacion["estaActivo"],
            fecha_registro=nueva_notificacion["fechaRegistro"],
            fecha_actualizacion=nueva_notificacion["fechaActualizacion"],
            fecha_envio=nueva_notificacion["fechaEnvio"],
            fecha_lectura=nueva_notificacion["fechaLectura"],
            usuario_registro_id=nueva_notificacion["usuarioRegistroId"],
            intentos_envio=nueva_notificacion["intentosEnvio"],
            max_intentos=nueva_notificacion["maxIntentos"],
            error_envio=nueva_notificacion["errorEnvio"],
            metadata=nueva_notificacion["metadata"],
            notificaciones_relacionadas_ids=nueva_notificacion["notificacionesRelacionadasIds"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.put("/{notificacion_id}", response_model=NotificacionResponse)
async def update_notificacion(
    notificacion_id: str,
    notificacion_update: NotificacionUpdate,
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Actualizar una notificación existente
    """
    try:
        notificacion = next((n for n in MOCK_NOTIFICACIONES if n["_id"] == notificacion_id), None)
        
        if not notificacion:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
        # Actualizar campos
        update_data = notificacion_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "estado":
                notificacion["estado"] = value
            elif field == "fecha_envio_programado":
                notificacion["fecha_envio_programado"] = value
            elif field == "observaciones":
                notificacion["observaciones"] = value
            elif field == "prioridad":
                notificacion["prioridad"] = value
            elif field == "canal":
                notificacion["canal"] = value
            elif field == "titulo":
                notificacion["titulo"] = value
            elif field == "mensaje":
                notificacion["mensaje"] = value
        
        notificacion["fechaActualizacion"] = datetime.utcnow()
        
        return NotificacionResponse(
            id=notificacion["_id"],
            titulo=notificacion["titulo"],
            mensaje=notificacion["mensaje"],
            tipo=notificacion["tipo"],
            prioridad=notificacion["prioridad"],
            canal=notificacion["canal"],
            destinatario_id=notificacion["destinatario_id"],
            tipo_destinatario=notificacion["tipo_destinatario"],
            entidad_asociada_id=notificacion["entidad_asociada_id"],
            tipo_entidad_asociada=notificacion["tipo_entidad_asociada"],
            fecha_envio_programado=notificacion["fecha_envio_programado"],
            observaciones=notificacion["observaciones"],
            estado=notificacion["estado"],
            esta_activo=notificacion["estaActivo"],
            fecha_registro=notificacion["fechaRegistro"],
            fecha_actualizacion=notificacion["fechaActualizacion"],
            fecha_envio=notificacion["fechaEnvio"],
            fecha_lectura=notificacion["fechaLectura"],
            usuario_registro_id=notificacion["usuarioRegistroId"],
            intentos_envio=notificacion["intentosEnvio"],
            max_intentos=notificacion["maxIntentos"],
            error_envio=notificacion["errorEnvio"],
            metadata=notificacion["metadata"],
            notificaciones_relacionadas_ids=notificacion["notificacionesRelacionadasIds"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.delete("/{notificacion_id}")
async def delete_notificacion(
    notificacion_id: str,
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Eliminar una notificación
    """
    try:
        notificacion = next((n for n in MOCK_NOTIFICACIONES if n["_id"] == notificacion_id), None)
        
        if not notificacion:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
        # Marcar como inactiva en lugar de eliminar
        notificacion["estaActivo"] = False
        notificacion["fechaActualizacion"] = datetime.utcnow()
        
        return {"message": "Notificación eliminada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.put("/{notificacion_id}/marcar-leida", response_model=NotificacionResponse)
async def marcar_como_leida(
    notificacion_id: str,
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Marcar una notificación como leída
    """
    try:
        notificacion = next((n for n in MOCK_NOTIFICACIONES if n["_id"] == notificacion_id), None)
        
        if not notificacion:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
        notificacion["estado"] = EstadoNotificacion.LEIDA
        notificacion["fechaLectura"] = datetime.utcnow()
        notificacion["fechaActualizacion"] = datetime.utcnow()
        
        return NotificacionResponse(
            id=notificacion["_id"],
            titulo=notificacion["titulo"],
            mensaje=notificacion["mensaje"],
            tipo=notificacion["tipo"],
            prioridad=notificacion["prioridad"],
            canal=notificacion["canal"],
            destinatario_id=notificacion["destinatario_id"],
            tipo_destinatario=notificacion["tipo_destinatario"],
            entidad_asociada_id=notificacion["entidad_asociada_id"],
            tipo_entidad_asociada=notificacion["tipo_entidad_asociada"],
            fecha_envio_programado=notificacion["fecha_envio_programado"],
            observaciones=notificacion["observaciones"],
            estado=notificacion["estado"],
            esta_activo=notificacion["estaActivo"],
            fecha_registro=notificacion["fechaRegistro"],
            fecha_actualizacion=notificacion["fechaActualizacion"],
            fecha_envio=notificacion["fechaEnvio"],
            fecha_lectura=notificacion["fechaLectura"],
            usuario_registro_id=notificacion["usuarioRegistroId"],
            intentos_envio=notificacion["intentosEnvio"],
            max_intentos=notificacion["maxIntentos"],
            error_envio=notificacion["errorEnvio"],
            metadata=notificacion["metadata"],
            notificaciones_relacionadas_ids=notificacion["notificacionesRelacionadasIds"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.put("/marcar-todas-leidas")
async def marcar_todas_como_leidas(
    destinatario_id: str = Query(..., description="ID del destinatario"),
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Marcar todas las notificaciones de un destinatario como leídas
    """
    try:
        notificaciones_actualizadas = 0
        
        for notificacion in MOCK_NOTIFICACIONES:
            if (notificacion["destinatario_id"] == destinatario_id and 
                notificacion["estado"] != EstadoNotificacion.LEIDA and
                notificacion["estaActivo"]):
                
                notificacion["estado"] = EstadoNotificacion.LEIDA
                notificacion["fechaLectura"] = datetime.utcnow()
                notificacion["fechaActualizacion"] = datetime.utcnow()
                notificaciones_actualizadas += 1
        
        return {"message": f"Se marcaron {notificaciones_actualizadas} notificaciones como leídas"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/no-leidas", response_model=List[NotificacionResponse])
async def get_notificaciones_no_leidas(
    destinatario_id: str = Query(..., description="ID del destinatario"),
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Obtener notificaciones no leídas de un destinatario
    """
    try:
        no_leidas = [
            n for n in MOCK_NOTIFICACIONES 
            if (n["destinatario_id"] == destinatario_id and 
                n["estado"] != EstadoNotificacion.LEIDA and
                n["estaActivo"])
        ]
        
        response = []
        for notif in no_leidas:
            response.append(NotificacionResponse(
                id=notif["_id"],
                titulo=notif["titulo"],
                mensaje=notif["mensaje"],
                tipo=notif["tipo"],
                prioridad=notif["prioridad"],
                canal=notif["canal"],
                destinatario_id=notif["destinatario_id"],
                tipo_destinatario=notif["tipo_destinatario"],
                entidad_asociada_id=notif["entidad_asociada_id"],
                tipo_entidad_asociada=notif["tipo_entidad_asociada"],
                fecha_envio_programado=notif["fecha_envio_programado"],
                observaciones=notif["observaciones"],
                estado=notif["estado"],
                esta_activo=notif["estaActivo"],
                fecha_registro=notif["fechaRegistro"],
                fecha_actualizacion=notif["fechaActualizacion"],
                fecha_envio=notif["fechaEnvio"],
                fecha_lectura=notif["fechaLectura"],
                usuario_registro_id=notif["usuarioRegistroId"],
                intentos_envio=notif["intentosEnvio"],
                max_intentos=notif["maxIntentos"],
                error_envio=notif["errorEnvio"],
                metadata=notif["metadata"],
                notificaciones_relacionadas_ids=notif["notificacionesRelacionadasIds"]
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/criticas", response_model=List[NotificacionResponse])
async def get_notificaciones_criticas(
    destinatario_id: str = Query(..., description="ID del destinatario"),
    current_user: UsuarioResponse = Depends(get_current_user)
):
    """
    Obtener notificaciones críticas de un destinatario
    """
    try:
        criticas = [
            n for n in MOCK_NOTIFICACIONES 
            if (n["destinatario_id"] == destinatario_id and 
                n["prioridad"] == PrioridadNotificacion.URGENTE and
                n["estaActivo"])
        ]
        
        response = []
        for notif in criticas:
            response.append(NotificacionResponse(
                id=notif["_id"],
                titulo=notif["titulo"],
                mensaje=notif["mensaje"],
                tipo=notif["tipo"],
                prioridad=notif["prioridad"],
                canal=notif["canal"],
                destinatario_id=notif["destinatario_id"],
                tipo_destinatario=notif["tipo_destinatario"],
                entidad_asociada_id=notif["entidad_asociada_id"],
                tipo_entidad_asociada=notif["tipo_entidad_asociada"],
                fecha_envio_programado=notif["fecha_envio_programado"],
                observaciones=notif["observaciones"],
                estado=notif["estado"],
                esta_activo=notif["estaActivo"],
                fecha_registro=notif["fechaRegistro"],
                fecha_actualizacion=notif["fechaActualizacion"],
                fecha_envio=notif["fechaEnvio"],
                fecha_lectura=notif["fechaLectura"],
                usuario_registro_id=notif["usuarioRegistroId"],
                intentos_envio=notif["intentosEnvio"],
                max_intentos=notif["maxIntentos"],
                error_envio=notif["errorEnvio"],
                metadata=notif["metadata"],
                notificaciones_relacionadas_ids=notif["notificacionesRelacionadasIds"]
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}") 
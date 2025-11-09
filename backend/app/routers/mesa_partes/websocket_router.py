"""
Router para WebSocket de notificaciones en tiempo real
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from app.services.mesa_partes.websocket_service import manager, websocket_service
from app.dependencies.auth import get_current_user_ws
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/notificaciones")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    area_id: str = Query(None)
):
    """
    Endpoint WebSocket para notificaciones en tiempo real
    
    Parámetros:
    - token: JWT token para autenticación
    - area_id: ID del área (opcional)
    """
    usuario_id = None
    
    try:
        # Validar token y obtener usuario
        # Por ahora usamos un usuario mock, en producción usar get_current_user_ws
        usuario_id = token  # Simplificado para desarrollo
        
        # Conectar cliente
        await manager.connect(websocket, usuario_id, area_id)
        
        # Mantener conexión abierta y escuchar mensajes
        while True:
            try:
                # Recibir mensaje del cliente
                data = await websocket.receive_json()
                
                # Procesar mensaje según tipo
                message_type = data.get("type")
                
                if message_type == "ping":
                    # Responder a ping con pong
                    await manager.send_personal_message(
                        {"type": "pong", "timestamp": data.get("timestamp")},
                        websocket
                    )
                
                elif message_type == "subscribe_area":
                    # Suscribirse a notificaciones de un área
                    new_area_id = data.get("area_id")
                    if new_area_id:
                        if new_area_id not in manager.area_connections:
                            manager.area_connections[new_area_id] = set()
                        manager.area_connections[new_area_id].add(websocket)
                        manager.websocket_to_area[websocket] = new_area_id
                        
                        await manager.send_personal_message(
                            {
                                "type": "subscription_confirmed",
                                "area_id": new_area_id
                            },
                            websocket
                        )
                
                elif message_type == "get_stats":
                    # Obtener estadísticas de conexión
                    stats = await websocket_service.get_connection_stats()
                    await manager.send_personal_message(
                        {
                            "type": "stats",
                            "data": stats
                        },
                        websocket
                    )
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error procesando mensaje WebSocket: {str(e)}")
                break
    
    except Exception as e:
        logger.error(f"Error en conexión WebSocket: {str(e)}")
    
    finally:
        # Desconectar cliente
        if usuario_id:
            manager.disconnect(websocket)


@router.get("/ws/stats")
async def get_websocket_stats():
    """Obtener estadísticas de conexiones WebSocket"""
    return await websocket_service.get_connection_stats()

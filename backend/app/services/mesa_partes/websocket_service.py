"""
WebSocket Service para notificaciones en tiempo real
"""
from typing import Dict, Set, List
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Gestor de conexiones WebSocket"""
    
    def __init__(self):
        # Conexiones activas por usuario
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Conexiones por área
        self.area_connections: Dict[str, Set[WebSocket]] = {}
        # Mapeo de websocket a usuario
        self.websocket_to_user: Dict[WebSocket, str] = {}
        # Mapeo de websocket a área
        self.websocket_to_area: Dict[WebSocket, str] = {}
        
    async def connect(self, websocket: WebSocket, usuario_id: str, area_id: str = None):
        """Conectar un nuevo cliente WebSocket"""
        await websocket.accept()
        
        # Agregar a conexiones de usuario
        if usuario_id not in self.active_connections:
            self.active_connections[usuario_id] = set()
        self.active_connections[usuario_id].add(websocket)
        self.websocket_to_user[websocket] = usuario_id
        
        # Agregar a conexiones de área si se proporciona
        if area_id:
            if area_id not in self.area_connections:
                self.area_connections[area_id] = set()
            self.area_connections[area_id].add(websocket)
            self.websocket_to_area[websocket] = area_id
        
        logger.info(f"Usuario {usuario_id} conectado via WebSocket (área: {area_id})")
        
        # Enviar mensaje de bienvenida
        await self.send_personal_message(
            {
                "type": "connection",
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Conectado al sistema de notificaciones"
            },
            websocket
        )
    
    def disconnect(self, websocket: WebSocket):
        """Desconectar un cliente WebSocket"""
        usuario_id = self.websocket_to_user.get(websocket)
        area_id = self.websocket_to_area.get(websocket)
        
        # Remover de conexiones de usuario
        if usuario_id and usuario_id in self.active_connections:
            self.active_connections[usuario_id].discard(websocket)
            if not self.active_connections[usuario_id]:
                del self.active_connections[usuario_id]
        
        # Remover de conexiones de área
        if area_id and area_id in self.area_connections:
            self.area_connections[area_id].discard(websocket)
            if not self.area_connections[area_id]:
                del self.area_connections[area_id]
        
        # Limpiar mapeos
        self.websocket_to_user.pop(websocket, None)
        self.websocket_to_area.pop(websocket, None)
        
        logger.info(f"Usuario {usuario_id} desconectado (área: {area_id})")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Enviar mensaje a una conexión específica"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error enviando mensaje personal: {str(e)}")
            self.disconnect(websocket)
    
    async def send_to_user(self, message: dict, usuario_id: str):
        """Enviar mensaje a todas las conexiones de un usuario"""
        if usuario_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[usuario_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error enviando a usuario {usuario_id}: {str(e)}")
                    disconnected.append(connection)
            
            # Limpiar conexiones fallidas
            for conn in disconnected:
                self.disconnect(conn)
    
    async def send_to_area(self, message: dict, area_id: str):
        """Enviar mensaje a todas las conexiones de un área"""
        if area_id in self.area_connections:
            disconnected = []
            for connection in self.area_connections[area_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error enviando a área {area_id}: {str(e)}")
                    disconnected.append(connection)
            
            # Limpiar conexiones fallidas
            for conn in disconnected:
                self.disconnect(conn)
    
    async def broadcast(self, message: dict):
        """Enviar mensaje a todas las conexiones activas"""
        all_connections = set()
        for connections in self.active_connections.values():
            all_connections.update(connections)
        
        disconnected = []
        for connection in all_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error en broadcast: {str(e)}")
                disconnected.append(connection)
        
        # Limpiar conexiones fallidas
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_notification(
        self,
        tipo: str,
        titulo: str,
        mensaje: str,
        usuario_id: str = None,
        area_id: str = None,
        datos: dict = None,
        prioridad: str = "NORMAL"
    ):
        """Enviar notificación estructurada"""
        notification = {
            "type": "notification",
            "notification_type": tipo,
            "title": titulo,
            "message": mensaje,
            "priority": prioridad,
            "timestamp": datetime.utcnow().isoformat(),
            "data": datos or {}
        }
        
        if usuario_id:
            await self.send_to_user(notification, usuario_id)
        elif area_id:
            await self.send_to_area(notification, area_id)
        else:
            await self.broadcast(notification)
    
    def get_active_users(self) -> List[str]:
        """Obtener lista de usuarios conectados"""
        return list(self.active_connections.keys())
    
    def get_user_connection_count(self, usuario_id: str) -> int:
        """Obtener número de conexiones de un usuario"""
        return len(self.active_connections.get(usuario_id, set()))
    
    def get_area_connection_count(self, area_id: str) -> int:
        """Obtener número de conexiones en un área"""
        return len(self.area_connections.get(area_id, set()))


# Instancia global del gestor de conexiones
manager = ConnectionManager()


class WebSocketService:
    """Servicio para operaciones WebSocket de alto nivel"""
    
    def __init__(self):
        self.manager = manager
    
    async def notify_documento_derivado(
        self,
        documento_id: str,
        numero_expediente: str,
        area_destino_id: str,
        usuario_deriva: str,
        es_urgente: bool = False
    ):
        """Notificar derivación de documento"""
        prioridad = "URGENTE" if es_urgente else "NORMAL"
        
        await self.manager.send_notification(
            tipo="documento_derivado",
            titulo="Nuevo documento derivado",
            mensaje=f"Se ha derivado el documento {numero_expediente}",
            area_id=area_destino_id,
            prioridad=prioridad,
            datos={
                "documento_id": documento_id,
                "numero_expediente": numero_expediente,
                "usuario_deriva": usuario_deriva,
                "es_urgente": es_urgente
            }
        )
        
        logger.info(f"Notificación enviada: documento {numero_expediente} derivado a área {area_destino_id}")
    
    async def notify_documento_recibido(
        self,
        documento_id: str,
        numero_expediente: str,
        usuario_id: str,
        area_id: str
    ):
        """Notificar recepción de documento"""
        await self.manager.send_notification(
            tipo="documento_recibido",
            titulo="Documento recibido",
            mensaje=f"Has recibido el documento {numero_expediente}",
            usuario_id=usuario_id,
            datos={
                "documento_id": documento_id,
                "numero_expediente": numero_expediente,
                "area_id": area_id
            }
        )
        
        logger.info(f"Notificación enviada: documento {numero_expediente} recibido por usuario {usuario_id}")
    
    async def notify_documento_proximo_vencer(
        self,
        documento_id: str,
        numero_expediente: str,
        area_id: str,
        dias_restantes: int
    ):
        """Notificar documento próximo a vencer"""
        await self.manager.send_notification(
            tipo="documento_proximo_vencer",
            titulo="Documento próximo a vencer",
            mensaje=f"El documento {numero_expediente} vence en {dias_restantes} día(s)",
            area_id=area_id,
            prioridad="ALTA",
            datos={
                "documento_id": documento_id,
                "numero_expediente": numero_expediente,
                "dias_restantes": dias_restantes
            }
        )
        
        logger.info(f"Notificación enviada: documento {numero_expediente} próximo a vencer ({dias_restantes} días)")
    
    async def notify_documento_urgente(
        self,
        documento_id: str,
        numero_expediente: str,
        area_id: str,
        remitente: str
    ):
        """Notificar documento urgente"""
        await self.manager.send_notification(
            tipo="documento_urgente",
            titulo="Documento urgente recibido",
            mensaje=f"Documento urgente {numero_expediente} de {remitente}",
            area_id=area_id,
            prioridad="URGENTE",
            datos={
                "documento_id": documento_id,
                "numero_expediente": numero_expediente,
                "remitente": remitente
            }
        )
        
        logger.info(f"Notificación enviada: documento urgente {numero_expediente}")
    
    async def notify_documento_atendido(
        self,
        documento_id: str,
        numero_expediente: str,
        usuario_id: str,
        observaciones: str = None
    ):
        """Notificar documento atendido"""
        await self.manager.send_notification(
            tipo="documento_atendido",
            titulo="Documento atendido",
            mensaje=f"El documento {numero_expediente} ha sido atendido",
            usuario_id=usuario_id,
            datos={
                "documento_id": documento_id,
                "numero_expediente": numero_expediente,
                "observaciones": observaciones
            }
        )
        
        logger.info(f"Notificación enviada: documento {numero_expediente} atendido")
    
    async def get_connection_stats(self) -> dict:
        """Obtener estadísticas de conexiones"""
        return {
            "total_users_connected": len(self.manager.active_connections),
            "total_connections": sum(len(conns) for conns in self.manager.active_connections.values()),
            "areas_with_connections": len(self.manager.area_connections),
            "active_users": self.manager.get_active_users()
        }


# Instancia global del servicio
websocket_service = WebSocketService()

"""
Integration Test: Sistema de Notificaciones
Tests the notification system including WebSocket and email notifications
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from unittest.mock import patch, AsyncMock, MagicMock
import asyncio

from app.models.mesa_partes.notificacion import Notificacion, TipoNotificacionEnum
from app.models.mesa_partes.documento import Documento


@pytest.mark.asyncio
class TestSistemaNotificaciones:
    """Test del sistema completo de notificaciones"""
    
    async def test_notificacion_derivacion_documento(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_user_destino,
        test_area_destino,
        test_documento
    ):
        """
        Test de notificación automática al derivar documento
        """
        
        # Derivar documento
        derivacion_data = {
            "documento_id": str(test_documento.id),
            "area_destino_id": str(test_area_destino.id),
            "instrucciones": "Revisar urgente"
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/derivaciones",
            json=derivacion_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        
        # Verificar que se creó notificación para usuario del área destino
        response = await async_client.get(
            "/api/v1/mesa-partes/notificaciones",
            headers={"Authorization": f"Bearer {test_user_destino.token}"}
        )
        
        assert response.status_code == 200
        notificaciones = response.json()
        
        # Verificar que hay al menos una notificación
        assert len(notificaciones) > 0
        
        # Verificar contenido de la notificación
        notif = notificaciones[0]
        assert notif["tipo"] == "DERIVACION_RECIBIDA"
        assert notif["leida"] is False
        assert test_documento.numero_expediente in notif["mensaje"]
        
    async def test_notificacion_documento_urgente(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_user_destino,
        test_area_destino,
        test_tipo_documento
    ):
        """
        Test de notificación prioritaria para documento urgente
        """
        
        # Crear documento urgente
        documento_data = {
            "tipo_documento_id": str(test_tipo_documento.id),
            "remitente": "Autoridad Superior",
            "asunto": "Asunto urgente que requiere atención inmediata",
            "numero_folios": 2,
            "prioridad": "URGENTE"
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/documentos",
            json=documento_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        documento_id = response.json()["id"]
        
        # Derivar a área
        derivacion_data = {
            "documento_id": documento_id,
            "area_destino_id": str(test_area_destino.id),
            "instrucciones": "Atender con máxima prioridad",
            "es_urgente": True
        }
        
        await async_client.post(
            "/api/v1/mesa-partes/derivaciones",
            json=derivacion_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        # Verificar notificación urgente
        response = await async_client.get(
            "/api/v1/mesa-partes/notificaciones",
            headers={"Authorization": f"Bearer {test_user_destino.token}"}
        )
        
        notificaciones = response.json()
        notif_urgente = next(
            (n for n in notificaciones if n["prioridad"] == "URGENTE"),
            None
        )
        
        assert notif_urgente is not None
        assert notif_urgente["tipo"] == "DOCUMENTO_URGENTE"
        
    async def test_alerta_documento_proximo_vencer(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_area_destino,
        test_tipo_documento
    ):
        """
        Test de alerta automática para documento próximo a vencer
        """
        
        # Crear documento con fecha límite cercana
        fecha_limite = datetime.utcnow() + timedelta(days=2)
        
        documento_data = {
            "tipo_documento_id": str(test_tipo_documento.id),
            "remitente": "Ciudadano",
            "asunto": "Solicitud con plazo legal",
            "numero_folios": 5,
            "fecha_limite": fecha_limite.isoformat()
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/documentos",
            json=documento_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        documento_id = response.json()["id"]
        
        # Derivar documento
        derivacion_data = {
            "documento_id": documento_id,
            "area_destino_id": str(test_area_destino.id),
            "instrucciones": "Atender antes del plazo"
        }
        
        await async_client.post(
            "/api/v1/mesa-partes/derivaciones",
            json=derivacion_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        # Ejecutar tarea de verificación de vencimientos
        response = await async_client.post(
            "/api/v1/mesa-partes/notificaciones/verificar-vencimientos",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        resultado = response.json()
        
        # Verificar que se generaron alertas
        assert resultado["alertas_generadas"] > 0
        
        # Verificar notificación de alerta
        response = await async_client.get(
            "/api/v1/mesa-partes/notificaciones",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        notificaciones = response.json()
        alerta = next(
            (n for n in notificaciones if n["tipo"] == "DOCUMENTO_PROXIMO_VENCER"),
            None
        )
        
        assert alerta is not None
        assert "2 días" in alerta["mensaje"] or "vencer" in alerta["mensaje"].lower()
        
    async def test_notificacion_email(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_user_destino,
        test_area_destino,
        test_documento
    ):
        """
        Test de envío de notificación por email
        """
        
        with patch('app.services.mesa_partes.notificacion_service.enviar_email') as mock_email:
            mock_email.return_value = True
            
            # Derivar documento con notificación por email
            derivacion_data = {
                "documento_id": str(test_documento.id),
                "area_destino_id": str(test_area_destino.id),
                "instrucciones": "Revisar documento",
                "notificar_email": True
            }
            
            response = await async_client.post(
                "/api/v1/mesa-partes/derivaciones",
                json=derivacion_data,
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 201
            
            # Verificar que se llamó a la función de envío de email
            mock_email.assert_called_once()
            
            # Verificar argumentos del email
            call_args = mock_email.call_args
            assert test_user_destino.email in str(call_args)
            assert test_documento.numero_expediente in str(call_args)
            
    async def test_marcar_notificacion_leida(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_notificacion
    ):
        """
        Test de marcar notificación como leída
        """
        
        # Marcar como leída
        response = await async_client.put(
            f"/api/v1/mesa-partes/notificaciones/{test_notificacion.id}/leer",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        notificacion = response.json()
        
        assert notificacion["leida"] is True
        assert notificacion["fecha_lectura"] is not None
        
    async def test_filtrar_notificaciones(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user
    ):
        """
        Test de filtrado de notificaciones
        """
        
        # Obtener solo notificaciones no leídas
        response = await async_client.get(
            "/api/v1/mesa-partes/notificaciones?leidas=false",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        notificaciones = response.json()
        
        # Verificar que todas son no leídas
        for notif in notificaciones:
            assert notif["leida"] is False
            
        # Obtener solo notificaciones leídas
        response = await async_client.get(
            "/api/v1/mesa-partes/notificaciones?leidas=true",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        notificaciones_leidas = response.json()
        
        # Verificar que todas son leídas
        for notif in notificaciones_leidas:
            assert notif["leida"] is True
            
    async def test_websocket_notificacion_tiempo_real(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_user_destino,
        test_area_destino,
        test_documento
    ):
        """
        Test de notificación en tiempo real vía WebSocket
        """
        
        # Simular conexión WebSocket
        notificaciones_recibidas = []
        
        async def mock_websocket_handler(websocket):
            # Simular recepción de mensaje
            mensaje = {
                "tipo": "DERIVACION_RECIBIDA",
                "documento_id": str(test_documento.id),
                "mensaje": f"Nuevo documento: {test_documento.numero_expediente}"
            }
            notificaciones_recibidas.append(mensaje)
            
        with patch('app.services.mesa_partes.websocket_service.broadcast') as mock_broadcast:
            mock_broadcast.side_effect = mock_websocket_handler
            
            # Derivar documento
            derivacion_data = {
                "documento_id": str(test_documento.id),
                "area_destino_id": str(test_area_destino.id),
                "instrucciones": "Revisar"
            }
            
            response = await async_client.post(
                "/api/v1/mesa-partes/derivaciones",
                json=derivacion_data,
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 201
            
            # Verificar que se envió notificación por WebSocket
            mock_broadcast.assert_called()
            
    async def test_resumen_diario_notificaciones(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user
    ):
        """
        Test de generación de resumen diario de notificaciones
        """
        
        with patch('app.services.mesa_partes.notificacion_service.enviar_email') as mock_email:
            mock_email.return_value = True
            
            # Generar resumen diario
            response = await async_client.post(
                "/api/v1/mesa-partes/notificaciones/resumen-diario",
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 200
            resultado = response.json()
            
            assert resultado["resumen_enviado"] is True
            assert resultado["total_notificaciones"] >= 0
            assert resultado["documentos_pendientes"] >= 0
            assert resultado["documentos_vencidos"] >= 0
            
    async def test_configurar_preferencias_notificaciones(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user
    ):
        """
        Test de configuración de preferencias de notificaciones
        """
        
        preferencias = {
            "notificar_derivaciones": True,
            "notificar_urgentes": True,
            "notificar_vencimientos": True,
            "enviar_email": False,
            "enviar_resumen_diario": True,
            "hora_resumen": "08:00"
        }
        
        response = await async_client.put(
            "/api/v1/mesa-partes/notificaciones/preferencias",
            json=preferencias,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        prefs_guardadas = response.json()
        
        assert prefs_guardadas["notificar_derivaciones"] is True
        assert prefs_guardadas["enviar_email"] is False
        assert prefs_guardadas["hora_resumen"] == "08:00"
        
    async def test_eliminar_notificaciones_antiguas(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user
    ):
        """
        Test de eliminación automática de notificaciones antiguas
        """
        
        # Ejecutar limpieza de notificaciones antiguas (más de 30 días)
        response = await async_client.post(
            "/api/v1/mesa-partes/notificaciones/limpiar-antiguas",
            json={"dias": 30},
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        resultado = response.json()
        
        assert "notificaciones_eliminadas" in resultado
        assert resultado["notificaciones_eliminadas"] >= 0

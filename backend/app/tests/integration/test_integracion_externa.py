"""
Integration Test: Integración Externa
Tests external integration: envío y recepción de documentos
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import json
import hmac
import hashlib
from unittest.mock import patch, AsyncMock

from app.models.mesa_partes.integracion import Integracion, TipoIntegracionEnum, TipoAutenticacionEnum, EstadoConexionEnum
from app.models.mesa_partes.documento import Documento


@pytest.mark.asyncio
class TestIntegracionExterna:
    """Test de integración con mesas de partes externas"""
    
    async def test_envio_documento_externo(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_integracion,
        test_documento
    ):
        """
        Test de envío de documento a mesa de partes externa
        """
        
        # Mock del cliente HTTP para simular respuesta externa
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "id": "ext-doc-123",
                "numero_expediente": "EXT-2025-0001",
                "estado": "recibido"
            }
            mock_post.return_value = mock_response
            
            # Enviar documento a integración externa
            response = await async_client.post(
                f"/api/v1/mesa-partes/integraciones/{test_integracion.id}/enviar/{test_documento.id}",
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 200
            resultado = response.json()
            
            # Verificar respuesta
            assert resultado["success"] is True
            assert resultado["id_externo"] == "ext-doc-123"
            
            # Verificar que se llamó al endpoint externo
            mock_post.assert_called_once()
            
    async def test_recepcion_documento_externo(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_integracion
    ):
        """
        Test de recepción de documento desde mesa de partes externa
        """
        
        # Datos del documento externo
        documento_externo = {
            "numero_expediente_externo": "EXT-2025-0001",
            "tipo_documento": "Oficio",
            "remitente": "Institución Externa",
            "asunto": "Solicitud de coordinación interinstitucional",
            "numero_folios": 8,
            "prioridad": "ALTA",
            "fecha_emision": datetime.utcnow().isoformat(),
            "archivos": [
                {
                    "nombre": "oficio.pdf",
                    "contenido_base64": "JVBERi0xLjQKJeLjz9MK...",
                    "tipo_mime": "application/pdf"
                }
            ]
        }
        
        # Recibir documento externo
        response = await async_client.post(
            "/api/v1/mesa-partes/integracion/recibir-documento",
            json=documento_externo,
            headers={
                "X-Integration-ID": str(test_integracion.id),
                "X-API-Key": test_integracion.api_key
            }
        )
        
        assert response.status_code == 201
        documento_creado = response.json()
        
        # Verificar que se creó el documento
        assert documento_creado["numero_expediente"] is not None
        assert documento_creado["remitente"] == "Institución Externa"
        assert documento_creado["asunto"] == "Solicitud de coordinación interinstitucional"
        assert documento_creado["prioridad"] == "ALTA"
        
        # Verificar que se guardó la referencia externa
        assert "metadata" in documento_creado
        assert documento_creado["metadata"]["numero_expediente_externo"] == "EXT-2025-0001"
        
    async def test_sincronizacion_estado_documento(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_integracion,
        test_documento
    ):
        """
        Test de sincronización de estado con sistema externo
        """
        
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "id": "ext-doc-123",
                "estado": "atendido",
                "fecha_atencion": datetime.utcnow().isoformat(),
                "observaciones": "Solicitud atendida satisfactoriamente"
            }
            mock_get.return_value = mock_response
            
            # Sincronizar estado
            response = await async_client.post(
                f"/api/v1/mesa-partes/integraciones/{test_integracion.id}/sincronizar/{test_documento.id}",
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 200
            resultado = response.json()
            
            assert resultado["sincronizado"] is True
            assert resultado["estado_actualizado"] == "atendido"
            
    async def test_webhook_recepcion(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_integracion
    ):
        """
        Test de recepción de webhook desde sistema externo
        """
        
        # Datos del webhook
        webhook_data = {
            "evento": "documento.actualizado",
            "documento_id": "ext-doc-123",
            "estado": "en_proceso",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Generar firma HMAC
        secreto = test_integracion.webhook_secret
        firma = hmac.new(
            secreto.encode(),
            json.dumps(webhook_data).encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Enviar webhook
        response = await async_client.post(
            "/api/v1/mesa-partes/integracion/webhook",
            json=webhook_data,
            headers={
                "X-Webhook-Signature": firma,
                "X-Webhook-Event": "documento.actualizado",
                "X-Integration-ID": str(test_integracion.id)
            }
        )
        
        assert response.status_code == 200
        resultado = response.json()
        
        assert resultado["procesado"] is True
        assert resultado["evento"] == "documento.actualizado"
        
    async def test_webhook_firma_invalida(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_integracion
    ):
        """
        Test de rechazo de webhook con firma inválida
        """
        
        webhook_data = {
            "evento": "documento.actualizado",
            "documento_id": "ext-doc-123"
        }
        
        # Firma incorrecta
        firma_invalida = "firma_incorrecta_123"
        
        response = await async_client.post(
            "/api/v1/mesa-partes/integracion/webhook",
            json=webhook_data,
            headers={
                "X-Webhook-Signature": firma_invalida,
                "X-Webhook-Event": "documento.actualizado",
                "X-Integration-ID": str(test_integracion.id)
            }
        )
        
        assert response.status_code == 401
        assert "firma inválida" in response.json()["detail"].lower()
        
    async def test_mapeo_campos_integracion(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_integracion
    ):
        """
        Test de mapeo de campos entre sistemas
        """
        
        # Configurar mapeo de campos
        mapeo_config = {
            "mapeos_campos": [
                {
                    "campo_local": "numero_expediente",
                    "campo_remoto": "nro_tramite",
                    "transformacion": None
                },
                {
                    "campo_local": "remitente",
                    "campo_remoto": "solicitante",
                    "transformacion": "uppercase"
                },
                {
                    "campo_local": "asunto",
                    "campo_remoto": "descripcion",
                    "transformacion": None
                }
            ]
        }
        
        response = await async_client.put(
            f"/api/v1/mesa-partes/integraciones/{test_integracion.id}/mapeo",
            json=mapeo_config,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        resultado = response.json()
        
        assert len(resultado["mapeos_campos"]) == 3
        assert resultado["mapeos_campos"][0]["campo_local"] == "numero_expediente"
        assert resultado["mapeos_campos"][0]["campo_remoto"] == "nro_tramite"
        
    async def test_log_sincronizacion(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_integracion,
        test_documento
    ):
        """
        Test de registro de log de sincronización
        """
        
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"id": "ext-doc-123"}
            mock_post.return_value = mock_response
            
            # Enviar documento
            await async_client.post(
                f"/api/v1/mesa-partes/integraciones/{test_integracion.id}/enviar/{test_documento.id}",
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
        # Consultar log de sincronización
        response = await async_client.get(
            f"/api/v1/mesa-partes/integraciones/{test_integracion.id}/log",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        logs = response.json()
        
        # Verificar que se registró el log
        assert len(logs) > 0
        assert logs[0]["integracion_id"] == str(test_integracion.id)
        assert logs[0]["documento_id"] == str(test_documento.id)
        assert logs[0]["tipo_operacion"] == "ENVIO"
        assert logs[0]["estado"] == "EXITOSO"
        
    async def test_reintento_envio_fallido(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_integracion,
        test_documento
    ):
        """
        Test de reintento automático cuando falla el envío
        """
        
        # Simular fallo en el primer intento
        with patch('httpx.AsyncClient.post') as mock_post:
            # Primera llamada falla
            mock_response_fail = AsyncMock()
            mock_response_fail.status_code = 500
            mock_response_fail.json.return_value = {"error": "Server error"}
            
            # Segunda llamada exitosa
            mock_response_success = AsyncMock()
            mock_response_success.status_code = 200
            mock_response_success.json.return_value = {"id": "ext-doc-123"}
            
            mock_post.side_effect = [mock_response_fail, mock_response_success]
            
            # Intentar enviar documento
            response = await async_client.post(
                f"/api/v1/mesa-partes/integraciones/{test_integracion.id}/enviar/{test_documento.id}",
                json={"reintentar": True},
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            # Verificar que se reintentó y fue exitoso
            assert response.status_code == 200
            resultado = response.json()
            assert resultado["success"] is True
            assert resultado["intentos"] == 2
            
    async def test_probar_conexion_integracion(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_integracion
    ):
        """
        Test de prueba de conectividad con sistema externo
        """
        
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"status": "ok", "version": "1.0"}
            mock_get.return_value = mock_response
            
            # Probar conexión
            response = await async_client.post(
                f"/api/v1/mesa-partes/integraciones/{test_integracion.id}/probar",
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 200
            resultado = response.json()
            
            assert resultado["conectado"] is True
            assert resultado["tiempo_respuesta"] is not None
            assert resultado["version"] == "1.0"

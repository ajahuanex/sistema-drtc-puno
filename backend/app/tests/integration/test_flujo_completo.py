"""
Integration Test: Flujo Completo de Documento
Tests the complete flow: registro → derivación → atención
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import uuid

from app.models.mesa_partes.documento import Documento, EstadoDocumentoEnum, PrioridadEnum
from app.models.mesa_partes.derivacion import Derivacion, EstadoDerivacionEnum
from app.models.mesa_partes.database import get_db


@pytest.mark.asyncio
class TestFlujoCompletoDocumento:
    """Test del flujo completo de un documento desde registro hasta atención"""
    
    async def test_flujo_registro_derivacion_atencion(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_area_origen,
        test_area_destino,
        test_tipo_documento
    ):
        """
        Test del flujo completo:
        1. Registrar documento
        2. Derivar a área
        3. Recibir documento
        4. Atender documento
        5. Verificar historial completo
        """
        
        # ============================================
        # PASO 1: REGISTRAR DOCUMENTO
        # ============================================
        documento_data = {
            "tipo_documento_id": str(test_tipo_documento.id),
            "numero_documento_externo": "DOC-EXT-001",
            "remitente": "Juan Pérez García",
            "asunto": "Solicitud de información pública",
            "numero_folios": 5,
            "tiene_anexos": True,
            "prioridad": "ALTA",
            "etiquetas": ["urgente", "informacion-publica"]
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/documentos",
            json=documento_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        documento_creado = response.json()
        
        # Verificar datos del documento creado
        assert documento_creado["numero_expediente"] is not None
        assert documento_creado["numero_expediente"].startswith("EXP-")
        assert documento_creado["remitente"] == "Juan Pérez García"
        assert documento_creado["estado"] == "REGISTRADO"
        assert documento_creado["prioridad"] == "ALTA"
        assert documento_creado["codigo_qr"] is not None
        
        documento_id = documento_creado["id"]
        
        # ============================================
        # PASO 2: DERIVAR DOCUMENTO
        # ============================================
        derivacion_data = {
            "documento_id": documento_id,
            "area_destino_id": str(test_area_destino.id),
            "instrucciones": "Revisar y responder en un plazo de 3 días",
            "es_urgente": True,
            "fecha_limite": (datetime.utcnow() + timedelta(days=3)).isoformat()
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/derivaciones",
            json=derivacion_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        derivacion_creada = response.json()
        
        # Verificar datos de la derivación
        assert derivacion_creada["documento_id"] == documento_id
        assert derivacion_creada["area_destino_id"] == str(test_area_destino.id)
        assert derivacion_creada["estado"] == "PENDIENTE"
        assert derivacion_creada["es_urgente"] is True
        assert derivacion_creada["fecha_derivacion"] is not None
        
        derivacion_id = derivacion_creada["id"]
        
        # Verificar que el documento cambió de estado
        response = await async_client.get(
            f"/api/v1/mesa-partes/documentos/{documento_id}",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        documento_actualizado = response.json()
        assert documento_actualizado["estado"] == "EN_PROCESO"
        assert documento_actualizado["area_actual_id"] == str(test_area_destino.id)
        
        # ============================================
        # PASO 3: RECIBIR DOCUMENTO
        # ============================================
        response = await async_client.put(
            f"/api/v1/mesa-partes/derivaciones/{derivacion_id}/recibir",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        derivacion_recibida = response.json()
        
        # Verificar que se registró la recepción
        assert derivacion_recibida["estado"] == "RECIBIDO"
        assert derivacion_recibida["fecha_recepcion"] is not None
        assert derivacion_recibida["usuario_recibe_id"] == str(test_user.id)
        
        # ============================================
        # PASO 4: ATENDER DOCUMENTO
        # ============================================
        atencion_data = {
            "observaciones": "Se revisó la solicitud y se proporcionó la información requerida. Se adjunta respuesta oficial."
        }
        
        response = await async_client.put(
            f"/api/v1/mesa-partes/derivaciones/{derivacion_id}/atender",
            json=atencion_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        derivacion_atendida = response.json()
        
        # Verificar que se registró la atención
        assert derivacion_atendida["estado"] == "ATENDIDO"
        assert derivacion_atendida["fecha_atencion"] is not None
        assert derivacion_atendida["observaciones"] == atencion_data["observaciones"]
        
        # Verificar que el documento cambió a estado ATENDIDO
        response = await async_client.get(
            f"/api/v1/mesa-partes/documentos/{documento_id}",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        documento_final = response.json()
        assert documento_final["estado"] == "ATENDIDO"
        
        # ============================================
        # PASO 5: VERIFICAR HISTORIAL COMPLETO
        # ============================================
        response = await async_client.get(
            f"/api/v1/mesa-partes/derivaciones/documento/{documento_id}",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        historial = response.json()
        
        # Verificar que el historial contiene todas las derivaciones
        assert len(historial) == 1
        assert historial[0]["id"] == derivacion_id
        assert historial[0]["estado"] == "ATENDIDO"
        
        # Verificar trazabilidad completa
        assert historial[0]["fecha_derivacion"] is not None
        assert historial[0]["fecha_recepcion"] is not None
        assert historial[0]["fecha_atencion"] is not None
        
    async def test_flujo_con_multiples_derivaciones(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_area_origen,
        test_area_destino,
        test_area_tercera,
        test_tipo_documento
    ):
        """Test de flujo con múltiples derivaciones en cadena"""
        
        # 1. Crear documento
        documento_data = {
            "tipo_documento_id": str(test_tipo_documento.id),
            "remitente": "María López",
            "asunto": "Solicitud que requiere múltiples áreas",
            "numero_folios": 3,
            "prioridad": "NORMAL"
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/documentos",
            json=documento_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        documento_id = response.json()["id"]
        
        # 2. Primera derivación
        derivacion1_data = {
            "documento_id": documento_id,
            "area_destino_id": str(test_area_destino.id),
            "instrucciones": "Revisar aspecto legal"
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/derivaciones",
            json=derivacion1_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        derivacion1_id = response.json()["id"]
        
        # 3. Atender primera derivación
        await async_client.put(
            f"/api/v1/mesa-partes/derivaciones/{derivacion1_id}/recibir",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        await async_client.put(
            f"/api/v1/mesa-partes/derivaciones/{derivacion1_id}/atender",
            json={"observaciones": "Aspecto legal revisado"},
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        # 4. Segunda derivación
        derivacion2_data = {
            "documento_id": documento_id,
            "area_destino_id": str(test_area_tercera.id),
            "instrucciones": "Revisar aspecto técnico"
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/derivaciones",
            json=derivacion2_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        derivacion2_id = response.json()["id"]
        
        # 5. Verificar historial con múltiples derivaciones
        response = await async_client.get(
            f"/api/v1/mesa-partes/derivaciones/documento/{documento_id}",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        historial = response.json()
        
        # Verificar que hay 2 derivaciones
        assert len(historial) == 2
        
        # Verificar orden cronológico
        assert historial[0]["fecha_derivacion"] < historial[1]["fecha_derivacion"]
        
    async def test_flujo_con_archivos_adjuntos(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_area_destino,
        test_tipo_documento
    ):
        """Test de flujo completo con archivos adjuntos"""
        
        # 1. Crear documento
        documento_data = {
            "tipo_documento_id": str(test_tipo_documento.id),
            "remitente": "Carlos Ruiz",
            "asunto": "Solicitud con documentación adjunta",
            "numero_folios": 10,
            "tiene_anexos": True,
            "prioridad": "ALTA"
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/documentos",
            json=documento_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        documento_id = response.json()["id"]
        
        # 2. Adjuntar archivos
        files = {
            "archivo": ("documento.pdf", b"PDF content", "application/pdf")
        }
        
        response = await async_client.post(
            f"/api/v1/mesa-partes/documentos/{documento_id}/archivos",
            files=files,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        archivo_adjunto = response.json()
        assert archivo_adjunto["nombre_archivo"] == "documento.pdf"
        
        # 3. Derivar documento
        derivacion_data = {
            "documento_id": documento_id,
            "area_destino_id": str(test_area_destino.id),
            "instrucciones": "Revisar documentación adjunta"
        }
        
        response = await async_client.post(
            "/api/v1/mesa-partes/derivaciones",
            json=derivacion_data,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 201
        
        # 4. Verificar que el documento con archivos se puede consultar
        response = await async_client.get(
            f"/api/v1/mesa-partes/documentos/{documento_id}",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        documento = response.json()
        assert len(documento["archivos_adjuntos"]) == 1
        assert documento["archivos_adjuntos"][0]["nombre_archivo"] == "documento.pdf"

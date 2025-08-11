#!/usr/bin/env python3
"""Servicio mock para oficinas del sistema DRTC Puno"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from bson import ObjectId
from app.models.oficina import (
    Oficina, OficinaCreate, OficinaUpdate, OficinaResponse,
    TipoOficina, PrioridadOficina, EstadoOficina
)
from app.models.usuario import UsuarioInDB
from app.services.mock_data import mock_service

class MockOficinaService:
    """Servicio mock para gestión de oficinas"""
    
    def __init__(self):
        self.oficinas: Dict[str, Oficina] = {}
        self._generar_datos_mock()
    
    def _generar_datos_mock(self):
        """Generar datos mock de oficinas"""
        
        # Oficina de Recepción
        oficina_recepcion = Oficina(
            id=str(ObjectId()),
            nombre="OFICINA DE RECEPCIÓN",
            tipo=TipoOficina.RECEPCION,
            responsable={
                "id": "admin_001",
                "nombres": "MARÍA",
                "apellidos": "GONZÁLEZ",
                "cargo": "JEFE DE RECEPCIÓN",
                "telefono": "051-123456",
                "email": "recepcion@drtc-puno.gob.pe"
            },
            ubicacion="PLANTA BAJA - ÁREA DE ATENCIÓN AL PÚBLICO",
            telefono="051-123456",
            email="recepcion@drtc-puno.gob.pe",
            horarioAtencion="08:00 - 17:00",
            tiempoEstimadoProcesamiento=1,
            capacidadMaxima=200,
            prioridad=PrioridadOficina.ALTA,
            estado=EstadoOficina.ACTIVA,
            dependencias=[],
            permisos=["RECEPCIONAR_DOCUMENTOS", "ASIGNAR_OFICINAS"]
        )
        
        # Oficina de Revisión Técnica
        oficina_revision = Oficina(
            id=str(ObjectId()),
            nombre="OFICINA DE REVISIÓN TÉCNICA",
            tipo=TipoOficina.REVISION_TECNICA,
            responsable={
                "id": "admin_002",
                "nombres": "CARLOS",
                "apellidos": "RODRÍGUEZ",
                "cargo": "INGENIERO TÉCNICO",
                "telefono": "051-123457",
                "email": "tecnica@drtc-puno.gob.pe"
            },
            ubicacion="PRIMER PISO - ÁREA TÉCNICA",
            telefono="051-123457",
            email="tecnica@drtc-puno.gob.pe",
            horarioAtencion="08:00 - 17:00",
            tiempoEstimadoProcesamiento=3,
            capacidadMaxima=150,
            prioridad=PrioridadOficina.ALTA,
            estado=EstadoOficina.ACTIVA,
            dependencias=[oficina_recepcion.id],
            permisos=["REVISAR_DOCUMENTOS_TECNICOS", "APROBAR_ESPECIFICACIONES"]
        )
        
        # Oficina Legal
        oficina_legal = Oficina(
            id=str(ObjectId()),
            nombre="OFICINA LEGAL",
            tipo=TipoOficina.LEGAL,
            responsable={
                "id": "admin_003",
                "nombres": "ANA",
                "apellidos": "MARTÍNEZ",
                "cargo": "ABOGADA",
                "telefono": "051-123458",
                "email": "legal@drtc-puno.gob.pe"
            },
            ubicacion="SEGUNDO PISO - ÁREA LEGAL",
            telefono="051-123458",
            email="legal@drtc-puno.gob.pe",
            horarioAtencion="08:00 - 17:00",
            tiempoEstimadoProcesamiento=5,
            capacidadMaxima=100,
            prioridad=PrioridadOficina.MEDIA,
            estado=EstadoOficina.ACTIVA,
            dependencias=[oficina_recepcion.id, oficina_revision.id],
            permisos=["REVISAR_ASPECTOS_LEGALES", "APROBAR_CONTRATOS"]
        )
        
        # Oficina Financiera
        oficina_financiera = Oficina(
            id=str(ObjectId()),
            nombre="OFICINA FINANCIERA",
            tipo=TipoOficina.FINANCIERA,
            responsable={
                "id": "admin_004",
                "nombres": "LUIS",
                "apellidos": "PÉREZ",
                "cargo": "CONTADOR",
                "telefono": "051-123459",
                "email": "financiera@drtc-puno.gob.pe"
            },
            ubicacion="PRIMER PISO - ÁREA ADMINISTRATIVA",
            telefono="051-123459",
            email="financiera@drtc-puno.gob.pe",
            horarioAtencion="08:00 - 17:00",
            tiempoEstimadoProcesamiento=2,
            capacidadMaxima=120,
            prioridad=PrioridadOficina.MEDIA,
            estado=EstadoOficina.ACTIVA,
            dependencias=[oficina_recepcion.id],
            permisos=["REVISAR_PAGOS", "APROBAR_PRESUPUESTOS"]
        )
        
        # Oficina de Aprobación
        oficina_aprobacion = Oficina(
            id=str(ObjectId()),
            nombre="OFICINA DE APROBACIÓN",
            tipo=TipoOficina.APROBACION,
            responsable={
                "id": "admin_005",
                "nombres": "ROBERTO",
                "apellidos": "SÁNCHEZ",
                "cargo": "DIRECTOR ADMINISTRATIVO",
                "telefono": "051-123460",
                "email": "aprobacion@drtc-puno.gob.pe"
            },
            ubicacion="TERCER PISO - DIRECCIÓN",
            telefono="051-123460",
            email="aprobacion@drtc-puno.gob.pe",
            horarioAtencion="08:00 - 17:00",
            tiempoEstimadoProcesamiento=1,
            capacidadMaxima=80,
            prioridad=PrioridadOficina.ALTA,
            estado=EstadoOficina.ACTIVA,
            dependencias=[oficina_recepcion.id, oficina_revision.id, oficina_legal.id, oficina_financiera.id],
            permisos=["APROBAR_EXPEDIENTES", "FIRMAR_RESOLUCIONES"]
        )
        
        # Oficina de Fiscalización
        oficina_fiscalizacion = Oficina(
            id=str(ObjectId()),
            nombre="OFICINA DE FISCALIZACIÓN",
            tipo=TipoOficina.FISCALIZACION,
            responsable={
                "id": "admin_006",
                "nombres": "PATRICIA",
                "apellidos": "LÓPEZ",
                "cargo": "FISCALIZADORA",
                "telefono": "051-123461",
                "email": "fiscalizacion@drtc-puno.gob.pe"
            },
            ubicacion="PLANTA BAJA - ÁREA DE FISCALIZACIÓN",
            telefono="051-123461",
            email="fiscalizacion@drtc-puno.gob.pe",
            horarioAtencion="08:00 - 17:00",
            tiempoEstimadoProcesamiento=4,
            capacidadMaxima=90,
            prioridad=PrioridadOficina.MEDIA,
            estado=EstadoOficina.ACTIVA,
            dependencias=[oficina_recepcion.id],
            permisos=["FISCALIZAR_EMPRESAS", "EMITIR_SANCIONES"]
        )
        
        # Oficina de Archivo
        oficina_archivo = Oficina(
            id=str(ObjectId()),
            nombre="OFICINA DE ARCHIVO",
            tipo=TipoOficina.ARCHIVO,
            responsable={
                "id": "admin_007",
                "nombres": "JORGE",
                "apellidos": "TORRES",
                "cargo": "ARCHIVISTA",
                "telefono": "051-123462",
                "email": "archivo@drtc-puno.gob.pe"
            },
            ubicacion="SÓTANO - DEPÓSITO DOCUMENTARIO",
            telefono="051-123462",
            email="archivo@drtc-puno.gob.pe",
            horarioAtencion="08:00 - 17:00",
            tiempoEstimadoProcesamiento=1,
            capacidadMaxima=500,
            prioridad=PrioridadOficina.BAJA,
            estado=EstadoOficina.ACTIVA,
            dependencias=[oficina_aprobacion.id],
            permisos=["ARCHIVAR_DOCUMENTOS", "CONSULTAR_HISTORIAL"]
        )
        
        # Agregar todas las oficinas al diccionario
        self.oficinas[oficina_recepcion.id] = oficina_recepcion
        self.oficinas[oficina_revision.id] = oficina_revision
        self.oficinas[oficina_legal.id] = oficina_legal
        self.oficinas[oficina_financiera.id] = oficina_financiera
        self.oficinas[oficina_aprobacion.id] = oficina_aprobacion
        self.oficinas[oficina_fiscalizacion.id] = oficina_fiscalizacion
        self.oficinas[oficina_archivo.id] = oficina_archivo
        
        print(f"🏢 Generadas {len(self.oficinas)} oficinas mock para el sistema DRTC Puno")
    
    async def create_oficina(self, oficina_data: OficinaCreate) -> OficinaResponse:
        """Crear una nueva oficina"""
        # Generar ID único
        oficina_id = str(ObjectId())
        
        # Crear oficina
        oficina = Oficina(
            id=oficina_id,
            **oficina_data.model_dump()
        )
        
        # Agregar a la colección
        self.oficinas[oficina_id] = oficina
        
        return OficinaResponse(**oficina.model_dump())
    
    async def get_oficina(self, oficina_id: str) -> Optional[OficinaResponse]:
        """Obtener una oficina por ID"""
        oficina = self.oficinas.get(oficina_id)
        if oficina:
            return OficinaResponse(**oficina.model_dump())
        return None
    
    async def get_oficinas(self, skip: int = 0, limit: int = 100) -> List[OficinaResponse]:
        """Obtener lista de oficinas"""
        oficinas_list = list(self.oficinas.values())
        return [OficinaResponse(**oficina.model_dump()) for oficina in oficinas_list[skip:skip + limit]]
    
    async def update_oficina(self, oficina_id: str, oficina_data: OficinaUpdate) -> Optional[OficinaResponse]:
        """Actualizar una oficina"""
        if oficina_id not in self.oficinas:
            return None
        
        oficina = self.oficinas[oficina_id]
        
        # Actualizar campos
        update_data = oficina_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(oficina, field, value)
        
        oficina.fechaActualizacion = datetime.now(timezone.utc)
        
        return OficinaResponse(**oficina.model_dump())
    
    async def delete_oficina(self, oficina_id: str) -> bool:
        """Eliminar una oficina"""
        if oficina_id in self.oficinas:
            del self.oficinas[oficina_id]
            return True
        return False
    
    async def get_expedientes_por_oficina(self, oficina_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Obtener expedientes en una oficina específica"""
        # Simular expedientes en la oficina
        expedientes = []
        
        # Generar algunos expedientes de ejemplo para cada oficina
        for i in range(5):
            expediente = {
                "id": f"exp_{oficina_id}_{i}",
                "numero": f"EXP-2025-{i+1:03d}",
                "tipo": "SOLICITUD_TUC",
                "empresa": f"Empresa Test {i+1}",
                "estado": "EN_REVISION",
                "fechaLlegada": datetime.now(timezone.utc).isoformat(),
                "tiempoEstimado": 3,
                "urgencia": "NORMAL"
            }
            expedientes.append(expediente)
        
        return expedientes[skip:skip + limit]
    
    async def mover_expediente(self, expediente_id: str, nueva_oficina_id: str, 
                              usuario_id: str, motivo: str, observaciones: str = None) -> bool:
        """Mover un expediente a otra oficina"""
        # Simular movimiento exitoso
        print(f"📋 Expediente {expediente_id} movido a oficina {nueva_oficina_id}")
        print(f"👤 Usuario: {usuario_id}")
        print(f"📝 Motivo: {motivo}")
        if observaciones:
            print(f"💬 Observaciones: {observaciones}")
        
        return True
    
    async def get_estadisticas_oficina(self, oficina_id: str) -> Dict[str, Any]:
        """Obtener estadísticas de una oficina"""
        if oficina_id not in self.oficinas:
            return {}
        
        oficina = self.oficinas[oficina_id]
        
        # Simular estadísticas
        estadisticas = {
            "oficina": oficina.nombre,
            "tipo": oficina.tipo,
            "totalExpedientes": 25,
            "expedientesEnCola": 8,
            "expedientesEnProceso": 12,
            "expedientesCompletados": 5,
            "tiempoPromedioProcesamiento": oficina.tiempoEstimadoProcesamiento,
            "capacidadUtilizada": "25%",
            "estado": oficina.estado,
            "ultimaActualizacion": datetime.now(timezone.utc).isoformat()
        }
        
        return estadisticas

# Instancia global del servicio mock
mock_oficina_service = MockOficinaService() 
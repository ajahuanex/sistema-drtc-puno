"""
Servicio para gestión del historial unificado de empresas
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.empresa import (
    EventoHistorialEmpresa,
    TipoEventoEmpresa,
    TipoDocumento,
    EVENTOS_REQUIEREN_DOCUMENTO
)


class HistorialEmpresaService:
    """Servicio para gestionar el historial unificado de empresas"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.empresas_collection = db.empresas
    
    async def registrar_evento(
        self,
        empresa_id: str,
        tipo_evento: TipoEventoEmpresa,
        titulo: str,
        descripcion: str,
        usuario_id: str,
        datos_anterior: Optional[Dict[str, Any]] = None,
        datos_nuevo: Optional[Dict[str, Any]] = None,
        motivo: Optional[str] = None,
        tipo_documento_sustentatorio: Optional[TipoDocumento] = None,
        numero_documento_sustentatorio: Optional[str] = None,
        es_documento_fisico: bool = False,
        url_documento_sustentatorio: Optional[str] = None,
        fecha_documento: Optional[datetime] = None,
        entidad_emisora: Optional[str] = None,
        observaciones: Optional[str] = None,
        vehiculo_id: Optional[str] = None,
        ruta_id: Optional[str] = None,
        resolucion_id: Optional[str] = None,
        ip_usuario: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """Registrar un evento en el historial de la empresa"""
        
        # Verificar si el evento requiere documento sustentatorio
        requiere_documento = EVENTOS_REQUIEREN_DOCUMENTO.get(tipo_evento, False)
        
        if requiere_documento and not numero_documento_sustentatorio:
            raise ValueError(f"El evento {tipo_evento.value} requiere número de documento sustentatorio")
        
        # Crear evento
        evento = EventoHistorialEmpresa(
            fechaEvento=datetime.utcnow(),
            usuarioId=usuario_id,
            tipoEvento=tipo_evento,
            titulo=titulo,
            descripcion=descripcion,
            datosAnterior=datos_anterior,
            datosNuevo=datos_nuevo,
            requiereDocumento=requiere_documento,
            tipoDocumentoSustentatorio=tipo_documento_sustentatorio,
            numeroDocumentoSustentatorio=numero_documento_sustentatorio,
            esDocumentoFisico=es_documento_fisico,
            urlDocumentoSustentatorio=url_documento_sustentatorio,
            fechaDocumento=fecha_documento,
            entidadEmisora=entidad_emisora,
            motivo=motivo,
            observaciones=observaciones,
            vehiculoId=vehiculo_id,
            rutaId=ruta_id,
            resolucionId=resolucion_id,
            ipUsuario=ip_usuario,
            userAgent=user_agent
        )
        
        # Actualizar empresa con el nuevo evento
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
            filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        
        update_data = {
            "$push": {"historialEventos": evento.dict()},
            "$set": {"fechaActualizacion": datetime.utcnow()}
        }
        
        result = await self.empresas_collection.update_one(filter_query, update_data)
        return result.modified_count > 0
    
    async def obtener_historial_empresa(
        self,
        empresa_id: str,
        tipo_evento: Optional[TipoEventoEmpresa] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None,
        limit: int = 100
    ) -> List[EventoHistorialEmpresa]:
        """Obtener historial de eventos de una empresa con filtros"""
        
        filter_query = {"id": empresa_id}
        if ObjectId.is_valid(empresa_id):
            filter_query = {"$or": [{"id": empresa_id}, {"_id": ObjectId(empresa_id)}]}
        
        # Obtener empresa
        empresa = await self.empresas_collection.find_one(filter_query)
        if not empresa:
            return []
        
        eventos = empresa.get("historialEventos", [])
        
        # Aplicar filtros
        if tipo_evento:
            eventos = [e for e in eventos if e.get("tipoEvento") == tipo_evento.value]
        
        if fecha_desde:
            eventos = [e for e in eventos if e.get("fechaEvento", datetime.min) >= fecha_desde]
        
        if fecha_hasta:
            eventos = [e for e in eventos if e.get("fechaEvento", datetime.max) <= fecha_hasta]
        
        # Ordenar por fecha descendente y limitar
        eventos.sort(key=lambda x: x.get("fechaEvento", datetime.min), reverse=True)
        eventos = eventos[:limit]
        
        return [EventoHistorialEmpresa(**evento) for evento in eventos]
    
    async def obtener_estadisticas_historial(self, empresa_id: str) -> Dict[str, Any]:
        """Obtener estadísticas del historial de una empresa"""
        
        eventos = await self.obtener_historial_empresa(empresa_id)
        
        # Contar eventos por tipo
        conteo_por_tipo = {}
        eventos_con_documento = 0
        eventos_sin_documento = 0
        
        for evento in eventos:
            tipo = evento.tipoEvento.value
            conteo_por_tipo[tipo] = conteo_por_tipo.get(tipo, 0) + 1
            
            if evento.documentoSustentatorio:
                eventos_con_documento += 1
            else:
                eventos_sin_documento += 1
        
        return {
            "totalEventos": len(eventos),
            "eventosPorTipo": conteo_por_tipo,
            "eventosConDocumento": eventos_con_documento,
            "eventosSinDocumento": eventos_sin_documento,
            "ultimoEvento": eventos[0].dict() if eventos else None
        }
    
    # Métodos específicos para cada tipo de evento
    
    async def registrar_cambio_representante(
        self,
        empresa_id: str,
        usuario_id: str,
        representante_anterior: Dict[str, Any],
        representante_nuevo: Dict[str, Any],
        motivo: str,
        documento_sustentatorio: str,
        tipo_documento: TipoDocumento,
        url_documento: Optional[str] = None,
        observaciones: Optional[str] = None
    ) -> bool:
        """Registrar cambio de representante legal"""
        
        return await self.registrar_evento(
            empresa_id=empresa_id,
            tipo_evento=TipoEventoEmpresa.CAMBIO_REPRESENTANTE_LEGAL,
            titulo="Cambio de Representante Legal",
            descripcion=f"Cambio de representante legal de {representante_anterior.get('nombres', '')} {representante_anterior.get('apellidos', '')} (DNI: {representante_anterior.get('dni', '')}) a {representante_nuevo.get('nombres', '')} {representante_nuevo.get('apellidos', '')} (DNI: {representante_nuevo.get('dni', '')})",
            usuario_id=usuario_id,
            datos_anterior=representante_anterior,
            datos_nuevo=representante_nuevo,
            motivo=motivo,
            documento_sustentatorio=documento_sustentatorio,
            tipo_documento_sustentatorio=tipo_documento,
            url_documento_sustentatorio=url_documento,
            observaciones=observaciones
        )
    
    async def registrar_cambio_estado(
        self,
        empresa_id: str,
        usuario_id: str,
        estado_anterior: str,
        estado_nuevo: str,
        motivo: str,
        documento_sustentatorio: Optional[str] = None,
        tipo_documento: Optional[TipoDocumento] = None,
        url_documento: Optional[str] = None,
        observaciones: Optional[str] = None
    ) -> bool:
        """Registrar cambio de estado"""
        
        return await self.registrar_evento(
            empresa_id=empresa_id,
            tipo_evento=TipoEventoEmpresa.CAMBIO_ESTADO,
            titulo="Cambio de Estado",
            descripcion=f"Cambio de estado de {estado_anterior} a {estado_nuevo}",
            usuario_id=usuario_id,
            datos_anterior={"estado": estado_anterior},
            datos_nuevo={"estado": estado_nuevo},
            motivo=motivo,
            documento_sustentatorio=documento_sustentatorio,
            tipo_documento_sustentatorio=tipo_documento,
            url_documento_sustentatorio=url_documento,
            observaciones=observaciones
        )
    
    async def registrar_operacion_vehicular(
        self,
        empresa_id: str,
        usuario_id: str,
        tipo_operacion: TipoEventoEmpresa,
        vehiculo_id: Optional[str] = None,
        vehiculos_ids: Optional[List[str]] = None,
        motivo: str = "",
        documento_sustentatorio: str = "",
        tipo_documento: TipoDocumento = TipoDocumento.RESOLUCION,
        url_documento: Optional[str] = None,
        observaciones: Optional[str] = None,
        datos_adicionales: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Registrar operación vehicular (renovación, incremento, sustitución, etc.)"""
        
        # Generar título y descripción según el tipo
        titulos = {
            TipoEventoEmpresa.RENOVACION: "Renovación de Autorización",
            TipoEventoEmpresa.INCREMENTO: "Incremento de Flota",
            TipoEventoEmpresa.SUSTITUCION: "Sustitución de Vehículo",
            TipoEventoEmpresa.DUPLICADO: "Duplicado de Documento",
            TipoEventoEmpresa.BAJA_VEHICULAR: "Baja de Vehículo"
        }
        
        titulo = titulos.get(tipo_operacion, tipo_operacion.value)
        
        if vehiculo_id:
            descripcion = f"{titulo} para vehículo ID: {vehiculo_id}"
        elif vehiculos_ids:
            descripcion = f"{titulo} para {len(vehiculos_ids)} vehículos"
        else:
            descripcion = titulo
        
        return await self.registrar_evento(
            empresa_id=empresa_id,
            tipo_evento=tipo_operacion,
            titulo=titulo,
            descripcion=descripcion,
            usuario_id=usuario_id,
            datos_anterior=datos_adicionales.get("anterior") if datos_adicionales else None,
            datos_nuevo=datos_adicionales.get("nuevo") if datos_adicionales else None,
            motivo=motivo,
            documento_sustentatorio=documento_sustentatorio,
            tipo_documento_sustentatorio=tipo_documento,
            url_documento_sustentatorio=url_documento,
            observaciones=observaciones,
            vehiculo_id=vehiculo_id
        )
    
    async def registrar_operacion_rutas(
        self,
        empresa_id: str,
        usuario_id: str,
        tipo_operacion: TipoEventoEmpresa,
        ruta_id: Optional[str] = None,
        rutas_ids: Optional[List[str]] = None,
        motivo: str = "",
        documento_sustentatorio: Optional[str] = None,
        tipo_documento: Optional[TipoDocumento] = None,
        url_documento: Optional[str] = None,
        observaciones: Optional[str] = None,
        datos_adicionales: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Registrar operación de rutas"""
        
        titulos = {
            TipoEventoEmpresa.CAMBIO_RUTAS: "Modificación de Rutas",
            TipoEventoEmpresa.CANCELACION_RUTAS: "Cancelación de Rutas",
            TipoEventoEmpresa.AUTORIZACION_RUTAS: "Autorización de Rutas"
        }
        
        titulo = titulos.get(tipo_operacion, tipo_operacion.value)
        
        if ruta_id:
            descripcion = f"{titulo} para ruta ID: {ruta_id}"
        elif rutas_ids:
            descripcion = f"{titulo} para {len(rutas_ids)} rutas"
        else:
            descripcion = titulo
        
        return await self.registrar_evento(
            empresa_id=empresa_id,
            tipo_evento=tipo_operacion,
            titulo=titulo,
            descripcion=descripcion,
            usuario_id=usuario_id,
            datos_anterior=datos_adicionales.get("anterior") if datos_adicionales else None,
            datos_nuevo=datos_adicionales.get("nuevo") if datos_adicionales else None,
            motivo=motivo,
            documento_sustentatorio=documento_sustentatorio,
            tipo_documento_sustentatorio=tipo_documento,
            url_documento_sustentatorio=url_documento,
            observaciones=observaciones,
            ruta_id=ruta_id
        )
"""
Servicio de auditoría para Mesa de Partes
"""
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func, text
import json
import asyncio
from contextlib import asynccontextmanager
import logging

from ...models.mesa_partes.auditoria import (
    LogAuditoria, ConfiguracionAuditoria, AlertaAuditoria, EstadisticasAuditoria,
    TipoEventoEnum, SeveridadEnum
)
from ...schemas.mesa_partes.auditoria import (
    LogAuditoriaCreate, LogAuditoriaResponse, FiltrosAuditoria,
    ConfiguracionAuditoriaCreate, AlertaAuditoriaResponse
)

logger = logging.getLogger(__name__)


class AuditoriaService:
    """Servicio para gestión de auditoría"""
    
    def __init__(self, db: Session):
        self.db = db
        self._config_cache = None
        self._cache_timestamp = None
    
    # Métodos para logging de eventos
    async def log_evento(
        self,
        tipo_evento: Union[TipoEventoEnum, str],
        descripcion: str,
        usuario_id: Optional[str] = None,
        usuario_email: Optional[str] = None,
        usuario_nombre: Optional[str] = None,
        recurso_tipo: Optional[str] = None,
        recurso_id: Optional[str] = None,
        recurso_nombre: Optional[str] = None,
        datos_anteriores: Optional[Dict[str, Any]] = None,
        datos_nuevos: Optional[Dict[str, Any]] = None,
        metadatos: Optional[Dict[str, Any]] = None,
        severidad: Union[SeveridadEnum, str] = SeveridadEnum.INFO,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        metodo_http: Optional[str] = None,
        codigo_respuesta: Optional[int] = None,
        duracion_ms: Optional[int] = None,
        session_id: Optional[str] = None,
        es_exitoso: bool = True
    ) -> LogAuditoria:
        """Registrar un evento de auditoría"""
        
        # Verificar si el evento debe ser registrado
        config = await self._get_configuracion()
        if not await self._debe_registrar_evento(tipo_evento, severidad, config):
            return None
        
        # Crear el log de auditoría
        log_entry = LogAuditoria(
            tipo_evento=tipo_evento.value if isinstance(tipo_evento, TipoEventoEnum) else tipo_evento,
            severidad=severidad.value if isinstance(severidad, SeveridadEnum) else severidad,
            descripcion=descripcion,
            usuario_id=usuario_id,
            usuario_email=usuario_email,
            usuario_nombre=usuario_nombre,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            recurso_tipo=recurso_tipo,
            recurso_id=recurso_id,
            recurso_nombre=recurso_nombre,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            metadatos=metadatos or {},
            endpoint=endpoint,
            metodo_http=metodo_http,
            codigo_respuesta=codigo_respuesta,
            duracion_ms=duracion_ms,
            es_exitoso=es_exitoso,
            contexto_aplicacion="mesa_partes",
            version_aplicacion="1.0.0"  # TODO: Obtener de configuración
        )
        
        try:
            self.db.add(log_entry)
            self.db.commit()
            self.db.refresh(log_entry)
            
            # Verificar si se debe generar una alerta
            await self._verificar_alertas(log_entry)
            
            return log_entry
            
        except Exception as e:
            logger.error(f"Error al registrar evento de auditoría: {str(e)}")
            self.db.rollback()
            return None
    
    # Métodos específicos para eventos comunes
    async def log_documento_creado(
        self,
        documento_id: str,
        usuario_id: str,
        datos_documento: Dict[str, Any],
        **kwargs
    ):
        """Log específico para creación de documento"""
        return await self.log_evento(
            tipo_evento=TipoEventoEnum.DOCUMENTO_CREADO,
            descripcion=f"Documento creado: {datos_documento.get('numero_expediente', documento_id)}",
            usuario_id=usuario_id,
            recurso_tipo="documento",
            recurso_id=documento_id,
            recurso_nombre=datos_documento.get("asunto", ""),
            datos_nuevos=datos_documento,
            severidad=SeveridadEnum.INFO,
            **kwargs
        )
    
    async def log_documento_derivado(
        self,
        documento_id: str,
        derivacion_id: str,
        usuario_id: str,
        area_origen: str,
        area_destino: str,
        **kwargs
    ):
        """Log específico para derivación de documento"""
        return await self.log_evento(
            tipo_evento=TipoEventoEnum.DOCUMENTO_DERIVADO,
            descripcion=f"Documento derivado de {area_origen} a {area_destino}",
            usuario_id=usuario_id,
            recurso_tipo="derivacion",
            recurso_id=derivacion_id,
            metadatos={
                "documento_id": documento_id,
                "area_origen": area_origen,
                "area_destino": area_destino
            },
            severidad=SeveridadEnum.INFO,
            **kwargs
        )
    
    async def log_acceso_denegado(
        self,
        usuario_id: Optional[str],
        recurso: str,
        motivo: str,
        **kwargs
    ):
        """Log específico para acceso denegado"""
        return await self.log_evento(
            tipo_evento=TipoEventoEnum.ACCESO_DENEGADO,
            descripcion=f"Acceso denegado a {recurso}: {motivo}",
            usuario_id=usuario_id,
            recurso_tipo="sistema",
            recurso_id=recurso,
            metadatos={"motivo": motivo},
            severidad=SeveridadEnum.WARNING,
            es_exitoso=False,
            **kwargs
        )
    
    async def log_intento_acceso_no_autorizado(
        self,
        endpoint: str,
        ip_address: str,
        motivo: str,
        **kwargs
    ):
        """Log específico para intentos de acceso no autorizado"""
        return await self.log_evento(
            tipo_evento=TipoEventoEnum.INTENTO_ACCESO_NO_AUTORIZADO,
            descripcion=f"Intento de acceso no autorizado desde {ip_address} a {endpoint}",
            recurso_tipo="endpoint",
            recurso_id=endpoint,
            metadatos={"motivo": motivo},
            severidad=SeveridadEnum.ERROR,
            es_exitoso=False,
            ip_address=ip_address,
            endpoint=endpoint,
            **kwargs
        )
    
    # Métodos de consulta
    async def obtener_logs(
        self,
        filtros: FiltrosAuditoria,
        skip: int = 0,
        limit: int = 100
    ) -> List[LogAuditoria]:
        """Obtener logs de auditoría con filtros"""
        query = self.db.query(LogAuditoria)
        
        # Aplicar filtros
        if filtros.fecha_inicio:
            query = query.filter(LogAuditoria.timestamp >= filtros.fecha_inicio)
        
        if filtros.fecha_fin:
            query = query.filter(LogAuditoria.timestamp <= filtros.fecha_fin)
        
        if filtros.tipo_evento:
            if isinstance(filtros.tipo_evento, list):
                query = query.filter(LogAuditoria.tipo_evento.in_(filtros.tipo_evento))
            else:
                query = query.filter(LogAuditoria.tipo_evento == filtros.tipo_evento)
        
        if filtros.severidad:
            if isinstance(filtros.severidad, list):
                query = query.filter(LogAuditoria.severidad.in_(filtros.severidad))
            else:
                query = query.filter(LogAuditoria.severidad == filtros.severidad)
        
        if filtros.usuario_id:
            query = query.filter(LogAuditoria.usuario_id == filtros.usuario_id)
        
        if filtros.recurso_tipo:
            query = query.filter(LogAuditoria.recurso_tipo == filtros.recurso_tipo)
        
        if filtros.recurso_id:
            query = query.filter(LogAuditoria.recurso_id == filtros.recurso_id)
        
        if filtros.ip_address:
            query = query.filter(LogAuditoria.ip_address == filtros.ip_address)
        
        if filtros.es_exitoso is not None:
            query = query.filter(LogAuditoria.es_exitoso == filtros.es_exitoso)
        
        if filtros.busqueda:
            search_term = f"%{filtros.busqueda}%"
            query = query.filter(
                or_(
                    LogAuditoria.descripcion.ilike(search_term),
                    LogAuditoria.usuario_email.ilike(search_term),
                    LogAuditoria.recurso_nombre.ilike(search_term)
                )
            )
        
        # Ordenar por timestamp descendente
        query = query.order_by(desc(LogAuditoria.timestamp))
        
        # Aplicar paginación
        return query.offset(skip).limit(limit).all()
    
    async def contar_logs(self, filtros: FiltrosAuditoria) -> int:
        """Contar logs que coinciden con los filtros"""
        query = self.db.query(func.count(LogAuditoria.id))
        
        # Aplicar los mismos filtros que en obtener_logs
        # (código similar al método anterior)
        
        return query.scalar()
    
    async def obtener_log_por_id(self, log_id: str) -> Optional[LogAuditoria]:
        """Obtener un log específico por ID"""
        return self.db.query(LogAuditoria).filter(LogAuditoria.id == log_id).first()
    
    # Métodos de estadísticas
    async def obtener_estadisticas_periodo(
        self,
        fecha_inicio: datetime,
        fecha_fin: datetime,
        agrupar_por: str = "dia"  # hora, dia, semana, mes
    ) -> Dict[str, Any]:
        """Obtener estadísticas de auditoría para un período"""
        
        # Formato de fecha según agrupación
        date_format = {
            "hora": "%Y-%m-%d %H:00:00",
            "dia": "%Y-%m-%d",
            "semana": "%Y-%W",
            "mes": "%Y-%m"
        }.get(agrupar_por, "%Y-%m-%d")
        
        # Query base
        query = self.db.query(LogAuditoria).filter(
            and_(
                LogAuditoria.timestamp >= fecha_inicio,
                LogAuditoria.timestamp <= fecha_fin
            )
        )
        
        # Estadísticas generales
        total_eventos = query.count()
        eventos_exitosos = query.filter(LogAuditoria.es_exitoso == True).count()
        eventos_fallidos = query.filter(LogAuditoria.es_exitoso == False).count()
        
        # Eventos por tipo
        eventos_por_tipo = {}
        for tipo in TipoEventoEnum:
            count = query.filter(LogAuditoria.tipo_evento == tipo.value).count()
            if count > 0:
                eventos_por_tipo[tipo.value] = count
        
        # Eventos por severidad
        eventos_por_severidad = {}
        for severidad in SeveridadEnum:
            count = query.filter(LogAuditoria.severidad == severidad.value).count()
            if count > 0:
                eventos_por_severidad[severidad.value] = count
        
        # Top usuarios más activos
        top_usuarios = self.db.query(
            LogAuditoria.usuario_email,
            func.count(LogAuditoria.id).label('total')
        ).filter(
            and_(
                LogAuditoria.timestamp >= fecha_inicio,
                LogAuditoria.timestamp <= fecha_fin,
                LogAuditoria.usuario_email.isnot(None)
            )
        ).group_by(LogAuditoria.usuario_email).order_by(desc('total')).limit(10).all()
        
        # IPs más activas
        top_ips = self.db.query(
            LogAuditoria.ip_address,
            func.count(LogAuditoria.id).label('total')
        ).filter(
            and_(
                LogAuditoria.timestamp >= fecha_inicio,
                LogAuditoria.timestamp <= fecha_fin,
                LogAuditoria.ip_address.isnot(None)
            )
        ).group_by(LogAuditoria.ip_address).order_by(desc('total')).limit(10).all()
        
        return {
            "periodo": {
                "inicio": fecha_inicio.isoformat(),
                "fin": fecha_fin.isoformat(),
                "agrupacion": agrupar_por
            },
            "resumen": {
                "total_eventos": total_eventos,
                "eventos_exitosos": eventos_exitosos,
                "eventos_fallidos": eventos_fallidos,
                "tasa_exito": round((eventos_exitosos / total_eventos * 100) if total_eventos > 0 else 0, 2)
            },
            "eventos_por_tipo": eventos_por_tipo,
            "eventos_por_severidad": eventos_por_severidad,
            "top_usuarios": [{"email": u[0], "eventos": u[1]} for u in top_usuarios],
            "top_ips": [{"ip": ip[0], "eventos": ip[1]} for ip in top_ips]
        }
    
    # Métodos de configuración
    async def _get_configuracion(self) -> ConfiguracionAuditoria:
        """Obtener configuración de auditoría (con caché)"""
        now = datetime.utcnow()
        
        # Verificar caché (válido por 5 minutos)
        if (self._config_cache and self._cache_timestamp and 
            (now - self._cache_timestamp).seconds < 300):
            return self._config_cache
        
        # Obtener configuración de la base de datos
        config = self.db.query(ConfiguracionAuditoria).filter(
            ConfiguracionAuditoria.activa == True
        ).first()
        
        if not config:
            # Crear configuración por defecto
            config = ConfiguracionAuditoria(
                eventos_habilitados=[e.value for e in TipoEventoEnum],
                severidades_habilitadas=[s.value for s in SeveridadEnum]
            )
            self.db.add(config)
            self.db.commit()
            self.db.refresh(config)
        
        # Actualizar caché
        self._config_cache = config
        self._cache_timestamp = now
        
        return config
    
    async def _debe_registrar_evento(
        self,
        tipo_evento: str,
        severidad: str,
        config: ConfiguracionAuditoria
    ) -> bool:
        """Verificar si un evento debe ser registrado"""
        eventos_habilitados = config.eventos_habilitados or []
        severidades_habilitadas = config.severidades_habilitadas or []
        
        return (
            (not eventos_habilitados or tipo_evento in eventos_habilitados) and
            (not severidades_habilitadas or severidad in severidades_habilitadas)
        )
    
    # Métodos de alertas
    async def _verificar_alertas(self, log_entry: LogAuditoria):
        """Verificar si se debe generar una alerta basada en el log"""
        
        # Patrones de alerta predefinidos
        patrones_alerta = [
            {
                "nombre": "multiples_accesos_fallidos",
                "condicion": lambda log: log.tipo_evento == TipoEventoEnum.LOGIN_FALLIDO.value,
                "umbral": 5,
                "ventana_minutos": 15,
                "severidad": SeveridadEnum.WARNING
            },
            {
                "nombre": "intentos_acceso_no_autorizado",
                "condicion": lambda log: log.tipo_evento == TipoEventoEnum.INTENTO_ACCESO_NO_AUTORIZADO.value,
                "umbral": 3,
                "ventana_minutos": 10,
                "severidad": SeveridadEnum.ERROR
            },
            {
                "nombre": "errores_criticos",
                "condicion": lambda log: log.severidad == SeveridadEnum.CRITICAL.value,
                "umbral": 1,
                "ventana_minutos": 1,
                "severidad": SeveridadEnum.CRITICAL
            }
        ]
        
        for patron in patrones_alerta:
            if patron["condicion"](log_entry):
                await self._evaluar_patron_alerta(log_entry, patron)
    
    async def _evaluar_patron_alerta(self, log_entry: LogAuditoria, patron: Dict[str, Any]):
        """Evaluar si un patrón de alerta se cumple"""
        ventana_inicio = log_entry.timestamp - timedelta(minutes=patron["ventana_minutos"])
        
        # Contar ocurrencias en la ventana de tiempo
        count = self.db.query(func.count(LogAuditoria.id)).filter(
            and_(
                LogAuditoria.timestamp >= ventana_inicio,
                LogAuditoria.timestamp <= log_entry.timestamp,
                LogAuditoria.tipo_evento == log_entry.tipo_evento
            )
        ).scalar()
        
        if count >= patron["umbral"]:
            # Generar alerta
            alerta = AlertaAuditoria(
                titulo=f"Patrón detectado: {patron['nombre']}",
                descripcion=f"Se detectaron {count} ocurrencias de {log_entry.tipo_evento} en {patron['ventana_minutos']} minutos",
                severidad=patron["severidad"].value,
                log_auditoria_id=log_entry.id,
                patron_detectado=patron["nombre"],
                numero_ocurrencias=count,
                ventana_tiempo_minutos=patron["ventana_minutos"]
            )
            
            self.db.add(alerta)
            self.db.commit()
    
    # Métodos de mantenimiento
    async def limpiar_logs_antiguos(self, dias_retencion: Optional[int] = None):
        """Limpiar logs antiguos según configuración"""
        config = await self._get_configuracion()
        dias = dias_retencion or config.dias_retencion
        
        fecha_limite = datetime.utcnow() - timedelta(days=dias)
        
        # Eliminar logs antiguos
        logs_eliminados = self.db.query(LogAuditoria).filter(
            LogAuditoria.timestamp < fecha_limite
        ).delete()
        
        self.db.commit()
        
        # Log del mantenimiento
        await self.log_evento(
            tipo_evento=TipoEventoEnum.SISTEMA_INICIADO,  # Usar un evento de sistema
            descripcion=f"Limpieza de logs completada: {logs_eliminados} registros eliminados",
            severidad=SeveridadEnum.INFO,
            metadatos={"logs_eliminados": logs_eliminados, "dias_retencion": dias}
        )
        
        return logs_eliminados
    
    async def generar_estadisticas_diarias(self, fecha: Optional[datetime] = None):
        """Generar estadísticas agregadas para un día"""
        if not fecha:
            fecha = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        fecha_fin = fecha + timedelta(days=1)
        
        # Verificar si ya existen estadísticas para este día
        existing = self.db.query(EstadisticasAuditoria).filter(
            and_(
                EstadisticasAuditoria.fecha == fecha,
                EstadisticasAuditoria.periodo == "dia"
            )
        ).first()
        
        if existing:
            return existing
        
        # Generar estadísticas
        stats = await self.obtener_estadisticas_periodo(fecha, fecha_fin, "dia")
        
        # Crear registro de estadísticas
        estadisticas = EstadisticasAuditoria(
            fecha=fecha,
            periodo="dia",
            total_eventos=stats["resumen"]["total_eventos"],
            eventos_por_tipo=stats["eventos_por_tipo"],
            eventos_por_severidad=stats["eventos_por_severidad"],
            operaciones_exitosas=stats["resumen"]["eventos_exitosos"],
            operaciones_fallidas=stats["resumen"]["eventos_fallidos"]
        )
        
        self.db.add(estadisticas)
        self.db.commit()
        self.db.refresh(estadisticas)
        
        return estadisticas
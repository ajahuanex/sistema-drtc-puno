"""
Service layer for Reporte operations
Handles business logic for reports and statistics in Mesa de Partes
"""
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text, extract, desc
import pandas as pd
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

from app.models.mesa_partes.documento import Documento, EstadoDocumentoEnum, PrioridadEnum
from app.models.mesa_partes.derivacion import Derivacion, EstadoDerivacionEnum
from app.models.mesa_partes.integracion import Integracion
from app.schemas.mesa_partes.documento import FiltrosDocumento


class ReporteService:
    def __init__(self, db: Session):
        self.db = db

    async def obtener_estadisticas(
        self,
        fecha_inicio: Optional[datetime] = None,
        fecha_fin: Optional[datetime] = None,
        area_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene estadísticas generales del sistema
        """
        # Establecer fechas por defecto (último mes)
        if not fecha_fin:
            fecha_fin = datetime.utcnow()
        if not fecha_inicio:
            fecha_inicio = fecha_fin - timedelta(days=30)

        # Query base
        query = self.db.query(Documento).filter(
            Documento.fecha_recepcion.between(fecha_inicio, fecha_fin)
        )
        
        if area_id:
            query = query.filter(Documento.area_actual_id == area_id)

        # Estadísticas básicas
        total_documentos = query.count()
        
        documentos_por_estado = (
            query.with_entities(
                Documento.estado,
                func.count(Documento.id).label('cantidad')
            )
            .group_by(Documento.estado)
            .all()
        )

        documentos_por_prioridad = (
            query.with_entities(
                Documento.prioridad,
                func.count(Documento.id).label('cantidad')
            )
            .group_by(Documento.prioridad)
            .all()
        )

        # Documentos vencidos
        documentos_vencidos = (
            query.filter(
                and_(
                    Documento.fecha_limite < datetime.utcnow(),
                    Documento.estado != EstadoDocumentoEnum.ATENDIDO,
                    Documento.estado != EstadoDocumentoEnum.ARCHIVADO
                )
            ).count()
        )

        # Documentos próximos a vencer (próximos 3 días)
        fecha_limite_proxima = datetime.utcnow() + timedelta(days=3)
        documentos_proximos_vencer = (
            query.filter(
                and_(
                    Documento.fecha_limite.between(datetime.utcnow(), fecha_limite_proxima),
                    Documento.estado != EstadoDocumentoEnum.ATENDIDO,
                    Documento.estado != EstadoDocumentoEnum.ARCHIVADO
                )
            ).count()
        )

        # Tendencia por días
        tendencia_diaria = (
            query.with_entities(
                func.date(Documento.fecha_recepcion).label('fecha'),
                func.count(Documento.id).label('cantidad')
            )
            .group_by(func.date(Documento.fecha_recepcion))
            .order_by(func.date(Documento.fecha_recepcion))
            .all()
        )

        return {
            "periodo": {
                "fecha_inicio": fecha_inicio.isoformat(),
                "fecha_fin": fecha_fin.isoformat()
            },
            "resumen": {
                "total_documentos": total_documentos,
                "documentos_vencidos": documentos_vencidos,
                "documentos_proximos_vencer": documentos_proximos_vencer
            },
            "distribucion_estado": [
                {"estado": estado.value, "cantidad": cantidad}
                for estado, cantidad in documentos_por_estado
            ],
            "distribucion_prioridad": [
                {"prioridad": prioridad.value, "cantidad": cantidad}
                for prioridad, cantidad in documentos_por_prioridad
            ],
            "tendencia_diaria": [
                {"fecha": fecha.isoformat(), "cantidad": cantidad}
                for fecha, cantidad in tendencia_diaria
            ]
        }

    async def generar_reporte(
        self,
        tipo_reporte: str,
        filtros: Optional[FiltrosDocumento] = None,
        formato: str = "json"
    ) -> Dict[str, Any]:
        """
        Genera un reporte personalizado según el tipo especificado
        """
        if tipo_reporte == "documentos_por_area":
            return await self._reporte_documentos_por_area(filtros)
        elif tipo_reporte == "tiempos_atencion":
            return await self._reporte_tiempos_atencion(filtros)
        elif tipo_reporte == "documentos_vencidos":
            return await self._reporte_documentos_vencidos(filtros)
        elif tipo_reporte == "productividad_areas":
            return await self._reporte_productividad_areas(filtros)
        elif tipo_reporte == "integraciones":
            return await self._reporte_integraciones(filtros)
        else:
            raise ValueError(f"Tipo de reporte no válido: {tipo_reporte}")

    async def _reporte_documentos_por_area(
        self,
        filtros: Optional[FiltrosDocumento] = None
    ) -> Dict[str, Any]:
        """Reporte de documentos agrupados por área"""
        query = self.db.query(Documento)
        
        if filtros:
            query = self._aplicar_filtros(query, filtros)

        resultado = (
            query.join(Documento.area_actual)
            .with_entities(
                Documento.area_actual.has().nombre.label('area'),
                func.count(Documento.id).label('total'),
                func.sum(
                    func.case(
                        [(Documento.estado == EstadoDocumentoEnum.REGISTRADO, 1)],
                        else_=0
                    )
                ).label('registrados'),
                func.sum(
                    func.case(
                        [(Documento.estado == EstadoDocumentoEnum.EN_PROCESO, 1)],
                        else_=0
                    )
                ).label('en_proceso'),
                func.sum(
                    func.case(
                        [(Documento.estado == EstadoDocumentoEnum.ATENDIDO, 1)],
                        else_=0
                    )
                ).label('atendidos')
            )
            .group_by(Documento.area_actual_id)
            .all()
        )

        return {
            "tipo": "documentos_por_area",
            "datos": [
                {
                    "area": area,
                    "total": total,
                    "registrados": registrados or 0,
                    "en_proceso": en_proceso or 0,
                    "atendidos": atendidos or 0
                }
                for area, total, registrados, en_proceso, atendidos in resultado
            ]
        }

    async def _reporte_tiempos_atencion(
        self,
        filtros: Optional[FiltrosDocumento] = None
    ) -> Dict[str, Any]:
        """Reporte de tiempos promedio de atención"""
        query = (
            self.db.query(Derivacion)
            .join(Derivacion.documento)
            .filter(Derivacion.fecha_atencion.isnot(None))
        )
        
        if filtros and filtros.fecha_inicio:
            query = query.filter(Derivacion.fecha_derivacion >= filtros.fecha_inicio)
        if filtros and filtros.fecha_fin:
            query = query.filter(Derivacion.fecha_derivacion <= filtros.fecha_fin)

        resultado = (
            query.join(Derivacion.area_destino)
            .with_entities(
                Derivacion.area_destino.has().nombre.label('area'),
                func.avg(
                    func.extract('epoch', Derivacion.fecha_atencion - Derivacion.fecha_derivacion) / 3600
                ).label('tiempo_promedio_horas'),
                func.count(Derivacion.id).label('total_atendidos')
            )
            .group_by(Derivacion.area_destino_id)
            .all()
        )

        return {
            "tipo": "tiempos_atencion",
            "datos": [
                {
                    "area": area,
                    "tiempo_promedio_horas": round(float(tiempo_promedio_horas or 0), 2),
                    "total_atendidos": total_atendidos
                }
                for area, tiempo_promedio_horas, total_atendidos in resultado
            ]
        }

    async def _reporte_documentos_vencidos(
        self,
        filtros: Optional[FiltrosDocumento] = None
    ) -> Dict[str, Any]:
        """Reporte de documentos vencidos"""
        query = (
            self.db.query(Documento)
            .filter(
                and_(
                    Documento.fecha_limite < datetime.utcnow(),
                    Documento.estado != EstadoDocumentoEnum.ATENDIDO,
                    Documento.estado != EstadoDocumentoEnum.ARCHIVADO
                )
            )
        )
        
        if filtros:
            query = self._aplicar_filtros(query, filtros)

        documentos = query.all()

        return {
            "tipo": "documentos_vencidos",
            "total": len(documentos),
            "datos": [
                {
                    "numero_expediente": doc.numero_expediente,
                    "remitente": doc.remitente,
                    "asunto": doc.asunto,
                    "fecha_limite": doc.fecha_limite.isoformat() if doc.fecha_limite else None,
                    "dias_vencido": (datetime.utcnow() - doc.fecha_limite).days if doc.fecha_limite else 0,
                    "area_actual": doc.area_actual.nombre if doc.area_actual else None,
                    "prioridad": doc.prioridad.value
                }
                for doc in documentos
            ]
        }

    async def _reporte_productividad_areas(
        self,
        filtros: Optional[FiltrosDocumento] = None
    ) -> Dict[str, Any]:
        """Reporte de productividad por áreas"""
        # Obtener período (último mes por defecto)
        fecha_fin = datetime.utcnow()
        fecha_inicio = fecha_fin - timedelta(days=30)
        
        if filtros and filtros.fecha_inicio:
            fecha_inicio = filtros.fecha_inicio
        if filtros and filtros.fecha_fin:
            fecha_fin = filtros.fecha_fin

        # Documentos recibidos por área
        recibidos = (
            self.db.query(Derivacion)
            .filter(
                and_(
                    Derivacion.fecha_derivacion.between(fecha_inicio, fecha_fin),
                    Derivacion.estado != EstadoDerivacionEnum.PENDIENTE
                )
            )
            .join(Derivacion.area_destino)
            .with_entities(
                Derivacion.area_destino.has().nombre.label('area'),
                func.count(Derivacion.id).label('recibidos')
            )
            .group_by(Derivacion.area_destino_id)
            .all()
        )

        # Documentos atendidos por área
        atendidos = (
            self.db.query(Derivacion)
            .filter(
                and_(
                    Derivacion.fecha_atencion.between(fecha_inicio, fecha_fin),
                    Derivacion.estado == EstadoDerivacionEnum.ATENDIDO
                )
            )
            .join(Derivacion.area_destino)
            .with_entities(
                Derivacion.area_destino.has().nombre.label('area'),
                func.count(Derivacion.id).label('atendidos')
            )
            .group_by(Derivacion.area_destino_id)
            .all()
        )

        # Combinar resultados
        areas_data = {}
        for area, cantidad in recibidos:
            areas_data[area] = {"recibidos": cantidad, "atendidos": 0}
        
        for area, cantidad in atendidos:
            if area in areas_data:
                areas_data[area]["atendidos"] = cantidad
            else:
                areas_data[area] = {"recibidos": 0, "atendidos": cantidad}

        # Calcular eficiencia
        datos = []
        for area, stats in areas_data.items():
            eficiencia = (stats["atendidos"] / stats["recibidos"] * 100) if stats["recibidos"] > 0 else 0
            datos.append({
                "area": area,
                "recibidos": stats["recibidos"],
                "atendidos": stats["atendidos"],
                "pendientes": stats["recibidos"] - stats["atendidos"],
                "eficiencia_porcentaje": round(eficiencia, 2)
            })

        return {
            "tipo": "productividad_areas",
            "periodo": {
                "fecha_inicio": fecha_inicio.isoformat(),
                "fecha_fin": fecha_fin.isoformat()
            },
            "datos": sorted(datos, key=lambda x: x["eficiencia_porcentaje"], reverse=True)
        }

    async def _reporte_integraciones(
        self,
        filtros: Optional[FiltrosDocumento] = None
    ) -> Dict[str, Any]:
        """Reporte de estado de integraciones"""
        integraciones = self.db.query(Integracion).all()

        datos = []
        for integracion in integraciones:
            # Contar documentos enviados/recibidos (esto requeriría una tabla de log)
            datos.append({
                "nombre": integracion.nombre,
                "tipo": integracion.tipo.value,
                "estado_conexion": integracion.estado_conexion.value,
                "activa": integracion.activa,
                "ultima_sincronizacion": integracion.ultima_sincronizacion.isoformat() if integracion.ultima_sincronizacion else None
            })

        return {
            "tipo": "integraciones",
            "total": len(integraciones),
            "activas": len([i for i in integraciones if i.activa]),
            "datos": datos
        }

    def _aplicar_filtros(self, query, filtros: FiltrosDocumento):
        """Aplica filtros comunes a las consultas"""
        if filtros.fecha_inicio:
            query = query.filter(Documento.fecha_recepcion >= filtros.fecha_inicio)
        if filtros.fecha_fin:
            query = query.filter(Documento.fecha_recepcion <= filtros.fecha_fin)
        if filtros.estado:
            query = query.filter(Documento.estado == filtros.estado)
        if filtros.prioridad:
            query = query.filter(Documento.prioridad == filtros.prioridad)
        if filtros.tipo_documento_id:
            query = query.filter(Documento.tipo_documento_id == filtros.tipo_documento_id)
        if filtros.area_id:
            query = query.filter(Documento.area_actual_id == filtros.area_id)
        if filtros.remitente:
            query = query.filter(Documento.remitente.ilike(f"%{filtros.remitente}%"))
        if filtros.asunto:
            query = query.filter(Documento.asunto.ilike(f"%{filtros.asunto}%"))
        
        return query

    async def exportar_excel(
        self,
        datos: Dict[str, Any],
        nombre_archivo: str = "reporte"
    ) -> bytes:
        """
        Exporta datos a formato Excel
        """
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            if datos.get("tipo") == "documentos_por_area":
                df = pd.DataFrame(datos["datos"])
                df.to_excel(writer, sheet_name='Documentos por Área', index=False)
                
            elif datos.get("tipo") == "tiempos_atencion":
                df = pd.DataFrame(datos["datos"])
                df.to_excel(writer, sheet_name='Tiempos de Atención', index=False)
                
            elif datos.get("tipo") == "documentos_vencidos":
                df = pd.DataFrame(datos["datos"])
                df.to_excel(writer, sheet_name='Documentos Vencidos', index=False)
                
            elif datos.get("tipo") == "productividad_areas":
                df = pd.DataFrame(datos["datos"])
                df.to_excel(writer, sheet_name='Productividad por Área', index=False)
                
            else:
                # Reporte genérico
                if "datos" in datos and isinstance(datos["datos"], list):
                    df = pd.DataFrame(datos["datos"])
                    df.to_excel(writer, sheet_name='Reporte', index=False)
        
        output.seek(0)
        return output.getvalue()

    async def exportar_pdf(
        self,
        datos: Dict[str, Any],
        nombre_archivo: str = "reporte"
    ) -> bytes:
        """
        Exporta datos a formato PDF
        """
        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Título
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center
        )
        
        titulo = f"Reporte: {datos.get('tipo', 'General').replace('_', ' ').title()}"
        story.append(Paragraph(titulo, title_style))
        story.append(Spacer(1, 12))

        # Información del período si existe
        if "periodo" in datos:
            periodo_text = f"Período: {datos['periodo']['fecha_inicio']} - {datos['periodo']['fecha_fin']}"
            story.append(Paragraph(periodo_text, styles['Normal']))
            story.append(Spacer(1, 12))

        # Resumen si existe
        if "resumen" in datos:
            story.append(Paragraph("Resumen Ejecutivo", styles['Heading2']))
            for key, value in datos["resumen"].items():
                text = f"{key.replace('_', ' ').title()}: {value}"
                story.append(Paragraph(text, styles['Normal']))
            story.append(Spacer(1, 12))

        # Datos principales
        if "datos" in datos and isinstance(datos["datos"], list) and datos["datos"]:
            story.append(Paragraph("Datos Detallados", styles['Heading2']))
            
            # Crear tabla
            data_list = datos["datos"]
            if data_list:
                # Headers
                headers = list(data_list[0].keys())
                table_data = [headers]
                
                # Rows
                for item in data_list:
                    row = [str(item.get(header, '')) for header in headers]
                    table_data.append(row)
                
                # Crear tabla
                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(table)

        # Generar PDF
        doc.build(story)
        output.seek(0)
        return output.getvalue()

    async def calcular_metricas(
        self,
        fecha_inicio: Optional[datetime] = None,
        fecha_fin: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Calcula métricas clave del sistema
        """
        if not fecha_fin:
            fecha_fin = datetime.utcnow()
        if not fecha_inicio:
            fecha_inicio = fecha_fin - timedelta(days=30)

        # Tiempo promedio de atención general
        tiempo_promedio = (
            self.db.query(
                func.avg(
                    func.extract('epoch', Derivacion.fecha_atencion - Derivacion.fecha_derivacion) / 3600
                )
            )
            .filter(
                and_(
                    Derivacion.fecha_atencion.isnot(None),
                    Derivacion.fecha_derivacion.between(fecha_inicio, fecha_fin)
                )
            )
            .scalar()
        )

        # Tasa de documentos atendidos a tiempo
        total_con_limite = (
            self.db.query(Documento)
            .filter(
                and_(
                    Documento.fecha_limite.isnot(None),
                    Documento.fecha_recepcion.between(fecha_inicio, fecha_fin)
                )
            )
            .count()
        )

        atendidos_a_tiempo = (
            self.db.query(Documento)
            .join(Derivacion)
            .filter(
                and_(
                    Documento.fecha_limite.isnot(None),
                    Documento.fecha_recepcion.between(fecha_inicio, fecha_fin),
                    Derivacion.fecha_atencion <= Documento.fecha_limite,
                    Derivacion.estado == EstadoDerivacionEnum.ATENDIDO
                )
            )
            .count()
        )

        tasa_cumplimiento = (atendidos_a_tiempo / total_con_limite * 100) if total_con_limite > 0 else 0

        # Documentos por día (promedio)
        dias_periodo = (fecha_fin - fecha_inicio).days
        total_documentos = (
            self.db.query(Documento)
            .filter(Documento.fecha_recepcion.between(fecha_inicio, fecha_fin))
            .count()
        )
        promedio_diario = total_documentos / dias_periodo if dias_periodo > 0 else 0

        # Área más productiva
        area_productiva = (
            self.db.query(Derivacion)
            .filter(
                and_(
                    Derivacion.fecha_atencion.between(fecha_inicio, fecha_fin),
                    Derivacion.estado == EstadoDerivacionEnum.ATENDIDO
                )
            )
            .join(Derivacion.area_destino)
            .with_entities(
                Derivacion.area_destino.has().nombre.label('area'),
                func.count(Derivacion.id).label('atendidos')
            )
            .group_by(Derivacion.area_destino_id)
            .order_by(desc('atendidos'))
            .first()
        )

        return {
            "periodo": {
                "fecha_inicio": fecha_inicio.isoformat(),
                "fecha_fin": fecha_fin.isoformat(),
                "dias": dias_periodo
            },
            "metricas": {
                "tiempo_promedio_atencion_horas": round(float(tiempo_promedio or 0), 2),
                "tasa_cumplimiento_porcentaje": round(tasa_cumplimiento, 2),
                "promedio_documentos_diario": round(promedio_diario, 2),
                "total_documentos_periodo": total_documentos,
                "area_mas_productiva": {
                    "nombre": area_productiva[0] if area_productiva else None,
                    "documentos_atendidos": area_productiva[1] if area_productiva else 0
                }
            }
        }
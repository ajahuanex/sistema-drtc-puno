"""
Migration script for Mesa de Partes database models
"""
from sqlalchemy import create_engine
from .base import Base, DATABASE_URL
from .documento import Documento, TipoDocumento, ArchivoAdjunto
from .derivacion import Derivacion
from .integracion import Integracion, LogSincronizacion
from .notificacion import Notificacion, Alerta
import logging

logger = logging.getLogger(__name__)

def create_tables(database_url: str = DATABASE_URL):
    """
    Crear todas las tablas de Mesa de Partes en la base de datos
    """
    try:
        engine = create_engine(database_url)
        
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        
        logger.info("✅ Tablas de Mesa de Partes creadas exitosamente")
        
        # Insertar datos iniciales
        insert_initial_data(engine)
        
    except Exception as e:
        logger.error(f"❌ Error creando tablas de Mesa de Partes: {str(e)}")
        raise

def insert_initial_data(engine):
    """
    Insertar datos iniciales en las tablas
    """
    from sqlalchemy.orm import sessionmaker
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Insertar tipos de documento iniciales
        tipos_documento_iniciales = [
            {
                "codigo": "SOL",
                "nombre": "Solicitud",
                "descripcion": "Solicitud general de trámite"
            },
            {
                "codigo": "OFC",
                "nombre": "Oficio",
                "descripcion": "Oficio institucional"
            },
            {
                "codigo": "MEM",
                "nombre": "Memorándum",
                "descripcion": "Memorándum interno"
            },
            {
                "codigo": "CAR",
                "nombre": "Carta",
                "descripcion": "Carta formal"
            },
            {
                "codigo": "INF",
                "nombre": "Informe",
                "descripcion": "Informe técnico o administrativo"
            },
            {
                "codigo": "REC",
                "nombre": "Recurso",
                "descripcion": "Recurso de apelación o reconsideración"
            },
            {
                "codigo": "DEN",
                "nombre": "Denuncia",
                "descripcion": "Denuncia o queja"
            },
            {
                "codigo": "CON",
                "nombre": "Consulta",
                "descripcion": "Consulta o petición de información"
            }
        ]
        
        for tipo_data in tipos_documento_iniciales:
            # Verificar si ya existe
            existing = session.query(TipoDocumento).filter_by(codigo=tipo_data["codigo"]).first()
            if not existing:
                tipo_documento = TipoDocumento(**tipo_data)
                session.add(tipo_documento)
        
        # Insertar alertas predefinidas
        alertas_iniciales = [
            {
                "nombre": "Documentos próximos a vencer",
                "descripcion": "Alerta para documentos que vencen en 3 días",
                "tipo": "VENCIMIENTO",
                "condicion_sql": """
                    SELECT id FROM documentos 
                    WHERE fecha_limite IS NOT NULL 
                    AND fecha_limite <= NOW() + INTERVAL '3 days'
                    AND estado != 'ATENDIDO'
                    AND estado != 'ARCHIVADO'
                """,
                "frecuencia_minutos": 1440,  # Diario
                "plantilla_titulo": "Documentos próximos a vencer",
                "plantilla_mensaje": "Hay {count} documentos que vencen en los próximos 3 días",
                "prioridad_notificacion": "ALTA"
            },
            {
                "nombre": "Documentos vencidos",
                "descripcion": "Alerta para documentos ya vencidos",
                "tipo": "VENCIMIENTO",
                "condicion_sql": """
                    SELECT id FROM documentos 
                    WHERE fecha_limite IS NOT NULL 
                    AND fecha_limite < NOW()
                    AND estado != 'ATENDIDO'
                    AND estado != 'ARCHIVADO'
                """,
                "frecuencia_minutos": 480,  # Cada 8 horas
                "plantilla_titulo": "Documentos vencidos",
                "plantilla_mensaje": "Hay {count} documentos vencidos que requieren atención",
                "prioridad_notificacion": "URGENTE"
            },
            {
                "nombre": "Documentos urgentes sin atender",
                "descripcion": "Alerta para documentos urgentes pendientes",
                "tipo": "URGENTE",
                "condicion_sql": """
                    SELECT id FROM documentos 
                    WHERE prioridad = 'URGENTE'
                    AND estado = 'EN_PROCESO'
                    AND created_at < NOW() - INTERVAL '2 hours'
                """,
                "frecuencia_minutos": 120,  # Cada 2 horas
                "plantilla_titulo": "Documentos urgentes pendientes",
                "plantilla_mensaje": "Hay {count} documentos urgentes sin atender por más de 2 horas",
                "prioridad_notificacion": "URGENTE"
            }
        ]
        
        for alerta_data in alertas_iniciales:
            # Verificar si ya existe
            existing = session.query(Alerta).filter_by(nombre=alerta_data["nombre"]).first()
            if not existing:
                alerta = Alerta(**alerta_data)
                session.add(alerta)
        
        session.commit()
        logger.info("✅ Datos iniciales insertados exitosamente")
        
    except Exception as e:
        session.rollback()
        logger.error(f"❌ Error insertando datos iniciales: {str(e)}")
        raise
    finally:
        session.close()

def drop_tables(database_url: str = DATABASE_URL):
    """
    Eliminar todas las tablas de Mesa de Partes (usar con precaución)
    """
    try:
        engine = create_engine(database_url)
        Base.metadata.drop_all(bind=engine)
        logger.info("✅ Tablas de Mesa de Partes eliminadas exitosamente")
    except Exception as e:
        logger.error(f"❌ Error eliminando tablas de Mesa de Partes: {str(e)}")
        raise

if __name__ == "__main__":
    # Ejecutar migración
    create_tables()
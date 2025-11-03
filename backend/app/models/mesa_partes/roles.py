"""
Modelos para sistema de roles y permisos de Mesa de Partes
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Table, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from enum import Enum

from .database import Base


class RolEnum(str, Enum):
    """Enum para roles del sistema"""
    ADMINISTRADOR = "administrador"
    OPERADOR_MESA = "operador_mesa"
    USUARIO_AREA = "usuario_area"
    CONSULTA = "consulta"


class PermisoEnum(str, Enum):
    """Enum para permisos del sistema"""
    # Permisos de documentos
    CREAR_DOCUMENTO = "crear_documento"
    LEER_DOCUMENTO = "leer_documento"
    ACTUALIZAR_DOCUMENTO = "actualizar_documento"
    ELIMINAR_DOCUMENTO = "eliminar_documento"
    ARCHIVAR_DOCUMENTO = "archivar_documento"
    
    # Permisos de derivación
    DERIVAR_DOCUMENTO = "derivar_documento"
    RECIBIR_DOCUMENTO = "recibir_documento"
    ATENDER_DOCUMENTO = "atender_documento"
    
    # Permisos de integración
    CONFIGURAR_INTEGRACION = "configurar_integracion"
    USAR_INTEGRACION = "usar_integracion"
    
    # Permisos de reportes
    GENERAR_REPORTES = "generar_reportes"
    VER_ESTADISTICAS = "ver_estadisticas"
    
    # Permisos de administración
    GESTIONAR_USUARIOS = "gestionar_usuarios"
    GESTIONAR_ROLES = "gestionar_roles"
    VER_AUDITORIA = "ver_auditoria"
    
    # Permisos de notificaciones
    ENVIAR_NOTIFICACIONES = "enviar_notificaciones"
    CONFIGURAR_ALERTAS = "configurar_alertas"


# Tabla de asociación muchos a muchos entre roles y permisos
rol_permiso_association = Table(
    'rol_permisos',
    Base.metadata,
    Column('rol_id', UUID(as_uuid=True), ForeignKey('roles.id'), primary_key=True),
    Column('permiso_id', UUID(as_uuid=True), ForeignKey('permisos.id'), primary_key=True)
)

# Tabla de asociación muchos a muchos entre usuarios y roles
usuario_rol_association = Table(
    'usuario_roles',
    Base.metadata,
    Column('usuario_id', UUID(as_uuid=True), ForeignKey('usuarios.id'), primary_key=True),
    Column('rol_id', UUID(as_uuid=True), ForeignKey('roles.id'), primary_key=True)
)


class Rol(Base):
    """Modelo para roles del sistema"""
    __tablename__ = "roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(Text)
    activo = Column(Boolean, default=True)
    es_sistema = Column(Boolean, default=False)  # Roles del sistema no se pueden eliminar
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    permisos = relationship("Permiso", secondary=rol_permiso_association, back_populates="roles")
    usuarios = relationship("Usuario", secondary=usuario_rol_association, back_populates="roles")


class Permiso(Base):
    """Modelo para permisos del sistema"""
    __tablename__ = "permisos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    categoria = Column(String(50))  # documentos, derivaciones, integraciones, etc.
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    roles = relationship("Rol", secondary=rol_permiso_association, back_populates="permisos")


class PermisoUsuario(Base):
    """Permisos específicos asignados directamente a usuarios (sobrescribe roles)"""
    __tablename__ = "permisos_usuario"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey('usuarios.id'), nullable=False)
    permiso_id = Column(UUID(as_uuid=True), ForeignKey('permisos.id'), nullable=False)
    concedido = Column(Boolean, default=True)  # True = conceder, False = denegar
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey('usuarios.id'))
    
    # Relationships
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    permiso = relationship("Permiso")
    creado_por = relationship("Usuario", foreign_keys=[created_by])
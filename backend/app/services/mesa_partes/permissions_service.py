"""
Servicio para gestión de permisos y roles
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ...models.mesa_partes.roles import (
    Rol, Permiso, PermisoUsuario, RolEnum, PermisoEnum,
    rol_permiso_association, usuario_rol_association
)
from ...schemas.mesa_partes.permissions import (
    RolCreate, RolUpdate, PermisoCreate, PermisoUsuarioCreate
)


class PermissionsService:
    """Servicio para gestión de permisos y roles"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Métodos para Roles
    async def crear_rol(self, rol_data: RolCreate) -> Rol:
        """Crear un nuevo rol"""
        rol = Rol(
            nombre=rol_data.nombre,
            descripcion=rol_data.descripcion,
            activo=rol_data.activo
        )
        
        self.db.add(rol)
        self.db.commit()
        self.db.refresh(rol)
        
        # Asignar permisos si se proporcionan
        if rol_data.permisos_ids:
            await self._asignar_permisos_a_rol(rol.id, rol_data.permisos_ids)
        
        return rol
    
    async def obtener_rol(self, rol_id: str) -> Optional[Rol]:
        """Obtener un rol por ID"""
        return self.db.query(Rol).filter(Rol.id == rol_id).first()
    
    async def listar_roles(self, activos_solo: bool = True) -> List[Rol]:
        """Listar todos los roles"""
        query = self.db.query(Rol)
        if activos_solo:
            query = query.filter(Rol.activo == True)
        return query.all()
    
    async def actualizar_rol(self, rol_id: str, rol_data: RolUpdate) -> Optional[Rol]:
        """Actualizar un rol"""
        rol = await self.obtener_rol(rol_id)
        if not rol:
            return None
        
        # No permitir actualizar roles del sistema
        if rol.es_sistema:
            raise ValueError("No se pueden modificar roles del sistema")
        
        for field, value in rol_data.dict(exclude_unset=True).items():
            if field != "permisos_ids":
                setattr(rol, field, value)
        
        self.db.commit()
        self.db.refresh(rol)
        
        # Actualizar permisos si se proporcionan
        if rol_data.permisos_ids is not None:
            await self._asignar_permisos_a_rol(rol.id, rol_data.permisos_ids)
        
        return rol
    
    async def eliminar_rol(self, rol_id: str) -> bool:
        """Eliminar un rol (solo desactivar si es del sistema)"""
        rol = await self.obtener_rol(rol_id)
        if not rol:
            return False
        
        if rol.es_sistema:
            # Solo desactivar roles del sistema
            rol.activo = False
            self.db.commit()
        else:
            # Eliminar roles personalizados
            self.db.delete(rol)
            self.db.commit()
        
        return True
    
    # Métodos para Permisos
    async def crear_permiso(self, permiso_data: PermisoCreate) -> Permiso:
        """Crear un nuevo permiso"""
        permiso = Permiso(
            nombre=permiso_data.nombre,
            descripcion=permiso_data.descripcion,
            categoria=permiso_data.categoria,
            activo=permiso_data.activo
        )
        
        self.db.add(permiso)
        self.db.commit()
        self.db.refresh(permiso)
        
        return permiso
    
    async def listar_permisos(self, categoria: Optional[str] = None) -> List[Permiso]:
        """Listar permisos, opcionalmente filtrados por categoría"""
        query = self.db.query(Permiso).filter(Permiso.activo == True)
        if categoria:
            query = query.filter(Permiso.categoria == categoria)
        return query.all()
    
    # Métodos para asignación de permisos
    async def asignar_rol_a_usuario(self, usuario_id: str, rol_id: str) -> bool:
        """Asignar un rol a un usuario"""
        # Verificar que el rol existe
        rol = await self.obtener_rol(rol_id)
        if not rol or not rol.activo:
            return False
        
        # Verificar si ya tiene el rol asignado
        existing = self.db.execute(
            usuario_rol_association.select().where(
                and_(
                    usuario_rol_association.c.usuario_id == usuario_id,
                    usuario_rol_association.c.rol_id == rol_id
                )
            )
        ).first()
        
        if existing:
            return True  # Ya tiene el rol
        
        # Asignar el rol
        self.db.execute(
            usuario_rol_association.insert().values(
                usuario_id=usuario_id,
                rol_id=rol_id
            )
        )
        self.db.commit()
        
        return True
    
    async def remover_rol_de_usuario(self, usuario_id: str, rol_id: str) -> bool:
        """Remover un rol de un usuario"""
        result = self.db.execute(
            usuario_rol_association.delete().where(
                and_(
                    usuario_rol_association.c.usuario_id == usuario_id,
                    usuario_rol_association.c.rol_id == rol_id
                )
            )
        )
        self.db.commit()
        
        return result.rowcount > 0
    
    async def asignar_permiso_especifico(
        self, 
        usuario_id: str, 
        permiso_id: str, 
        concedido: bool = True,
        creado_por: str = None
    ) -> PermisoUsuario:
        """Asignar un permiso específico a un usuario"""
        # Verificar si ya existe
        existing = self.db.query(PermisoUsuario).filter(
            and_(
                PermisoUsuario.usuario_id == usuario_id,
                PermisoUsuario.permiso_id == permiso_id
            )
        ).first()
        
        if existing:
            existing.concedido = concedido
            self.db.commit()
            return existing
        
        # Crear nuevo permiso específico
        permiso_usuario = PermisoUsuario(
            usuario_id=usuario_id,
            permiso_id=permiso_id,
            concedido=concedido,
            created_by=creado_por
        )
        
        self.db.add(permiso_usuario)
        self.db.commit()
        self.db.refresh(permiso_usuario)
        
        return permiso_usuario
    
    # Métodos para verificación de permisos
    async def usuario_tiene_permiso(self, usuario_id: str, permiso: str) -> bool:
        """Verificar si un usuario tiene un permiso específico"""
        # 1. Verificar permisos específicos del usuario (tienen prioridad)
        permiso_especifico = self.db.query(PermisoUsuario).join(Permiso).filter(
            and_(
                PermisoUsuario.usuario_id == usuario_id,
                Permiso.nombre == permiso,
                Permiso.activo == True
            )
        ).first()
        
        if permiso_especifico:
            return permiso_especifico.concedido
        
        # 2. Verificar permisos a través de roles
        permisos_por_roles = self.db.query(Permiso).join(
            rol_permiso_association
        ).join(Rol).join(
            usuario_rol_association
        ).filter(
            and_(
                usuario_rol_association.c.usuario_id == usuario_id,
                Rol.activo == True,
                Permiso.nombre == permiso,
                Permiso.activo == True
            )
        ).first()
        
        return permisos_por_roles is not None
    
    async def usuario_tiene_rol(self, usuario_id: str, rol: str) -> bool:
        """Verificar si un usuario tiene un rol específico"""
        resultado = self.db.query(Rol).join(
            usuario_rol_association
        ).filter(
            and_(
                usuario_rol_association.c.usuario_id == usuario_id,
                Rol.nombre == rol,
                Rol.activo == True
            )
        ).first()
        
        return resultado is not None
    
    async def obtener_permisos_usuario(self, usuario_id: str) -> List[str]:
        """Obtener todos los permisos de un usuario"""
        # Permisos a través de roles
        permisos_roles = self.db.query(Permiso.nombre).join(
            rol_permiso_association
        ).join(Rol).join(
            usuario_rol_association
        ).filter(
            and_(
                usuario_rol_association.c.usuario_id == usuario_id,
                Rol.activo == True,
                Permiso.activo == True
            )
        ).all()
        
        permisos = set([p.nombre for p in permisos_roles])
        
        # Permisos específicos del usuario
        permisos_especificos = self.db.query(PermisoUsuario).join(Permiso).filter(
            and_(
                PermisoUsuario.usuario_id == usuario_id,
                Permiso.activo == True
            )
        ).all()
        
        # Aplicar permisos específicos (pueden conceder o denegar)
        for pe in permisos_especificos:
            if pe.concedido:
                permisos.add(pe.permiso.nombre)
            else:
                permisos.discard(pe.permiso.nombre)
        
        return list(permisos)
    
    async def obtener_roles_usuario(self, usuario_id: str) -> List[str]:
        """Obtener todos los roles de un usuario"""
        roles = self.db.query(Rol.nombre).join(
            usuario_rol_association
        ).filter(
            and_(
                usuario_rol_association.c.usuario_id == usuario_id,
                Rol.activo == True
            )
        ).all()
        
        return [r.nombre for r in roles]
    
    # Métodos auxiliares
    async def _asignar_permisos_a_rol(self, rol_id: str, permisos_ids: List[str]):
        """Asignar permisos a un rol"""
        # Limpiar permisos existentes
        self.db.execute(
            rol_permiso_association.delete().where(
                rol_permiso_association.c.rol_id == rol_id
            )
        )
        
        # Asignar nuevos permisos
        for permiso_id in permisos_ids:
            self.db.execute(
                rol_permiso_association.insert().values(
                    rol_id=rol_id,
                    permiso_id=permiso_id
                )
            )
        
        self.db.commit()
    
    async def inicializar_roles_sistema(self):
        """Inicializar roles y permisos del sistema"""
        # Crear permisos básicos si no existen
        permisos_sistema = [
            ("crear_documento", "Crear documentos", "documentos"),
            ("leer_documento", "Leer documentos", "documentos"),
            ("actualizar_documento", "Actualizar documentos", "documentos"),
            ("eliminar_documento", "Eliminar documentos", "documentos"),
            ("archivar_documento", "Archivar documentos", "documentos"),
            ("derivar_documento", "Derivar documentos", "derivaciones"),
            ("recibir_documento", "Recibir documentos", "derivaciones"),
            ("atender_documento", "Atender documentos", "derivaciones"),
            ("configurar_integracion", "Configurar integraciones", "integraciones"),
            ("usar_integracion", "Usar integraciones", "integraciones"),
            ("generar_reportes", "Generar reportes", "reportes"),
            ("ver_estadisticas", "Ver estadísticas", "reportes"),
            ("gestionar_usuarios", "Gestionar usuarios", "administracion"),
            ("gestionar_roles", "Gestionar roles", "administracion"),
            ("ver_auditoria", "Ver auditoría", "administracion"),
            ("enviar_notificaciones", "Enviar notificaciones", "notificaciones"),
            ("configurar_alertas", "Configurar alertas", "notificaciones"),
        ]
        
        permisos_creados = {}
        for nombre, descripcion, categoria in permisos_sistema:
            permiso_existente = self.db.query(Permiso).filter(Permiso.nombre == nombre).first()
            if not permiso_existente:
                permiso = Permiso(
                    nombre=nombre,
                    descripcion=descripcion,
                    categoria=categoria
                )
                self.db.add(permiso)
                self.db.flush()
                permisos_creados[nombre] = permiso.id
            else:
                permisos_creados[nombre] = permiso_existente.id
        
        # Crear roles del sistema si no existen
        roles_sistema = {
            "administrador": {
                "descripcion": "Administrador del sistema con todos los permisos",
                "permisos": list(permisos_creados.keys())
            },
            "operador_mesa": {
                "descripcion": "Operador de mesa de partes",
                "permisos": [
                    "crear_documento", "leer_documento", "actualizar_documento",
                    "derivar_documento", "recibir_documento", "atender_documento",
                    "usar_integracion", "ver_estadisticas", "enviar_notificaciones"
                ]
            },
            "usuario_area": {
                "descripcion": "Usuario de área específica",
                "permisos": [
                    "leer_documento", "recibir_documento", "atender_documento",
                    "ver_estadisticas"
                ]
            },
            "consulta": {
                "descripcion": "Solo consulta de documentos",
                "permisos": ["leer_documento", "ver_estadisticas"]
            }
        }
        
        for nombre_rol, config in roles_sistema.items():
            rol_existente = self.db.query(Rol).filter(Rol.nombre == nombre_rol).first()
            if not rol_existente:
                rol = Rol(
                    nombre=nombre_rol,
                    descripcion=config["descripcion"],
                    es_sistema=True
                )
                self.db.add(rol)
                self.db.flush()
                
                # Asignar permisos al rol
                for permiso_nombre in config["permisos"]:
                    if permiso_nombre in permisos_creados:
                        self.db.execute(
                            rol_permiso_association.insert().values(
                                rol_id=rol.id,
                                permiso_id=permisos_creados[permiso_nombre]
                            )
                        )
        
        self.db.commit()
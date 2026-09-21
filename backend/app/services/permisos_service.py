from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from bson import ObjectId
import logging
from app.models.permisos_roles import (
    ModuloSistema, 
    RolPermisosConfig, 
    UsuarioPermisosResponse
)

logger = logging.getLogger(__name__)

CATALOGO_MODULOS: List[Dict[str, Any]] = [
    {
        "id": "dashboard",
        "nombre": "Dashboard General",
        "descripcion": "Indicadores globales, métricas y resumen institucional",
        "icono": "dashboard",
        "ruta": "/dashboard",
        "orden": 1
    },
    {
        "id": "empresas",
        "nombre": "Empresas de Transporte",
        "descripcion": "Padrón general, autorizaciones y expedientes de empresas",
        "icono": "business",
        "ruta": "/empresas",
        "orden": 2
    },
    {
        "id": "vehiculos",
        "nombre": "Parque Automotor",
        "descripcion": "Vehículos registrados, sustitución de flota y especificaciones",
        "icono": "directions_bus",
        "ruta": "/vehiculos",
        "orden": 3
    },
    {
        "id": "rutas",
        "nombre": "Rutas y Frecuencias",
        "descripcion": "Gestión de rutas interurbanas, itinerarios y paraderos",
        "icono": "alt_route",
        "ruta": "/rutas",
        "orden": 4
    },
    {
        "id": "resoluciones",
        "nombre": "Resoluciones Directorales",
        "descripcion": "Resoluciones primigenias, modificaciones y renovaciones",
        "icono": "description",
        "ruta": "/resoluciones",
        "orden": 5
    },
    {
        "id": "tucs",
        "nombre": "Tarjetas Únicas (TUC)",
        "descripcion": "Emisión, renovación y control de TUCs con código QR",
        "icono": "badge",
        "ruta": "/tucs",
        "orden": 6
    },
    {
        "id": "localidades",
        "nombre": "Localidades y Geometrías",
        "descripcion": "Centros poblados, distritos, provincias y capas GIS",
        "icono": "map",
        "ruta": "/localidades",
        "orden": 7
    },
    {
        "id": "infraestructura",
        "nombre": "Infraestructura Complementaria",
        "descripcion": "Terminales terrestres y estaciones de ruta autorizadas",
        "icono": "domain",
        "ruta": "/infraestructura",
        "orden": 8
    },
    {
        "id": "auditoria",
        "nombre": "Auditoría y Trazabilidad",
        "descripcion": "Logs de operaciones, historial de cambios y seguridad",
        "icono": "history",
        "ruta": "/auditoria",
        "orden": 9
    },
    {
        "id": "configuracion",
        "nombre": "Configuración y Seguridad",
        "descripcion": "Administración de usuarios, roles, parámetros e interoperabilidad",
        "icono": "settings",
        "ruta": "/configuracion",
        "orden": 10
    }
]

ROLES_DEFAULT: List[Dict[str, Any]] = [
    {
        "rolId": "oti",
        "nombre": "Oficina de Tecnología e Informática (OTI)",
        "descripcion": "Acceso total irrestricto y superusuario del sistema",
        "esSistema": True,
        "modulos": [m["id"] for m in CATALOGO_MODULOS]
    },
    {
        "rolId": "admin",
        "nombre": "Administrador del Sistema",
        "descripcion": "Gestión integral de usuarios, parámetros y todos los módulos operativos",
        "esSistema": True,
        "modulos": [m["id"] for m in CATALOGO_MODULOS]
    },
    {
        "rolId": "directivo",
        "nombre": "Directivo / Dirección Regional",
        "descripcion": "Consulta de reportes, indicadores, empresas, resoluciones y auditoría",
        "esSistema": False,
        "modulos": ["dashboard", "empresas", "vehiculos", "rutas", "resoluciones", "tucs", "infraestructura", "auditoria"]
    },
    {
        "rolId": "supervisor",
        "nombre": "Supervisor de Transporte",
        "descripcion": "Supervisión de operaciones, rutas, vehículos, terminales y auditoría",
        "esSistema": False,
        "modulos": ["dashboard", "empresas", "vehiculos", "rutas", "resoluciones", "tucs", "localidades", "infraestructura", "auditoria"]
    },
    {
        "rolId": "fiscalizador",
        "nombre": "Fiscalizador / Inspector",
        "descripcion": "Fiscalización en campo de vehículos, empresas, TUCs y verificación",
        "esSistema": False,
        "modulos": ["dashboard", "empresas", "vehiculos", "rutas", "tucs", "infraestructura", "auditoria"]
    },
    {
        "rolId": "especialista",
        "nombre": "Especialista Técnico de Transporte",
        "descripcion": "Registro y evaluación de expedientes, resoluciones, vehículos y rutas",
        "esSistema": False,
        "modulos": ["dashboard", "empresas", "vehiculos", "rutas", "resoluciones", "tucs", "localidades", "infraestructura"]
    },
    {
        "rolId": "operador",
        "nombre": "Operador de Mesa / Ventanilla",
        "descripcion": "Registro de trámites básicos, consultas de vehículos y empresas",
        "esSistema": False,
        "modulos": ["dashboard", "empresas", "vehiculos", "rutas", "resoluciones", "tucs", "localidades"]
    },
    {
        "rolId": "gerente",
        "nombre": "Gerente de Transporte",
        "descripcion": "Supervisión ejecutiva, emisión de resoluciones y control",
        "esSistema": False,
        "modulos": ["dashboard", "empresas", "vehiculos", "rutas", "resoluciones", "tucs", "infraestructura", "auditoria"]
    },
    {
        "rolId": "usuario",
        "nombre": "Usuario General / Consulta",
        "descripcion": "Consultas básicas del parque automotor y empresas",
        "esSistema": False,
        "modulos": ["dashboard", "empresas", "vehiculos", "tucs"]
    }
]

class PermisosService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.col_roles = db["roles_permisos"]
        self.col_usuarios = db["usuarios"]

    async def inicializar_roles_permisos(self):
        """Inicializa los roles y permisos por defecto si no existen"""
        try:
            await self.col_roles.create_index("rolId", unique=True, background=True)
            for r in ROLES_DEFAULT:
                existe = await self.col_roles.find_one({"rolId": r["rolId"]})
                if not existe:
                    await self.col_roles.insert_one(r)
            logger.info("Roles y permisos inicializados correctamente en MongoDB.")
        except Exception as e:
            logger.error(f"Error inicializando roles_permisos: {e}")

    def get_catalogo_modulos(self) -> List[ModuloSistema]:
        """Devuelve el catálogo de módulos del sistema ordenados"""
        return [ModuloSistema(**m) for m in sorted(CATALOGO_MODULOS, key=lambda x: x["orden"])]

    async def get_roles_permisos(self) -> List[RolPermisosConfig]:
        """Obtiene la configuración de permisos para todos los roles"""
        cursor = self.col_roles.find({})
        roles_db = await cursor.to_list(length=None)
        
        # Mapear roles existentes en BD
        db_map = {r["rolId"]: r for r in roles_db}
        
        resultado = []
        for r_def in ROLES_DEFAULT:
            rol_id = r_def["rolId"]
            if rol_id in db_map:
                r_item = db_map[rol_id]
                resultado.append(RolPermisosConfig(
                    rolId=r_item["rolId"],
                    nombre=r_item.get("nombre", r_def["nombre"]),
                    descripcion=r_item.get("descripcion", r_def["descripcion"]),
                    esSistema=r_item.get("esSistema", r_def["esSistema"]),
                    modulos=r_item.get("modulos", r_def["modulos"])
                ))
            else:
                resultado.append(RolPermisosConfig(**r_def))
                
        return resultado

    async def get_modulos_por_rol(self, rol_id: str) -> List[str]:
        """Obtiene la lista de módulos asignados a un rol específico"""
        rol_id_clean = (rol_id or "usuario").lower()
        
        # Superadministradores siempre tienen todos los módulos
        if rol_id_clean in ["admin", "oti"]:
            return [m["id"] for m in CATALOGO_MODULOS]

        doc = await self.col_roles.find_one({"rolId": rol_id_clean})
        if doc and "modulos" in doc:
            return doc["modulos"]
            
        # Fallback al catálogo por defecto
        for r in ROLES_DEFAULT:
            if r["rolId"] == rol_id_clean:
                return r["modulos"]
                
        return ["dashboard", "empresas", "vehiculos", "tucs"]

    async def update_rol_permisos(self, rol_id: str, modulos: List[str]) -> Optional[RolPermisosConfig]:
        """Actualiza los módulos asignados a un rol"""
        rol_id_clean = rol_id.lower()
        
        # OTI siempre conserva todos los módulos
        if rol_id_clean == "oti":
            modulos = [m["id"] for m in CATALOGO_MODULOS]

        update_result = await self.col_roles.update_one(
            {"rolId": rol_id_clean},
            {"$set": {"modulos": modulos}},
            upsert=True
        )
        
        doc = await self.col_roles.find_one({"rolId": rol_id_clean})
        if not doc:
            return None
            
        return RolPermisosConfig(
            rolId=doc["rolId"],
            nombre=doc.get("nombre", rol_id_clean.upper()),
            descripcion=doc.get("descripcion", ""),
            esSistema=doc.get("esSistema", False),
            modulos=doc.get("modulos", [])
        )

    async def calcular_modulos_usuario(self, usuario_doc: Dict[str, Any]) -> List[str]:
        """
        Calcula los módulos permitidos para un usuario:
        Si tiene modulosPermitidos personalizados, los usa.
        De lo contrario, hereda de su rol.
        """
        rol_id = (usuario_doc.get("rolId") or usuario_doc.get("rol_id") or "usuario").lower()
        
        # Superusuarios siempre tienen acceso total
        if rol_id in ["admin", "oti"]:
            return [m["id"] for m in CATALOGO_MODULOS]
            
        modulos_custom = usuario_doc.get("modulosPermitidos")
        if modulos_custom is not None and isinstance(modulos_custom, list) and len(modulos_custom) > 0:
            return modulos_custom
            
        return await self.get_modulos_por_rol(rol_id)

    async def get_permisos_usuario(self, usuario_id: str) -> Optional[UsuarioPermisosResponse]:
        """Obtiene el detalle de permisos y módulos de un usuario"""
        usuario = await self.col_usuarios.find_one({"_id": ObjectId(usuario_id)})
        if not usuario:
            return None
            
        rol_id = (usuario.get("rolId") or usuario.get("rol_id") or "usuario").lower()
        modulos_custom = usuario.get("modulosPermitidos")
        hereda_rol = (modulos_custom is None)
        
        modulos_calculados = await self.calcular_modulos_usuario(usuario)
        
        return UsuarioPermisosResponse(
            usuarioId=str(usuario["_id"]),
            dni=usuario.get("dni", ""),
            nombres=usuario.get("nombres", ""),
            apellidos=usuario.get("apellidos", ""),
            rolId=rol_id,
            heredaRol=hereda_rol,
            modulosPersonalizados=modulos_custom if not hereda_rol else None,
            modulosCalculados=modulos_calculados
        )

    async def update_permisos_usuario(
        self, 
        usuario_id: str, 
        modulos: Optional[List[str]], 
        heredar: bool
    ) -> Optional[UsuarioPermisosResponse]:
        """Asigna permisos personalizados a un usuario o restablece la herencia de su rol"""
        nuevo_valor = None if heredar else (modulos or [])
        
        await self.col_usuarios.update_one(
            {"_id": ObjectId(usuario_id)},
            {"$set": {"modulosPermitidos": nuevo_valor}}
        )
        
        return await self.get_permisos_usuario(usuario_id)

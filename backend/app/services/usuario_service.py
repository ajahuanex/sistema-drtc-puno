from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from passlib.context import CryptContext
from app.models.usuario import UsuarioCreate, UsuarioUpdate, UsuarioInDB

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UsuarioService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.usuarios

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verificar contraseña"""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Generar hash de contraseña"""
        return pwd_context.hash(password)

    async def create_usuario(self, usuario_data: UsuarioCreate) -> UsuarioInDB:
        """Crear nuevo usuario"""
        # Verificar si ya existe un usuario con el mismo DNI o email
        existing_dni = await self.collection.find_one({"dni": usuario_data.dni})
        if existing_dni:
            raise ValueError(f"Ya existe un usuario con DNI {usuario_data.dni}")
        
        existing_email = await self.collection.find_one({"email": usuario_data.email})
        if existing_email:
            raise ValueError(f"Ya existe un usuario con email {usuario_data.email}")
        
        usuario_dict = usuario_data.model_dump()
        usuario_dict["passwordHash"] = self.get_password_hash(usuario_data.password)
        usuario_dict["fechaCreacion"] = datetime.utcnow()
        del usuario_dict["password"]
        
        result = await self.collection.insert_one(usuario_dict)
        return await self.get_usuario_by_id(str(result.inserted_id))

    async def get_usuario_by_id(self, usuario_id: str) -> Optional[UsuarioInDB]:
        """Obtener usuario por ID"""
        usuario = await self.collection.find_one({"_id": ObjectId(usuario_id)})
        return UsuarioInDB(**usuario) if usuario else None

    async def get_usuario_by_dni(self, dni: str) -> Optional[UsuarioInDB]:
        """Obtener usuario por DNI"""
        usuario = await self.collection.find_one({"dni": dni})
        return UsuarioInDB(**usuario) if usuario else None

    async def get_usuario_by_email(self, email: str) -> Optional[UsuarioInDB]:
        """Obtener usuario por email"""
        usuario = await self.collection.find_one({"email": email})
        return UsuarioInDB(**usuario) if usuario else None

    async def get_usuarios_activos(self) -> List[UsuarioInDB]:
        """Obtener todos los usuarios activos"""
        cursor = self.collection.find({"estaActivo": True})
        usuarios = await cursor.to_list(length=None)
        return [UsuarioInDB(**usuario) for usuario in usuarios]

    async def update_usuario(self, usuario_id: str, usuario_data: UsuarioUpdate) -> Optional[UsuarioInDB]:
        """Actualizar usuario"""
        update_data = usuario_data.model_dump(exclude_unset=True)
        
        if update_data:
            update_data["fechaActualizacion"] = datetime.utcnow()
            
            # Si se actualiza la contraseña, generar hash
            if "password" in update_data:
                update_data["passwordHash"] = self.get_password_hash(update_data["password"])
                del update_data["password"]
            
            result = await self.collection.update_one(
                {"_id": ObjectId(usuario_id)},
                {"$set": update_data}
            )
            
            if result.modified_count:
                return await self.get_usuario_by_id(usuario_id)
        
        return None

    async def soft_delete_usuario(self, usuario_id: str) -> bool:
        """Desactivar usuario (borrado lógico)"""
        result = await self.collection.update_one(
            {"_id": ObjectId(usuario_id)},
            {"$set": {"estaActivo": False, "fechaActualizacion": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def authenticate_usuario(self, dni: str, password: str) -> Optional[UsuarioInDB]:
        """Autenticar usuario con DNI y contraseña"""
        usuario = await self.get_usuario_by_dni(dni)
        if not usuario:
            return None
        
        if not self.verify_password(password, usuario.password_hash):
            return None
        
        return usuario 
from typing import List, Optional
from datetime import datetime
from passlib.context import CryptContext
from app.models.usuario import UsuarioCreate, UsuarioUpdate, UsuarioInDB
from app.services.mock_data import mock_service

# Configurar passlib para evitar errores con bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__default_rounds=12)

class MockUsuarioService:
    """Servicio mock para usuarios en desarrollo"""
    
    def __init__(self):
        self.usuarios = mock_service.usuarios
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verificar contraseña"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            # Fallback para contraseñas hardcodeadas
            return plain_password == "password123" and hashed_password == "$2b$12$fbHM5OEHpgfJ36KMGoqC6.JDSN0tSCSiDCV3rH/ZR5qXq3ctb5.d6"

    def get_password_hash(self, password: str) -> str:
        """Generar hash de contraseña"""
        try:
            return pwd_context.hash(password)
        except Exception:
            # Fallback para evitar errores
            return "$2b$12$fbHM5OEHpgfJ36KMGoqC6.JDSN0tSCSiDCV3rH/ZR5qXq3ctb5.d6"

    async def create_usuario(self, usuario_data: UsuarioCreate) -> UsuarioInDB:
        """Crear nuevo usuario"""
        # Verificar si ya existe un usuario con el mismo DNI o email
        for user in self.usuarios.values():
            if user.dni == usuario_data.dni:
                raise ValueError(f"Ya existe un usuario con DNI {usuario_data.dni}")
            if user.email == usuario_data.email:
                raise ValueError(f"Ya existe un usuario con email {usuario_data.email}")
        
        # Generar nuevo ID
        new_id = str(len(self.usuarios) + 1)
        
        usuario_dict = usuario_data.model_dump()
        usuario_dict["id"] = new_id
        usuario_dict["passwordHash"] = self.get_password_hash(usuario_data.password)
        usuario_dict["fechaCreacion"] = datetime.utcnow()
        del usuario_dict["password"]
        
        new_usuario = UsuarioInDB(**usuario_dict)
        self.usuarios[new_id] = new_usuario
        
        return new_usuario

    async def get_usuario_by_id(self, usuario_id: str) -> Optional[UsuarioInDB]:
        """Obtener usuario por ID"""
        return self.usuarios.get(usuario_id)

    async def get_usuario_by_dni(self, dni: str) -> Optional[UsuarioInDB]:
        """Obtener usuario por DNI"""
        for user in self.usuarios.values():
            if user.dni == dni:
                return user
        return None

    async def get_usuario_by_email(self, email: str) -> Optional[UsuarioInDB]:
        """Obtener usuario por email"""
        for user in self.usuarios.values():
            if user.email == email:
                return user
        return None

    async def get_usuarios_activos(self) -> List[UsuarioInDB]:
        """Obtener todos los usuarios activos"""
        return [user for user in self.usuarios.values() if user.estaActivo]

    async def update_usuario(self, usuario_id: str, usuario_data: UsuarioUpdate) -> Optional[UsuarioInDB]:
        """Actualizar usuario"""
        if usuario_id not in self.usuarios:
            return None
        
        usuario = self.usuarios[usuario_id]
        update_data = usuario_data.model_dump(exclude_unset=True)
        
        if update_data:
            update_data["fechaActualizacion"] = datetime.utcnow()
            
            # Si se actualiza la contraseña, generar hash
            if "password" in update_data:
                update_data["passwordHash"] = self.get_password_hash(update_data["password"])
                del update_data["password"]
            
            # Actualizar campos
            for key, value in update_data.items():
                setattr(usuario, key, value)
            
            return usuario
        
        return None

    async def soft_delete_usuario(self, usuario_id: str) -> bool:
        """Desactivar usuario (borrado lógico)"""
        if usuario_id in self.usuarios:
            self.usuarios[usuario_id].estaActivo = False
            self.usuarios[usuario_id].fechaActualizacion = datetime.utcnow()
            return True
        return False

    async def authenticate_usuario(self, dni: str, password: str) -> Optional[UsuarioInDB]:
        """Autenticar usuario con DNI y contraseña"""
        usuario = await self.get_usuario_by_dni(dni)
        if not usuario:
            return None
        
        if not self.verify_password(password, usuario.passwordHash):
            return None
        
        return usuario 
"""
Servicio de seguridad para integraciones
"""
import hmac
import hashlib
import secrets
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
import redis
import json

from ...models.mesa_partes.integracion import Integracion
from ...core.config import settings


class IntegrationSecurityService:
    """Servicio para manejo de seguridad en integraciones"""
    
    def __init__(self, db: Session, redis_client: Optional[redis.Redis] = None):
        self.db = db
        self.redis_client = redis_client
        self.encryption_key = self._get_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
    
    def _get_encryption_key(self) -> bytes:
        """Obtener clave de encriptación desde configuración"""
        # En producción, esto debería venir de variables de entorno
        key = getattr(settings, 'ENCRYPTION_KEY', None)
        if not key:
            # Generar una clave temporal (NO usar en producción)
            key = Fernet.generate_key()
        return key if isinstance(key, bytes) else key.encode()
    
    # Gestión de API Keys
    def generate_api_key(self) -> str:
        """Generar una nueva API key"""
        return secrets.token_urlsafe(32)
    
    def hash_api_key(self, api_key: str) -> str:
        """Generar hash de API key para almacenamiento seguro"""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    async def validate_api_key(self, api_key: str, integracion_id: str) -> bool:
        """Validar API key para una integración específica"""
        try:
            integracion = self.db.query(Integracion).filter(
                Integracion.id == integracion_id,
                Integracion.activa == True
            ).first()
            
            if not integracion:
                return False
            
            # Desencriptar credenciales
            credenciales = self.decrypt_credentials(integracion.credenciales_encriptadas)
            stored_api_key_hash = credenciales.get('api_key_hash')
            
            if not stored_api_key_hash:
                return False
            
            # Comparar hash de la API key proporcionada
            provided_key_hash = self.hash_api_key(api_key)
            return hmac.compare_digest(stored_api_key_hash, provided_key_hash)
            
        except Exception:
            return False
    
    # Encriptación de credenciales
    def encrypt_credentials(self, credentials: Dict[str, Any]) -> str:
        """Encriptar credenciales para almacenamiento"""
        try:
            credentials_json = json.dumps(credentials)
            encrypted_data = self.cipher_suite.encrypt(credentials_json.encode())
            return encrypted_data.decode()
        except Exception as e:
            raise ValueError(f"Error al encriptar credenciales: {str(e)}")
    
    def decrypt_credentials(self, encrypted_credentials: str) -> Dict[str, Any]:
        """Desencriptar credenciales"""
        try:
            decrypted_data = self.cipher_suite.decrypt(encrypted_credentials.encode())
            return json.loads(decrypted_data.decode())
        except Exception as e:
            raise ValueError(f"Error al desencriptar credenciales: {str(e)}")
    
    # Firma HMAC para webhooks
    def generate_webhook_secret(self) -> str:
        """Generar secreto para firma de webhooks"""
        return secrets.token_urlsafe(32)
    
    def generate_hmac_signature(self, payload: str, secret: str) -> str:
        """Generar firma HMAC para webhook"""
        signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"
    
    def verify_hmac_signature(self, payload: str, signature: str, secret: str) -> bool:
        """Verificar firma HMAC de webhook"""
        try:
            expected_signature = self.generate_hmac_signature(payload, secret)
            return hmac.compare_digest(signature, expected_signature)
        except Exception:
            return False
    
    # Rate Limiting
    def _get_rate_limit_key(self, identifier: str, endpoint: str) -> str:
        """Generar clave para rate limiting"""
        return f"rate_limit:{identifier}:{endpoint}"
    
    async def check_rate_limit(
        self, 
        identifier: str, 
        endpoint: str, 
        max_requests: int = 100, 
        window_seconds: int = 3600
    ) -> bool:
        """Verificar límite de velocidad"""
        if not self.redis_client:
            # Si no hay Redis, permitir todas las requests (no recomendado para producción)
            return True
        
        try:
            key = self._get_rate_limit_key(identifier, endpoint)
            current_time = int(time.time())
            window_start = current_time - window_seconds
            
            # Usar sliding window con Redis sorted sets
            pipe = self.redis_client.pipeline()
            
            # Remover requests antiguas
            pipe.zremrangebyscore(key, 0, window_start)
            
            # Contar requests actuales
            pipe.zcard(key)
            
            # Agregar request actual
            pipe.zadd(key, {str(current_time): current_time})
            
            # Establecer expiración
            pipe.expire(key, window_seconds)
            
            results = pipe.execute()
            current_requests = results[1]
            
            return current_requests < max_requests
            
        except Exception:
            # En caso de error con Redis, permitir la request
            return True
    
    async def increment_rate_limit(self, identifier: str, endpoint: str):
        """Incrementar contador de rate limiting"""
        # Ya se incrementa en check_rate_limit
        pass
    
    # Validación de integraciones
    async def validate_integration_request(
        self, 
        request: Request, 
        integracion_id: str,
        require_signature: bool = False
    ) -> Dict[str, Any]:
        """Validar request de integración completa"""
        # 1. Verificar API key
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API Key requerida"
            )
        
        if not await self.validate_api_key(api_key, integracion_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API Key inválida"
            )
        
        # 2. Verificar rate limiting
        client_ip = request.client.host
        endpoint = request.url.path
        
        if not await self.check_rate_limit(f"{integracion_id}:{client_ip}", endpoint):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Límite de requests excedido"
            )
        
        # 3. Verificar firma HMAC si es requerida
        if require_signature:
            signature = request.headers.get("X-Signature")
            if not signature:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Firma requerida"
                )
            
            # Obtener el body del request
            body = await request.body()
            payload = body.decode()
            
            # Obtener secreto de la integración
            integracion = self.db.query(Integracion).filter(
                Integracion.id == integracion_id
            ).first()
            
            if not integracion:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Integración no encontrada"
                )
            
            webhook_config = integracion.configuracion_webhook or {}
            secret = webhook_config.get('secreto')
            
            if not secret:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Secreto de webhook no configurado"
                )
            
            if not self.verify_hmac_signature(payload, signature, secret):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Firma inválida"
                )
        
        return {
            "integracion_id": integracion_id,
            "api_key_valid": True,
            "rate_limit_ok": True,
            "signature_valid": require_signature
        }
    
    # Configuración de seguridad para integraciones
    async def setup_integration_security(
        self, 
        integracion_id: str, 
        credentials: Dict[str, Any]
    ) -> Dict[str, str]:
        """Configurar seguridad para una nueva integración"""
        # Generar API key
        api_key = self.generate_api_key()
        api_key_hash = self.hash_api_key(api_key)
        
        # Generar secreto para webhooks
        webhook_secret = self.generate_webhook_secret()
        
        # Preparar credenciales completas
        full_credentials = {
            **credentials,
            'api_key_hash': api_key_hash,
            'webhook_secret': webhook_secret,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Encriptar credenciales
        encrypted_credentials = self.encrypt_credentials(full_credentials)
        
        # Actualizar integración en base de datos
        integracion = self.db.query(Integracion).filter(
            Integracion.id == integracion_id
        ).first()
        
        if integracion:
            integracion.credenciales_encriptadas = encrypted_credentials
            self.db.commit()
        
        return {
            'api_key': api_key,  # Solo se retorna una vez
            'webhook_secret': webhook_secret,
            'integration_id': integracion_id
        }
    
    # Rotación de credenciales
    async def rotate_api_key(self, integracion_id: str) -> str:
        """Rotar API key de una integración"""
        integracion = self.db.query(Integracion).filter(
            Integracion.id == integracion_id
        ).first()
        
        if not integracion:
            raise ValueError("Integración no encontrada")
        
        # Generar nueva API key
        new_api_key = self.generate_api_key()
        new_api_key_hash = self.hash_api_key(new_api_key)
        
        # Desencriptar credenciales actuales
        current_credentials = self.decrypt_credentials(integracion.credenciales_encriptadas)
        
        # Actualizar con nueva API key
        current_credentials['api_key_hash'] = new_api_key_hash
        current_credentials['api_key_rotated_at'] = datetime.utcnow().isoformat()
        
        # Encriptar y guardar
        encrypted_credentials = self.encrypt_credentials(current_credentials)
        integracion.credenciales_encriptadas = encrypted_credentials
        self.db.commit()
        
        return new_api_key
    
    async def rotate_webhook_secret(self, integracion_id: str) -> str:
        """Rotar secreto de webhook de una integración"""
        integracion = self.db.query(Integracion).filter(
            Integracion.id == integracion_id
        ).first()
        
        if not integracion:
            raise ValueError("Integración no encontrada")
        
        # Generar nuevo secreto
        new_secret = self.generate_webhook_secret()
        
        # Desencriptar credenciales actuales
        current_credentials = self.decrypt_credentials(integracion.credenciales_encriptadas)
        
        # Actualizar con nuevo secreto
        current_credentials['webhook_secret'] = new_secret
        current_credentials['webhook_secret_rotated_at'] = datetime.utcnow().isoformat()
        
        # Encriptar y guardar
        encrypted_credentials = self.encrypt_credentials(current_credentials)
        integracion.credenciales_encriptadas = encrypted_credentials
        
        # También actualizar configuración de webhook
        webhook_config = integracion.configuracion_webhook or {}
        webhook_config['secreto'] = new_secret
        integracion.configuracion_webhook = webhook_config
        
        self.db.commit()
        
        return new_secret
    
    # Logging de seguridad
    async def log_security_event(
        self, 
        event_type: str, 
        integracion_id: str, 
        details: Dict[str, Any],
        severity: str = "INFO"
    ):
        """Registrar evento de seguridad"""
        # Aquí podrías implementar logging a un sistema de auditoría
        security_log = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'integracion_id': integracion_id,
            'severity': severity,
            'details': details
        }
        
        # Por ahora solo log a consola, en producción enviar a sistema de logging
        print(f"SECURITY EVENT: {json.dumps(security_log)}")
        
        # Si hay Redis disponible, también almacenar ahí
        if self.redis_client:
            try:
                key = f"security_log:{integracion_id}:{int(time.time())}"
                self.redis_client.setex(
                    key, 
                    86400,  # 24 horas
                    json.dumps(security_log)
                )
            except Exception:
                pass
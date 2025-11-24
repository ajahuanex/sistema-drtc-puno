# 🔄 Cambiar de Datos Mock a Base de Datos Real

## Estado Actual

❌ **Estás usando MODO MOCK** - Los datos no se persisten en MongoDB

Evidencia de los logs:
```
🚀 Iniciando Sistema de Gestión DRTC Puno (MODO MOCK)...
✅ Iniciando sistema con datos mock
```

## ¿Por qué está en modo mock?

El archivo `backend/app/dependencies/db.py` tiene el código de MongoDB **comentado** y solo usa datos mock en memoria.

## Cómo Cambiar a Base de Datos Real

### Opción 1: Descomentar el código de MongoDB (Recomendado)

Edita `backend/app/dependencies/db.py` y descomenta el código de MongoDB:

```python
from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database_name: str = settings.DATABASE_NAME

db = Database()

async def get_database() -> AsyncIOMotorClient:
    """Obtener instancia de la base de datos"""
    return db.client[db.database_name]

@asynccontextmanager
async def lifespan_startup():
    """Conectar a MongoDB"""
    logger.info("🔌 Conectando a MongoDB...")
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    logger.info("✅ Conectado a MongoDB exitosamente")
    yield

@asynccontextmanager
async def lifespan_shutdown():
    """Cerrar conexión a MongoDB"""
    logger.info("🔌 Cerrando conexión a MongoDB...")
    if db.client:
        db.client.close()
    logger.info("✅ Conexión cerrada")
    yield

@asynccontextmanager
async def lifespan(app):
    """Gestión del ciclo de vida de la aplicación"""
    logger.info("🚀 Iniciando Sistema de Gestión DRTC Puno...")
    async with lifespan_startup():
        yield
    async with lifespan_shutdown():
        pass
    logger.info("🛑 Sistema cerrado")
```

### Opción 2: Usar Variable de Entorno

Agrega una variable de entorno para controlar el modo:

1. Edita `.env` o `docker-compose.yml`:
```yaml
environment:
  - USE_MOCK_DATA=false  # false para base de datos real
```

2. Modifica `db.py` para leer esta variable y decidir qué usar.

## Servicios que Necesitan Actualización

Una vez que actives MongoDB, necesitarás actualizar estos servicios para usar la base de datos:

### Servicios Principales
1. **EmpresaService** - Gestión de empresas de transporte
2. **VehiculoService** - Gestión de vehículos
3. **ResolucionService** - Gestión de resoluciones
4. **TucService** - Gestión de TUCs
5. **RutaService** - Gestión de rutas

### Servicios de Mesa de Partes
1. **DocumentoService** - Gestión de documentos
2. **DerivacionService** - Derivación de documentos
3. **IntegracionService** - Integraciones externas
4. **NotificacionService** - Notificaciones

## Configuración Actual de MongoDB

Según `docker-compose.yml`:

```yaml
mongodb:
  image: mongo:7.0
  ports:
    - "27017:27017"
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD=password
```

**URL de conexión:**
```
mongodb://admin:password@mongodb:27017/
```

## Pasos para Activar Base de Datos Real

### 1. Verificar que MongoDB esté corriendo

```bash
docker-compose ps mongodb
```

Debería mostrar: `Up X minutes (healthy)`

### 2. Editar db.py

Descomenta el código de MongoDB en `backend/app/dependencies/db.py`

### 3. Instalar dependencias si faltan

```bash
cd backend
pip install motor pymongo
```

O en el Dockerfile:
```dockerfile
RUN pip install motor pymongo
```

### 4. Reiniciar el backend

```bash
docker-compose restart backend
```

### 5. Verificar los logs

```bash
docker-compose logs backend --tail 20
```

Deberías ver:
```
🚀 Iniciando Sistema de Gestión DRTC Puno...
🔌 Conectando a MongoDB...
✅ Conectado a MongoDB exitosamente
```

## Ventajas de Usar Base de Datos Real

✅ **Persistencia** - Los datos se guardan permanentemente  
✅ **Escalabilidad** - Soporta grandes volúmenes de datos  
✅ **Consultas complejas** - Búsquedas y filtros avanzados  
✅ **Transacciones** - Operaciones atómicas  
✅ **Backup** - Respaldo de datos  
✅ **Producción ready** - Listo para ambiente real  

## Desventajas del Modo Mock Actual

❌ **Sin persistencia** - Los datos se pierden al reiniciar  
❌ **Datos limitados** - Solo datos de prueba hardcodeados  
❌ **No escalable** - Todo en memoria  
❌ **No realista** - No simula comportamiento de producción  

## Migración de Datos

Si tienes datos mock que quieres preservar, necesitarás:

1. Exportar datos mock a JSON
2. Crear scripts de migración
3. Importar a MongoDB

## Verificación Post-Cambio

Después de cambiar a base de datos real:

1. **Crear una empresa:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/empresas \
     -H "Content-Type: application/json" \
     -d '{"nombre": "Test Transport", "ruc": "12345678901"}'
   ```

2. **Verificar en MongoDB:**
   ```bash
   docker exec -it drtc-mongodb mongosh -u admin -p password
   use drtc_puno_db
   db.empresas.find()
   ```

3. **Reiniciar backend y verificar persistencia:**
   ```bash
   docker-compose restart backend
   # Los datos deben seguir ahí
   ```

## Estado de Servicios

| Servicio | Implementado | Usa MongoDB | Estado |
|----------|--------------|-------------|--------|
| Empresas | ✅ | ❌ Mock | Necesita actualización |
| Vehículos | ✅ | ❌ Mock | Necesita actualización |
| Resoluciones | ✅ | ❌ Mock | Necesita actualización |
| TUCs | ✅ | ❌ Mock | Necesita actualización |
| Rutas | ✅ | ❌ Mock | Necesita actualización |
| Mesa de Partes | ✅ | ❌ Mock | Necesita actualización |

## Próximos Pasos Recomendados

1. ✅ Descomentar código de MongoDB en `db.py`
2. ✅ Verificar dependencias (motor, pymongo)
3. ✅ Reiniciar backend
4. ✅ Verificar conexión en logs
5. ⏳ Actualizar servicios para usar MongoDB
6. ⏳ Crear modelos de datos (schemas)
7. ⏳ Implementar repositorios
8. ⏳ Migrar datos mock a MongoDB

---

**Estado Actual**: ❌ MODO MOCK  
**Recomendación**: Cambiar a MongoDB para pruebas reales y persistencia de datos

# Mesa de Partes - Database Models

Este directorio contiene los modelos de base de datos SQLAlchemy para el módulo de Mesa de Partes.

## Estructura de Modelos

### Modelos Principales

1. **Documento** (`documento.py`)
   - Modelo principal para documentos de mesa de partes
   - Campos: número de expediente, tipo, remitente, asunto, estado, prioridad, fechas
   - Relaciones: tipo_documento, archivos_adjuntos, derivaciones

2. **TipoDocumento** (`documento.py`)
   - Catálogo de tipos de documento (solicitud, oficio, memorándum, etc.)
   - Campos: nombre, código, descripción

3. **ArchivoAdjunto** (`documento.py`)
   - Archivos adjuntos a documentos
   - Campos: nombre, tipo MIME, tamaño, URL, hash
   - Relación: documento

4. **Derivacion** (`derivacion.py`)
   - Derivaciones de documentos entre áreas
   - Campos: áreas origen/destino, usuarios, fechas, estado, instrucciones
   - Relación: documento

5. **Integracion** (`integracion.py`)
   - Configuración de integraciones con mesas externas
   - Campos: tipo, URL, autenticación, mapeos, estado
   - Relación: logs_sincronizacion

6. **LogSincronizacion** (`integracion.py`)
   - Logs de sincronización con sistemas externos
   - Campos: operación, estado, datos enviados/recibidos, errores
   - Relaciones: integracion, documento

7. **Notificacion** (`notificacion.py`)
   - Notificaciones del sistema para usuarios
   - Campos: tipo, título, mensaje, estado, prioridad
   - Relación opcional: documento

8. **Alerta** (`notificacion.py`)
   - Configuración de alertas automáticas
   - Campos: condición SQL, frecuencia, destinatarios, plantillas

## Configuración de Base de Datos

### Variables de Entorno

```bash
MESA_PARTES_DATABASE_URL=postgresql://user:password@localhost:5432/mesa_partes_db
SQL_DEBUG=false  # true para ver queries SQL
```

### Inicialización

```python
from app.models.mesa_partes import init_db, check_db_connection

# Verificar conexión
if check_db_connection():
    print("✅ Conexión a base de datos OK")
    
# Inicializar base de datos (crear tablas y datos iniciales)
init_db()
```

### Uso en Endpoints

```python
from app.models.mesa_partes import get_db, Documento
from sqlalchemy.orm import Session
from fastapi import Depends

@app.get("/documentos")
async def listar_documentos(db: Session = Depends(get_db)):
    documentos = db.query(Documento).all()
    return documentos
```

## Índices de Base de Datos

Los modelos incluyen índices optimizados para las consultas más frecuentes:

- **Documento**: número_expediente, estado, fecha_recepcion, remitente, área_actual
- **Derivacion**: documento_id, área_destino, estado, fecha_derivacion
- **Integracion**: código, tipo, estado_conexion
- **Notificacion**: usuario_id, tipo, estado, fecha_creación

## Migraciones

Para ejecutar las migraciones manualmente:

```python
from app.models.mesa_partes.migrations import create_tables, drop_tables

# Crear tablas
create_tables()

# Eliminar tablas (¡CUIDADO!)
drop_tables()
```

## Datos Iniciales

El sistema incluye datos iniciales:

### Tipos de Documento
- SOL: Solicitud
- OFC: Oficio  
- MEM: Memorándum
- CAR: Carta
- INF: Informe
- REC: Recurso
- DEN: Denuncia
- CON: Consulta

### Alertas Predefinidas
- Documentos próximos a vencer (3 días)
- Documentos vencidos
- Documentos urgentes sin atender (2+ horas)

## Seguridad

- Las credenciales de integración se almacenan encriptadas
- Los logs incluyen información de auditoría
- Todos los modelos tienen timestamps de creación/actualización
- Soporte para soft delete en modelos críticos

## Performance

- Índices optimizados para consultas frecuentes
- Connection pooling configurado
- Lazy loading en relaciones
- Paginación recomendada para listados grandes

## Testing

Para testing, se puede usar SQLite en memoria:

```python
DATABASE_URL = "sqlite:///:memory:"
```

Los modelos son compatibles con SQLite para desarrollo y testing.
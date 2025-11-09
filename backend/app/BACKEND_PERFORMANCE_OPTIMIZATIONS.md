# Backend Performance Optimizations - Mesa de Partes Module

## Overview

This document describes the performance optimizations implemented in the Mesa de Partes backend to improve scalability, response times, and resource utilization.

## Implemented Optimizations

### 1. Database Indexes

#### Documento Model Indexes
```python
# Single column indexes
- idx_documento_numero_expediente (numero_expediente)
- idx_documento_estado (estado)
- idx_documento_prioridad (prioridad)
- idx_documento_fecha_recepcion (fecha_recepcion)
- idx_documento_fecha_limite (fecha_limite)
- idx_documento_remitente (remitente)
- idx_documento_usuario_registro (usuario_registro_id)
- idx_documento_area_actual (area_actual_id)
- idx_documento_tipo (tipo_documento_id)
- idx_documento_codigo_qr (codigo_qr)
- idx_documento_origen_externo (origen_externo)
- idx_documento_id_externo (id_externo)

# Composite indexes for frequent queries
- idx_documento_estado_fecha (estado, fecha_recepcion)
- idx_documento_area_estado (area_actual_id, estado)
- idx_documento_usuario_fecha (usuario_registro_id, fecha_recepcion)
```

#### Derivacion Model Indexes
```python
# Single column indexes
- idx_derivacion_documento (documento_id)
- idx_derivacion_area_origen (area_origen_id)
- idx_derivacion_area_destino (area_destino_id)
- idx_derivacion_usuario_deriva (usuario_deriva_id)
- idx_derivacion_usuario_recibe (usuario_recibe_id)
- idx_derivacion_estado (estado)
- idx_derivacion_fecha_derivacion (fecha_derivacion)
- idx_derivacion_fecha_limite (fecha_limite_atencion)
- idx_derivacion_urgente (es_urgente)
- idx_derivacion_numero (numero_derivacion)

# Composite indexes for frequent queries
- idx_derivacion_area_estado (area_destino_id, estado)
- idx_derivacion_documento_estado (documento_id, estado)
- idx_derivacion_urgente_estado (es_urgente, estado)
- idx_derivacion_fecha_estado (fecha_derivacion, estado)
```

#### Integracion Model Indexes
```python
- idx_integracion_codigo (codigo)
- idx_integracion_tipo (tipo)
- idx_integracion_activa (activa)
- idx_integracion_estado (estado_conexion)
- idx_integracion_ultima_sync (ultima_sincronizacion)
```

#### LogSincronizacion Model Indexes
```python
# Single column indexes
- idx_log_integracion (integracion_id)
- idx_log_documento (documento_id)
- idx_log_operacion (operacion)
- idx_log_estado (estado)
- idx_log_fecha (created_at)
- idx_log_numero_expediente (documento_numero_expediente)
- idx_log_id_externo (id_externo)

# Composite indexes
- idx_log_integracion_fecha (integracion_id, created_at)
- idx_log_integracion_estado (integracion_id, estado)
- idx_log_documento_operacion (documento_id, operacion)
```

### 2. Redis Caching

#### Cache Service Features
- **TTL-based caching**: Automatic expiration of cached data
- **Pattern-based invalidation**: Invalidate multiple related cache entries
- **Graceful degradation**: System works without Redis if unavailable
- **Serialization**: Automatic pickle serialization for complex objects

#### Cached Operations
```python
# Documento operations
- obtener_documento() - 10 minutes TTL
- listar_documentos() - 2 minutes TTL
- generar_comprobante_pdf() - 1 hour TTL
- obtener_estadisticas() - 5 minutes TTL

# Reporte operations
- obtener_estadisticas() - 5 minutes TTL
- calcular_metricas() - 10 minutes TTL
```

#### Cache Invalidation Strategy
```python
# On documento creation/update
invalidate_cache("documentos:list:*")
invalidate_cache("documentos:stats:*")
invalidate_cache(f"documento:{documento_id}:*")

# On derivacion creation/update
invalidate_cache("derivaciones:list:*")
invalidate_cache("derivaciones:stats:*")
```

#### Usage Example
```python
from app.core.cache import get_cache, cached, invalidate_cache

# Using decorator
@cached("documento", ttl=600)
async def obtener_documento(documento_id: str):
    return documento

# Manual caching
cache = get_cache()
cache_key = cache._generate_key("documentos:list", filtros.dict())
cached_result = cache.get(cache_key)
if cached_result is None:
    result = query_database()
    cache.set(cache_key, result, ttl=120)
```

### 3. Async Task Processing

#### Celery Task Queue
- **Broker**: Redis (separate database from cache)
- **Backend**: Redis for result storage
- **Worker Configuration**:
  - Task time limit: 30 minutes
  - Soft time limit: 25 minutes
  - Prefetch multiplier: 1
  - Max tasks per child: 1000

#### Implemented Tasks
```python
# Report generation
- mesa_partes.generar_reporte_excel
- mesa_partes.generar_reporte_pdf

# File processing
- mesa_partes.procesar_archivo_adjunto

# External synchronization
- mesa_partes.sincronizar_documento_externo

# Bulk notifications
- mesa_partes.enviar_notificaciones_masivas
```

#### Usage Example
```python
from app.core.task_queue import get_task_queue

task_queue = get_task_queue()

# Enqueue task
task_id = task_queue.enqueue(
    'mesa_partes.generar_reporte_excel',
    filtros,
    usuario_id
)

# Check task status
status = task_queue.get_task_status(task_id)

# Cancel task
task_queue.cancel_task(task_id)
```

### 4. Query Optimization

#### Query Optimizer Features
- **EXPLAIN ANALYZE**: Get query execution plans
- **Slow query logging**: Automatic detection of slow queries
- **Performance monitoring**: Track query statistics
- **Index recommendations**: Suggest indexes based on query patterns

#### Usage Example
```python
from app.core.query_optimizer import QueryOptimizer

optimizer = QueryOptimizer()

# Get EXPLAIN output
explain_output = optimizer.explain_query(db, query)

# Monitor slow queries
@QueryOptimizer.analyze_slow_queries(threshold_ms=200)
def get_documentos(db: Session):
    return db.query(Documento).all()

# Optimize pagination
items, total = optimizer.optimize_pagination(query, page=0, page_size=50)

# Batch load
documentos = optimizer.batch_load(db, Documento, ids, batch_size=100)

# Prefetch relationships
query = optimizer.prefetch_relationships(
    query,
    'tipo_documento',
    'archivos_adjuntos'
)
```

#### Query Performance Monitoring
```python
from app.core.query_optimizer import QueryPerformanceMonitor

monitor = QueryPerformanceMonitor(threshold_ms=100)
monitor.setup_monitoring(engine)

# Get statistics
stats = monitor.get_stats()

# Reset statistics
monitor.reset_stats()
```

## Performance Metrics

### Expected Improvements

#### Response Times
- **List operations**: 50-70% faster with caching
- **Detail views**: 80-90% faster with caching
- **Report generation**: 90% faster with async processing
- **Statistics**: 70-80% faster with caching

#### Database Load
- **Query count**: 40-60% reduction with caching
- **Query execution time**: 30-50% faster with indexes
- **Connection usage**: 20-30% reduction with connection pooling

#### Scalability
- **Concurrent users**: 3-5x increase
- **Request throughput**: 2-3x increase
- **Memory usage**: 10-20% reduction with efficient caching

## Configuration

### Redis Configuration
```python
# Environment variables
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB_CACHE=0
REDIS_DB_CELERY_BROKER=1
REDIS_DB_CELERY_BACKEND=2
```

### Celery Configuration
```python
# Environment variables
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
CELERY_TASK_TIME_LIMIT=1800  # 30 minutes
CELERY_TASK_SOFT_TIME_LIMIT=1500  # 25 minutes
```

### Database Configuration
```python
# Connection pooling
SQLALCHEMY_POOL_SIZE=20
SQLALCHEMY_MAX_OVERFLOW=40
SQLALCHEMY_POOL_TIMEOUT=30
SQLALCHEMY_POOL_RECYCLE=3600
```

## Monitoring and Maintenance

### Cache Monitoring
```python
# Check cache status
cache = get_cache()
print(f"Cache enabled: {cache.enabled}")

# Clear cache
cache.clear()

# Delete pattern
cache.delete_pattern("documentos:*")
```

### Task Queue Monitoring
```python
# Check queue status
task_queue = get_task_queue()
print(f"Queue enabled: {task_queue.enabled}")

# Get task status
status = task_queue.get_task_status(task_id)
```

### Database Monitoring
```python
# Check slow queries
from app.core.query_optimizer import QueryPerformanceMonitor

monitor = QueryPerformanceMonitor()
stats = monitor.get_stats()

# Print optimization tips
from app.core.query_optimizer import print_optimization_tips
print_optimization_tips()
```

## Best Practices

### Caching
1. **Cache frequently accessed data**: User profiles, statistics, reports
2. **Use appropriate TTL**: Balance freshness vs performance
3. **Invalidate on updates**: Clear related caches when data changes
4. **Monitor cache hit rate**: Aim for >70% hit rate

### Async Tasks
1. **Use for heavy operations**: Report generation, file processing
2. **Implement retries**: Handle transient failures
3. **Monitor task status**: Track success/failure rates
4. **Set appropriate timeouts**: Prevent hanging tasks

### Database Queries
1. **Use indexes**: Add indexes for frequently queried columns
2. **Optimize joins**: Use joinedload for N+1 prevention
3. **Paginate results**: Always use LIMIT and OFFSET
4. **Monitor slow queries**: Set threshold and log slow queries

### General
1. **Profile regularly**: Use monitoring tools to identify bottlenecks
2. **Test under load**: Simulate production traffic
3. **Monitor resources**: Track CPU, memory, disk usage
4. **Plan for growth**: Design for 3-5x current load

## Troubleshooting

### Redis Connection Issues
```python
# Check Redis connection
redis-cli ping

# Check Redis memory usage
redis-cli info memory

# Clear Redis cache
redis-cli FLUSHDB
```

### Celery Worker Issues
```python
# Start Celery worker
celery -A app.core.task_queue worker --loglevel=info

# Check active tasks
celery -A app.core.task_queue inspect active

# Purge all tasks
celery -A app.core.task_queue purge
```

### Database Performance Issues
```python
# Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

# Vacuum and analyze
VACUUM ANALYZE;
```

## Future Optimizations

### Planned Improvements
1. **Database partitioning**: Partition large tables by date
2. **Read replicas**: Separate read and write operations
3. **CDN integration**: Cache static assets
4. **GraphQL**: Reduce over-fetching
5. **Elasticsearch**: Full-text search optimization
6. **Message queue**: Decouple services
7. **Horizontal scaling**: Add more application servers
8. **Database sharding**: Distribute data across multiple databases

### Performance Goals
- **Response time**: <100ms for 95% of requests
- **Throughput**: >1000 requests/second
- **Availability**: 99.9% uptime
- **Scalability**: Support 10,000+ concurrent users

## References

- [Redis Documentation](https://redis.io/documentation)
- [Celery Documentation](https://docs.celeryproject.org/)
- [SQLAlchemy Performance](https://docs.sqlalchemy.org/en/14/faq/performance.html)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)

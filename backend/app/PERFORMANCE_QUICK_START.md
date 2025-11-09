# Backend Performance Optimizations - Quick Start Guide

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Redis 6+
- pip or conda

## Installation

### 1. Install Redis

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### macOS
```bash
brew install redis
brew services start redis
```

#### Windows
Download and install from: https://redis.io/download

### 2. Install Python Dependencies

```bash
cd backend
pip install redis celery cryptography
```

Or use the requirements file:
```bash
pip install -r requirements-performance.txt
```

### 3. Configure Environment Variables

Create or update your `.env` file:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB_CACHE=0
REDIS_DB_CELERY_BROKER=1
REDIS_DB_CELERY_BACKEND=2

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
CELERY_TASK_TIME_LIMIT=1800
CELERY_TASK_SOFT_TIME_LIMIT=1500

# Database Configuration
SQLALCHEMY_POOL_SIZE=20
SQLALCHEMY_MAX_OVERFLOW=40
SQLALCHEMY_POOL_TIMEOUT=30
SQLALCHEMY_POOL_RECYCLE=3600

# Encryption Key (generate with command below)
ENCRYPTION_KEY=your-encryption-key-here
```

Generate encryption key:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 4. Create Database Indexes

Run the database migration:

```bash
# Using Alembic
alembic upgrade head

# Or manually with SQL
psql -U your_user -d your_db -f create_indexes.sql
```

### 5. Start Celery Worker

```bash
# In a separate terminal
celery -A app.core.task_queue worker --loglevel=info --concurrency=4
```

For production, use systemd service (see setup_performance.sh).

### 6. (Optional) Start Celery Beat

For scheduled tasks:

```bash
# In a separate terminal
celery -A app.core.task_queue beat --loglevel=info
```

### 7. (Optional) Start Flower

For monitoring Celery tasks:

```bash
celery -A app.core.task_queue flower
```

Access at: http://localhost:5555

## Verification

### Quick Test

Run the verification script:

```bash
cd backend
python verify_optimizations.py
```

Expected output:
```
✓ Redis Cache is working correctly
✓ Celery task queue is working correctly
✓ Query optimizer is working correctly
✓ Database indexes are properly defined
✓ Service optimizations are properly implemented

✓ All optimizations verified successfully!
```

### Manual Tests

#### Test Redis
```bash
redis-cli ping
# Expected: PONG
```

#### Test Celery
```bash
celery -A app.core.task_queue inspect active
# Expected: List of active tasks (may be empty)
```

#### Test Database Indexes
```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Usage Examples

### Using Cache in Services

```python
from app.core.cache import get_cache, cached, invalidate_cache

# Get cache instance
cache = get_cache()

# Manual caching
cache_key = "my_key"
cache.set(cache_key, {"data": "value"}, ttl=300)
value = cache.get(cache_key)

# Using decorator
@cached("my_prefix", ttl=600)
async def my_function(param1, param2):
    # Function will be cached automatically
    return result

# Invalidate cache
invalidate_cache("my_prefix:*")
```

### Using Async Tasks

```python
from app.core.task_queue import get_task_queue

# Get task queue instance
task_queue = get_task_queue()

# Enqueue task
task_id = task_queue.enqueue(
    'mesa_partes.generar_reporte_excel',
    filtros={'tipo': 'documentos'},
    usuario_id='user123'
)

# Check task status
status = task_queue.get_task_status(task_id)
print(f"Status: {status['status']}")

# Cancel task
task_queue.cancel_task(task_id)
```

### Using Query Optimizer

```python
from app.core.query_optimizer import QueryOptimizer

optimizer = QueryOptimizer()

# Get EXPLAIN output
explain = optimizer.explain_query(db, query)
print(explain)

# Use slow query decorator
@QueryOptimizer.analyze_slow_queries(threshold_ms=200)
def get_data():
    return db.query(Model).all()

# Optimize pagination
items, total = optimizer.optimize_pagination(query, page=0, page_size=50)

# Prefetch relationships
query = optimizer.prefetch_relationships(
    query,
    'relationship1',
    'relationship2'
)
```

## Monitoring

### Redis Monitoring

```bash
# Check status
redis-cli ping

# Monitor commands in real-time
redis-cli MONITOR

# Check stats
redis-cli INFO stats

# Check memory usage
redis-cli INFO memory

# List all keys
redis-cli KEYS "*"

# Get specific key
redis-cli GET "my_key"
```

### Celery Monitoring

```bash
# Check active tasks
celery -A app.core.task_queue inspect active

# Check registered tasks
celery -A app.core.task_queue inspect registered

# Check worker stats
celery -A app.core.task_queue inspect stats

# Purge all tasks
celery -A app.core.task_queue purge

# Check scheduled tasks
celery -A app.core.task_queue inspect scheduled
```

### Database Monitoring

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Redis Not Connecting

```bash
# Check if Redis is running
sudo systemctl status redis-server

# Start Redis
sudo systemctl start redis-server

# Check Redis logs
sudo journalctl -u redis-server -f

# Test connection
redis-cli ping
```

### Celery Worker Not Starting

```bash
# Check if Redis is running (Celery needs Redis)
redis-cli ping

# Check Celery logs
celery -A app.core.task_queue worker --loglevel=debug

# Check for port conflicts
lsof -i :6379

# Purge old tasks
celery -A app.core.task_queue purge
```

### Database Indexes Not Created

```bash
# Check if migrations ran
alembic current

# Run migrations
alembic upgrade head

# Manually create indexes
psql -U your_user -d your_db -f create_indexes.sql

# Verify indexes
psql -U your_user -d your_db -c "\di"
```

### Cache Not Working

```python
# Check cache status
from app.core.cache import get_cache
cache = get_cache()
print(f"Cache enabled: {cache.enabled}")

# Test cache manually
cache.set("test", "value", ttl=60)
print(cache.get("test"))

# Clear cache
cache.clear()
```

## Performance Tips

### Cache Strategy

1. **Cache frequently accessed data**: User profiles, statistics, reports
2. **Use appropriate TTL**: 
   - Hot data: 1-5 minutes
   - Warm data: 5-30 minutes
   - Cold data: 30-60 minutes
3. **Invalidate on updates**: Clear related caches when data changes
4. **Monitor hit rate**: Aim for >70% cache hit rate

### Async Tasks

1. **Use for heavy operations**: Report generation, file processing, bulk operations
2. **Set appropriate timeouts**: Based on expected execution time
3. **Implement retries**: For transient failures
4. **Monitor task status**: Track success/failure rates

### Database Queries

1. **Use indexes**: Add indexes for frequently queried columns
2. **Optimize joins**: Use joinedload for N+1 prevention
3. **Paginate results**: Always use LIMIT and OFFSET
4. **Monitor slow queries**: Set threshold and log slow queries

## Production Deployment

### Systemd Services

Create systemd services for Celery:

```bash
# Copy service files
sudo cp celery-worker.service /etc/systemd/system/
sudo cp celery-beat.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Start services
sudo systemctl start celery-worker
sudo systemctl start celery-beat

# Enable on boot
sudo systemctl enable celery-worker
sudo systemctl enable celery-beat

# Check status
sudo systemctl status celery-worker
sudo systemctl status celery-beat
```

### Redis Configuration

For production, configure Redis persistence:

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Set max memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Restart Redis
sudo systemctl restart redis-server
```

### Monitoring

Set up monitoring with:
- **Prometheus**: For metrics collection
- **Grafana**: For visualization
- **Sentry**: For error tracking
- **Flower**: For Celery monitoring

## Next Steps

1. ✅ Verify all optimizations are working
2. ✅ Monitor performance metrics
3. ✅ Tune cache TTLs based on usage patterns
4. ✅ Set up production monitoring
5. ✅ Configure backup and recovery
6. ✅ Plan for horizontal scaling

## Support

For issues or questions:
- Check logs: `sudo journalctl -u celery-worker -f`
- Review documentation: `BACKEND_PERFORMANCE_OPTIMIZATIONS.md`
- Run verification: `python verify_optimizations.py`

## References

- [Redis Documentation](https://redis.io/documentation)
- [Celery Documentation](https://docs.celeryproject.org/)
- [SQLAlchemy Performance](https://docs.sqlalchemy.org/en/14/faq/performance.html)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)

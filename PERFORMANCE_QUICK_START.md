# Performance Optimizations - Quick Start Guide

## Overview
This guide helps you quickly set up and use the performance optimizations implemented in Task 25.

## Prerequisites
- Node.js 18+ (Frontend)
- Python 3.9+ (Backend)
- PostgreSQL 13+
- Redis 6+ (will be installed)
- Celery (will be installed)

## Quick Setup

### 1. Backend Setup (5 minutes)

```bash
cd backend

# Install performance dependencies
pip install -r requirements-performance.txt

# Run automated setup (installs Redis, Celery, configures services)
chmod +x setup_performance.sh
./setup_performance.sh

# Or manual setup:
# Install Redis
sudo apt-get install redis-server
sudo systemctl start redis-server

# Start Celery worker
celery -A app.core.task_queue worker --loglevel=info &

# Start Celery beat
celery -A app.core.task_queue beat --loglevel=info &
```

### 2. Frontend Setup (2 minutes)

```bash
cd frontend

# No additional setup needed!
# Optimizations are already integrated
npm start
```

## Usage Examples

### Frontend Caching

```typescript
// Automatic caching
this.documentoService.obtenerDocumento(id).subscribe(doc => {
  // Cached for 5 minutes
});

// Bypass cache
this.documentoService.obtenerDocumento(id, false).subscribe(doc => {
  // Fresh from server
});
```

### Virtual Scrolling
```html
<app-lista-documentos-virtual
  [filtros]="filtros"
  (documentoSeleccionado)="onSelect($event)">
</app-lista-documentos-virtual>
```

### Backend Caching
```python
from app.core.cache import cached

@cached("documento", ttl=300)
def get_documento(db: Session, id: str):
    return db.query(Documento).filter(Documento.id == id).first()
```

### Async Tasks
```python
from app.core.task_queue import get_task_queue

task_queue = get_task_queue()
task_id = task_queue.enqueue('mesa_partes.generar_reporte_excel', filtros)
```

## Monitoring

```bash
# Redis
redis-cli MONITOR

# Celery
celery -A app.core.task_queue inspect active

# Flower (Web UI)
celery -A app.core.task_queue flower
# Open http://localhost:5555
```

## Documentation
- Frontend: `frontend/src/app/components/mesa-partes/PERFORMANCE_OPTIMIZATIONS.md`
- Backend: `backend/app/PERFORMANCE_OPTIMIZATIONS.md`
- Verification: `TASK_25_VERIFICATION.md`
- Summary: `frontend/src/app/components/mesa-partes/TASK_25_COMPLETION_SUMMARY.md`

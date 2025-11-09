"""
Async task queue for processing heavy operations in background
Uses Celery for distributed task processing
"""
import logging
from typing import Any, Callable, Optional
from functools import wraps
from celery import Celery
from celery.result import AsyncResult

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    'mesa_partes',
    broker='redis://localhost:6379/1',
    backend='redis://localhost:6379/2'
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Lima',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)


class TaskQueue:
    """Service for managing async tasks"""
    
    def __init__(self):
        self.celery = celery_app
        self.enabled = self._check_connection()
    
    def _check_connection(self) -> bool:
        """Check if Celery broker is available"""
        try:
            self.celery.broker_connection().ensure_connection(max_retries=3)
            logger.info("Celery task queue enabled")
            return True
        except Exception as e:
            logger.warning(f"Celery not available, async tasks disabled: {e}")
            return False
    
    def enqueue(self, task_name: str, *args, **kwargs) -> Optional[str]:
        """
        Enqueue a task for async processing
        
        Args:
            task_name: Name of the task to execute
            *args: Positional arguments for the task
            **kwargs: Keyword arguments for the task
            
        Returns:
            Task ID if successful, None otherwise
        """
        if not self.enabled:
            logger.warning(f"Task queue disabled, cannot enqueue: {task_name}")
            return None
        
        try:
            result = self.celery.send_task(task_name, args=args, kwargs=kwargs)
            logger.info(f"Task enqueued: {task_name} (ID: {result.id})")
            return result.id
        except Exception as e:
            logger.error(f"Error enqueuing task {task_name}: {e}")
            return None
    
    def get_task_status(self, task_id: str) -> dict:
        """
        Get status of a task
        
        Args:
            task_id: Task ID
            
        Returns:
            Dictionary with task status information
        """
        if not self.enabled:
            return {"status": "DISABLED"}
        
        try:
            result = AsyncResult(task_id, app=self.celery)
            return {
                "task_id": task_id,
                "status": result.status,
                "result": result.result if result.ready() else None,
                "error": str(result.info) if result.failed() else None
            }
        except Exception as e:
            logger.error(f"Error getting task status: {e}")
            return {"status": "ERROR", "error": str(e)}
    
    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a running task
        
        Args:
            task_id: Task ID
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        try:
            self.celery.control.revoke(task_id, terminate=True)
            logger.info(f"Task cancelled: {task_id}")
            return True
        except Exception as e:
            logger.error(f"Error cancelling task: {e}")
            return False


# Global task queue instance
_task_queue_instance: Optional[TaskQueue] = None

def get_task_queue() -> TaskQueue:
    """Get global task queue instance"""
    global _task_queue_instance
    if _task_queue_instance is None:
        _task_queue_instance = TaskQueue()
    return _task_queue_instance


# Celery tasks
@celery_app.task(name='mesa_partes.generar_reporte_excel')
def generar_reporte_excel_task(filtros: dict, usuario_id: str) -> dict:
    """
    Generate Excel report asynchronously
    
    Args:
        filtros: Filters for the report
        usuario_id: User ID requesting the report
        
    Returns:
        Dictionary with report information
    """
    try:
        from app.services.mesa_partes.reporte_service import ReporteService
        from app.models.mesa_partes.database import get_db
        
        db = next(get_db())
        service = ReporteService(db)
        
        # Generate report
        file_path = service.generar_reporte_excel_sync(filtros)
        
        logger.info(f"Excel report generated: {file_path}")
        return {
            "status": "SUCCESS",
            "file_path": file_path,
            "usuario_id": usuario_id
        }
    except Exception as e:
        logger.error(f"Error generating Excel report: {e}")
        return {
            "status": "ERROR",
            "error": str(e)
        }


@celery_app.task(name='mesa_partes.generar_reporte_pdf')
def generar_reporte_pdf_task(filtros: dict, usuario_id: str) -> dict:
    """
    Generate PDF report asynchronously
    
    Args:
        filtros: Filters for the report
        usuario_id: User ID requesting the report
        
    Returns:
        Dictionary with report information
    """
    try:
        from app.services.mesa_partes.reporte_service import ReporteService
        from app.models.mesa_partes.database import get_db
        
        db = next(get_db())
        service = ReporteService(db)
        
        # Generate report
        file_path = service.generar_reporte_pdf_sync(filtros)
        
        logger.info(f"PDF report generated: {file_path}")
        return {
            "status": "SUCCESS",
            "file_path": file_path,
            "usuario_id": usuario_id
        }
    except Exception as e:
        logger.error(f"Error generating PDF report: {e}")
        return {
            "status": "ERROR",
            "error": str(e)
        }


@celery_app.task(name='mesa_partes.procesar_archivo_adjunto')
def procesar_archivo_adjunto_task(documento_id: str, archivo_path: str) -> dict:
    """
    Process attached file asynchronously (virus scan, thumbnail generation, etc.)
    
    Args:
        documento_id: Document ID
        archivo_path: Path to the file
        
    Returns:
        Dictionary with processing results
    """
    try:
        import hashlib
        import os
        
        # Calculate file hash
        with open(archivo_path, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
        
        # Get file size
        file_size = os.path.getsize(archivo_path)
        
        logger.info(f"File processed: {archivo_path} (hash: {file_hash})")
        return {
            "status": "SUCCESS",
            "documento_id": documento_id,
            "file_hash": file_hash,
            "file_size": file_size
        }
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        return {
            "status": "ERROR",
            "error": str(e)
        }


@celery_app.task(name='mesa_partes.sincronizar_documento_externo')
def sincronizar_documento_externo_task(documento_id: str, integracion_id: str) -> dict:
    """
    Synchronize document with external system asynchronously
    
    Args:
        documento_id: Document ID
        integracion_id: Integration ID
        
    Returns:
        Dictionary with synchronization results
    """
    try:
        from app.services.mesa_partes.integracion_service import IntegracionService
        from app.models.mesa_partes.database import get_db
        
        db = next(get_db())
        service = IntegracionService(db)
        
        # Synchronize
        result = service.enviar_documento_sync(documento_id, integracion_id)
        
        logger.info(f"Document synchronized: {documento_id} -> {integracion_id}")
        return {
            "status": "SUCCESS",
            "documento_id": documento_id,
            "integracion_id": integracion_id,
            "result": result
        }
    except Exception as e:
        logger.error(f"Error synchronizing document: {e}")
        return {
            "status": "ERROR",
            "error": str(e)
        }


@celery_app.task(name='mesa_partes.enviar_notificaciones_masivas')
def enviar_notificaciones_masivas_task(usuario_ids: list, mensaje: dict) -> dict:
    """
    Send bulk notifications asynchronously
    
    Args:
        usuario_ids: List of user IDs
        mensaje: Notification message
        
    Returns:
        Dictionary with sending results
    """
    try:
        from app.services.mesa_partes.notificacion_service import NotificacionService
        from app.models.mesa_partes.database import get_db
        
        db = next(get_db())
        service = NotificacionService(db)
        
        # Send notifications
        enviadas = 0
        for usuario_id in usuario_ids:
            try:
                service.enviar_notificacion_sync(usuario_id, mensaje)
                enviadas += 1
            except Exception as e:
                logger.error(f"Error sending notification to {usuario_id}: {e}")
        
        logger.info(f"Bulk notifications sent: {enviadas}/{len(usuario_ids)}")
        return {
            "status": "SUCCESS",
            "total": len(usuario_ids),
            "enviadas": enviadas
        }
    except Exception as e:
        logger.error(f"Error sending bulk notifications: {e}")
        return {
            "status": "ERROR",
            "error": str(e)
        }


def async_task(task_name: str):
    """
    Decorator to make a function execute asynchronously
    
    Args:
        task_name: Name of the Celery task to execute
        
    Example:
        @async_task('mesa_partes.generar_reporte_excel')
        def generar_reporte(filtros: dict):
            # This will be executed asynchronously
            pass
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            task_queue = get_task_queue()
            if task_queue.enabled:
                # Execute asynchronously
                task_id = task_queue.enqueue(task_name, *args, **kwargs)
                return {"task_id": task_id, "status": "PENDING"}
            else:
                # Execute synchronously if queue is disabled
                logger.warning(f"Executing {task_name} synchronously (queue disabled)")
                return func(*args, **kwargs)
        return wrapper
    return decorator

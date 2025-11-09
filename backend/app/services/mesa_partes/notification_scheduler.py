"""
Notification Scheduler Service
Handles scheduled notifications for documents about to expire
"""
import asyncio
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.mesa_partes.documento import Documento, EstadoDocumentoEnum
from app.services.mesa_partes.websocket_service import websocket_service
from app.dependencies.database import get_db
import logging

logger = logging.getLogger(__name__)


class NotificationScheduler:
    """Service for scheduling and sending periodic notifications"""
    
    def __init__(self):
        self.running = False
        self.check_interval = 3600  # Check every hour
        
    async def start(self):
        """Start the notification scheduler"""
        if self.running:
            logger.warning("Notification scheduler is already running")
            return
        
        self.running = True
        logger.info("Notification scheduler started")
        
        while self.running:
            try:
                await self.check_expiring_documents()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in notification scheduler: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def stop(self):
        """Stop the notification scheduler"""
        self.running = False
        logger.info("Notification scheduler stopped")
    
    async def check_expiring_documents(self):
        """Check for documents about to expire and send notifications"""
        logger.info("Checking for expiring documents...")
        
        try:
            # Get database session
            db = next(get_db())
            
            # Get current date
            now = datetime.utcnow()
            
            # Check for documents expiring in 1, 2, and 3 days
            for days in [1, 2, 3]:
                target_date = now + timedelta(days=days)
                
                # Query documents with fecha_limite on target date
                documents = db.query(Documento).filter(
                    Documento.fecha_limite.isnot(None),
                    Documento.fecha_limite >= target_date.replace(hour=0, minute=0, second=0),
                    Documento.fecha_limite < target_date.replace(hour=23, minute=59, second=59),
                    Documento.estado.in_([EstadoDocumentoEnum.REGISTRADO, EstadoDocumentoEnum.EN_PROCESO])
                ).all()
                
                # Send notifications
                for documento in documents:
                    if documento.area_actual_id:
                        try:
                            await websocket_service.notify_documento_proximo_vencer(
                                documento_id=str(documento.id),
                                numero_expediente=documento.numero_expediente,
                                area_id=str(documento.area_actual_id),
                                dias_restantes=days
                            )
                            logger.info(f"Sent expiration notification for document {documento.numero_expediente} ({days} days)")
                        except Exception as e:
                            logger.error(f"Error sending expiration notification: {str(e)}")
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error checking expiring documents: {str(e)}")


# Global instance
notification_scheduler = NotificationScheduler()


async def start_notification_scheduler():
    """Start the notification scheduler as a background task"""
    await notification_scheduler.start()


async def stop_notification_scheduler():
    """Stop the notification scheduler"""
    await notification_scheduler.stop()

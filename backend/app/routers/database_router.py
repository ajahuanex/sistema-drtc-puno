"""
Router para gestión y switch de Base de Datos MongoDB (Local vs Remota)
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging

from app.config.settings import settings
from app.dependencies.db import (
    get_mongo_status_detail,
    switch_mongo_target,
    test_mongo_target,
    db
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/database", tags=["Base de Datos - Switch"])

class SwitchDatabaseRequest(BaseModel):
    target: str = Field(..., description="Destino de conexión: 'local' o 'remote'")
    persist_env: bool = Field(True, description="Guardar la selección en el archivo .env")

class TestConnectionRequest(BaseModel):
    target: str = Field("remote", description="Destino a probar: 'local' o 'remote'")

class SyncDatabaseRequest(BaseModel):
    collections: Optional[List[str]] = Field(None, description="Lista opcional de colecciones a sincronizar (None para todas)")
    drop_existing: bool = Field(False, description="Sobrescribir colecciones destino si ya existen")

@router.get("/status")
async def get_database_status():
    """
    Obtiene el estado actual de la conexión a la base de datos MongoDB.
    Indica si está conectado a la base de datos Local o Remota,
    latencia de ping, colecciones existentes y host.
    """
    try:
        status_data = await get_mongo_status_detail()
        return {
            "success": True,
            "data": status_data
        }
    except Exception as e:
        logger.error(f"Error obteniendo estado de MongoDB: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error consultando estado de MongoDB: {str(e)}"
        )

@router.post("/test")
async def test_database_connection(request: TestConnectionRequest):
    """
    Prueba la conexión a un destino ('local' o 'remote') sin cambiar la conexión activa.
    """
    target = request.target.strip().lower()
    if target not in ("local", "remote"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El target debe ser 'local' o 'remote'"
        )

    result = await test_mongo_target(target)
    return {
        "success": result.get("success", False),
        "data": result
    }

@router.post("/switch")
async def switch_database(request: SwitchDatabaseRequest):
    """
    Cambia la conexión activa de MongoDB en caliente a 'local' o 'remote'.
    Opcionalmente persiste el cambio en el archivo .env para que se mantenga tras reiniciar.
    """
    target = request.target.strip().lower()
    if target not in ("local", "remote"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El target debe ser 'local' o 'remote'"
        )

    try:
        new_status = await switch_mongo_target(target, persist_env=request.persist_env)
        return {
            "success": new_status.get("connected", False),
            "message": f"Conexión cambiada a {target.upper()} correctamente",
            "data": new_status
        }
    except Exception as e:
        logger.error(f"Error cambiando conexión a {target}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo cambiar la conexión a {target}: {str(e)}"
        )

@router.post("/sync-to-remote")
async def sync_data_to_remote(request: SyncDatabaseRequest):
    """
    Sincroniza/copia colecciones de MongoDB Local a MongoDB Remoto.
    Útil para inicializar la base de datos remota con los datos actuales.
    """
    from pymongo import MongoClient
    
    try:
        # Clientes síncronos dedicados para transferencia masiva
        client_local = MongoClient(settings.MONGODB_URL_LOCAL, serverSelectionTimeoutMS=5000)
        client_remote = MongoClient(settings.MONGODB_URL_REMOTE, serverSelectionTimeoutMS=8000)
        
        db_local = client_local[settings.DATABASE_NAME]
        db_remote = client_remote[settings.DATABASE_NAME]
        
        # Verificar colecciones locales
        available_cols = db_local.list_collection_names()
        target_cols = request.collections if request.collections else available_cols
        
        results: Dict[str, Any] = {}
        total_docs = 0

        for col_name in target_cols:
            if col_name not in available_cols:
                continue
                
            col_local = db_local[col_name]
            col_remote = db_remote[col_name]
            
            if request.drop_existing:
                col_remote.drop()
                
            docs = list(col_local.find({}))
            count = len(docs)
            if count > 0:
                # Insertar en lotes si es grande
                batch_size = 500
                inserted = 0
                for i in range(0, count, batch_size):
                    batch = docs[i:i + batch_size]
                    # Si no hacemos drop_existing, usar replace/upsert por _id
                    for doc in batch:
                        col_remote.replace_one({"_id": doc["_id"]}, doc, upsert=True)
                        inserted += 1
                results[col_name] = {"total_local": count, "synced": inserted}
                total_docs += inserted
            else:
                results[col_name] = {"total_local": 0, "synced": 0}

        client_local.close()
        client_remote.close()
        
        return {
            "success": True,
            "message": f"Sincronización completada. {total_docs} documentos copiados a MongoDB Remoto.",
            "total_documents": total_docs,
            "collections": results
        }
    except Exception as e:
        logger.error(f"Error en sincronización a remoto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante la sincronización: {str(e)}"
        )

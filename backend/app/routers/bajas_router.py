import logging
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from bson import ObjectId

from app.dependencies.db import get_database
from app.dependencies.auth import get_current_active_user, get_admin_or_oti_user
from app.models.usuario import UsuarioResponse
from app.models.baja_externa import BajaExternaCreate, BajaExternaUpdate, BajaExternaResponse
from app.config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bajas", tags=["Módulo de Bajas Externas"])

async def get_bajas_collection(db = Depends(get_database)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    return db["bajas_externas"]

@router.get("", response_model=List[BajaExternaResponse])
async def obtener_bajas(
    estado: Optional[str] = None,
    collection = Depends(get_bajas_collection),
    current_user: UsuarioResponse = Depends(get_current_active_user)
):
    """
    Obtener lista de bajas externas registradas.
    """
    query = {}
    if estado:
        query["estado_notificacion"] = estado.upper()
        
    try:
        cursor = collection.find(query).sort("fecha_registro", -1)
        bajas = await cursor.to_list(length=100)
        
        # Convertir _id a string
        for b in bajas:
            b["_id"] = str(b["_id"])
            
        return bajas
    except Exception as e:
        logger.error(f"Error obteniendo bajas externas: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("", response_model=BajaExternaResponse, status_code=201)
async def registrar_baja(
    placa: str = Form(...),
    ruc_empresa: str = Form(...),
    razon_social: str = Form(...),
    motivo: str = Form(...),
    observaciones: Optional[str] = Form(None),
    archivo: UploadFile = File(...),
    collection = Depends(get_bajas_collection),
    current_user: UsuarioResponse = Depends(get_current_active_user)
):
    """
    Registrar una nueva baja externa adjuntando la evidencia (PDF/Imagen).
    """
    try:
        # Guardar archivo
        upload_dir = os.path.join(settings.UPLOAD_DIR, "bajas_externas")
        os.makedirs(upload_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{placa}_{timestamp}_{archivo.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            buffer.write(await archivo.read())
            
        archivo_url = f"/uploads/bajas_externas/{filename}"
        
        nueva_baja = {
            "placa": placa.upper().strip(),
            "ruc_empresa": ruc_empresa,
            "razon_social": razon_social,
            "motivo": motivo,
            "observaciones": observaciones,
            "archivo_evidencia": archivo_url,
            "estado_notificacion": "PENDIENTE",
            "fecha_registro": datetime.utcnow(),
            "registrado_por": current_user.dni
        }
        
        result = await collection.insert_one(nueva_baja)
        nueva_baja["_id"] = str(result.inserted_id)
        
        logger.info(f"Baja externa registrada para placa {placa} por usuario {current_user.dni}")
        return nueva_baja
        
    except Exception as e:
        logger.error(f"Error registrando baja externa: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al guardar el registro")

@router.put("/{baja_id}/notificar", response_model=BajaExternaResponse)
async def marcar_como_notificado(
    baja_id: str,
    observaciones: Optional[str] = None,
    collection = Depends(get_bajas_collection),
    current_user: UsuarioResponse = Depends(get_current_active_user)
):
    """
    Marcar una baja externa como NOTIFICADA (ej. ya se envió oficio al MTC).
    """
    try:
        if not ObjectId.is_valid(baja_id):
            raise HTTPException(status_code=400, detail="ID inválido")
            
        update_data = {
            "estado_notificacion": "NOTIFICADO",
            "fecha_notificacion": datetime.utcnow()
        }
        
        if observaciones:
            update_data["observaciones"] = observaciones
            
        result = await collection.find_one_and_update(
            {"_id": ObjectId(baja_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Registro de baja no encontrado")
            
        result["_id"] = str(result["_id"])
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando estado de baja {baja_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al actualizar el registro")

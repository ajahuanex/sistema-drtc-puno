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
    tipo_baja: Optional[str] = None,
    q: Optional[str] = None,
    collection = Depends(get_bajas_collection),
    current_user: UsuarioResponse = Depends(get_current_active_user)
):
    """
    Obtener lista de bajas vehiculares (externas y locales) registradas.
    """
    query = {}
    if estado:
        query["estado_notificacion"] = estado.upper()
    if tipo_baja and tipo_baja.upper() != 'TODOS':
        query["tipo_baja"] = tipo_baja.upper()
    if q and q.strip():
        term = q.strip()
        query["$or"] = [
            {"placa": {"$regex": term, "$options": "i"}},
            {"ruc_empresa": {"$regex": term, "$options": "i"}},
            {"razon_social": {"$regex": term, "$options": "i"}},
            {"motivo": {"$regex": term, "$options": "i"}}
        ]
        
    try:
        cursor = collection.find(query).sort("fecha_registro", -1)
        bajas = await cursor.to_list(length=300)
        
        # Convertir _id a string y asegurar valores por defecto
        for b in bajas:
            b["_id"] = str(b["_id"])
            if "tipo_baja" not in b:
                b["tipo_baja"] = "EXTERNA"
            
        return bajas
    except Exception as e:
        logger.error(f"Error obteniendo bajas: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/buscar-vehiculo/{placa}")
async def buscar_vehiculo_baja(
    placa: str,
    db = Depends(get_database),
    current_user: UsuarioResponse = Depends(get_current_active_user)
):
    """
    Busca si el vehículo existe en la flota regional para autocompletar RUC y Razón Social.
    """
    placa_clean = placa.upper().strip()
    try:
        # Buscar en flota_empresa
        flota_doc = await db["flota_empresa"].find_one({"placa": placa_clean})
        if flota_doc:
            ruc = flota_doc.get("ruc") or flota_doc.get("ruc_empresa", "")
            empresa_doc = None
            if ruc:
                empresa_doc = await db["empresas"].find_one({"ruc": ruc})
            razon_social = (
                flota_doc.get("razon_social") or 
                (empresa_doc.get("razon_social") if empresa_doc else "") or 
                flota_doc.get("empresa", "")
            )
            return {
                "encontrado": True,
                "placa": placa_clean,
                "ruc_empresa": ruc,
                "razon_social": razon_social,
                "origen": "flota_empresa"
            }
        
        # Buscar en vehiculos general
        veh_doc = await db["vehiculos"].find_one({"placa": placa_clean})
        if veh_doc:
            ruc = veh_doc.get("ruc_empresa") or veh_doc.get("ruc", "")
            empresa_doc = None
            if ruc:
                empresa_doc = await db["empresas"].find_one({"ruc": ruc})
            razon_social = (
                veh_doc.get("razon_social") or 
                (empresa_doc.get("razon_social") if empresa_doc else "")
            )
            return {
                "encontrado": True,
                "placa": placa_clean,
                "ruc_empresa": ruc,
                "razon_social": razon_social,
                "origen": "vehiculos"
            }
            
        return {"encontrado": False, "placa": placa_clean}
    except Exception as e:
        logger.warning(f"Error consultando vehículo {placa} para baja: {str(e)}")
        return {"encontrado": False, "placa": placa_clean}


@router.post("", response_model=BajaExternaResponse, status_code=201)
async def registrar_baja(
    placa: str = Form(...),
    tipo_baja: str = Form("EXTERNA"),
    ruc_empresa: Optional[str] = Form(None),
    razon_social: Optional[str] = Form(None),
    motivo: Optional[str] = Form(None),
    observaciones: Optional[str] = Form(None),
    entidad_destino: Optional[str] = Form(None),
    numero_oficio: Optional[str] = Form(None),
    archivo: Optional[UploadFile] = File(None),
    collection = Depends(get_bajas_collection),
    current_user: UsuarioResponse = Depends(get_current_active_user)
):
    """
    Registrar una nueva baja (externa o local). Todos los campos excepto placa son opcionales.
    """
    try:
        archivo_url = None
        # Guardar archivo de evidencia si fue adjuntado
        if archivo and archivo.filename:
            upload_dir = os.path.join(settings.UPLOAD_DIR, "bajas_externas")
            os.makedirs(upload_dir, exist_ok=True)
            
            clean_placa = placa.upper().strip().replace(" ", "_")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_filename = archivo.filename.replace(" ", "_")
            filename = f"{clean_placa}_{timestamp}_{safe_filename}"
            file_path = os.path.join(upload_dir, filename)
            
            with open(file_path, "wb") as buffer:
                buffer.write(await archivo.read())
                
            archivo_url = f"/uploads/bajas_externas/{filename}"
        
        tipo_normalizado = tipo_baja.upper().strip() if tipo_baja else "EXTERNA"
        if tipo_normalizado not in ["EXTERNA", "LOCAL"]:
            tipo_normalizado = "EXTERNA"

        nueva_baja = {
            "tipo_baja": tipo_normalizado,
            "placa": placa.upper().strip(),
            "ruc_empresa": ruc_empresa.strip() if ruc_empresa else None,
            "razon_social": razon_social.strip() if razon_social else None,
            "motivo": motivo.strip() if motivo else "Baja vehicular",
            "observaciones": observaciones.strip() if observaciones else None,
            "entidad_destino": entidad_destino.strip() if entidad_destino else ("MTC" if tipo_normalizado == "EXTERNA" else "Regional Puno"),
            "numero_oficio": numero_oficio.strip() if numero_oficio else None,
            "archivo_evidencia": archivo_url,
            "estado_notificacion": "PENDIENTE",
            "fecha_registro": datetime.utcnow(),
            "registrado_por": getattr(current_user, "dni", None) or getattr(current_user, "username", "SISTEMA")
        }
        
        result = await collection.insert_one(nueva_baja)
        nueva_baja["_id"] = str(result.inserted_id)
        
        logger.info(f"Baja ({tipo_normalizado}) registrada para placa {placa} por usuario {nueva_baja['registrado_por']}")
        return nueva_baja
        
    except Exception as e:
        logger.error(f"Error registrando baja: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al guardar el registro: {str(e)}")


@router.put("/{baja_id}/notificar", response_model=BajaExternaResponse)
async def marcar_como_notificado(
    baja_id: str,
    payload: Optional[dict] = None,
    collection = Depends(get_bajas_collection),
    current_user: UsuarioResponse = Depends(get_current_active_user)
):
    """
    Marcar una baja vehicular como NOTIFICADA (ej. ya se emitió y notificó oficio a la empresa o MTC).
    """
    try:
        if not ObjectId.is_valid(baja_id):
            raise HTTPException(status_code=400, detail="ID inválido")
            
        update_data = {
            "estado_notificacion": "NOTIFICADO",
            "fecha_notificacion": datetime.utcnow()
        }
        
        if payload:
            if payload.get("observaciones"):
                update_data["observaciones"] = payload["observaciones"]
            if payload.get("numero_oficio"):
                update_data["numero_oficio"] = payload["numero_oficio"]
            if payload.get("entidad_destino"):
                update_data["entidad_destino"] = payload["entidad_destino"]
            
        result = await collection.find_one_and_update(
            {"_id": ObjectId(baja_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Registro de baja no encontrado")
            
        result["_id"] = str(result["_id"])
        if "tipo_baja" not in result:
            result["tipo_baja"] = "EXTERNA"
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando estado de baja {baja_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al actualizar el registro")


@router.delete("/{baja_id}", status_code=204)
async def eliminar_baja(
    baja_id: str,
    collection = Depends(get_bajas_collection),
    current_user: UsuarioResponse = Depends(get_current_active_user)
):
    """
    Eliminar un registro de baja vehicular.
    """
    try:
        if not ObjectId.is_valid(baja_id):
            raise HTTPException(status_code=400, detail="ID inválido")
            
        result = await collection.delete_one({"_id": ObjectId(baja_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
            
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando baja {baja_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al eliminar registro")

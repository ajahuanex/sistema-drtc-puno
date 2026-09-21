import logging
from datetime import datetime
from bson import ObjectId
from typing import Dict, Any

from app.models.sustitucion import SustitucionRequest
from app.models.flota_empresa import VehiculoEmpresaUpdate

logger = logging.getLogger(__name__)

class SustitucionService:
    def __init__(self, db):
        self.db = db
        self.flota_collection = db["flota_empresa"]
        self.resoluciones_hijas = db["resoluciones_hijas"]
        
    async def procesar_sustitucion(self, request: SustitucionRequest, user_dni: str) -> Dict[str, Any]:
        """
        Lógica core para sustituir un vehículo.
        """
        # 1. Buscar placa_baja en flota_empresa
        vehiculo_baja = await self.flota_collection.find_one({
            "ruc": request.ruc_empresa,
            "placa": request.placa_baja,
            "estado": {"$ne": "INHABILITADO"}
        })
        
        if not vehiculo_baja:
            raise ValueError(f"El vehículo {request.placa_baja} no se encuentra habilitado para el RUC {request.ruc_empresa}.")
            
        resolucion_primigenia = vehiculo_baja.get("nro_resolucion_primigenia", "S/N")
        razon_social = vehiculo_baja.get("razon_social", "")
        
        # 2. Registrar en resoluciones_hijas
        nro_res = request.numero_resolucion.upper().strip()
        resolucion_doc = {
            "nro_resolucion": nro_res,
            "tipo_acto": "SUSTITUCION_VEHICULAR",
            "placa": request.placa_alta,
            "baja_sustitucion": request.placa_baja,
            "fecha_resolucion": request.fecha_resolucion,
            "ruc_empresa": request.ruc_empresa,
            "razon_social": razon_social,
            "estado": "ACTIVA",
            "esta_activo": True,
            "fecha_registro": datetime.utcnow()
        }
        if request.archivo_resolucion:
            resolucion_doc["archivo_pdf"] = request.archivo_resolucion
            
        await self.resoluciones_hijas.insert_one(resolucion_doc)
        
        # 3. Actualizar placa_baja -> INHABILITADO
        obs_baja = vehiculo_baja.get("observaciones", "") or ""
        obs_baja += f" | SUSTITUIDO EN {nro_res}"
        
        historial_baja = vehiculo_baja.get("observaciones_historial", [])
        historial_baja.append({
            "fecha": datetime.utcnow(),
            "texto": f"Sustituido por {request.placa_alta} mediante Res. {nro_res}",
            "usuario": user_dni
        })
        
        await self.flota_collection.update_one(
            {"_id": vehiculo_baja["_id"]},
            {"$set": {
                "estado": "INHABILITADO",
                "observaciones": obs_baja.strip(" |"),
                "observaciones_historial": historial_baja,
                "fecha_actualizacion": datetime.utcnow()
            }}
        )
        
        # 4. Registrar/Actualizar placa_alta en flota_empresa
        obs_alta = f"Sustituye a {request.placa_baja} (Res: {nro_res})."
        if request.modifico_rutas and request.motivo_modificacion_rutas:
            obs_alta += f" Rutas modificadas: {request.motivo_modificacion_rutas}."
            
        alta_doc = {
            "ruc": request.ruc_empresa,
            "placa": request.placa_alta,
            "razon_social": razon_social,
            "estado": "HABILITADO",
            "nro_resolucion_primigenia": resolucion_primigenia,
            "nro_resolucion_hija": nro_res,
            "rutas_asignadas": request.rutas_heredadas,
            "observaciones": obs_alta,
            "fecha_cronologica": datetime.utcnow(),
            "esta_activo": True,
            "es_cronologico": False,
            "observaciones_historial": [{
                "fecha": datetime.utcnow(),
                "texto": f"Alta por sustitución de {request.placa_baja}",
                "usuario": user_dni
            }]
        }
        
        # Verificar si placa_alta ya existe en flota (en estado inactivo o similar para esta empresa)
        existente = await self.flota_collection.find_one({
            "ruc": request.ruc_empresa,
            "placa": request.placa_alta
        })
        
        if existente:
            await self.flota_collection.update_one(
                {"_id": existente["_id"]},
                {"$set": alta_doc}
            )
            id_alta = existente["_id"]
        else:
            res_alta = await self.flota_collection.insert_one(alta_doc)
            id_alta = res_alta.inserted_id
            
        return {
            "mensaje": "Sustitución procesada correctamente",
            "resolucion_creada": nro_res,
            "baja_procesada": request.placa_baja,
            "alta_procesada": request.placa_alta,
            "id_vehiculo_alta": str(id_alta)
        }

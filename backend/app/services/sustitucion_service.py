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
        # 1. Validar que las placas no sean iguales
        placa_baja_clean = request.placa_baja.strip().upper()
        placa_alta_clean = request.placa_alta.strip().upper()
        if placa_baja_clean == placa_alta_clean:
            raise ValueError("Operación Denegada: La placa entrante no puede ser idéntica a la placa saliente.")

        # 2. Buscar placa_baja en flota_empresa de la misma empresa
        vehiculo_baja = await self.flota_collection.find_one({
            "ruc": request.ruc_empresa,
            "placa": placa_baja_clean
        })
        
        if not vehiculo_baja:
            raise ValueError(f"Operación Denegada: El vehículo saliente {placa_baja_clean} no se encuentra registrado en la flota para el RUC {request.ruc_empresa}.")

        estado_baja = str(vehiculo_baja.get("estado", "")).upper()
        activo_baja = vehiculo_baja.get("esta_activo", True)
        if estado_baja in ["SUSTITUIDO", "INHABILITADO", "BAJA"] or activo_baja is False:
            raise ValueError(f"Operación Denegada: El vehículo saliente {placa_baja_clean} se encuentra en estado '{estado_baja}' (ya fue sustituido o dado de baja previamente). Un vehículo no puede ser sustituido 2 veces.")

        # 3. Control de Doble Habilitación para placa_alta (Vehículo entrante):
        # A) ¿Está habilitado en otra empresa?
        otra_activa = await self.flota_collection.find_one({
            "ruc": {"$ne": request.ruc_empresa},
            "placa": placa_alta_clean,
            "estado": "HABILITADO",
            "esta_activo": {"$ne": False}
        })
        if otra_activa:
            otra_emp_razon = otra_activa.get("razon_social") or "otra empresa"
            otra_emp_ruc = otra_activa.get("ruc") or ""
            otra_res = otra_activa.get("nro_resolucion_hija") or otra_activa.get("nro_resolucion_primigenia") or "S/N"
            raise ValueError(
                f"Doble Habilitación Prohibida: El vehículo entrante {placa_alta_clean} ya se encuentra HABILITADO "
                f"en la empresa '{otra_emp_razon}' (RUC {otra_emp_ruc}, Resolución {otra_res}). "
                f"Un vehículo no puede tener doble habilitación simultánea (D.S. 017-2009-MTC). Debe gestionar su baja previa."
            )

        # B) ¿Ya está habilitado en la misma empresa?
        misma_activa = await self.flota_collection.find_one({
            "ruc": request.ruc_empresa,
            "placa": placa_alta_clean,
            "estado": "HABILITADO",
            "esta_activo": {"$ne": False}
        })
        if misma_activa and str(misma_activa.get("_id")) != str(vehiculo_baja.get("_id")):
            res_misma = misma_activa.get("nro_resolucion_hija") or misma_activa.get("nro_resolucion_primigenia") or "S/N"
            raise ValueError(
                f"Doble Habilitación Prohibida: El vehículo entrante {placa_alta_clean} ya se encuentra HABILITADO "
                f"en esta misma empresa bajo la Resolución {res_misma}."
            )
            
        resolucion_primigenia = vehiculo_baja.get("nro_resolucion_primigenia", "S/N")
        razon_social = vehiculo_baja.get("razon_social", "")
        
        # 4. Registrar en resoluciones_hijas
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
                "estado": "SUSTITUIDO",
                "esta_activo": False,
                "motivo_baja": f"Sustituido por {request.placa_alta} mediante Res. {nro_res}",
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

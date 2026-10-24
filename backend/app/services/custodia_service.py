import os
import re
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from fastapi import HTTPException, UploadFile
import logging

from app.config.settings import settings
from app.models.custodia import (
    DocumentoCustodiaCreate, DocumentoCustodiaUpdate,
    MovimientoPrestamo
)

logger = logging.getLogger(__name__)

class CustodiaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.documentos_custodia

    async def _generar_codigo_custodia(self) -> str:
        """Genera un código correlativo para custodia anual, ej. CUST-2026-0001"""
        anio = datetime.utcnow().year
        prefijo = f"CUST-{anio}-"
        # Contar documentos con ese prefijo
        count = await self.collection.count_documents({"codigo_custodia": {"$regex": f"^{prefijo}"}})
        correlativo = str(count + 1).zfill(4)
        return f"{prefijo}{correlativo}"

    async def get_documentos(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        estado: Optional[str] = None,
        area: Optional[str] = None,
        tipo_tramite: Optional[str] = None
    ) -> Dict[str, Any]:
        """Obtiene la lista paginada y filtrada de expedientes/documentos en custodia"""
        query: Dict[str, Any] = {}

        if estado and estado != "TODOS":
            query["estado_custodia"] = estado

        if area and area != "TODOS":
            query["area_remitente"] = {"$regex": re.escape(area), "$options": "i"}

        if tipo_tramite and tipo_tramite != "TODOS":
            query["tipo_tramite"] = tipo_tramite

        if search and search.strip():
            st = re.escape(search.strip())
            query["$or"] = [
                {"nro_memorandum": {"$regex": st, "$options": "i"}},
                {"nro_expediente": {"$regex": st, "$options": "i"}},
                {"razon_social": {"$regex": st, "$options": "i"}},
                {"ruc": {"$regex": st, "$options": "i"}},
                {"asunto_expediente": {"$regex": st, "$options": "i"}},
                {"codigo_custodia": {"$regex": st, "$options": "i"}},
                {"nro_resolucion": {"$regex": st, "$options": "i"}},
                {"ubicacion_archivador": {"$regex": st, "$options": "i"}},
                {"ubicacion_estante": {"$regex": st, "$options": "i"}}
            ]

        total = await self.collection.count_documents(query)
        cursor = self.collection.find(query).sort("fecha_ingreso_custodia", -1).skip(skip).limit(limit)

        documentos = []
        async for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            if "id" not in doc and "_id" in doc:
                doc["id"] = doc["_id"]
            for k in ["fecha_ingreso_custodia", "fecha_actualizacion"]:
                if k in doc and hasattr(doc[k], "isoformat"):
                    doc[k] = doc[k].isoformat()
            documentos.append(doc)

        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "items": documentos
        }

    async def get_stats(self) -> Dict[str, Any]:
        """Calcula estadísticas generales del acervo documentario en custodia"""
        total = await self.collection.count_documents({})
        en_custodia = await self.collection.count_documents({"estado_custodia": "EN_CUSTODIA"})
        prestados = await self.collection.count_documents({"estado_custodia": "PRESTADO"})
        transferidos = await self.collection.count_documents({"estado_custodia": "TRANSFERIDO_ARCHIVO_CENTRAL"})

        # Agregación para suma total de folios
        pipeline_folios = [
            {"$group": {"_id": None, "total_folios": {"$sum": "$nro_folios"}}}
        ]
        res_folios = await self.collection.aggregate(pipeline_folios).to_list(length=1)
        total_folios = res_folios[0]["total_folios"] if res_folios else 0

        # Agrupación por área remitente
        pipeline_areas = [
            {"$group": {"_id": "$area_remitente", "cantidad": {"$sum": 1}}},
            {"$sort": {"cantidad": -1}},
            {"$limit": 7}
        ]
        areas_agrupadas = await self.collection.aggregate(pipeline_areas).to_list(length=10)

        # Últimos 5 ingresos
        cursor_ultimos = self.collection.find().sort("fecha_ingreso_custodia", -1).limit(5)
        ultimos = []
        async for doc in cursor_ultimos:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            if "id" not in doc:
                doc["id"] = doc["_id"]
            if "fecha_ingreso_custodia" in doc and hasattr(doc["fecha_ingreso_custodia"], "isoformat"):
                doc["fecha_ingreso_custodia"] = doc["fecha_ingreso_custodia"].isoformat()
            ultimos.append(doc)

        return {
            "total_general": total,
            "en_custodia": en_custodia,
            "prestados": prestados,
            "transferidos": transferidos,
            "total_folios": total_folios,
            "por_area": areas_agrupadas,
            "ultimos_ingresos": ultimos
        }

    async def get_documento_by_id(self, doc_id: str) -> Optional[dict]:
        """Obtiene un documento por ID (ObjectId o UUID)"""
        doc = None
        if ObjectId.is_valid(doc_id):
            doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
        if not doc:
            doc = await self.collection.find_one({"id": doc_id})
        if not doc:
            doc = await self.collection.find_one({"codigo_custodia": doc_id})

        if doc:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            if "id" not in doc:
                doc["id"] = doc["_id"]
            for k in ["fecha_ingreso_custodia", "fecha_actualizacion"]:
                if k in doc and hasattr(doc[k], "isoformat"):
                    doc[k] = doc[k].isoformat()
            return doc
        return None

    async def create_documento(self, data: DocumentoCustodiaCreate, usuario: Optional[str] = None) -> dict:
        """Crea un nuevo registro en custodia de expedientes"""
        doc_dict = data.dict(exclude_unset=False)
        doc_dict["codigo_custodia"] = await self._generar_codigo_custodia()
        doc_dict["fecha_ingreso_custodia"] = datetime.utcnow()
        doc_dict["fecha_actualizacion"] = datetime.utcnow()
        doc_dict["registrado_por"] = usuario or "SISTEMA"
        doc_dict["prestamo_actual"] = None
        doc_dict["historial_prestamos"] = []

        result = await self.collection.insert_one(doc_dict)
        doc_dict["_id"] = str(result.inserted_id)
        doc_dict["id"] = doc_dict["_id"]
        doc_dict["fecha_ingreso_custodia"] = doc_dict["fecha_ingreso_custodia"].isoformat()
        doc_dict["fecha_actualizacion"] = doc_dict["fecha_actualizacion"].isoformat()
        logger.info(f"Expediente en custodia creado: {doc_dict['codigo_custodia']} (Exp: {doc_dict.get('nro_expediente')})")
        return doc_dict

    async def update_documento(self, doc_id: str, data: DocumentoCustodiaUpdate, usuario: Optional[str] = None) -> Optional[dict]:
        """Actualiza metadatos de un expediente en custodia"""
        update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
        if not update_data:
            return await self.get_documento_by_id(doc_id)

        update_data["fecha_actualizacion"] = datetime.utcnow()

        filter_q = {"_id": ObjectId(doc_id)} if ObjectId.is_valid(doc_id) else {"id": doc_id}
        result = await self.collection.update_one(filter_q, {"$set": update_data})
        if result.matched_count == 0:
            return None
        return await self.get_documento_by_id(doc_id)

    async def delete_documento(self, doc_id: str) -> bool:
        """Elimina un registro de custodia"""
        filter_q = {"_id": ObjectId(doc_id)} if ObjectId.is_valid(doc_id) else {"id": doc_id}
        doc = await self.collection.find_one(filter_q)
        if not doc:
            return False

        # Intentar limpiar archivos si existen
        for fkey in ["archivo_memo", "archivo_expediente"]:
            fpath = doc.get(fkey)
            if fpath and fpath.startswith("/uploads/"):
                rel_path = fpath.replace("/uploads/", "")
                full_path = os.path.join(settings.UPLOAD_DIR, rel_path)
                if os.path.exists(full_path):
                    try:
                        os.remove(full_path)
                    except Exception as e:
                        logger.warning(f"No se pudo borrar archivo físico {full_path}: {e}")

        res = await self.collection.delete_one(filter_q)
        return res.deleted_count > 0

    async def registrar_prestamo(self, doc_id: str, prestamo: MovimientoPrestamo, usuario: Optional[str] = None) -> dict:
        """Registra la salida temporal de un expediente por préstamo a un funcionario/oficina"""
        doc = await self.get_documento_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Expediente en custodia no encontrado")

        if doc.get("estado_custodia") == "PRESTADO":
            raise HTTPException(
                status_code=400,
                detail=f"El expediente ya se encuentra en calidad de PRESTADO a {doc.get('prestamo_actual', {}).get('solicitante', 'otro usuario')}."
            )

        prestamo_dict = prestamo.dict()
        prestamo_dict["id"] = str(uuid.uuid4())[:8]
        prestamo_dict["fecha_prestamo"] = datetime.utcnow()
        prestamo_dict["devuelto"] = False
        prestamo_dict["registrado_por"] = usuario or "SISTEMA"

        filter_q = {"_id": ObjectId(doc_id)} if ObjectId.is_valid(doc_id) else {"id": doc_id}
        await self.collection.update_one(
            filter_q,
            {
                "$set": {
                    "estado_custodia": "PRESTADO",
                    "prestamo_actual": prestamo_dict,
                    "fecha_actualizacion": datetime.utcnow()
                },
                "$push": {
                    "historial_prestamos": prestamo_dict
                }
            }
        )
        return await self.get_documento_by_id(doc_id)

    async def registrar_devolucion(
        self,
        doc_id: str,
        observaciones_devolucion: Optional[str] = None,
        usuario: Optional[str] = None
    ) -> dict:
        """Registra el reingreso/devolución formal del expediente a custodia"""
        doc = await self.get_documento_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Expediente en custodia no encontrado")

        prestamo_actual = doc.get("prestamo_actual")
        if not prestamo_actual:
            raise HTTPException(status_code=400, detail="El expediente no registra préstamo activo para devolver")

        prestamo_id = prestamo_actual.get("id")
        now = datetime.utcnow()

        filter_q = {"_id": ObjectId(doc_id)} if ObjectId.is_valid(doc_id) else {"id": doc_id}

        # Actualizar préstamo en historial
        await self.collection.update_one(
            filter_q,
            {
                "$set": {
                    "estado_custodia": "EN_CUSTODIA",
                    "prestamo_actual": None,
                    "fecha_actualizacion": now,
                    "historial_prestamos.$[elem].devuelto": True,
                    "historial_prestamos.$[elem].fecha_devolucion_real": now,
                    "historial_prestamos.$[elem].observaciones_devolucion": observaciones_devolucion or "Devolución conforme"
                }
            },
            array_filters=[{"elem.id": prestamo_id}]
        )

        return await self.get_documento_by_id(doc_id)

    async def guardar_archivo_adjunto(
        self,
        doc_id: str,
        tipo_archivo: str,  # 'memo' o 'expediente'
        archivo: UploadFile
    ) -> dict:
        """Guarda físicamente el PDF del memorándum o del expediente escaneado y lo vincula al registro"""
        doc = await self.get_documento_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Expediente en custodia no encontrado")

        upload_dir = os.path.join(settings.UPLOAD_DIR, "custodia")
        os.makedirs(upload_dir, exist_ok=True)

        nro_exp_clean = re.sub(r'[^a-zA-Z0-9_-]', '_', doc.get("nro_expediente", "EXP"))
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_orig_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', archivo.filename or "documento.pdf")
        filename = f"{tipo_archivo}_{nro_exp_clean}_{timestamp}_{safe_orig_name}"
        file_path = os.path.join(upload_dir, filename)

        with open(file_path, "wb") as buffer:
            content = await archivo.read()
            buffer.write(content)

        archivo_url = f"/uploads/custodia/{filename}"

        campo_url = "archivo_memo" if tipo_archivo == "memo" else "archivo_expediente"
        campo_nombre = "nombre_archivo_memo" if tipo_archivo == "memo" else "nombre_archivo_expediente"

        filter_q = {"_id": ObjectId(doc_id)} if ObjectId.is_valid(doc_id) else {"id": doc_id}
        await self.collection.update_one(
            filter_q,
            {
                "$set": {
                    campo_url: archivo_url,
                    campo_nombre: archivo.filename,
                    "fecha_actualizacion": datetime.utcnow()
                }
            }
        )

        return {
            "success": True,
            "tipo": tipo_archivo,
            "archivo_url": archivo_url,
            "nombre_archivo": archivo.filename
        }

    async def acumular_documento(
        self,
        doc_id: str,
        nro_documento: Optional[str] = None,
        fecha_documento: Optional[str] = None,
        folios_agregados: int = 0,
        asunto: Optional[str] = None,
        area_remitente: Optional[str] = "SUB DIRECCION DE TRANSPORTE TERRESTRE",
        remitente_nombre: Optional[str] = "Lic. Edgar Burneo Gonzales",
        archivo: Optional[UploadFile] = None,
        usuario: Optional[str] = None
    ) -> dict:
        """Acumula o anexa un actuado complementario al documento principal en custodia"""
        doc = await self.get_documento_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Documento en custodia no encontrado")

        archivo_url = None
        nombre_archivo = None
        if archivo:
            upload_dir = os.path.join(settings.UPLOAD_DIR, "custodia")
            os.makedirs(upload_dir, exist_ok=True)
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', archivo.filename or "acumulado.pdf")
            filename = f"acumulado_{timestamp}_{safe_name}"
            file_path = os.path.join(upload_dir, filename)
            with open(file_path, "wb") as buffer:
                content = await archivo.read()
                buffer.write(content)
            archivo_url = f"/uploads/custodia/{filename}"
            nombre_archivo = archivo.filename

        acumulado_item = {
            "id": str(uuid.uuid4())[:8],
            "nro_documento": nro_documento,
            "fecha_documento": fecha_documento,
            "folios_agregados": folios_agregados,
            "asunto": asunto,
            "area_remitente": area_remitente or "SUB DIRECCION DE TRANSPORTE TERRESTRE",
            "remitente_nombre": remitente_nombre or "Lic. Edgar Burneo Gonzales",
            "archivo_adjunto": archivo_url,
            "nombre_archivo": nombre_archivo,
            "fecha_acumulacion": datetime.utcnow().isoformat(),
            "registrado_por": usuario or "SISTEMA"
        }

        filter_q = {"_id": ObjectId(doc_id)} if ObjectId.is_valid(doc_id) else {"id": doc_id}
        await self.collection.update_one(
            filter_q,
            {
                "$inc": {"nro_folios": folios_agregados},
                "$push": {"documentos_acumulados": acumulado_item},
                "$set": {"fecha_actualizacion": datetime.utcnow()}
            }
        )

        return await self.get_documento_by_id(doc_id)


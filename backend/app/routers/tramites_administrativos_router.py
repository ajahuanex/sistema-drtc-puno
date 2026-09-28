import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies.db import get_database
from app.models.tramite_administrativo import (
    TramiteAdministrativo,
    TramiteAdministrativoCreate,
    AmbitoTramite,
    TipoTramiteAdministrativo
)

logger = logging.getLogger("tramites_administrativos_router")
router = APIRouter(prefix="/tramites-administrativos", tags=["Trámites Administrativos y Corporativos"])

@router.get("", response_model=Dict[str, Any])
async def listar_tramites(
    ruc: Optional[str] = Query(None, description="Filtrar por RUC de empresa"),
    ambito: Optional[AmbitoTramite] = Query(None, description="Filtrar por ámbito (EMPRESA o CONCESION)"),
    tipo_tramite: Optional[TipoTramiteAdministrativo] = Query(None, description="Filtrar por tipo de trámite"),
    resolucion: Optional[str] = Query(None, description="Filtrar por número de resolución"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Lista el historial de trámites y actos administrativos corporativos y de concesión"""
    filtro: Dict[str, Any] = {}
    if ruc:
        filtro["ruc_empresa"] = ruc.strip()
    if ambito:
        filtro["ambito"] = ambito.value
    if tipo_tramite:
        filtro["tipo_tramite"] = tipo_tramite.value
    if resolucion:
        filtro["nro_resolucion"] = {"$regex": resolucion.strip(), "$options": "i"}
        
    cursor = db["tramites_administrativos"].find(filtro).sort("fecha_registro", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db["tramites_administrativos"].count_documents(filtro)
    
    # Formatear IDs
    for item in items:
        if "_id" in item:
            item["id"] = str(item.pop("_id"))
            
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{tramite_id}", response_model=Dict[str, Any])
async def obtener_tramite(
    tramite_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Obtiene el detalle completo de un trámite administrativo por ID"""
    doc = await db["tramites_administrativos"].find_one({"$or": [{"id": tramite_id}, {"_id": tramite_id}]})
    if not doc:
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

@router.post("", status_code=status.HTTP_201_CREATED, response_model=Dict[str, Any])
async def registrar_tramite_administrativo(
    payload: TramiteAdministrativoCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Registra un acto administrativo corporativo o de concesión (sin placa)
    y aplica los efectos inmediatos en la entidad correspondiente:
    - CAMBIO_REPRESENTANTE: actualiza empresas (representanteLegal, dni) y archiva el anterior.
    - CAMBIO_DOMICILIO: actualiza empresas (domicilioLegal) y archiva el anterior.
    - MODIFICACION_RUTA: actualiza el itinerario en rutas.
    - MODIFICACION_FRECUENCIA: actualiza las frecuencias en rutas.
    - FE_DE_ERRATAS: anexa al historial de resoluciones_primigenias.
    - Sincroniza con expedientes y resoluciones_hijas para trazabilidad total.
    """
    now = datetime.utcnow()
    tramite_id = str(uuid.uuid4())
    
    doc = payload.model_dump()
    doc["id"] = tramite_id
    doc["_id"] = tramite_id
    doc["estado"] = "APROBADO"
    doc["fecha_registro"] = now
    doc["fecha_actualizacion"] = now
    
    ruc = payload.ruc_empresa.strip()
    detalles = payload.detalles or {}
    
    # Verificar existencia de la empresa
    empresa = await db["empresas"].find_one({"ruc": ruc})
    if not empresa:
        raise HTTPException(
            status_code=400,
            detail=f"La empresa con RUC {ruc} no existe en el padrón de empresas."
        )
    razon_social = empresa.get("razonSocial") or empresa.get("razon_social") or payload.razon_social or "EMPRESA"
    doc["razon_social"] = razon_social

    # 1. Aplicación de efectos según tipo de trámite
    if payload.tipo_tramite == TipoTramiteAdministrativo.CAMBIO_REPRESENTANTE:
        nuevo_rep = detalles.get("nuevo_representante", "").strip().upper()
        nuevo_dni = detalles.get("nuevo_dni", "").strip()
        partida = detalles.get("partida_registral", "").strip()
        asiento = detalles.get("asiento_registral", "").strip()
        
        if not nuevo_rep:
            raise HTTPException(status_code=400, detail="Debe ingresar el nombre del nuevo representante legal.")
            
        rep_anterior = empresa.get("representanteLegal") or empresa.get("representante_legal") or "NO ESPECIFICADO"
        dni_anterior = empresa.get("dniRepresentanteLegal") or empresa.get("dni_representante_legal") or ""
        
        historial_entry = {
            "representante_saliente": rep_anterior,
            "dni_saliente": dni_anterior,
            "representante_entrante": nuevo_rep,
            "dni_entrante": nuevo_dni,
            "partida_registral": partida,
            "asiento": asiento,
            "nro_resolucion": payload.nro_resolucion,
            "fecha_resolucion": payload.fecha_resolucion or now,
            "fecha_cambio": now,
            "tramite_id": tramite_id
        }
        
        update_fields: Dict[str, Any] = {
            "representanteLegal": nuevo_rep,
            "representante_legal": nuevo_rep,
            "dniRepresentanteLegal": nuevo_dni,
            "dni_representante_legal": nuevo_dni,
            "fechaActualizacion": now
        }
        if partida:
            update_fields["partidaRegistral"] = partida
            update_fields["partida_registral"] = partida
            
        await db["empresas"].update_one(
            {"ruc": ruc},
            {
                "$set": update_fields,
                "$push": {"historial_representantes": historial_entry}
            }
        )

    elif payload.tipo_tramite == TipoTramiteAdministrativo.CAMBIO_DOMICILIO:
        nuevo_dom = detalles.get("nuevo_domicilio", "").strip().upper()
        if not nuevo_dom:
            raise HTTPException(status_code=400, detail="Debe ingresar el nuevo domicilio legal.")
            
        dom_anterior = empresa.get("domicilioLegal") or empresa.get("domicilio_legal") or "NO ESPECIFICADO"
        
        historial_entry = {
            "domicilio_anterior": dom_anterior,
            "domicilio_nuevo": nuevo_dom,
            "nro_resolucion": payload.nro_resolucion,
            "fecha_resolucion": payload.fecha_resolucion or now,
            "fecha_cambio": now,
            "tramite_id": tramite_id
        }
        
        await db["empresas"].update_one(
            {"ruc": ruc},
            {
                "$set": {
                    "domicilioLegal": nuevo_dom,
                    "domicilio_legal": nuevo_dom,
                    "fechaActualizacion": now
                },
                "$push": {"historial_domicilios": historial_entry}
            }
        )

    elif payload.tipo_tramite == TipoTramiteAdministrativo.MODIFICACION_RUTA:
        codigo_ruta = str(detalles.get("codigo_ruta", "")).strip()
        nuevo_itinerario = detalles.get("nuevo_itinerario", "").strip()
        if not payload.nro_resolucion_primigenia:
            raise HTTPException(status_code=400, detail="Debe asociar la Resolución Primigenia de concesión para modificar la ruta.")
            
        filtro_ruta = {
            "$or": [
                {"resolucion": payload.nro_resolucion_primigenia},
                {"resolucionNormalizada": payload.nro_resolucion_primigenia},
                {"nro_resolucion_primigenia": payload.nro_resolucion_primigenia}
            ]
        }
        if codigo_ruta:
            filtro_ruta["$or"].extend([{"codigoRuta": codigo_ruta}, {"codigo": codigo_ruta}, {"codigo_ruta": codigo_ruta}])
            
        await db["rutas"].update_many(
            filtro_ruta,
            {
                "$set": {
                    "itinerario": nuevo_itinerario,
                    "itinerario_texto": nuevo_itinerario,
                    "fechaActualizacion": now,
                    "ultima_resolucion_modificatoria": payload.nro_resolucion
                },
                "$push": {
                    "historial_modificaciones": {
                        "acto": "MODIFICACION_ITINERARIO",
                        "itinerario_anterior": detalles.get("itinerario_anterior"),
                        "itinerario_nuevo": nuevo_itinerario,
                        "resolucion": payload.nro_resolucion,
                        "fecha": now,
                        "tramite_id": tramite_id
                    }
                }
            }
        )

    elif payload.tipo_tramite == TipoTramiteAdministrativo.MODIFICACION_FRECUENCIA:
        codigo_ruta = str(detalles.get("codigo_ruta", "")).strip()
        nueva_frecuencia = detalles.get("nueva_frecuencia", "").strip().upper()
        if not nueva_frecuencia:
            raise HTTPException(status_code=400, detail="Debe especificar la nueva frecuencia autorizada.")
        if not payload.nro_resolucion_primigenia:
            raise HTTPException(status_code=400, detail="Debe asociar la Resolución Primigenia de concesión.")
            
        filtro_ruta = {
            "$or": [
                {"resolucion": payload.nro_resolucion_primigenia},
                {"resolucionNormalizada": payload.nro_resolucion_primigenia},
                {"nro_resolucion_primigenia": payload.nro_resolucion_primigenia}
            ]
        }
        if codigo_ruta:
            filtro_ruta["$or"].extend([{"codigoRuta": codigo_ruta}, {"codigo": codigo_ruta}])
            
        await db["rutas"].update_many(
            filtro_ruta,
            {
                "$set": {
                    "frecuencias": nueva_frecuencia,
                    "frecuencia": nueva_frecuencia,
                    "fechaActualizacion": now,
                    "ultima_resolucion_modificatoria": payload.nro_resolucion
                },
                "$push": {
                    "historial_modificaciones": {
                        "acto": "MODIFICACION_FRECUENCIA",
                        "frecuencia_anterior": detalles.get("frecuencia_anterior"),
                        "frecuencia_nueva": nueva_frecuencia,
                        "resolucion": payload.nro_resolucion,
                        "fecha": now,
                        "tramite_id": tramite_id
                    }
                }
            }
        )

    elif payload.tipo_tramite == TipoTramiteAdministrativo.FE_DE_ERRATAS:
        if not payload.nro_resolucion_primigenia:
            raise HTTPException(status_code=400, detail="Debe indicar la resolución sobre la cual recae la Fe de Erratas.")
            
        fe_entry = {
            "resolucion_fe_erratas": payload.nro_resolucion,
            "fecha_emision": payload.fecha_resolucion or now,
            "articulo_afectado": detalles.get("articulo_afectado", "RESOLUTIVO"),
            "dice": detalles.get("dice", "").strip(),
            "debe_decir": detalles.get("debe_decir", "").strip(),
            "fecha_registro": now,
            "tramite_id": tramite_id
        }
        
        await db["resoluciones_primigenias"].update_one(
            {"$or": [
                {"nro_resolucion": payload.nro_resolucion_primigenia},
                {"resolucion_numero": payload.nro_resolucion_primigenia}
            ]},
            {
                "$push": {"fe_de_erratas": fe_entry},
                "$set": {"fecha_actualizacion": now}
            }
        )

    elif payload.tipo_tramite == TipoTramiteAdministrativo.REACTIVACION_JUDICIAL:
        # Reactivación legal de empresa por mandato judicial u orden resolutiva
        await db["empresas"].update_one(
            {"ruc": ruc},
            {
                "$set": {
                    "estado": "AUTORIZADA",
                    "estaActivo": True,
                    "fechaActualizacion": now
                },
                "$push": {
                    "auditoria": {
                        "fechaCambio": now,
                        "usuarioId": payload.usuario or "SISTEMA",
                        "tipoCambio": "REACTIVACION_JUDICIAL",
                        "campoAnterior": "CANCELADA",
                        "campoNuevo": "AUTORIZADA",
                        "observaciones": f"Reactivación legal aprobada con acto {payload.nro_resolucion}: {payload.observaciones or ''}"
                    }
                }
            }
        )
        if payload.nro_resolucion_primigenia:
            await db["resoluciones_primigenias"].update_many(
                {"$or": [
                    {"nro_resolucion": payload.nro_resolucion_primigenia},
                    {"resolucion_numero": payload.nro_resolucion_primigenia}
                ], "ruc_empresa": ruc},
                {"$set": {"estado": "VIGENTE", "fecha_actualizacion": now}}
            )

    # 2. Sincronizar con Expedientes Administrativos si se incluye nro_expediente
    if payload.nro_expediente:
        exp_clean = payload.nro_expediente.strip().upper()
        await db["expedientes"].update_one(
            {"$or": [{"nroExpediente": exp_clean}, {"nro_expediente": exp_clean}]},
            {
                "$setOnInsert": {
                    "id": str(uuid.uuid4()),
                    "nroExpediente": exp_clean,
                    "folio": 1,
                    "fechaEmision": payload.fecha_expediente or now,
                    "tipoTramite": payload.tipo_tramite.value,
                    "estado": "APROBADO",
                    "estaActivo": True,
                    "empresaId": ruc,
                    "ruc": ruc,
                    "razonSocial": razon_social,
                    "nro_resolucion_primigenia": payload.nro_resolucion_primigenia,
                    "nro_resolucion_hija": payload.nro_resolucion,
                    "fechaRegistro": now,
                    "observaciones": f"Trámite corporativo/administrativo {payload.tipo_tramite.value} (Res. {payload.nro_resolucion})"
                }
            },
            upsert=True
        )

    # 3. Sincronizar con resoluciones_hijas para inventario unificado de actos administrativos
    await db["resoluciones_hijas"].update_one(
        {"nro_resolucion": payload.nro_resolucion.strip().upper()},
        {
            "$setOnInsert": {
                "id": tramite_id,
                "nro_resolucion": payload.nro_resolucion.strip().upper(),
                "nro_resolucion_primigenia": payload.nro_resolucion_primigenia or "AMBITO_CORPORATIVO_EMPRESA",
                "ruc_empresa": ruc,
                "razon_social": razon_social,
                "tipo_acto": payload.tipo_tramite.value,
                "tipo_tramite_origen": payload.tipo_tramite.value,
                "fecha_resolucion": payload.fecha_resolucion or now,
                "fecha_inicio_efectos": payload.fecha_resolucion or now,
                "expediente_numero": payload.nro_expediente,
                "fecha_expediente": payload.fecha_expediente,
                "link_documento": payload.link_documento,
                "link_notificacion": payload.link_notificacion,
                "observaciones": payload.observaciones or f"Acto administrativo corporativo: {payload.tipo_tramite.value}",
                "esta_activo": True,
                "fecha_registro": now,
                "vehiculos_ingresantes": [],
                "vehiculos_salientes": [],
                "numeros_tuc": []
            }
        },
        upsert=True
    )

    # 4. Guardar en la colección de trámites administrativos
    await db["tramites_administrativos"].insert_one(doc)
    doc.pop("_id", None)
    
    return {
        "success": True,
        "mensaje": f"Trámite de {payload.tipo_tramite.value} registrado y aplicado con éxito.",
        "tramite": doc
    }

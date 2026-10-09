from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
from io import BytesIO

from app.dependencies.db import get_database
from app.models.resolucion_hija import (
    ResolucionHijaCreate,
    ResolucionHijaUpdate,
    ResolucionHijaResponse,
    TipoActoModificatorio
)
from app.services.resolucion_hija_service import ResolucionHijaService
from app.services.resolucion_hija_excel_service import ResolucionHijaExcelService
from app.utils.exceptions import ResolucionNotFoundException, ResolucionAlreadyExistsException, ValidationErrorException

router = APIRouter(prefix="/resoluciones-hijas", tags=["resoluciones-hijas"])

async def get_service():
    db = await get_database()
    return ResolucionHijaService(db)

async def get_excel_service():
    db = await get_database()
    return ResolucionHijaExcelService(db)

@router.post("", response_model=ResolucionHijaResponse, response_model_by_alias=False, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ResolucionHijaResponse, response_model_by_alias=False, status_code=status.HTTP_201_CREATED)
async def create_resolucion_hija(
    data: ResolucionHijaCreate,
    service: ResolucionHijaService = Depends(get_service)
) -> ResolucionHijaResponse:
    """Crear nueva resolución hija / modificatoria"""
    if not data.nro_resolucion.strip():
        raise ValidationErrorException("nro_resolucion", "El número de resolución hija no puede estar vacío")
    if not data.nro_resolucion_primigenia.strip():
        raise ValidationErrorException("nro_resolucion_primigenia", "El número de resolución primigenia asociada es obligatorio")
    if not data.ruc_empresa.strip() or len(data.ruc_empresa.strip()) != 11:
        raise ValidationErrorException("ruc_empresa", "El RUC de la empresa debe tener 11 dígitos")

    try:
        res = await service.create_resolucion_hija(data)
        return ResolucionHijaResponse.model_validate(res)
    except ResolucionAlreadyExistsException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[ResolucionHijaResponse], response_model_by_alias=False)
@router.get("/", response_model=List[ResolucionHijaResponse], response_model_by_alias=False)
async def get_resoluciones_hijas(
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1, le=50000),
    nro_resolucion: Optional[str] = Query(None, description="Filtrar por número de resolución hija"),
    nro_resolucion_primigenia: Optional[str] = Query(None, description="Filtrar por número de resolución primigenia asociada"),
    ruc_empresa: Optional[str] = Query(None, description="Filtrar por RUC de empresa"),
    tipo_acto: Optional[TipoActoModificatorio] = Query(None, description="Filtrar por tipo de acto modificatorio"),
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None),
    service: ResolucionHijaService = Depends(get_service)
) -> List[ResolucionHijaResponse]:
    """Obtener lista de resoluciones hijas con filtros opcionales"""
    filtros = {}
    if nro_resolucion: filtros["nro_resolucion"] = nro_resolucion
    if nro_resolucion_primigenia: filtros["nro_resolucion_primigenia"] = nro_resolucion_primigenia
    if ruc_empresa: filtros["ruc_empresa"] = ruc_empresa
    if tipo_acto: filtros["tipo_acto"] = tipo_acto.value
    if fecha_desde: filtros["fecha_desde"] = fecha_desde
    if fecha_hasta: filtros["fecha_hasta"] = fecha_hasta

    resoluciones = await service.get_resoluciones_hijas_con_filtros(filtros)
    paginadas = resoluciones[skip:skip + limit]
    return [ResolucionHijaResponse.model_validate(r) for r in paginadas]

@router.get("/primigenia/{nro_resolucion_primigenia}", response_model=List[ResolucionHijaResponse], response_model_by_alias=False)
async def get_hijas_by_primigenia(
    nro_resolucion_primigenia: str,
    service: ResolucionHijaService = Depends(get_service)
) -> List[ResolucionHijaResponse]:
    """Obtener todas las resoluciones hijas vinculadas a una resolución primigenia específica"""
    hijas = await service.get_hijas_by_primigenia(nro_resolucion_primigenia)
    return [ResolucionHijaResponse.model_validate(h) for h in hijas]

@router.get("/empresa/{ruc_empresa}", response_model=List[ResolucionHijaResponse], response_model_by_alias=False)
async def get_hijas_by_empresa(
    ruc_empresa: str,
    service: ResolucionHijaService = Depends(get_service)
) -> List[ResolucionHijaResponse]:
    """Obtener todas las resoluciones hijas pertenecientes a una empresa por su RUC"""
    hijas = await service.get_hijas_by_ruc(ruc_empresa)
    return [ResolucionHijaResponse.model_validate(h) for h in hijas]

@router.get("/siguiente-numero", summary="Generar el siguiente número correlativo para resolución hija")
async def get_siguiente_numero_resolucion(
    tipo_tramite: Optional[str] = Query(None, description="Tipo de trámite (SUSTITUCION, INCREMENTO, etc.)"),
    anio: Optional[int] = Query(None, description="Año de la resolución"),
    service: ResolucionHijaService = Depends(get_service)
):
    """Obtener el siguiente número correlativo sugerido para resolución hija"""
    siguiente = await service.generar_siguiente_numero(tipo_tramite, anio)
    return {"siguiente_numero": siguiente}

@router.get("/numero/{nro_resolucion}", response_model=ResolucionHijaResponse, response_model_by_alias=False)
async def get_resolucion_hija_by_numero(
    nro_resolucion: str,
    service: ResolucionHijaService = Depends(get_service)
) -> ResolucionHijaResponse:
    """Buscar resolución hija por número correlativo"""
    hija = await service.get_resolucion_hija_by_numero(nro_resolucion)
    if not hija:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución hija con número {nro_resolucion}")
    return ResolucionHijaResponse.model_validate(hija)

from pydantic import BaseModel

class BulkDeleteRequest(BaseModel):
    ids: List[str]

@router.post("/eliminar-masivo")
async def eliminar_masivo_resoluciones_hijas(
    payload: BulkDeleteRequest,
    service: ResolucionHijaService = Depends(get_service)
):
    """Desactivar de forma masiva un conjunto de resoluciones hijas por sus IDs"""
    if not payload.ids:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos un ID para eliminar")
    eliminados = await service.bulk_delete_resoluciones_hijas(payload.ids)
    return {"eliminados": eliminados, "mensaje": f"{eliminados} resoluciones hijas eliminadas correctamente."}

@router.get("/{hija_id}", response_model=ResolucionHijaResponse, response_model_by_alias=False)
async def get_resolucion_hija_by_id(
    hija_id: str,
    service: ResolucionHijaService = Depends(get_service)
) -> ResolucionHijaResponse:
    """Obtener detalle de resolución hija por ID"""
    hija = await service.get_resolucion_hija_by_id(hija_id)
    if not hija:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución hija con ID {hija_id}")
    return ResolucionHijaResponse.model_validate(hija)

@router.put("/{hija_id}", response_model=ResolucionHijaResponse, response_model_by_alias=False)
async def update_resolucion_hija(
    hija_id: str,
    data: ResolucionHijaUpdate,
    service: ResolucionHijaService = Depends(get_service)
) -> ResolucionHijaResponse:
    """Actualizar datos de resolución hija"""
    hija = await service.update_resolucion_hija(hija_id, data)
    if not hija:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución hija con ID {hija_id}")
    return ResolucionHijaResponse.model_validate(hija)

@router.delete("/{hija_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resolucion_hija(
    hija_id: str,
    service: ResolucionHijaService = Depends(get_service)
):
    """Desactivar (borrado lógico) resolución hija"""
    success = await service.soft_delete_resolucion_hija(hija_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"No se encontró resolución hija con ID {hija_id}")


from bson import ObjectId
from pydantic import BaseModel

class VehiculoEdicionTramite(BaseModel):
    placa: str
    numero_tuc: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio_fabricacion: Optional[Any] = None
    categoria: Optional[str] = None
    color: Optional[str] = None
    rutas: Optional[List[str]] = None
    es_saliente: bool = False

class EditarTramiteCompletoRequest(BaseModel):
    nro_resolucion: Optional[str] = None
    nro_resolucion_primigenia: Optional[str] = None
    expediente_numero: Optional[str] = None
    fecha_resolucion: Optional[Any] = None
    observaciones: Optional[str] = None
    vehiculos: List[VehiculoEdicionTramite] = []


@router.get("/{hija_id}/vehiculos-detalle")
async def get_vehiculos_detalle_tramite(
    hija_id: str,
    db = Depends(get_database)
):
    """
    Obtiene la lista detallada de vehículos vinculados al trámite (ingresantes y salientes)
    con sus datos técnicos y números de TUC para su edición.
    """
    conditions = [{"id": hija_id}, {"nro_resolucion": hija_id}]
    if ObjectId.is_valid(hija_id):
        conditions.append({"_id": ObjectId(hija_id)})
    
    doc = await db["resoluciones_hijas"].find_one({"$or": conditions})
    if not doc:
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
        
    ruc = doc.get("ruc_empresa")
    placas_ing = doc.get("vehiculos_ingresantes") or []
    placas_sal = doc.get("vehiculos_salientes") or []
    numeros_tuc = doc.get("numeros_tuc") or []
    
    todas_placas = list(set(placas_ing + placas_sal))
    
    # Buscar datos en flota_empresa y vehiculos_data
    flota_cursor = db["flota_empresa"].find({"ruc": ruc, "placa": {"$in": todas_placas}})
    flota_map = {}
    async for fv in flota_cursor:
        flota_map[fv.get("placa")] = fv
        
    tuc_pos_map = {}
    for idx, p in enumerate(placas_ing):
        if idx < len(numeros_tuc):
            tuc_pos_map[p] = numeros_tuc[idx]
            
    resultado = []
    for p in todas_placas:
        es_saliente = p in placas_sal and p not in placas_ing
        fv = flota_map.get(p) or {}
        
        clean_p = p.replace("-", "").strip()
        vd = await db["vehiculos_data"].find_one({"$or": [{"placa_actual": p}, {"placa_actual": clean_p}, {"placa": p}]}) or {}
        
        marca = fv.get("marca") or vd.get("marca") or ""
        modelo = fv.get("modelo") or vd.get("modelo") or ""
        anio = fv.get("anio_fabricacion") or vd.get("anio_fabricacion")
        categoria = fv.get("categoria") or vd.get("categoria") or "M2"
        color = fv.get("color") or vd.get("color") or ""
        carroceria = fv.get("carroceria") or vd.get("carroceria") or ""
        modalidad = fv.get("modalidad") or vd.get("modalidad") or doc.get("modalidad_servicio") or ""
        vin = fv.get("numero_serie_vin") or fv.get("vin") or vd.get("serie_vin") or vd.get("numero_chasis") or ""
        motor = fv.get("numero_motor") or vd.get("motor") or vd.get("numero_motor") or ""
        asientos = fv.get("num_asientos") or fv.get("asientos") or vd.get("asientos") or vd.get("num_asientos")
        pasajeros = fv.get("num_pasajeros") or fv.get("pasajeros") or vd.get("pasajeros") or vd.get("num_pasajeros")
        combustible = fv.get("combustible") or vd.get("combustible") or ""
        peso_seco = fv.get("peso_neto") or fv.get("peso_seco") or vd.get("peso_neto") or vd.get("peso_seco")
        peso_bruto = fv.get("peso_bruto") or vd.get("peso_bruto")
        carga_util = fv.get("carga_util") or vd.get("carga_util")
        rutas = fv.get("rutas") or doc.get("rutas_modificadas_ids") or []
        tuc = fv.get("numero_tuc") or tuc_pos_map.get(p) or ""
        
        resultado.append({
            "placa": p,
            "numero_tuc": tuc,
            "marca": marca,
            "modelo": modelo,
            "anio_fabricacion": anio,
            "categoria": categoria,
            "color": color,
            "carroceria": carroceria,
            "modalidad": modalidad,
            "vin": vin,
            "motor": motor,
            "asientos": asientos,
            "pasajeros": pasajeros,
            "combustible": combustible,
            "peso_seco": peso_seco,
            "peso_bruto": peso_bruto,
            "carga_util": carga_util,
            "rutas": rutas,
            "es_saliente": es_saliente,
            "estado": fv.get("estado", "HABILITADO" if not es_saliente else "INHABILITADO")
        })
    
    # Ordenar: ingresantes primero, salientes al final
    resultado.sort(key=lambda x: (1 if x["es_saliente"] else 0, x["placa"]))
        
    return {
        "tramite_id": str(doc.get("_id") or doc.get("id")),
        "nro_resolucion": doc.get("nro_resolucion"),
        "nro_resolucion_primigenia": doc.get("nro_resolucion_primigenia"),
        "ruc_empresa": ruc,
        "razon_social": doc.get("razon_social"),
        "expediente_numero": doc.get("expediente_numero"),
        "fecha_resolucion": doc.get("fecha_resolucion"),
        "observaciones": doc.get("observaciones"),
        "vehiculos": resultado
    }


@router.put("/{hija_id}/editar-tramite")
async def editar_tramite_completo(
    hija_id: str,
    payload: EditarTramiteCompletoRequest,
    db = Depends(get_database)
):
    """
    Edita la información del trámite y permite agregar, modificar o eliminar vehículos,
    sincronizando la flota de la empresa y la trazabilidad de TUCs.
    """
    query = {"id": hija_id}
    if ObjectId.is_valid(hija_id):
        query = {"$or": [{"id": hija_id}, {"_id": ObjectId(hija_id)}]}
        
    doc = await db["resoluciones_hijas"].find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
        
    ruc = doc.get("ruc_empresa")
    razon_social = doc.get("razon_social")
    nro_res_actual = payload.nro_resolucion.strip() if payload.nro_resolucion else doc.get("nro_resolucion")
    nro_prim_actual = payload.nro_resolucion_primigenia.strip() if payload.nro_resolucion_primigenia else doc.get("nro_resolucion_primigenia")
    now = datetime.utcnow()
    
    placas_ing_anteriores = set(doc.get("vehiculos_ingresantes") or [])
    
    # Separar ingresantes y salientes del payload
    ingresantes = [v for v in payload.vehiculos if not v.es_saliente]
    salientes = [v for v in payload.vehiculos if v.es_saliente]
    
    nuevas_placas_ing = [v.placa.strip().upper() for v in ingresantes if v.placa]
    nuevas_placas_sal = [v.placa.strip().upper() for v in salientes if v.placa]
    nuevos_tucs = [v.numero_tuc.strip() for v in ingresantes if v.numero_tuc and v.numero_tuc.strip()]
    
    # 1. Vehículos eliminados del trámite: antes estaban en ingresantes pero ya no están
    placas_removidas = placas_ing_anteriores - set(nuevas_placas_ing)
    for p_rem in placas_removidas:
        await db["flota_empresa"].update_one(
            {"ruc": ruc, "placa": p_rem},
            {"$set": {
                "esta_activo": False,
                "estado": "INHABILITADO",
                "fecha_actualizacion": now
            },
            "$push": {
                "observaciones_historial": {
                    "fecha": now,
                    "texto": f"Removido del trámite {nro_res_actual} durante edición de resolución",
                    "fuente": "edicion_tramite"
                }
            }}
        )
        
    # 2. Procesar / agregar / actualizar cada vehículo ingresante
    for v in ingresantes:
        p = v.placa.strip().upper()
        if not p:
            continue
            
        update_data = {
            "ruc": ruc,
            "razon_social": razon_social,
            "placa": p,
            "nro_resolucion_hija": nro_res_actual,
            "nro_resolucion_primigenia": nro_prim_actual,
            "numero_tuc": v.numero_tuc.strip() if v.numero_tuc else None,
            "marca": v.marca.strip() if v.marca else None,
            "modelo": v.modelo.strip() if v.modelo else None,
            "anio_fabricacion": v.anio_fabricacion,
            "categoria": v.categoria or "M2",
            "color": v.color,
            "rutas": v.rutas or doc.get("rutas_modificadas_ids") or [],
            "estado": "HABILITADO",
            "esta_activo": True,
            "fecha_actualizacion": now
        }
        
        fields_set = {k: val for k, val in update_data.items() if val is not None}
        
        existente = await db["flota_empresa"].find_one({"ruc": ruc, "placa": p})
        if existente:
            await db["flota_empresa"].update_one(
                {"_id": existente["_id"]},
                {"$set": fields_set}
            )
        else:
            fields_set["fecha_registro"] = now
            await db["flota_empresa"].insert_one(fields_set)
            
        # Sincronizar TUC si fue especificado
        if v.numero_tuc and v.numero_tuc.strip():
            await db["tucs"].update_one(
                {"placa": p, "ruc": ruc},
                {"$set": {
                    "placa": p,
                    "ruc": ruc,
                    "razonSocial": razon_social,
                    "nroTuc": v.numero_tuc.strip(),
                    "nroResolucion": nro_res_actual,
                    "estado": "VIGENTE",
                    "fechaActualizacion": now.isoformat()
                }},
                upsert=True
            )
            
    # 3. Procesar vehículos salientes (baja)
    for v in salientes:
        p_sal = v.placa.strip().upper()
        if p_sal:
            await db["flota_empresa"].update_many(
                {"ruc": ruc, "placa": p_sal},
                {"$set": {
                    "estado": "INHABILITADO",
                    "fecha_actualizacion": now
                }}
            )

    # 4. Actualizar el documento de resolucion_hija
    update_doc = {
        "nro_resolucion": nro_res_actual,
        "nro_resolucion_primigenia": nro_prim_actual,
        "vehiculos_ingresantes": nuevas_placas_ing,
        "vehiculos_salientes": nuevas_placas_sal,
        "numeros_tuc": nuevos_tucs,
        "fecha_actualizacion": now
    }
    
    if payload.expediente_numero is not None:
        update_doc["expediente_numero"] = payload.expediente_numero.strip()
    if payload.observaciones is not None:
        update_doc["observaciones"] = payload.observaciones.strip()
    if payload.fecha_resolucion:
        try:
            if isinstance(payload.fecha_resolucion, str):
                update_doc["fecha_resolucion"] = datetime.fromisoformat(payload.fecha_resolucion.replace("Z", "+00:00"))
            else:
                update_doc["fecha_resolucion"] = payload.fecha_resolucion
        except Exception:
            pass

    await db["resoluciones_hijas"].update_one(
        query,
        {"$set": update_doc}
    )
    
    doc_actualizado = await db["resoluciones_hijas"].find_one(query)
    doc_actualizado["_id"] = str(doc_actualizado["_id"])
    return {
        "success": True,
        "mensaje": f"Trámite {nro_res_actual} actualizado con éxito",
        "tramite": doc_actualizado
    }

# ========================================
# ENDPOINTS DE CARGA MASIVA
# ========================================

class GoogleSheetRequest(BaseModel):
    url: str
    modo: Optional[str] = "upsert"


@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_resoluciones_hijas(
    excel_service: ResolucionHijaExcelService = Depends(get_excel_service)
):
    """Descargar plantilla Excel oficial para Carga Masiva de Resoluciones Hijas"""
    try:
        buffer = excel_service.generar_plantilla_excel()
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_resoluciones_hijas.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando plantilla: {str(e)}")

@router.post("/carga-masiva/procesar")
async def procesar_carga_masiva_resoluciones_hijas(
    archivo: UploadFile = File(..., description="Archivo Excel (.xlsx o .xls) con resoluciones hijas"),
    modo: str = Query("upsert", description="Modo de procesamiento: 'upsert' o 'crear'"),
    excel_service: ResolucionHijaExcelService = Depends(get_excel_service)
):
    """Procesar carga masiva de resoluciones hijas desde archivo Excel"""
    if not archivo.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="El archivo debe ser Excel (.xlsx, .xls) o CSV (.csv)")

    try:
        contenido = await archivo.read()
        buffer = BytesIO(contenido)
        resultado = await excel_service.procesar_carga_masiva(buffer, modo=modo)
        msg_extra = f" ({resultado.get('sin_ruc_valido_omitidas', 0)} filas omitidas por RUC no válido)" if resultado.get('sin_ruc_valido_omitidas', 0) > 0 else ""
        return {
            "archivo": archivo.filename,
            "resultado": resultado,
            "mensaje": f"Carga masiva completada: {resultado.get('creados', 0)} resoluciones hijas creadas, {resultado.get('actualizados', 0)} actualizadas.{msg_extra}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")

@router.post("/carga-masiva/procesar-url")
async def procesar_carga_masiva_url_resoluciones_hijas(
    payload: GoogleSheetRequest,
    excel_service: ResolucionHijaExcelService = Depends(get_excel_service)
):
    """Procesar carga masiva de resoluciones hijas desde URL de Google Sheets"""
    if not payload.url.strip():
        raise HTTPException(status_code=400, detail="La URL de Google Sheets no puede estar vacía")

    try:
        resultado = await excel_service.procesar_carga_masiva_desde_url(payload.url, modo=payload.modo or "upsert")
        msg_extra = f" ({resultado.get('sin_ruc_valido_omitidas', 0)} filas omitidas por RUC no válido)" if resultado.get('sin_ruc_valido_omitidas', 0) > 0 else ""
        return {
            "url": payload.url,
            "resultado": resultado,
            "mensaje": f"Carga masiva completada desde Google Sheets: {resultado.get('creados', 0)} creadas, {resultado.get('actualizados', 0)} actualizadas.{msg_extra}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar enlace: {str(e)}")

@router.post("/carga-masiva/preview")
async def preview_carga_masiva_resoluciones_hijas(
    archivo: UploadFile = File(..., description="Archivo Excel (.xlsx o .xls)"),
    n_filas: int = Query(15, ge=1, le=100),
    excel_service: ResolucionHijaExcelService = Depends(get_excel_service)
):
    """Generar vista previa de las primeras N filas del archivo"""
    try:
        contenido = await archivo.read()
        buffer = BytesIO(contenido)
        preview = await excel_service.procesar_preview(buffer, n_filas=n_filas)
        return {"filas": preview, "total_preview": len(preview)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando vista previa: {str(e)}")


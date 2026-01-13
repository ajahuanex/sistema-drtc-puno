from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
import logging
from bson import ObjectId

from ..models.ruta_simple import (
    RutaSimple,
    RutaSimpleCreate,
    RutaSimpleUpdate,
    RutaSimpleResponse,
    FiltrosRutaSimple,
    ConsultaEmpresasEnRuta,
    ConsultaVehiculosEnRuta,
    ConsultaIncrementosEmpresa,
    EstadisticasRutasSimples
)
from ..database import get_database
from ..dependencies.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rutas", tags=["rutas"])

# ========================================
# CRUD BÁSICO SIMPLIFICADO
# ========================================

@router.get("/", response_model=List[RutaSimpleResponse])
async def obtener_rutas_simples(
    # Filtros básicos
    codigoRuta: Optional[str] = Query(None, description="Código de ruta"),
    nombre: Optional[str] = Query(None, description="Nombre de ruta"),
    estado: Optional[str] = Query(None, description="Estado de la ruta"),
    tipoRuta: Optional[str] = Query(None, description="Tipo de ruta"),
    
    # Filtros por localidades (solo nombres)
    origenNombre: Optional[str] = Query(None, description="Nombre del origen"),
    destinoNombre: Optional[str] = Query(None, description="Nombre del destino"),
    
    # Filtros por empresa/resolución
    empresaId: Optional[str] = Query(None, description="ID de empresa"),
    empresaRuc: Optional[str] = Query(None, description="RUC de empresa"),
    resolucionId: Optional[str] = Query(None, description="ID de resolución"),
    
    # Paginación
    page: int = Query(1, ge=1, description="Página"),
    limit: int = Query(50, ge=1, le=1000, description="Límite por página"),
    
    # Dependencias
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Obtener rutas simples con filtros básicos
    """
    try:
        logger.info(f"Obteniendo rutas simples con filtros básicos")
        
        # Construir filtros MongoDB simples
        filtros_mongo = {}
        
        if codigoRuta:
            filtros_mongo["codigoRuta"] = {"$regex": codigoRuta, "$options": "i"}
        if nombre:
            filtros_mongo["nombre"] = {"$regex": nombre, "$options": "i"}
        if estado:
            filtros_mongo["estado"] = estado
        if tipoRuta:
            filtros_mongo["tipoRuta"] = tipoRuta
        if origenNombre:
            filtros_mongo["origen.nombre"] = {"$regex": origenNombre, "$options": "i"}
        if destinoNombre:
            filtros_mongo["destino.nombre"] = {"$regex": destinoNombre, "$options": "i"}
        if empresaId:
            filtros_mongo["resolucion.empresa.id"] = empresaId
        if empresaRuc:
            filtros_mongo["resolucion.empresa.ruc"] = {"$regex": empresaRuc, "$options": "i"}
        if resolucionId:
            filtros_mongo["resolucion.id"] = resolucionId
        
        # Obtener colección
        rutas_collection = db.rutas
        
        # Calcular paginación
        skip = (page - 1) * limit
        
        # Obtener rutas con paginación
        cursor = rutas_collection.find(filtros_mongo).skip(skip).limit(limit).sort("fechaRegistro", -1)
        rutas_docs = await cursor.to_list(length=limit)
        
        # Convertir documentos a modelos simples
        rutas = []
        for doc in rutas_docs:
            try:
                # Convertir ObjectId a string
                if "_id" in doc:
                    doc["id"] = str(doc["_id"])
                    del doc["_id"]
                
                # Solo mantener campos simples
                ruta_simple = {
                    "id": doc["id"],
                    "codigoRuta": doc.get("codigoRuta", ""),
                    "nombre": doc.get("nombre", ""),
                    "origen": doc.get("origen", {}),
                    "destino": doc.get("destino", {}),
                    "itinerario": doc.get("itinerario", []),
                    "resolucion": doc.get("resolucion", {}),
                    "frecuencias": doc.get("frecuencias", ""),
                    "tipoRuta": doc.get("tipoRuta", "INTERPROVINCIAL"),
                    "tipoServicio": doc.get("tipoServicio", "PASAJEROS"),
                    "estado": doc.get("estado", "ACTIVA"),
                    "estaActivo": doc.get("estaActivo", True),
                    "fechaRegistro": doc.get("fechaRegistro", datetime.utcnow()),
                    "fechaActualizacion": doc.get("fechaActualizacion"),
                    "observaciones": doc.get("observaciones")
                }
                
                ruta = RutaSimpleResponse(**ruta_simple)
                rutas.append(ruta)
            except Exception as e:
                logger.error(f"Error procesando ruta {doc.get('id', 'unknown')}: {e}")
                continue
        
        logger.info(f"Obtenidas {len(rutas)} rutas simples")
        return rutas
        
    except Exception as e:
        logger.error(f"Error obteniendo rutas simples: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/{ruta_id}", response_model=RutaSimpleResponse)
async def obtener_ruta_simple_por_id(
    ruta_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Obtener una ruta simple por ID
    """
    try:
        logger.info(f"Obteniendo ruta simple por ID: {ruta_id}")
        
        rutas_collection = db.rutas
        doc = await rutas_collection.find_one({"_id": ObjectId(ruta_id)})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")
        
        # Convertir a modelo simple
        if "_id" in doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        
        ruta_simple = {
            "id": doc["id"],
            "codigoRuta": doc.get("codigoRuta", ""),
            "nombre": doc.get("nombre", ""),
            "origen": doc.get("origen", {}),
            "destino": doc.get("destino", {}),
            "itinerario": doc.get("itinerario", []),
            "resolucion": doc.get("resolucion", {}),
            "frecuencias": doc.get("frecuencias", ""),
            "tipoRuta": doc.get("tipoRuta", "INTERPROVINCIAL"),
            "tipoServicio": doc.get("tipoServicio", "PASAJEROS"),
            "estado": doc.get("estado", "ACTIVA"),
            "estaActivo": doc.get("estaActivo", True),
            "fechaRegistro": doc.get("fechaRegistro", datetime.utcnow()),
            "fechaActualizacion": doc.get("fechaActualizacion"),
            "observaciones": doc.get("observaciones")
        }
        
        ruta = RutaSimpleResponse(**ruta_simple)
        
        logger.info(f"Ruta simple obtenida: {ruta.codigoRuta}")
        return ruta
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo ruta simple por ID: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/", response_model=RutaSimpleResponse)
async def crear_ruta_simple(
    ruta_data: RutaSimpleCreate,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Crear una nueva ruta simple
    """
    try:
        logger.info(f"Creando ruta simple: {ruta_data.codigoRuta}")
        
        rutas_collection = db.rutas
        
        # Validar unicidad del código en la resolución
        filtro_unicidad = {
            "codigoRuta": ruta_data.codigoRuta,
            "resolucion.id": ruta_data.resolucion.id
        }
        
        ruta_existente = await rutas_collection.find_one(filtro_unicidad)
        if ruta_existente:
            raise HTTPException(
                status_code=400, 
                detail=f"Ya existe una ruta con código '{ruta_data.codigoRuta}' en la resolución '{ruta_data.resolucion.nroResolucion}'"
            )
        
        # Crear documento simple
        ruta_doc = ruta_data.dict()
        ruta_doc["fechaRegistro"] = datetime.utcnow()
        ruta_doc["estaActivo"] = True
        ruta_doc["estado"] = "ACTIVA"
        
        # Insertar en MongoDB
        resultado = await rutas_collection.insert_one(ruta_doc)
        
        if not resultado.inserted_id:
            raise HTTPException(status_code=500, detail="Error creando ruta en la base de datos")
        
        # Obtener ruta creada
        ruta_creada = await rutas_collection.find_one({"_id": resultado.inserted_id})
        ruta_creada["id"] = str(ruta_creada["_id"])
        del ruta_creada["_id"]
        
        ruta_response = RutaSimpleResponse(**ruta_creada)
        
        logger.info(f"Ruta simple creada exitosamente: {ruta_response.id}")
        return ruta_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando ruta simple: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# ========================================
# CONSULTAS DE NEGOCIO SIMPLES
# ========================================

@router.get("/consultas/empresas-en-ruta", response_model=ConsultaEmpresasEnRuta)
async def obtener_empresas_en_ruta_simple(
    origen: str = Query(..., description="Nombre de localidad origen"),
    destino: str = Query(..., description="Nombre de localidad destino"),
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    ¿Qué empresas operan en la ruta origen-destino? (Versión simple)
    """
    try:
        logger.info(f"Consultando empresas en ruta simple: {origen} → {destino}")
        
        rutas_collection = db.rutas
        
        # Filtros simples
        filtros = {
            "origen.nombre": {"$regex": origen, "$options": "i"},
            "destino.nombre": {"$regex": destino, "$options": "i"},
            "estado": "ACTIVA"
        }
        
        # Obtener rutas
        cursor = rutas_collection.find(filtros)
        rutas_docs = await cursor.to_list(length=None)
        
        # Extraer empresas únicas
        empresas = set()
        for doc in rutas_docs:
            if "resolucion" in doc and "empresa" in doc["resolucion"]:
                empresa = doc["resolucion"]["empresa"]
                empresas.add(empresa["razonSocial"])
        
        empresas_lista = list(empresas)
        
        resultado = ConsultaEmpresasEnRuta(
            origen=origen,
            destino=destino,
            empresas=empresas_lista,
            total_empresas=len(empresas_lista),
            total_rutas=len(rutas_docs)
        )
        
        logger.info(f"Encontradas {len(empresas_lista)} empresas operando en ruta {origen} → {destino}")
        return resultado
        
    except Exception as e:
        logger.error(f"Error consultando empresas en ruta simple: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/consultas/vehiculos-en-ruta", response_model=ConsultaVehiculosEnRuta)
async def obtener_vehiculos_en_ruta_simple(
    origen: str = Query(..., description="Nombre de localidad origen"),
    destino: str = Query(..., description="Nombre de localidad destino"),
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    ¿Cuántos vehículos operan en la ruta origen-destino? (Versión simple)
    """
    try:
        logger.info(f"Consultando vehículos en ruta simple: {origen} → {destino}")
        
        # Para obtener vehículos, consultamos el módulo de vehículos
        vehiculos_collection = db.vehiculos
        
        # Obtener vehículos que operan en rutas con este origen-destino
        pipeline = [
            {
                "$lookup": {
                    "from": "rutas",
                    "localField": "rutasAsignadasIds",
                    "foreignField": "_id",
                    "as": "rutas"
                }
            },
            {
                "$match": {
                    "rutas.origen.nombre": {"$regex": origen, "$options": "i"},
                    "rutas.destino.nombre": {"$regex": destino, "$options": "i"},
                    "rutas.estado": "ACTIVA",
                    "estado": "ACTIVO"
                }
            },
            {
                "$count": "total_vehiculos"
            }
        ]
        
        cursor = vehiculos_collection.aggregate(pipeline)
        resultado_vehiculos = await cursor.to_list(length=1)
        
        total_vehiculos = resultado_vehiculos[0]["total_vehiculos"] if resultado_vehiculos else 0
        
        # Contar rutas también
        rutas_collection = db.rutas
        total_rutas = await rutas_collection.count_documents({
            "origen.nombre": {"$regex": origen, "$options": "i"},
            "destino.nombre": {"$regex": destino, "$options": "i"},
            "estado": "ACTIVA"
        })
        
        resultado = ConsultaVehiculosEnRuta(
            origen=origen,
            destino=destino,
            total_vehiculos=total_vehiculos,
            total_rutas=total_rutas
        )
        
        logger.info(f"Encontrados {total_vehiculos} vehículos operando en ruta {origen} → {destino}")
        return resultado
        
    except Exception as e:
        logger.error(f"Error consultando vehículos en ruta simple: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/consultas/incrementos-empresa/{empresa_id}", response_model=ConsultaIncrementosEmpresa)
async def obtener_incrementos_empresa_simple(
    empresa_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    ¿Cuántos incrementos tiene una empresa? (Versión simple)
    """
    try:
        logger.info(f"Consultando incrementos de empresa simple: {empresa_id}")
        
        rutas_collection = db.rutas
        
        # Contar incrementos
        total_incrementos = await rutas_collection.count_documents({
            "resolucion.empresa.id": empresa_id,
            "resolucion.tipoTramite": "INCREMENTO"
        })
        
        # Contar primigenias
        total_primigenias = await rutas_collection.count_documents({
            "resolucion.empresa.id": empresa_id,
            "resolucion.tipoTramite": "PRIMIGENIA"
        })
        
        resultado = ConsultaIncrementosEmpresa(
            empresa_id=empresa_id,
            total_incrementos=total_incrementos,
            total_primigenias=total_primigenias,
            total_rutas=total_incrementos + total_primigenias
        )
        
        logger.info(f"Empresa {empresa_id} tiene {total_incrementos} incrementos y {total_primigenias} primigenias")
        return resultado
        
    except Exception as e:
        logger.error(f"Error consultando incrementos de empresa simple: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/estadisticas", response_model=EstadisticasRutasSimples)
async def obtener_estadisticas_simples(
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Obtener estadísticas simples de rutas
    """
    try:
        logger.info("Obteniendo estadísticas simples de rutas")
        
        rutas_collection = db.rutas
        
        # Estadísticas básicas
        total_rutas = await rutas_collection.count_documents({})
        rutas_activas = await rutas_collection.count_documents({"estado": "ACTIVA"})
        rutas_inactivas = await rutas_collection.count_documents({"estado": "INACTIVA"})
        
        # Estadísticas por tipo
        pipeline_tipos = [
            {"$group": {"_id": "$tipoRuta", "count": {"$sum": 1}}}
        ]
        tipos_cursor = rutas_collection.aggregate(pipeline_tipos)
        tipos_docs = await tipos_cursor.to_list(length=None)
        distribucion_tipos = {doc["_id"]: doc["count"] for doc in tipos_docs}
        
        # Contar empresas únicas
        pipeline_empresas = [
            {"$group": {"_id": "$resolucion.empresa.id"}}
        ]
        empresas_cursor = rutas_collection.aggregate(pipeline_empresas)
        empresas_docs = await empresas_cursor.to_list(length=None)
        total_empresas = len(empresas_docs)
        
        resultado = EstadisticasRutasSimples(
            total_rutas=total_rutas,
            rutas_activas=rutas_activas,
            rutas_inactivas=rutas_inactivas,
            total_empresas=total_empresas,
            distribucion_por_tipo=distribucion_tipos,
            fecha_generacion=datetime.utcnow().isoformat()
        )
        
        logger.info(f"Estadísticas simples generadas: {total_rutas} rutas, {total_empresas} empresas")
        return resultado
        
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas simples: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# ========================================
# VALIDACIONES SIMPLES
# ========================================

@router.post("/validar-codigo")
async def validar_codigo_unico_simple(
    datos: dict,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Validar que el código de ruta sea único en la resolución (versión simple)
    """
    try:
        codigo_ruta = datos.get("codigoRuta")
        resolucion_id = datos.get("resolucionId")
        ruta_id_excluir = datos.get("rutaIdExcluir")
        
        if not codigo_ruta or not resolucion_id:
            raise HTTPException(status_code=400, detail="codigoRuta y resolucionId son requeridos")
        
        rutas_collection = db.rutas
        
        # Construir filtro simple
        filtro = {
            "codigoRuta": codigo_ruta,
            "resolucion.id": resolucion_id
        }
        
        if ruta_id_excluir:
            filtro["_id"] = {"$ne": ObjectId(ruta_id_excluir)}
        
        ruta_existente = await rutas_collection.find_one(filtro)
        es_unico = ruta_existente is None
        
        return {"esUnico": es_unico}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validando código único simple: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/generar-codigo/{resolucion_id}")
async def generar_siguiente_codigo_simple(
    resolucion_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Generar el siguiente código disponible para una resolución (versión simple)
    """
    try:
        logger.info(f"Generando siguiente código simple para resolución: {resolucion_id}")
        
        rutas_collection = db.rutas
        
        # Obtener códigos existentes
        filtro = {"resolucion.id": resolucion_id}
        cursor = rutas_collection.find(filtro, {"codigoRuta": 1})
        rutas_docs = await cursor.to_list(length=None)
        
        # Encontrar siguiente número
        codigos_existentes = set()
        for doc in rutas_docs:
            codigo = doc.get("codigoRuta", "")
            if codigo.isdigit():
                codigos_existentes.add(int(codigo))
        
        siguiente_numero = 1
        while siguiente_numero in codigos_existentes:
            siguiente_numero += 1
        
        codigo_generado = str(siguiente_numero).zfill(2)
        
        logger.info(f"Código simple generado: {codigo_generado}")
        return {"codigo": codigo_generado}
        
    except Exception as e:
# ========================================
# CARGA MASIVA DE RUTAS
# ========================================

@router.post("/carga-masiva/validar")
async def validar_carga_masiva_rutas(
    archivo: bytes,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Validar archivo Excel para carga masiva de rutas
    """
    try:
        logger.info("Validando archivo Excel para carga masiva de rutas")
        
        import pandas as pd
        from io import BytesIO
        
        # Leer archivo Excel
        df = pd.read_excel(BytesIO(archivo))
        
        # Validar columnas requeridas
        columnas_requeridas = [
            'codigoRuta', 'nombre', 'origenNombre', 'destinoNombre',
            'empresaRuc', 'resolucionNumero', 'frecuencias', 'tipoRuta', 'tipoServicio'
        ]
        
        columnas_faltantes = [col for col in columnas_requeridas if col not in df.columns]
        if columnas_faltantes:
            raise HTTPException(
                status_code=400, 
                detail=f"Columnas faltantes: {', '.join(columnas_faltantes)}"
            )
        
        # Validar datos
        errores = []
        rutas_validas = []
        
        for index, row in df.iterrows():
            fila_errores = []
            
            # Validar campos requeridos
            if pd.isna(row['codigoRuta']) or str(row['codigoRuta']).strip() == '':
                fila_errores.append("Código de ruta requerido")
            
            if pd.isna(row['nombre']) or str(row['nombre']).strip() == '':
                fila_errores.append("Nombre de ruta requerido")
            
            if pd.isna(row['origenNombre']) or str(row['origenNombre']).strip() == '':
                fila_errores.append("Origen requerido")
            
            if pd.isna(row['destinoNombre']) or str(row['destinoNombre']).strip() == '':
                fila_errores.append("Destino requerido")
            
            if pd.isna(row['empresaRuc']) or str(row['empresaRuc']).strip() == '':
                fila_errores.append("RUC de empresa requerido")
            
            if fila_errores:
                errores.append({
                    "fila": index + 2,  # +2 porque Excel empieza en 1 y hay header
                    "errores": fila_errores
                })
            else:
                rutas_validas.append({
                    "fila": index + 2,
                    "codigoRuta": str(row['codigoRuta']).strip(),
                    "nombre": str(row['nombre']).strip(),
                    "origenNombre": str(row['origenNombre']).strip(),
                    "destinoNombre": str(row['destinoNombre']).strip(),
                    "empresaRuc": str(row['empresaRuc']).strip(),
                    "resolucionNumero": str(row['resolucionNumero']).strip() if not pd.isna(row['resolucionNumero']) else "",
                    "frecuencias": str(row['frecuencias']).strip() if not pd.isna(row['frecuencias']) else "08 DIARIAS",
                    "tipoRuta": str(row['tipoRuta']).strip() if not pd.isna(row['tipoRuta']) else "INTERPROVINCIAL",
                    "tipoServicio": str(row['tipoServicio']).strip() if not pd.isna(row['tipoServicio']) else "PASAJEROS"
                })
        
        resultado = {
            "total_filas": len(df),
            "rutas_validas": len(rutas_validas),
            "rutas_con_errores": len(errores),
            "errores": errores[:10],  # Solo primeros 10 errores
            "muestra_rutas_validas": rutas_validas[:5]  # Solo primeras 5 rutas válidas
        }
        
        logger.info(f"Validación completada: {len(rutas_validas)} válidas, {len(errores)} con errores")
        return resultado
        
    except Exception as e:
        logger.error(f"Error validando carga masiva: {e}")
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")

@router.post("/carga-masiva/procesar")
async def procesar_carga_masiva_rutas(
    archivo: bytes,
    solo_validar: bool = False,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Procesar carga masiva de rutas desde Excel
    """
    try:
        logger.info(f"Procesando carga masiva de rutas (solo_validar: {solo_validar})")
        
        import pandas as pd
        from io import BytesIO
        from bson import ObjectId
        
        # Leer archivo Excel
        df = pd.read_excel(BytesIO(archivo))
        
        # Obtener colecciones
        rutas_collection = db.rutas
        empresas_collection = db.empresas
        resoluciones_collection = db.resoluciones
        localidades_collection = db.localidades
        
        # Procesar cada fila
        rutas_creadas = []
        errores = []
        
        for index, row in df.iterrows():
            try:
                fila = index + 2
                
                # Validar campos básicos
                codigo_ruta = str(row['codigoRuta']).strip()
                nombre = str(row['nombre']).strip()
                origen_nombre = str(row['origenNombre']).strip()
                destino_nombre = str(row['destinoNombre']).strip()
                empresa_ruc = str(row['empresaRuc']).strip()
                
                if not all([codigo_ruta, nombre, origen_nombre, destino_nombre, empresa_ruc]):
                    errores.append({
                        "fila": fila,
                        "error": "Campos requeridos faltantes"
                    })
                    continue
                
                # Buscar empresa
                empresa = await empresas_collection.find_one({"ruc": empresa_ruc})
                if not empresa:
                    errores.append({
                        "fila": fila,
                        "error": f"Empresa con RUC {empresa_ruc} no encontrada"
                    })
                    continue
                
                # Buscar resolución (si se proporciona)
                resolucion = None
                resolucion_numero = str(row['resolucionNumero']).strip() if not pd.isna(row['resolucionNumero']) else ""
                
                if resolucion_numero:
                    resolucion = await resoluciones_collection.find_one({
                        "nroResolucion": resolucion_numero,
                        "empresaId": str(empresa["_id"])
                    })
                
                if not resolucion:
                    # Buscar cualquier resolución activa de la empresa
                    resolucion = await resoluciones_collection.find_one({
                        "empresaId": str(empresa["_id"]),
                        "estado": "VIGENTE"
                    })
                
                if not resolucion:
                    errores.append({
                        "fila": fila,
                        "error": f"No se encontró resolución vigente para empresa {empresa_ruc}"
                    })
                    continue
                
                # Buscar localidades
                origen = await localidades_collection.find_one({
                    "nombre": {"$regex": f"^{origen_nombre}$", "$options": "i"}
                })
                
                destino = await localidades_collection.find_one({
                    "nombre": {"$regex": f"^{destino_nombre}$", "$options": "i"}
                })
                
                if not origen:
                    errores.append({
                        "fila": fila,
                        "error": f"Localidad origen '{origen_nombre}' no encontrada"
                    })
                    continue
                
                if not destino:
                    errores.append({
                        "fila": fila,
                        "error": f"Localidad destino '{destino_nombre}' no encontrada"
                    })
                    continue
                
                # Verificar código único en resolución
                ruta_existente = await rutas_collection.find_one({
                    "codigoRuta": codigo_ruta,
                    "resolucion.id": str(resolucion["_id"])
                })
                
                if ruta_existente:
                    errores.append({
                        "fila": fila,
                        "error": f"Código '{codigo_ruta}' ya existe en la resolución"
                    })
                    continue
                
                # Crear ruta simple
                ruta_nueva = {
                    "codigoRuta": codigo_ruta,
                    "nombre": nombre,
                    
                    "origen": {
                        "id": str(origen["_id"]),
                        "nombre": origen.get("nombre", origen_nombre)
                    },
                    "destino": {
                        "id": str(destino["_id"]),
                        "nombre": destino.get("nombre", destino_nombre)
                    },
                    "itinerario": [],
                    
                    "resolucion": {
                        "id": str(resolucion["_id"]),
                        "nroResolucion": resolucion.get("nroResolucion", ""),
                        "tipoResolucion": resolucion.get("tipoResolucion", "PADRE"),
                        "tipoTramite": resolucion.get("tipoTramite", "PRIMIGENIA"),
                        "estado": resolucion.get("estado", "VIGENTE"),
                        "empresa": {
                            "id": str(empresa["_id"]),
                            "ruc": empresa.get("ruc", empresa_ruc),
                            "razonSocial": empresa.get("razonSocial", {}).get("principal", "")
                        }
                    },
                    
                    "frecuencias": str(row['frecuencias']).strip() if not pd.isna(row['frecuencias']) else "08 DIARIAS",
                    "tipoRuta": str(row['tipoRuta']).strip() if not pd.isna(row['tipoRuta']) else "INTERPROVINCIAL",
                    "tipoServicio": str(row['tipoServicio']).strip() if not pd.isna(row['tipoServicio']) else "PASAJEROS",
                    "estado": "ACTIVA",
                    "estaActivo": True,
                    "fechaRegistro": datetime.utcnow(),
                    "observaciones": f"Creada por carga masiva - Fila {fila}"
                }
                
                if not solo_validar:
                    # Insertar en base de datos
                    resultado = await rutas_collection.insert_one(ruta_nueva)
                    if resultado.inserted_id:
                        rutas_creadas.append({
                            "fila": fila,
                            "id": str(resultado.inserted_id),
                            "codigoRuta": codigo_ruta,
                            "nombre": nombre
                        })
                else:
                    # Solo validar
                    rutas_creadas.append({
                        "fila": fila,
                        "codigoRuta": codigo_ruta,
                        "nombre": nombre,
                        "valida": True
                    })
                
            except Exception as e:
                errores.append({
                    "fila": index + 2,
                    "error": f"Error procesando fila: {str(e)}"
                })
        
        resultado = {
            "total_procesadas": len(df),
            "rutas_creadas": len(rutas_creadas),
            "errores": len(errores),
            "solo_validacion": solo_validar,
            "rutas_exitosas": rutas_creadas,
            "errores_detalle": errores
        }
        
        logger.info(f"Carga masiva completada: {len(rutas_creadas)} creadas, {len(errores)} errores")
        return resultado
        
    except Exception as e:
        logger.error(f"Error en carga masiva: {e}")
        raise HTTPException(status_code=500, detail=f"Error procesando carga masiva: {str(e)}")

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_rutas():
    """
    Descargar plantilla Excel para carga masiva de rutas
    """
    try:
        import pandas as pd
        from io import BytesIO
        from fastapi.responses import StreamingResponse
        
        # Crear plantilla con datos de ejemplo
        datos_ejemplo = [
            {
                'codigoRuta': '01',
                'nombre': 'PUNO - JULIACA',
                'origenNombre': 'PUNO',
                'destinoNombre': 'JULIACA',
                'empresaRuc': '20123456789',
                'resolucionNumero': 'RD-001-2024-MTC',
                'frecuencias': '08 DIARIAS',
                'tipoRuta': 'INTERPROVINCIAL',
                'tipoServicio': 'PASAJEROS',
                'observaciones': 'Ruta de ejemplo'
            },
            {
                'codigoRuta': '02',
                'nombre': 'JULIACA - AREQUIPA',
                'origenNombre': 'JULIACA',
                'destinoNombre': 'AREQUIPA',
                'empresaRuc': '20987654321',
                'resolucionNumero': 'RD-002-2024-MTC',
                'frecuencias': '10 DIARIAS',
                'tipoRuta': 'INTERPROVINCIAL',
                'tipoServicio': 'PASAJEROS',
                'observaciones': 'Ruta de ejemplo 2'
            }
        ]
        
        # Crear DataFrame
        df = pd.DataFrame(datos_ejemplo)
        
        # Crear archivo Excel en memoria
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Rutas', index=False)
            
            # Agregar hoja de instrucciones
            instrucciones = pd.DataFrame([
                ['INSTRUCCIONES PARA CARGA MASIVA DE RUTAS'],
                [''],
                ['Columnas requeridas:'],
                ['- codigoRuta: Código único de la ruta (ej: 01, 02, 03)'],
                ['- nombre: Nombre descriptivo de la ruta'],
                ['- origenNombre: Nombre de la localidad de origen'],
                ['- destinoNombre: Nombre de la localidad de destino'],
                ['- empresaRuc: RUC de la empresa (debe existir en el sistema)'],
                ['- resolucionNumero: Número de resolución (opcional)'],
                ['- frecuencias: Frecuencias de operación (ej: 08 DIARIAS)'],
                ['- tipoRuta: URBANA, INTERURBANA, INTERPROVINCIAL, INTERREGIONAL, RURAL'],
                ['- tipoServicio: PASAJEROS, CARGA, MIXTO'],
                ['- observaciones: Observaciones adicionales (opcional)'],
                [''],
                ['NOTAS IMPORTANTES:'],
                ['- Las localidades de origen y destino deben existir en el sistema'],
                ['- La empresa debe estar registrada con el RUC proporcionado'],
                ['- Si no se especifica resolución, se usará una vigente de la empresa'],
                ['- Los códigos de ruta deben ser únicos dentro de cada resolución']
            ])
            
            instrucciones.to_excel(writer, sheet_name='Instrucciones', index=False, header=False)
        
        output.seek(0)
        
        # Retornar archivo
        return StreamingResponse(
            BytesIO(output.read()),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={"Content-Disposition": "attachment; filename=plantilla_rutas.xlsx"}
        )
        
    except Exception as e:
        logger.error(f"Error generando plantilla: {e}")
        raise HTTPException(status_code=500, detail=f"Error generando plantilla: {str(e)}")
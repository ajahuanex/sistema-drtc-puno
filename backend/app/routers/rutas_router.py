from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from io import BytesIO
from app.dependencies.auth import get_current_active_user
from app.dependencies.db import get_database
from app.services.ruta_service import RutaService
from app.services.ruta_excel_service import RutaExcelService
from app.models.ruta import RutaCreate, RutaUpdate, RutaInDB, RutaResponse
from app.utils.exceptions import (
    RutaNotFoundException, 
    RutaAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/rutas", tags=["rutas"])

def build_ruta_response(ruta) -> RutaResponse:
    """Función helper para construir RutaResponse con todos los campos requeridos"""
    return RutaResponse(
        id=ruta.id,
        codigoRuta=ruta.codigoRuta,
        nombre=ruta.nombre,
        origenId=ruta.origenId,
        destinoId=ruta.destinoId,
        itinerarioIds=ruta.itinerarioIds,
        frecuencias=ruta.frecuencias,
        estado=ruta.estado,
        estaActivo=ruta.estaActivo,
        fechaRegistro=ruta.fechaRegistro,
        fechaActualizacion=ruta.fechaActualizacion,
        tipoRuta=ruta.tipoRuta,
        tipoServicio=ruta.tipoServicio,
        distancia=ruta.distancia,
        tiempoEstimado=ruta.tiempoEstimado,
        tarifaBase=ruta.tarifaBase,
        capacidadMaxima=ruta.capacidadMaxima,
        horarios=ruta.horarios,
        restricciones=ruta.restricciones,
        observaciones=ruta.observaciones,
        empresasAutorizadasIds=ruta.empresasAutorizadasIds,
        vehiculosAsignadosIds=ruta.vehiculosAsignadosIds,
        documentosIds=ruta.documentosIds,
        historialIds=ruta.historialIds,
        empresaId=getattr(ruta, 'empresaId', None),
        resolucionId=getattr(ruta, 'resolucionId', None)
    )

@router.post("/", response_model=RutaResponse, status_code=201)
async def create_ruta(
    ruta_data: RutaCreate,
    db = Depends(get_database)
) -> RutaResponse:
    """Crear nueva ruta con validaciones completas"""
    # Guard clauses al inicio
    if not ruta_data.codigoRuta.strip():
        raise ValidationErrorException("Código de Ruta", "El código de ruta no puede estar vacío")
    
    if not ruta_data.empresaId:
        raise ValidationErrorException("Empresa", "La empresa es obligatoria")
    
    if not ruta_data.resolucionId:
        raise ValidationErrorException("Resolución", "La resolución es obligatoria")
    
    ruta_service = RutaService(db)
    
    try:
        ruta = await ruta_service.create_ruta(ruta_data)
        return build_ruta_response(ruta)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear ruta: {str(e)}")

@router.get("/empresa/{empresa_id}/resolucion/{resolucion_id}", response_model=List[RutaResponse])
async def get_rutas_por_empresa_y_resolucion(
    empresa_id: str,
    resolucion_id: str,
    db = Depends(get_database)
) -> List[RutaResponse]:
    """Obtener rutas filtradas por empresa y resolución"""
    ruta_service = RutaService(db)
    rutas = await ruta_service.get_rutas_por_empresa_y_resolucion(empresa_id, resolucion_id)
    return [build_ruta_response(r) for r in rutas]

@router.get("/empresa/{empresa_id}", response_model=List[RutaResponse])
async def get_rutas_por_empresa(
    empresa_id: str,
    db = Depends(get_database)
) -> List[RutaResponse]:
    """Obtener rutas de una empresa"""
    ruta_service = RutaService(db)
    rutas = await ruta_service.get_rutas_por_empresa(empresa_id)
    return [build_ruta_response(r) for r in rutas]

@router.get("/resolucion/{resolucion_id}", response_model=List[RutaResponse])
async def get_rutas_por_resolucion(
    resolucion_id: str,
    db = Depends(get_database)
) -> List[RutaResponse]:
    """Obtener rutas de una resolución"""
    ruta_service = RutaService(db)
    rutas = await ruta_service.get_rutas_por_resolucion(resolucion_id)
    return [build_ruta_response(r) for r in rutas]

@router.get("/resolucion/{resolucion_id}/validar")
async def validar_resolucion(
    resolucion_id: str,
    db = Depends(get_database)
):
    """Validar que una resolución sea válida para asociar rutas"""
    ruta_service = RutaService(db)
    
    try:
        es_valida = await ruta_service.validar_resolucion_vigente(resolucion_id)
        return {
            "valida": es_valida,
            "mensaje": "Resolución válida para asociar rutas (VIGENTE y PADRE)"
        }
    except HTTPException as e:
        return {
            "valida": False,
            "mensaje": e.detail
        }

@router.get("/resolucion/{resolucion_id}/siguiente-codigo")
async def get_siguiente_codigo(
    resolucion_id: str,
    db = Depends(get_database)
):
    """Obtener el siguiente código disponible para una resolución"""
    ruta_service = RutaService(db)
    codigo = await ruta_service.generar_siguiente_codigo(resolucion_id)
    return {
        "resolucionId": resolucion_id,
        "siguienteCodigo": codigo
    }

@router.get("/empresa/{empresa_id}/resoluciones-primigenias")
async def get_resoluciones_primigenias_empresa(
    empresa_id: str,
    db = Depends(get_database)
):
    """Obtener resoluciones primigenias (PADRE y VIGENTE) de una empresa"""
    try:
        resoluciones_collection = db.resoluciones
        
        # Buscar resoluciones PADRE y VIGENTE de la empresa
        resoluciones = await resoluciones_collection.find({
            "empresaId": empresa_id,
            "tipoResolucion": "PADRE",
            "estado": "VIGENTE",
            "estaActivo": True
        }).to_list(length=None)
        
        # Convertir ObjectId a string
        for resolucion in resoluciones:
            resolucion["id"] = str(resolucion.pop("_id"))
        
        return {
            "empresaId": empresa_id,
            "resoluciones": resoluciones,
            "total": len(resoluciones)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener resoluciones primigenias: {str(e)}"
        )

@router.get("/resoluciones-primigenias")
async def get_todas_resoluciones_primigenias(
    db = Depends(get_database)
):
    """Obtener todas las resoluciones primigenias (PADRE y VIGENTE) con datos de empresa"""
    try:
        resoluciones_collection = db.resoluciones
        empresas_collection = db.empresas
        
        # Buscar todas las resoluciones PADRE y VIGENTE
        resoluciones = await resoluciones_collection.find({
            "tipoResolucion": "PADRE",
            "estado": "VIGENTE",
            "estaActivo": True
        }).to_list(length=None)
        
        # Enriquecer con datos de empresa
        resoluciones_enriquecidas = []
        for resolucion in resoluciones:
            resolucion["id"] = str(resolucion.pop("_id"))
            
            # Obtener datos de la empresa
            if resolucion.get("empresaId"):
                # Buscar empresa por ObjectId
                empresa = None
                empresa_id = resolucion["empresaId"]
                
                if ObjectId.is_valid(empresa_id):
                    empresa = await empresas_collection.find_one({"_id": ObjectId(empresa_id)})
                
                if not empresa:
                    # Buscar por campo id si no se encontró por _id
                    empresa = await empresas_collection.find_one({"id": empresa_id})
                
                if empresa:
                    empresa_id_str = str(empresa.get("_id", empresa.get("id", "")))
                    resolucion["empresa"] = {
                        "id": empresa_id_str,
                        "ruc": empresa.get("ruc", ""),
                        "razonSocial": empresa.get("razonSocial", {}).get("principal", "Sin razón social")
                    }
                else:
                    resolucion["empresa"] = None
            else:
                resolucion["empresa"] = None
            
            resoluciones_enriquecidas.append(resolucion)
        
        return {
            "resoluciones": resoluciones_enriquecidas,
            "total": len(resoluciones_enriquecidas)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener resoluciones primigenias: {str(e)}"
        )

@router.get("/", response_model=List[RutaResponse])
async def get_rutas(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    db = Depends(get_database)
) -> List[RutaResponse]:
    """Obtener lista de rutas con filtros opcionales"""
    ruta_service = RutaService(db)
    rutas = await ruta_service.get_rutas(skip=skip, limit=limit, estado=estado)
    return [build_ruta_response(r) for r in rutas]

@router.get("/mock", response_model=List[RutaResponse])
async def get_rutas_mock(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado")
) -> List[RutaResponse]:
    """Obtener lista de rutas MOCK (solo para desarrollo)"""
    try:
        # Datos mock simplificados para evitar errores
        mock_rutas = [
            # RESOLUCIÓN 1 - EMPRESA 1 (TRANSPORTES PUNO S.A.)
            {
                "id": "1",
                "codigoRuta": "01",
                "nombre": "PUNO - JULIACA",
                "origenId": "1",
                "destinoId": "2",
                "itinerarioIds": ["1", "3", "2"],
                "frecuencias": "Diaria, cada 30 minutos",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "fechaActualizacion": None,
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 45.0,
                "tiempoEstimado": "01:00",
                "tarifaBase": 5.00,
                "capacidadMaxima": 50,
                "horarios": [],
                "restricciones": [],
                "observaciones": "Ruta principal interprovincial",
                "empresasAutorizadasIds": ["1"],
                "vehiculosAsignadosIds": ["1", "2"],
                "documentosIds": ["1", "2"],
                "historialIds": [],
                "empresaId": "1",
                "resolucionId": "1"
            },
            {
                "id": "2",
                "codigoRuta": "02",
                "nombre": "PUNO - CUSCO",
                "origenId": "1",
                "destinoId": "3",
                "itinerarioIds": ["1", "4", "5", "3"],
                "frecuencias": "Diaria, 3 veces al día",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "fechaActualizacion": None,
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 350.0,
                "tiempoEstimado": "06:00",
                "tarifaBase": 25.00,
                "capacidadMaxima": 45,
                "horarios": [],
                "restricciones": [],
                "observaciones": "Ruta turística importante",
                "empresasAutorizadasIds": ["1"],
                "vehiculosAsignadosIds": ["3"],
                "documentosIds": ["3", "4"],
                "historialIds": [],
                "empresaId": "1",
                "resolucionId": "1"
            },
            {
                "id": "3",
                "codigoRuta": "03",
                "nombre": "PUNO - MOQUEGUA",
                "origenId": "1",
                "destinoId": "4",
                "itinerarioIds": ["1", "6", "4"],
                "frecuencias": "Diaria, 2 veces al día",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "fechaActualizacion": None,
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 280.0,
                "tiempoEstimado": "04:00",
                "tarifaBase": 18.00,
                "capacidadMaxima": 40,
                "horarios": [],
                "restricciones": [],
                "observaciones": "Ruta comercial",
                "empresasAutorizadasIds": ["1"],
                "vehiculosAsignadosIds": ["4"],
                "documentosIds": ["5"],
                "historialIds": [],
                "empresaId": "1",
                "resolucionId": "1"
            },

            # RESOLUCIÓN 2 - EMPRESA 2 (TRANSPORTES LIMA E.I.R.L.)
            {
                "id": "4",
                "codigoRuta": "01",
                "nombre": "LIMA - TRUJILLO",
                "origenId": "5",
                "destinoId": "6",
                "itinerarioIds": ["5", "7", "6"],
                "frecuencias": "Diaria, 2 veces al día",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "fechaActualizacion": None,
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 550.0,
                "tiempoEstimado": "08:00",
                "tarifaBase": 35.00,
                "capacidadMaxima": 55,
                "horarios": [],
                "restricciones": [],
                "observaciones": "Ruta costera norte",
                "empresasAutorizadasIds": ["2"],
                "vehiculosAsignadosIds": ["5", "6"],
                "documentosIds": ["6", "7"],
                "historialIds": [],
                "empresaId": "2",
                "resolucionId": "2"
            },
            {
                "id": "5",
                "codigoRuta": "02",
                "nombre": "LIMA - CHICLAYO",
                "origenId": "5",
                "destinoId": "7",
                "itinerarioIds": ["5", "8", "7"],
                "frecuencias": "Diaria, 1 vez al día",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "fechaActualizacion": None,
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 770.0,
                "tiempoEstimado": "12:00",
                "tarifaBase": 45.00,
                "capacidadMaxima": 40,
                "horarios": [],
                "restricciones": [],
                "observaciones": "Ruta larga distancia",
                "empresasAutorizadasIds": ["2"],
                "vehiculosAsignadosIds": ["7"],
                "documentosIds": ["8"],
                "historialIds": [],
                "empresaId": "2",
                "resolucionId": "2"
            },

            # RESOLUCIÓN 3 - EMPRESA 3 (TRANSPORTES AREQUIPA S.A.C.)
            {
                "id": "7",
                "codigoRuta": "01",
                "nombre": "AREQUIPA - MOLLENDO",
                "origenId": "9",
                "destinoId": "10",
                "itinerarioIds": ["9", "10"],
                "frecuencias": "Diaria, cada hora",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "fechaActualizacion": None,
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 120.0,
                "tiempoEstimado": "02:00",
                "tarifaBase": 8.00,
                "capacidadMaxima": 30,
                "horarios": [],
                "restricciones": [],
                "observaciones": "Ruta costera",
                "empresasAutorizadasIds": ["3"],
                "vehiculosAsignadosIds": ["7"],
                "documentosIds": ["7"],
                "historialIds": [],
                "empresaId": "3",
                "resolucionId": "3"
            },
            {
                "id": "8",
                "codigoRuta": "02",
                "nombre": "AREQUIPA - TACNA",
                "origenId": "9",
                "destinoId": "11",
                "itinerarioIds": ["9", "11"],
                "frecuencias": "Diaria, 3 veces al día",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "fechaActualizacion": None,
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": 320.0,
                "tiempoEstimado": "05:00",
                "tarifaBase": 20.00,
                "capacidadMaxima": 25,
                "horarios": [],
                "restricciones": [],
                "observaciones": "Ruta fronteriza",
                "empresasAutorizadasIds": ["3"],
                "vehiculosAsignadosIds": ["8"],
                "documentosIds": ["8"],
                "historialIds": [],
                "empresaId": "3",
                "resolucionId": "3"
            },

            # RESOLUCIÓN 4 - EMPRESA 4 (TRANSPORTES CUSCO S.A.)
        ]
        
        # Filtrar por estado si se especifica
        if estado:
            mock_rutas = [r for r in mock_rutas if r["estado"] == estado]
        
        # Aplicar paginación
        total = len(mock_rutas)
        rutas_paginadas = mock_rutas[skip:skip + limit]
        
        return [
            RutaResponse(
                id=ruta["id"],
                codigoRuta=ruta["codigoRuta"],
                nombre=ruta["nombre"],
                origenId=ruta["origenId"],
                destinoId=ruta["destinoId"],
                itinerarioIds=ruta["itinerarioIds"],
                frecuencias=ruta["frecuencias"],
                estado=ruta["estado"],
                estaActivo=ruta["estaActivo"],
                fechaRegistro=ruta["fechaRegistro"],
                fechaActualizacion=ruta["fechaActualizacion"],
                tipoRuta=ruta["tipoRuta"],
                tipoServicio=ruta["tipoServicio"],
                distancia=ruta["distancia"],
                tiempoEstimado=ruta["tiempoEstimado"],
                tarifaBase=ruta["tarifaBase"],
                capacidadMaxima=ruta["capacidadMaxima"],
                horarios=ruta["horarios"],
                restricciones=ruta["restricciones"],
                observaciones=ruta["observaciones"],
                empresasAutorizadasIds=ruta["empresasAutorizadasIds"],
                vehiculosAsignadosIds=ruta["vehiculosAsignadosIds"],
                documentosIds=ruta["documentosIds"],
                historialIds=ruta["historialIds"],
                empresaId=ruta["empresaId"],
                resolucionId=ruta["resolucionId"]
            )
            for ruta in rutas_paginadas
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/filtros", response_model=List[RutaResponse])
async def get_rutas_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    codigo: Optional[str] = Query(None),
    nombre: Optional[str] = Query(None),
    origen_id: Optional[str] = Query(None),
    destino_id: Optional[str] = Query(None),
    db = Depends(get_database)
) -> List[RutaResponse]:
    """Obtener rutas con filtros avanzados"""
    ruta_service = RutaService(db)
    
    # Construir filtros
    filtros = {}
    if estado:
        filtros['estado'] = estado
    if codigo:
        filtros['codigo'] = codigo
    if nombre:
        filtros['nombre'] = nombre
    if origen_id:
        filtros['origen_id'] = origen_id
    if destino_id:
        filtros['destino_id'] = destino_id
    
    rutas = await ruta_service.get_rutas_con_filtros(filtros)
    rutas = rutas[skip:skip + limit]
    
    return [build_ruta_response(ruta) for ruta in rutas]

@router.get("/estadisticas")
async def get_estadisticas_rutas(
    db = Depends(get_database)
):
    """Obtener estadísticas de rutas"""
    ruta_service = RutaService(db)
    estadisticas = await ruta_service.get_estadisticas()
    
    return {
        "totalRutas": estadisticas['total'],
        "rutasActivas": estadisticas['activas'],
        "rutasInactivas": estadisticas['inactivas'],
        "rutasSuspendidas": estadisticas['suspendidas']
    }

# ========================================
# ENDPOINTS FILTRO AVANZADO ORIGEN-DESTINO
# ========================================

@router.get("/filtro-avanzado", response_model=dict)
async def filtro_avanzado_origen_destino(
    origen: Optional[str] = Query(None, description="Filtrar por origen"),
    destino: Optional[str] = Query(None, description="Filtrar por destino"),
    incluir_empresas: bool = Query(True, description="Incluir información de empresas"),
    incluir_estadisticas: bool = Query(True, description="Incluir estadísticas"),
    db = Depends(get_database)
):
    """
    Filtro avanzado por origen y destino con información de empresas para informes
    
    Casos de uso:
    - /rutas/filtro-avanzado?origen=PUNO_001 (todas las rutas desde Puno)
    - /rutas/filtro-avanzado?destino=JULIACA_001 (todas las rutas hacia Juliaca)
    - /rutas/filtro-avanzado?origen=PUNO_001&destino=JULIACA_001 (ruta específica)
    """
    try:
        ruta_service = RutaService(db)
        
        # Construir filtros
        filtros = {}
        if origen:
            filtros['origen'] = origen
        if destino:
            filtros['destino'] = destino
        
        # Obtener rutas filtradas
        rutas = await ruta_service.get_rutas_filtro_avanzado(filtros)
        
        # Procesar resultados
        resultado = {
            "filtros_aplicados": {
                "origen": origen,
                "destino": destino
            },
            "total_rutas": len(rutas),
            "rutas": []
        }
        
        # Agrupar por empresa si se solicita
        if incluir_empresas:
            empresas_collection = db.empresas
            empresas_info = {}
            rutas_por_empresa = {}
            
            for ruta in rutas:
                empresa_id = ruta.get('empresaId')
                if empresa_id:
                    # Obtener info de empresa si no la tenemos
                    if empresa_id not in empresas_info:
                        empresa = None
                        if ObjectId.is_valid(empresa_id):
                            empresa = await empresas_collection.find_one({"_id": ObjectId(empresa_id)})
                        if not empresa:
                            empresa = await empresas_collection.find_one({"id": empresa_id})
                        
                        if empresa:
                            empresas_info[empresa_id] = {
                                "id": str(empresa.get("_id", empresa.get("id", ""))),
                                "ruc": empresa.get("ruc", ""),
                                "razonSocial": empresa.get("razonSocial", {}).get("principal", "Sin razón social")
                            }
                        else:
                            empresas_info[empresa_id] = {
                                "id": empresa_id,
                                "ruc": "No encontrado",
                                "razonSocial": "Empresa no encontrada"
                            }
                    
                    # Agrupar rutas por empresa
                    if empresa_id not in rutas_por_empresa:
                        rutas_por_empresa[empresa_id] = []
                    
                    rutas_por_empresa[empresa_id].append({
                        "id": ruta.get('id', str(ruta.get('_id', ''))),
                        "codigoRuta": ruta.get('codigoRuta', ''),
                        "nombre": ruta.get('nombre', ''),
                        "origen": ruta.get('origen', ruta.get('origenId', '')),
                        "destino": ruta.get('destino', ruta.get('destinoId', '')),
                        "estado": ruta.get('estado', ''),
                        "resolucionId": ruta.get('resolucionId', '')
                    })
            
            # Estructurar resultado por empresas
            resultado["empresas"] = []
            for empresa_id, rutas_empresa in rutas_por_empresa.items():
                resultado["empresas"].append({
                    "empresa": empresas_info.get(empresa_id, {}),
                    "total_rutas": len(rutas_empresa),
                    "rutas": rutas_empresa
                })
            
            resultado["total_empresas"] = len(rutas_por_empresa)
        
        # Agregar estadísticas si se solicita
        if incluir_estadisticas:
            # Obtener orígenes y destinos únicos
            origenes_unicos = set()
            destinos_unicos = set()
            estados_rutas = {}
            
            for ruta in rutas:
                origen_ruta = ruta.get('origen', ruta.get('origenId', ''))
                destino_ruta = ruta.get('destino', ruta.get('destinoId', ''))
                estado_ruta = ruta.get('estado', 'DESCONOCIDO')
                
                if origen_ruta:
                    origenes_unicos.add(origen_ruta)
                if destino_ruta:
                    destinos_unicos.add(destino_ruta)
                
                estados_rutas[estado_ruta] = estados_rutas.get(estado_ruta, 0) + 1
            
            resultado["estadisticas"] = {
                "origenes_unicos": sorted(list(origenes_unicos)),
                "destinos_unicos": sorted(list(destinos_unicos)),
                "total_origenes": len(origenes_unicos),
                "total_destinos": len(destinos_unicos),
                "estados_rutas": estados_rutas,
                "cobertura_geografica": f"{len(origenes_unicos)} orígenes → {len(destinos_unicos)} destinos"
            }
        
        # Si no se agrupó por empresas, incluir lista simple de rutas
        if not incluir_empresas:
            resultado["rutas"] = [
                {
                    "id": ruta.get('id', str(ruta.get('_id', ''))),
                    "codigoRuta": ruta.get('codigoRuta', ''),
                    "nombre": ruta.get('nombre', ''),
                    "origen": ruta.get('origen', ruta.get('origenId', '')),
                    "destino": ruta.get('destino', ruta.get('destinoId', '')),
                    "estado": ruta.get('estado', ''),
                    "empresaId": ruta.get('empresaId', ''),
                    "resolucionId": ruta.get('resolucionId', '')
                }
                for ruta in rutas
            ]
        
        return resultado
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en filtro avanzado: {str(e)}"
        )

@router.get("/origenes-destinos", response_model=dict)
async def get_origenes_destinos_disponibles(
    db = Depends(get_database)
):
    """
    Obtener lista de orígenes y destinos disponibles para los filtros
    """
    try:
        ruta_service = RutaService(db)
        rutas = await ruta_service.get_rutas()
        
        origenes = set()
        destinos = set()
        combinaciones = set()
        
        for ruta in rutas:
            # Convertir a dict si es necesario
            if hasattr(ruta, '__dict__'):
                ruta_dict = ruta.__dict__
            else:
                ruta_dict = ruta
            
            origen = ruta_dict.get('origen', ruta_dict.get('origenId', ''))
            destino = ruta_dict.get('destino', ruta_dict.get('destinoId', ''))
            
            if origen:
                origenes.add(origen)
            if destino:
                destinos.add(destino)
            if origen and destino:
                combinaciones.add(f"{origen} → {destino}")
        
        return {
            "origenes": sorted(list(origenes)),
            "destinos": sorted(list(destinos)),
            "combinaciones": sorted(list(combinaciones)),
            "total_origenes": len(origenes),
            "total_destinos": len(destinos),
            "total_combinaciones": len(combinaciones)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener orígenes y destinos: {str(e)}"
        )

@router.get("/combinaciones-rutas", response_model=dict)
async def get_combinaciones_rutas(
    busqueda: Optional[str] = Query(None, description="Término de búsqueda para filtrar combinaciones"),
    db = Depends(get_database)
):
    """
    Obtener combinaciones de rutas con búsqueda inteligente
    Si busco 'PUNO' devuelve: PUNO → JULIACA, PUNO → YUNGUYO, YUNGUYO → PUNO, etc.
    """
    try:
        ruta_service = RutaService(db)
        rutas = await ruta_service.get_rutas()
        
        combinaciones_completas = []
        
        for ruta in rutas:
            # Convertir a dict si es necesario
            if hasattr(ruta, '__dict__'):
                ruta_dict = ruta.__dict__
            else:
                ruta_dict = ruta
            
            origen = ruta_dict.get('origen', ruta_dict.get('origenId', ''))
            destino = ruta_dict.get('destino', ruta_dict.get('destinoId', ''))
            
            if origen and destino:
                combinacion = {
                    "id": ruta_dict.get('id', str(ruta_dict.get('_id', ''))),
                    "origen": origen,
                    "destino": destino,
                    "combinacion": f"{origen} → {destino}",
                    "codigoRuta": ruta_dict.get('codigoRuta', ''),
                    "empresaId": ruta_dict.get('empresaId', ''),
                    "resolucionId": ruta_dict.get('resolucionId', ''),
                    "estado": ruta_dict.get('estado', '')
                }
                combinaciones_completas.append(combinacion)
        
        # Filtrar por búsqueda si se proporciona
        if busqueda:
            busqueda_lower = busqueda.lower()
            combinaciones_filtradas = []
            
            for comb in combinaciones_completas:
                # Buscar en origen, destino o combinación completa
                if (busqueda_lower in comb["origen"].lower() or 
                    busqueda_lower in comb["destino"].lower() or
                    busqueda_lower in comb["combinacion"].lower()):
                    combinaciones_filtradas.append(comb)
            
            combinaciones_completas = combinaciones_filtradas
        
        # Agrupar por combinación única para evitar duplicados
        combinaciones_unicas = {}
        for comb in combinaciones_completas:
            key = comb["combinacion"]
            if key not in combinaciones_unicas:
                combinaciones_unicas[key] = {
                    "combinacion": comb["combinacion"],
                    "origen": comb["origen"],
                    "destino": comb["destino"],
                    "rutas": []
                }
            
            combinaciones_unicas[key]["rutas"].append({
                "id": comb["id"],
                "codigoRuta": comb["codigoRuta"],
                "empresaId": comb["empresaId"],
                "resolucionId": comb["resolucionId"],
                "estado": comb["estado"]
            })
        
        # Convertir a lista y ordenar
        resultado = list(combinaciones_unicas.values())
        resultado.sort(key=lambda x: x["combinacion"])
        
        return {
            "combinaciones": resultado,
            "total_combinaciones": len(resultado),
            "busqueda": busqueda,
            "mensaje": f"Se encontraron {len(resultado)} combinaciones" + (f" para '{busqueda}'" if busqueda else "")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener combinaciones: {str(e)}"
        )

@router.get("/filtro-avanzado/exportar/{formato}")
async def exportar_filtro_avanzado(
    formato: str,
    origen: Optional[str] = Query(None),
    destino: Optional[str] = Query(None),
    db = Depends(get_database)
):
    """
    Exportar resultados del filtro avanzado en diferentes formatos
    Formatos soportados: excel, pdf, csv
    """
    if formato not in ['excel', 'pdf', 'csv']:
        raise HTTPException(
            status_code=400,
            detail="Formato no soportado. Use: excel, pdf, csv"
        )
    
    try:
        # Obtener datos del filtro avanzado
        filtro_resultado = await filtro_avanzado_origen_destino(
            origen=origen,
            destino=destino,
            incluir_empresas=True,
            incluir_estadisticas=True,
            db=db
        )
        
        # Generar nombre del archivo
        filtro_nombre = []
        if origen:
            filtro_nombre.append(f"origen-{origen}")
        if destino:
            filtro_nombre.append(f"destino-{destino}")
        
        nombre_base = "rutas-" + "-".join(filtro_nombre) if filtro_nombre else "todas-rutas"
        fecha_actual = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_archivo = f"{nombre_base}_{fecha_actual}"
        
        if formato == 'excel':
            # Simular generación de Excel
            return {
                "mensaje": f"Exportando a Excel: {nombre_archivo}.xlsx",
                "datos": filtro_resultado,
                "formato": "excel",
                "archivo": f"{nombre_archivo}.xlsx"
            }
        elif formato == 'pdf':
            # Simular generación de PDF
            return {
                "mensaje": f"Exportando a PDF: {nombre_archivo}.pdf",
                "datos": filtro_resultado,
                "formato": "pdf",
                "archivo": f"{nombre_archivo}.pdf"
            }
        elif formato == 'csv':
            # Simular generación de CSV
            return {
                "mensaje": f"Exportando a CSV: {nombre_archivo}.csv",
                "datos": filtro_resultado,
                "formato": "csv",
                "archivo": f"{nombre_archivo}.csv"
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al exportar: {str(e)}"
        )

@router.get("/{ruta_id}", response_model=RutaResponse)
async def get_ruta(
    ruta_id: str,
    db = Depends(get_database)
) -> RutaResponse:
    """Obtener ruta por ID"""
    ruta_service = RutaService(db)
    ruta = await ruta_service.get_ruta_by_id(ruta_id)
    
    if not ruta:
        raise RutaNotFoundException(ruta_id)
    
    return build_ruta_response(ruta)

@router.get("/codigo/{codigo}", response_model=RutaResponse)
async def get_ruta_by_codigo(
    codigo: str,
    db = Depends(get_database)
) -> RutaResponse:
    """Obtener ruta por código"""
    ruta_service = RutaService(db)
    ruta = await ruta_service.get_ruta_by_codigo(codigo)
    
    if not ruta:
        raise RutaNotFoundException(f"Código {codigo}")
    
    return build_ruta_response(ruta)

@router.get("/validar-codigo/{codigo}")
async def validar_codigo_ruta(codigo: str):
    """Validar si un código de ruta ya existe"""
    ruta_service = MockRutaService()
    ruta_existente = await ruta_service.get_ruta_by_codigo(codigo)
    
    return {
        "valido": not ruta_existente,
        "ruta": ruta_existente
    }

@router.put("/{ruta_id}", response_model=RutaResponse)
async def update_ruta(
    ruta_id: str,
    ruta_data: RutaUpdate
) -> RutaResponse:
    """Actualizar ruta"""
    # Guard clauses
    if not ruta_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de ruta inválido")
    
    if not ruta_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    ruta_service = MockRutaService()
    
    # Si se está actualizando el código de ruta, validar que sea único
    if ruta_data.codigoRuta:
        # Obtener la ruta actual para verificar la resolución
        ruta_actual = await ruta_service.get_ruta_by_id(ruta_id)
        if not ruta_actual:
            raise RutaNotFoundException(ruta_id)
        
        # Verificar que el nuevo código no exista en la misma resolución
        ruta_existente = await ruta_service.get_ruta_by_codigo(ruta_data.codigoRuta)
        if ruta_existente and ruta_existente.id != ruta_id:
            # Verificar si pertenecen a la misma resolución
            if hasattr(ruta_existente, 'resolucionId') and hasattr(ruta_actual, 'resolucionId'):
                if ruta_existente.resolucionId == ruta_actual.resolucionId:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Ya existe una ruta con código {ruta_data.codigoRuta} en la misma resolución"
                    )
    
    updated_ruta = await ruta_service.update_ruta(ruta_id, ruta_data)
    
    if not updated_ruta:
        raise RutaNotFoundException(ruta_id)
    
    return build_ruta_response(updated_ruta)

@router.delete("/{ruta_id}", status_code=204)
async def delete_ruta(
    ruta_id: str
):
    """Desactivar ruta (borrado lógico)"""
    # Guard clause
    if not ruta_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de ruta inválido")
    
    ruta_service = MockRutaService()
    success = await ruta_service.soft_delete_ruta(ruta_id)
    
    if not success:
        raise RutaNotFoundException(ruta_id)

# Endpoints para gestión de itinerarios
@router.post("/{ruta_id}/itinerario/{localidad_id}", response_model=RutaResponse)
async def agregar_localidad_a_itinerario(
    ruta_id: str,
    localidad_id: str
) -> RutaResponse:
    """Agregar localidad al itinerario de la ruta"""
    ruta_service = MockRutaService()
    ruta = await ruta_service.agregar_localidad_a_itinerario(ruta_id, localidad_id)
    
    if not ruta:
        raise RutaNotFoundException(ruta_id)
    
    return build_ruta_response(ruta)

@router.delete("/{ruta_id}/itinerario/{localidad_id}", response_model=RutaResponse)
async def remover_localidad_de_itinerario(
    ruta_id: str,
    localidad_id: str
) -> RutaResponse:
    """Remover localidad del itinerario de la ruta"""
    ruta_service = MockRutaService()
    ruta = await ruta_service.remover_localidad_de_itinerario(ruta_id, localidad_id)
    
    if not ruta:
        raise RutaNotFoundException(ruta_id)
    
    return build_ruta_response(ruta)

# Endpoints para gestión de frecuencias
@router.put("/{ruta_id}/frecuencias", response_model=RutaResponse)
async def actualizar_frecuencias(
    ruta_id: str,
    frecuencias: str
) -> RutaResponse:
    """Actualizar frecuencias de la ruta"""
    ruta_service = MockRutaService()
    ruta = await ruta_service.actualizar_frecuencias(ruta_id, frecuencias)
    
    if not ruta:
        raise RutaNotFoundException(ruta_id)
    
    return build_ruta_response(ruta)

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_rutas(
    formato: str,
    estado: Optional[str] = Query(None)
):
    """Exportar rutas en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    ruta_service = MockRutaService()
    
    # Obtener rutas según filtros
    if estado:
        rutas = await ruta_service.get_rutas_por_estado(estado)
    else:
        rutas = await ruta_service.get_rutas_activas()
    
    # Simular exportación
    if formato == 'excel':
        return {"message": f"Exportando {len(rutas)} rutas a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(rutas)} rutas a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(rutas)} rutas a CSV"}
# ========================================
# ENDPOINTS DE CARGA MASIVA DESDE EXCEL
# ========================================

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_rutas():
    """Descargar plantilla Excel para carga masiva de rutas"""
    try:
        excel_service = RutaExcelService()
        plantilla_buffer = excel_service.generar_plantilla_excel()
        
        return StreamingResponse(
            BytesIO(plantilla_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_rutas.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar plantilla: {str(e)}")

@router.post("/carga-masiva/validar")
async def validar_archivo_rutas(
    archivo: UploadFile = File(..., description="Archivo Excel con rutas")
):
    """Validar archivo Excel de rutas sin procesarlo"""
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser un Excel (.xlsx o .xls)"
        )
    
    try:
        # Leer archivo
        contenido = await archivo.read()
        archivo_buffer = BytesIO(contenido)
        
        # Validar con el servicio
        excel_service = RutaExcelService()
        resultado = excel_service.validar_archivo_excel(archivo_buffer)
        
        return {
            "archivo": archivo.filename,
            "validacion": resultado,
            "mensaje": f"Archivo validado: {resultado['validos']} válidos, {resultado['invalidos']} inválidos"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al validar archivo: {str(e)}"
        )

@router.post("/carga-masiva/procesar")
async def procesar_carga_masiva_rutas(
    archivo: UploadFile = File(..., description="Archivo Excel con rutas"),
    solo_validar: bool = Query(False, description="Solo validar sin crear rutas")
):
    """Procesar carga masiva de rutas desde Excel"""
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser un Excel (.xlsx o .xls)"
        )
    
    try:
        # Leer archivo
        contenido = await archivo.read()
        archivo_buffer = BytesIO(contenido)
        
        # Procesar con el servicio
        excel_service = RutaExcelService()
        
        if solo_validar:
            resultado = excel_service.validar_archivo_excel(archivo_buffer)
            mensaje = f"Validación completada: {resultado['validos']} válidos, {resultado['invalidos']} inválidos"
        else:
            resultado = excel_service.procesar_carga_masiva(archivo_buffer)
            mensaje = f"Procesamiento completado: {resultado.get('total_creadas', 0)} rutas creadas"
        
        return {
            "archivo": archivo.filename,
            "solo_validacion": solo_validar,
            "resultado": resultado,
            "mensaje": mensaje
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al procesar archivo: {str(e)}"
        )

# ========================================
# ENDPOINTS CARGA MASIVA COMPLETOS
# ========================================

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_rutas():
    """Descargar plantilla Excel para carga masiva de rutas"""
    try:
        excel_service = RutaExcelService()
        buffer = excel_service.generar_plantilla_excel()
        
        return StreamingResponse(
            BytesIO(buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_rutas.xlsx"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar plantilla: {str(e)}"
        )

@router.post("/carga-masiva/validar-completo")
async def validar_archivo_rutas_completo(
    archivo: UploadFile = File(..., description="Archivo Excel con rutas"),
    db = Depends(get_database)
):
    """Validar archivo Excel de rutas con validaciones completas de BD"""
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser un Excel (.xlsx o .xls)"
        )
    
    try:
        # Leer archivo
        contenido = await archivo.read()
        archivo_buffer = BytesIO(contenido)
        
        # Validar con el servicio (con conexión a BD)
        excel_service = RutaExcelService(db)
        resultado = await excel_service.validar_archivo_excel(archivo_buffer)
        
        return {
            "archivo": archivo.filename,
            "validacion": resultado,
            "mensaje": f"Archivo validado: {resultado['validos']} válidos, {resultado['invalidos']} inválidos",
            "resumen": {
                "total_filas": resultado['total_filas'],
                "validos": resultado['validos'],
                "invalidos": resultado['invalidos'],
                "con_advertencias": resultado['con_advertencias']
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al validar archivo: {str(e)}"
        )

@router.post("/carga-masiva/procesar-completo")
async def procesar_carga_masiva_rutas_completo(
    archivo: UploadFile = File(..., description="Archivo Excel con rutas"),
    solo_validar: bool = Query(False, description="Solo validar sin crear rutas"),
    db = Depends(get_database)
):
    """Procesar carga masiva de rutas desde Excel con validaciones completas"""
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="El archivo debe ser un Excel (.xlsx o .xls)"
        )
    
    try:
        # Leer archivo
        contenido = await archivo.read()
        archivo_buffer = BytesIO(contenido)
        
        # Procesar con el servicio (con conexión a BD)
        excel_service = RutaExcelService(db)
        ruta_service = RutaService(db)
        
        if solo_validar:
            resultado = await excel_service.validar_archivo_excel(archivo_buffer)
            mensaje = f"Validación completada: {resultado['validos']} válidos, {resultado['invalidos']} inválidos"
        else:
            resultado = await excel_service.procesar_carga_masiva(archivo_buffer, ruta_service)
            mensaje = f"Procesamiento completado: {resultado.get('total_creadas', 0)} rutas creadas"
        
        return {
            "archivo": archivo.filename,
            "solo_validacion": solo_validar,
            "resultado": resultado,
            "mensaje": mensaje,
            "resumen": {
                "total_filas": resultado.get('total_filas', 0),
                "validos": resultado.get('validos', 0),
                "invalidos": resultado.get('invalidos', 0),
                "creadas": resultado.get('total_creadas', 0),
                "errores_creacion": len(resultado.get('errores_creacion', []))
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al procesar archivo: {str(e)}"
        )

@router.get("/carga-masiva/ayuda")
async def obtener_ayuda_carga_masiva():
    """Obtener información de ayuda para la carga masiva de rutas"""
    return {
        "titulo": "Carga Masiva de Rutas",
        "descripcion": "Sistema para cargar múltiples rutas desde un archivo Excel",
        "pasos": [
            "1. Descargar la plantilla Excel",
            "2. Completar los datos en la hoja 'DATOS'",
            "3. Validar el archivo antes de procesarlo",
            "4. Procesar la carga masiva"
        ],
        "campos_obligatorios": [
            "Código Ruta: 2-3 dígitos únicos dentro de la resolución",
            "Nombre: Descripción de la ruta (mínimo 5 caracteres)",
            "Empresa ID: ID de la empresa propietaria (debe existir)",
            "Resolución ID: ID de resolución PADRE y VIGENTE (debe existir)",
            "Origen ID: ID del lugar de origen",
            "Destino ID: ID del lugar de destino",
            "Frecuencias: Descripción de las frecuencias"
        ],
        "campos_opcionales": [
            "Tipo Ruta: URBANA, INTERURBANA, INTERPROVINCIAL, INTERREGIONAL",
            "Tipo Servicio: PASAJEROS, CARGA, MIXTO",
            "Estado: ACTIVA, INACTIVA, EN_MANTENIMIENTO, SUSPENDIDA",
            "Distancia (km): Distancia en kilómetros",
            "Tiempo Estimado: Formato HH:MM",
            "Tarifa Base: Precio base en soles",
            "Capacidad Máxima: Número de pasajeros/toneladas",
            "Observaciones: Comentarios adicionales"
        ],
        "validaciones": [
            "El código de ruta debe ser único dentro de la resolución",
            "La empresa debe existir en el sistema",
            "La resolución debe ser PADRE, VIGENTE y pertenecer a la empresa",
            "El origen y destino no pueden ser iguales",
            "Los valores numéricos deben ser positivos"
        ],
        "endpoints": {
            "plantilla": "/rutas/carga-masiva/plantilla",
            "validar": "/rutas/carga-masiva/validar-completo",
            "procesar": "/rutas/carga-masiva/procesar-completo"
        }
    }
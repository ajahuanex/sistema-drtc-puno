from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from io import BytesIO
from app.dependencies.auth import get_current_active_user
from app.services.ruta_excel_service import RutaExcelService
from app.services.mock_ruta_service import MockRutaService
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
    ruta_data: RutaCreate
) -> RutaResponse:
    """Crear nueva ruta"""
    # Guard clauses al inicio
    if not ruta_data.codigoRuta.strip():
        raise ValidationErrorException("Código de Ruta", "El código de ruta no puede estar vacío")
    
    ruta_service = MockRutaService()
    
    try:
        ruta = await ruta_service.create_ruta(ruta_data)
        return build_ruta_response(ruta)
    except ValueError as e:
        if "código" in str(e).lower():
            raise RutaAlreadyExistsException(ruta_data.codigoRuta)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[RutaResponse])
async def get_rutas(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado")
) -> List[RutaResponse]:
    """Obtener lista de rutas con filtros opcionales"""
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
    destino_id: Optional[str] = Query(None)
) -> List[RutaResponse]:
    """Obtener rutas con filtros avanzados"""
    ruta_service = MockRutaService()
    
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
async def get_estadisticas_rutas():
    """Obtener estadísticas de rutas"""
    ruta_service = MockRutaService()
    estadisticas = await ruta_service.get_estadisticas()
    
    return {
        "totalRutas": estadisticas['total'],
        "rutasActivas": estadisticas['activas'],
        "rutasInactivas": estadisticas['inactivas'],
        "rutasSuspendidas": estadisticas['suspendidas']
    }

@router.get("/{ruta_id}", response_model=RutaResponse)
async def get_ruta(
    ruta_id: str
) -> RutaResponse:
    """Obtener ruta por ID"""
    # Guard clause
    if not ruta_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de ruta inválido")
    
    ruta_service = MockRutaService()
    ruta = await ruta_service.get_ruta_by_id(ruta_id)
    
    if not ruta:
        raise RutaNotFoundException(ruta_id)
    
    return build_ruta_response(ruta)

@router.get("/codigo/{codigo}", response_model=RutaResponse)
async def get_ruta_by_codigo(
    codigo: str
) -> RutaResponse:
    """Obtener ruta por código"""
    ruta_service = MockRutaService()
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
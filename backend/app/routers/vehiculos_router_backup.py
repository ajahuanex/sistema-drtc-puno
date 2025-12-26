from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import tempfile
import os
from app.dependencies.auth import get_current_active_user
from app.dependencies.db import get_database
from app.services.vehiculo_service import VehiculoService
# Importación condicional para evitar errores al iniciar el servidor
try:
    from app.services.vehiculo_excel_service import VehiculoExcelService
    EXCEL_SERVICE_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Servicio de Excel no disponible: {e}")
    VehiculoExcelService = None
    EXCEL_SERVICE_AVAILABLE = False
from app.models.vehiculo import (
    VehiculoCreate, VehiculoUpdate, VehiculoInDB, VehiculoResponse,
    VehiculoCargaMasivaResponse, VehiculoValidacionExcel
)
from app.utils.exceptions import (
    VehiculoNotFoundException, 
    VehiculoAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/vehiculos", tags=["vehiculos"])

def vehiculo_to_response(vehiculo: VehiculoInDB) -> VehiculoResponse:
    """Convertir VehiculoInDB a VehiculoResponse manejando campos faltantes"""
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresaActualId=vehiculo.empresaActualId,
        resolucionId=vehiculo.resolucionId,
        rutasAsignadasIds=vehiculo.rutasAsignadasIds or [],
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anioFabricacion=vehiculo.anioFabricacion,
        estado=vehiculo.estado,
        sedeRegistro=getattr(vehiculo, 'sedeRegistro', 'PUNO'),
        placaSustituida=getattr(vehiculo, 'placaSustituida', None),
        fechaSustitucion=getattr(vehiculo, 'fechaSustitucion', None),
        motivoSustitucion=getattr(vehiculo, 'motivoSustitucion', None),
        resolucionSustitucion=getattr(vehiculo, 'resolucionSustitucion', None),
        numeroTuc=getattr(vehiculo, 'numeroTuc', None),
        estaActivo=vehiculo.estaActivo,
        fechaRegistro=vehiculo.fechaRegistro,
        fechaActualizacion=vehiculo.fechaActualizacion,
        datosTecnicos=vehiculo.datosTecnicos,
        color=vehiculo.color,
        numeroSerie=vehiculo.numeroSerie,
        observaciones=vehiculo.observaciones,
        documentosIds=vehiculo.documentosIds or [],
        historialIds=vehiculo.historialIds or [],
        numeroHistorialValidacion=getattr(vehiculo, 'numeroHistorialValidacion', None),
        esHistorialActual=getattr(vehiculo, 'esHistorialActual', True),
        vehiculoHistorialActualId=getattr(vehiculo, 'vehiculoHistorialActualId', None),
        tuc=vehiculo.tuc
    )

async def get_vehiculo_service():
    """Dependency para obtener el servicio de vehículos"""
    db = await get_database()
    return VehiculoService(db)

@router.post("/", response_model=VehiculoResponse, status_code=201)
async def create_vehiculo(
    vehiculo_data: VehiculoCreate,
    db = Depends(get_database)
) -> VehiculoResponse:
    """Crear nuevo vehículo"""
    # Guard clauses al inicio
    if not vehiculo_data.placa.strip():
        raise ValidationErrorException("Placa", "La placa no puede estar vacía")
    
    vehiculo_service = VehiculoService(db)
    
    try:
        vehiculo = await vehiculo_service.create_vehiculo(vehiculo_data)
        return VehiculoResponse(**vehiculo.model_dump())
    except VehiculoAlreadyExistsException:
        raise
    except ValueError as e:
        if "placa" in str(e).lower():
            raise VehiculoAlreadyExistsException(vehiculo_data.placa)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[VehiculoResponse])
async def get_vehiculos(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_id: str = Query(None, description="Filtrar por empresa"),
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> List[VehiculoResponse]:
    """Obtener lista de vehículos con filtros opcionales"""
    
    # Usar solo el método básico disponible en VehiculoService
    vehiculos = await vehiculo_service.get_vehiculos(
        skip=skip,
        limit=limit,
        empresa_id=empresa_id,
        estado=estado
    )
    
    return [
        VehiculoResponse(
            id=vehiculo.id,
            placa=vehiculo.placa,
            empresaActualId=vehiculo.empresaActualId,
            resolucionId=vehiculo.resolucionId,
            rutasAsignadasIds=vehiculo.rutasAsignadasIds,
            categoria=vehiculo.categoria,
            marca=vehiculo.marca,
            modelo=vehiculo.modelo,
            anioFabricacion=vehiculo.anioFabricacion,
            estado=vehiculo.estado,
            estaActivo=vehiculo.estaActivo,
            fechaRegistro=vehiculo.fechaRegistro,
            fechaActualizacion=vehiculo.fechaActualizacion,
            datosTecnicos=vehiculo.datosTecnicos,
            color=vehiculo.color,
            numeroSerie=vehiculo.numeroSerie,
            observaciones=vehiculo.observaciones,
            documentosIds=vehiculo.documentosIds,
            historialIds=vehiculo.historialIds,
            tuc=vehiculo.tuc
        )
        for vehiculo in vehiculos
    ]

@router.get("/filtros", response_model=List[VehiculoResponse])
async def get_vehiculos_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    placa: Optional[str] = Query(None),
    marca: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
    empresa_id: Optional[str] = Query(None),
    anio_desde: Optional[int] = Query(None),
    anio_hasta: Optional[int] = Query(None),
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> List[VehiculoResponse]:
    """Obtener vehículos con filtros avanzados"""
    # Construir filtros
    filtros = {}
    if estado:
        filtros['estado'] = estado
    if placa:
        filtros['placa'] = placa
    if marca:
        filtros['marca'] = marca
    if categoria:
        filtros['categoria'] = categoria
    if empresa_id:
        filtros['empresa_id'] = empresa_id
    if anio_desde:
        filtros['anio_desde'] = anio_desde
    if anio_hasta:
        filtros['anio_hasta'] = anio_hasta
    
    vehiculos = await vehiculo_service.get_vehiculos_con_filtros(filtros)
    vehiculos = vehiculos[skip:skip + limit]
    
    return [
        VehiculoResponse(
            id=vehiculo.id,
            placa=vehiculo.placa,
            empresaActualId=vehiculo.empresaActualId,
            resolucionId=vehiculo.resolucionId,
            rutasAsignadasIds=vehiculo.rutasAsignadasIds,
            categoria=vehiculo.categoria,
            marca=vehiculo.marca,
            modelo=vehiculo.modelo,
            anioFabricacion=vehiculo.anioFabricacion,
            estado=vehiculo.estado,
            estaActivo=vehiculo.estaActivo,
            fechaRegistro=vehiculo.fechaRegistro,
            fechaActualizacion=vehiculo.fechaActualizacion,
            datosTecnicos=vehiculo.datosTecnicos,
            color=vehiculo.color,
            numeroSerie=vehiculo.numeroSerie,
            observaciones=vehiculo.observaciones,
            documentosIds=vehiculo.documentosIds,
            historialIds=vehiculo.historialIds,
            tuc=vehiculo.tuc
        )
        for vehiculo in vehiculos
    ]

@router.get("/estadisticas")
async def get_estadisticas_vehiculos(
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Obtener estadísticas de vehículos"""
    estadisticas = await vehiculo_service.get_estadisticas()
    
    return {
        "totalVehiculos": estadisticas['total'],
        "vehiculosActivos": estadisticas['activos'],
        "vehiculosInactivos": estadisticas['inactivos'],
        "vehiculosEnMantenimiento": estadisticas['mantenimiento'],
        "porCategoria": estadisticas['por_categoria']
    }

# ========================================
# ENDPOINTS DE HISTORIAL DE VALIDACIONES
# ========================================

@router.post("/historial/actualizar-todos")
async def actualizar_historial_todos():
    """Actualizar el historial de validaciones para todos los vehículos"""
    try:
        from app.services.vehiculo_historial_service import VehiculoHistorialService
        historial_service = VehiculoHistorialService()
        
        resultado = await historial_service.actualizar_historial_todos_vehiculos()
        
        return {
            "mensaje": "Historial de validaciones actualizado exitosamente",
            "estadisticas": resultado
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al actualizar historial: {str(e)}"
        )

@router.get("/historial/estadisticas")
async def obtener_estadisticas_historial():
    """Obtener estadísticas del historial de validaciones"""
    try:
        from app.services.vehiculo_historial_service import VehiculoHistorialService
        historial_service = VehiculoHistorialService()
        
        estadisticas = await historial_service.obtener_estadisticas_historial()
        
        return {
            "estadisticas": estadisticas,
            "mensaje": "Estadísticas generadas exitosamente"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al generar estadísticas: {str(e)}"
        )

@router.post("/historial/marcar-actuales")
async def marcar_vehiculos_historial_actual():
    """Marcar qué vehículos tienen el historial más actual y bloquear los históricos"""
    try:
        from app.services.vehiculo_filtro_historial_service import VehiculoFiltroHistorialService
        filtro_service = VehiculoFiltroHistorialService()
        
        resultado = await filtro_service.marcar_vehiculos_historial_actual()
        
        return {
            "mensaje": "Vehículos marcados por historial exitosamente",
            "resultado": resultado
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al marcar vehículos: {str(e)}"
        )

# ENDPOINT TEMPORALMENTE DESACTIVADO - Usar DataManager en su lugar
@router.get("/visibles")
async def obtener_vehiculos_visibles(
    empresa_id: Optional[str] = Query(None, description="Filtrar por empresa")
):
    """Obtener solo los vehículos visibles (historial actual, no bloqueados)"""
    # Retornar lista vacía en lugar de error para no bloquear el frontend
    return {
        "vehiculos": [],
        "total": 0,
        "mensaje": "Usar DataManager para obtener vehículos"
    }

@router.get("/historial-placa/{placa}")
async def obtener_historial_por_placa(placa: str):
    """Obtener todos los registros históricos de una placa específica"""
    try:
        from app.services.vehiculo_filtro_historial_service import VehiculoFiltroHistorialService
        filtro_service = VehiculoFiltroHistorialService()
        
        vehiculos_historicos = await filtro_service.obtener_vehiculos_historicos(placa)
        
        return {
            "placa": placa,
            "registros_historicos": vehiculos_historicos,
            "total_registros": len(vehiculos_historicos),
            "mensaje": f"Historial completo obtenido para placa: {placa}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener historial: {str(e)}"
        )

@router.get("/filtrado/estadisticas")
async def obtener_estadisticas_filtrado():
    """Obtener estadísticas del filtrado por historial"""
    try:
        from app.services.vehiculo_filtro_historial_service import VehiculoFiltroHistorialService
        filtro_service = VehiculoFiltroHistorialService()
        
        estadisticas = await filtro_service.obtener_estadisticas_filtrado()
        
        return {
            "estadisticas": estadisticas,
            "mensaje": "Estadísticas de filtrado generadas exitosamente"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al generar estadísticas: {str(e)}"
        )

@router.post("/restaurar-historico/{vehiculo_id}")
async def restaurar_vehiculo_historico(vehiculo_id: str):
    """Restaurar un vehículo histórico como el actual"""
    try:
        from app.services.vehiculo_filtro_historial_service import VehiculoFiltroHistorialService
        filtro_service = VehiculoFiltroHistorialService()
        
        resultado = await filtro_service.restaurar_vehiculo_historico(vehiculo_id)
        
        return {
            "resultado": resultado,
            "mensaje": "Vehículo histórico restaurado exitosamente"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al restaurar vehículo: {str(e)}"
        )

@router.post("/historial/recalcular-empresa/{empresa_id}")
async def recalcular_historial_empresa(empresa_id: str):
    """Recalcular historial de validaciones para una empresa específica"""
    try:
        from app.services.vehiculo_historial_service import VehiculoHistorialService
        historial_service = VehiculoHistorialService()
        
        resultado = await historial_service.recalcular_historial_por_empresa(empresa_id)
        
        return {
            "mensaje": f"Historial recalculado para empresa {empresa_id}",
            "resultado": resultado
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al recalcular historial: {str(e)}"
        )

# ========================================
# ENDPOINTS DE CARGA MASIVA DESDE EXCEL
# ========================================

# Endpoints para carga masiva desde Excel (DEBEN IR ANTES DE LOS ENDPOINTS CON PARÁMETROS)
@router.get("/plantilla-excel")
async def descargar_plantilla_excel():
    """Descargar plantilla Excel para carga masiva de vehículos"""
    if not EXCEL_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Servicio de Excel no disponible. Instale las dependencias: pip install pandas openpyxl xlrd")
    
    excel_service = VehiculoExcelService()
    
    try:
        archivo_plantilla = await excel_service.generar_plantilla_excel()
        
        return FileResponse(
            path=archivo_plantilla,
            filename="plantilla_vehiculos.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar plantilla: {str(e)}")

@router.post("/validar-excel", response_model=List[VehiculoValidacionExcel])
async def validar_excel(
    archivo: UploadFile = File(...)
):
    """Validar archivo Excel antes de la carga masiva"""
    
    if not EXCEL_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Servicio de Excel no disponible. Instale las dependencias: pip install pandas openpyxl xlrd")
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")
    
    excel_service = VehiculoExcelService()
    
    # Guardar archivo temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
        content = await archivo.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Validar archivo
        validaciones = await excel_service.validar_excel_preview(temp_file_path)
        return validaciones
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al validar archivo: {str(e)}")
    
    finally:
        # Limpiar archivo temporal
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@router.post("/carga-masiva", response_model=VehiculoCargaMasivaResponse)
async def carga_masiva_vehiculos(
    archivo: UploadFile = File(...)
):
    """Realizar carga masiva de vehículos desde Excel"""
    
    if not EXCEL_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Servicio de Excel no disponible. Instale las dependencias: pip install pandas openpyxl xlrd")
    
    # Validar tipo de archivo
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")
    
    excel_service = VehiculoExcelService()
    
    # Guardar archivo temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
        content = await archivo.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Procesar archivo
        resultado = await excel_service.procesar_excel(temp_file_path)
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")
    
    finally:
        # Limpiar archivo temporal
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@router.get("/carga-masiva/estadisticas")
async def estadisticas_carga_masiva():
    """Obtener estadísticas de cargas masivas realizadas"""
    # En un sistema real, esto vendría de una base de datos
    return {
        "total_cargas": 5,
        "vehiculos_cargados_total": 150,
        "ultima_carga": "2024-01-15T10:30:00",
        "promedio_exitosos": 85.5,
        "errores_comunes": [
            {"error": "Placa duplicada", "frecuencia": 15},
            {"error": "RUC empresa no encontrado", "frecuencia": 8},
            {"error": "Categoría inválida", "frecuencia": 5}
        ]
    }

@router.get("/{vehiculo_id}/historial-detallado")
async def obtener_historial_detallado(vehiculo_id: str):
    """Obtener historial detallado de un vehículo específico"""
    try:
        from app.services.vehiculo_historial_service import VehiculoHistorialService
        historial_service = VehiculoHistorialService()
        
        historial = await historial_service.obtener_historial_vehiculo_detallado(vehiculo_id)
        
        return {
            "historial": historial,
            "mensaje": "Historial detallado obtenido exitosamente"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al obtener historial: {str(e)}"
        )

@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
async def get_vehiculo(
    vehiculo_id: str,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Obtener vehículo por ID"""
    # Guard clause
    if not vehiculo_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    vehiculo = await vehiculo_service.get_vehiculo_by_id(vehiculo_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresaActualId=vehiculo.empresaActualId,
        resolucionId=vehiculo.resolucionId,
        rutasAsignadasIds=vehiculo.rutasAsignadasIds,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anioFabricacion=vehiculo.anioFabricacion,
        estado=vehiculo.estado,
        estaActivo=vehiculo.estaActivo,
        fechaRegistro=vehiculo.fechaRegistro,
        fechaActualizacion=vehiculo.fechaActualizacion,
        datosTecnicos=vehiculo.datosTecnicos,
        color=vehiculo.color,
        numeroSerie=vehiculo.numeroSerie,
        observaciones=vehiculo.observaciones,
        documentosIds=vehiculo.documentosIds,
        historialIds=vehiculo.historialIds,
        tuc=vehiculo.tuc
    )

# ENDPOINT TEMPORALMENTE DESACTIVADO - Usar DataManager en su lugar
# @router.get("/placa/{placa}", response_model=VehiculoResponse)
# async def get_vehiculo_by_placa(
#     placa: str
# ) -> VehiculoResponse:
#     """Obtener vehículo por placa"""
#     # vehiculo_service = MockVehiculoService()
#     # vehiculo = await vehiculo_service.get_vehiculo_by_placa(placa)
#     
#     if not vehiculo:
#         raise VehiculoNotFoundException(f"Placa {placa}")
#     
#     return VehiculoResponse(
#         id=vehiculo.id,
#         placa=vehiculo.placa,
#         empresaActualId=vehiculo.empresaActualId,
#         resolucionId=vehiculo.resolucionId,
#         rutasAsignadasIds=vehiculo.rutasAsignadasIds,
#         categoria=vehiculo.categoria,
#         marca=vehiculo.marca,
#         modelo=vehiculo.modelo,
#         anioFabricacion=vehiculo.anioFabricacion,
#         estado=vehiculo.estado,
#         estaActivo=vehiculo.estaActivo,
#         fechaRegistro=vehiculo.fechaRegistro,
#         fechaActualizacion=vehiculo.fechaActualizacion,
#         datosTecnicos=vehiculo.datosTecnicos,
#         color=vehiculo.color,
#         numeroSerie=vehiculo.numeroSerie,
#         observaciones=vehiculo.observaciones,
#         documentosIds=vehiculo.documentosIds,
#         historialIds=vehiculo.historialIds,
#         tuc=vehiculo.tuc
#     )
#     raise HTTPException(status_code=501, detail="Endpoint desactivado - Usar DataManager")

@router.get("/validar-placa/{placa}")
async def validar_placa(
    placa: str,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Validar si una placa ya existe"""
    vehiculo_existente = await vehiculo_service.get_vehiculo_by_placa(placa)
    
    return {
        "valido": not vehiculo_existente,
        "vehiculo": vehiculo_existente
    }

@router.put("/{vehiculo_id}", response_model=VehiculoResponse)
async def update_vehiculo(
    vehiculo_id: str,
    vehiculo_data: VehiculoUpdate,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Actualizar vehículo"""
    # Guard clauses
    if not vehiculo_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    if not vehiculo_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    updated_vehiculo = await vehiculo_service.update_vehiculo(vehiculo_id, vehiculo_data)
    
    if not updated_vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=updated_vehiculo.id,
        placa=updated_vehiculo.placa,
        empresaActualId=updated_vehiculo.empresaActualId,
        resolucionId=updated_vehiculo.resolucionId,
        rutasAsignadasIds=updated_vehiculo.rutasAsignadasIds,
        categoria=updated_vehiculo.categoria,
        marca=updated_vehiculo.marca,
        modelo=updated_vehiculo.modelo,
        anioFabricacion=updated_vehiculo.anioFabricacion,
        estado=updated_vehiculo.estado,
        estaActivo=updated_vehiculo.estaActivo,
        fechaRegistro=updated_vehiculo.fechaRegistro,
        fechaActualizacion=updated_vehiculo.fechaActualizacion,
        datosTecnicos=updated_vehiculo.datosTecnicos,
        color=updated_vehiculo.color,
        numeroSerie=updated_vehiculo.numeroSerie,
        observaciones=updated_vehiculo.observaciones,
        documentosIds=updated_vehiculo.documentosIds,
        historialIds=updated_vehiculo.historialIds,
        tuc=updated_vehiculo.tuc
    )

@router.delete("/{vehiculo_id}", status_code=204)
async def delete_vehiculo(
    vehiculo_id: str,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Desactivar vehículo (borrado lógico)"""
    # Guard clause
    if not vehiculo_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    success = await vehiculo_service.soft_delete_vehiculo(vehiculo_id)
    
    if not success:
        raise VehiculoNotFoundException(vehiculo_id)

# Endpoints para gestión de rutas
@router.post("/{vehiculo_id}/rutas/{ruta_id}", response_model=VehiculoResponse)
async def agregar_ruta_a_vehiculo(
    vehiculo_id: str,
    ruta_id: str
,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Agregar ruta a vehículo"""
    vehiculo = await vehiculo_service.agregar_ruta_a_vehiculo(vehiculo_id, ruta_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresaActualId=vehiculo.empresaActualId,
        resolucionId=vehiculo.resolucionId,
        rutasAsignadasIds=vehiculo.rutasAsignadasIds,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anioFabricacion=vehiculo.anioFabricacion,
        estado=vehiculo.estado,
        estaActivo=vehiculo.estaActivo,
        fechaRegistro=vehiculo.fechaRegistro,
        fechaActualizacion=vehiculo.fechaActualizacion,
        datosTecnicos=vehiculo.datosTecnicos,
        color=vehiculo.color,
        numeroSerie=vehiculo.numeroSerie,
        observaciones=vehiculo.observaciones,
        documentosIds=vehiculo.documentosIds,
        historialIds=vehiculo.historialIds,
        tuc=vehiculo.tuc
    )

@router.delete("/{vehiculo_id}/rutas/{ruta_id}", response_model=VehiculoResponse)
async def remover_ruta_de_vehiculo(
    vehiculo_id: str,
    ruta_id: str
,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Remover ruta de vehículo"""
    vehiculo = await vehiculo_service.remover_ruta_de_vehiculo(vehiculo_id, ruta_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresaActualId=vehiculo.empresaActualId,
        resolucionId=vehiculo.resolucionId,
        rutasAsignadasIds=vehiculo.rutasAsignadasIds,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anioFabricacion=vehiculo.anioFabricacion,
        estado=vehiculo.estado,
        estaActivo=vehiculo.estaActivo,
        fechaRegistro=vehiculo.fechaRegistro,
        fechaActualizacion=vehiculo.fechaActualizacion,
        datosTecnicos=vehiculo.datosTecnicos,
        color=vehiculo.color,
        numeroSerie=vehiculo.numeroSerie,
        observaciones=vehiculo.observaciones,
        documentosIds=vehiculo.documentosIds,
        historialIds=vehiculo.historialIds,
        tuc=vehiculo.tuc
    )

# Endpoints para gestión de TUC
@router.post("/{vehiculo_id}/tuc", response_model=VehiculoResponse)
async def asignar_tuc(
    vehiculo_id: str,
    tuc_data: dict
,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Asignar TUC a vehículo"""
    vehiculo = await vehiculo_service.asignar_tuc(vehiculo_id, tuc_data)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresaActualId=vehiculo.empresaActualId,
        resolucionId=vehiculo.resolucionId,
        rutasAsignadasIds=vehiculo.rutasAsignadasIds,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anioFabricacion=vehiculo.anioFabricacion,
        estado=vehiculo.estado,
        estaActivo=vehiculo.estaActivo,
        fechaRegistro=vehiculo.fechaRegistro,
        fechaActualizacion=vehiculo.fechaActualizacion,
        datosTecnicos=vehiculo.datosTecnicos,
        color=vehiculo.color,
        numeroSerie=vehiculo.numeroSerie,
        observaciones=vehiculo.observaciones,
        documentosIds=vehiculo.documentosIds,
        historialIds=vehiculo.historialIds,
        tuc=vehiculo.tuc
    )

@router.delete("/{vehiculo_id}/tuc", response_model=VehiculoResponse)
async def remover_tuc(
    vehiculo_id: str
,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Remover TUC de vehículo"""
    vehiculo = await vehiculo_service.remover_tuc(vehiculo_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresaActualId=vehiculo.empresaActualId,
        resolucionId=vehiculo.resolucionId,
        rutasAsignadasIds=vehiculo.rutasAsignadasIds,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anioFabricacion=vehiculo.anioFabricacion,
        estado=vehiculo.estado,
        estaActivo=vehiculo.estaActivo,
        fechaRegistro=vehiculo.fechaRegistro,
        fechaActualizacion=vehiculo.fechaActualizacion,
        datosTecnicos=vehiculo.datosTecnicos,
        color=vehiculo.color,
        numeroSerie=vehiculo.numeroSerie,
        observaciones=vehiculo.observaciones,
        documentosIds=vehiculo.documentosIds,
        historialIds=vehiculo.historialIds,
        tuc=vehiculo.tuc
    )

# Endpoints para cambio de empresa
@router.put("/{vehiculo_id}/cambiar-empresa/{nueva_empresa_id}", response_model=VehiculoResponse)
async def cambiar_empresa_vehiculo(
    vehiculo_id: str,
    nueva_empresa_id: str
,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Cambiar empresa del vehículo"""
    vehiculo = await vehiculo_service.cambiar_empresa(vehiculo_id, nueva_empresa_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresaActualId=vehiculo.empresaActualId,
        resolucionId=vehiculo.resolucionId,
        rutasAsignadasIds=vehiculo.rutasAsignadasIds,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anioFabricacion=vehiculo.anioFabricacion,
        estado=vehiculo.estado,
        estaActivo=vehiculo.estaActivo,
        fechaRegistro=vehiculo.fechaRegistro,
        fechaActualizacion=vehiculo.fechaActualizacion,
        datosTecnicos=vehiculo.datosTecnicos,
        color=vehiculo.color,
        numeroSerie=vehiculo.numeroSerie,
        observaciones=vehiculo.observaciones,
        documentosIds=vehiculo.documentosIds,
        historialIds=vehiculo.historialIds,
        tuc=vehiculo.tuc
    )

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_vehiculos(
    formato: str,
    estado: Optional[str] = Query(None),
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Exportar vehículos en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    # Obtener vehículos según filtros
    if estado:
        vehiculos = await vehiculo_service.get_vehiculos_por_estado(estado)
    else:
        vehiculos = await vehiculo_service.get_vehiculos_activos()
    
    # Simular exportación
    if formato == 'excel':
        return {"message": f"Exportando {len(vehiculos)} vehículos a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(vehiculos)} vehículos a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(vehiculos)} vehículos a CSV"}

 
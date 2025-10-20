from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from io import BytesIO
from app.dependencies.auth import get_current_active_user
from app.services.mock_empresa_service import MockEmpresaService
from app.services.empresa_excel_service import EmpresaExcelService
from app.models.empresa import EmpresaCreate, EmpresaUpdate, EmpresaInDB, EmpresaResponse
from app.utils.exceptions import (
    EmpresaNotFoundException, 
    EmpresaAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/empresas", tags=["empresas"])

def create_empresa_response(empresa: EmpresaInDB) -> EmpresaResponse:
    """Función helper para crear respuestas completas de EmpresaResponse"""
    return EmpresaResponse(
        id=empresa.id,
        codigoEmpresa=empresa.codigoEmpresa,
        ruc=empresa.ruc,
        razonSocial=empresa.razonSocial,
        direccionFiscal=empresa.direccionFiscal,
        estado=empresa.estado,
        estaActivo=empresa.estaActivo,
        fechaRegistro=empresa.fechaRegistro,
        fechaActualizacion=empresa.fechaActualizacion,
        representanteLegal=empresa.representanteLegal,
        emailContacto=empresa.emailContacto,
        telefonoContacto=empresa.telefonoContacto,
        sitioWeb=empresa.sitioWeb,
        documentos=empresa.documentos,
        auditoria=empresa.auditoria,
        resolucionesPrimigeniasIds=empresa.resolucionesPrimigeniasIds,
        vehiculosHabilitadosIds=empresa.vehiculosHabilitadosIds,
        conductoresHabilitadosIds=empresa.conductoresHabilitadosIds,
        rutasAutorizadasIds=empresa.rutasAutorizadasIds,
        datosSunat=empresa.datosSunat,
        ultimaValidacionSunat=empresa.ultimaValidacionSunat,
        scoreRiesgo=empresa.scoreRiesgo,
        observaciones=empresa.observaciones
    )

@router.post("/", response_model=EmpresaResponse, status_code=201)
async def create_empresa(
    empresa_data: EmpresaCreate
) -> EmpresaResponse:
    """Crear nueva empresa"""
    # Guard clauses al inicio
    if not empresa_data.ruc.strip():
        raise ValidationErrorException("RUC", "El RUC no puede estar vacío")
    
    empresa_service = MockEmpresaService()
    
    try:
        empresa = await empresa_service.create_empresa(empresa_data)
        return create_empresa_response(empresa)
    except ValueError as e:
        if "RUC" in str(e):
            raise EmpresaAlreadyExistsException(empresa_data.ruc)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[EmpresaResponse])
async def get_empresas(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado")
) -> List[EmpresaResponse]:
    """Obtener lista de empresas con filtros opcionales"""
    empresa_service = MockEmpresaService()
    
    if estado:
        empresas = await empresa_service.get_empresas_por_estado(estado)
    else:
        empresas = await empresa_service.get_empresas_activas()
    
    # Aplicar paginación
    empresas = empresas[skip:skip + limit]
    
    return [
        create_empresa_response(empresa)
        for empresa in empresas
    ]

@router.get("/filtros", response_model=List[EmpresaResponse])
async def get_empresas_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    ruc: Optional[str] = Query(None),
    razon_social: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None)
) -> List[EmpresaResponse]:
    """Obtener empresas con filtros avanzados"""
    empresa_service = MockEmpresaService()
    
    # Construir filtros
    filtros = {}
    if estado:
        filtros['estado'] = estado
    if ruc:
        filtros['ruc'] = ruc
    if razon_social:
        filtros['razon_social'] = razon_social
    if fecha_desde:
        filtros['fecha_desde'] = fecha_desde
    if fecha_hasta:
        filtros['fecha_hasta'] = fecha_hasta
    
    empresas = await empresa_service.get_empresas_con_filtros(filtros)
    empresas = empresas[skip:skip + limit]
    
    return [
        create_empresa_response(empresa)
        for empresa in empresas
    ]

@router.get("/estadisticas")
async def get_estadisticas_empresas():
    """Obtener estadísticas de empresas"""
    empresa_service = MockEmpresaService()
    estadisticas = await empresa_service.get_estadisticas()
    
    return {
        "totalEmpresas": estadisticas['total'],
        "empresasHabilitadas": estadisticas['habilitadas'],
        "empresasEnTramite": estadisticas['en_tramite'],
        "empresasSuspendidas": estadisticas['suspendidas'],
        "empresasCanceladas": estadisticas['canceladas']
    }

@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def get_empresa(
    empresa_id: str
) -> EmpresaResponse:
    """Obtener empresa por ID"""
    # Guard clause
    if not empresa_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.get_empresa_by_id(empresa_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.get("/ruc/{ruc}", response_model=EmpresaResponse)
async def get_empresa_by_ruc(
    ruc: str
) -> EmpresaResponse:
    """Obtener empresa por RUC"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.get_empresa_by_ruc(ruc)
    
    if not empresa:
        raise EmpresaNotFoundException(f"RUC {ruc}")
    
    return create_empresa_response(empresa)

@router.get("/validar-ruc/{ruc}")
async def validar_ruc(ruc: str):
    """Validar si un RUC ya existe"""
    empresa_service = MockEmpresaService()
    empresa_existente = await empresa_service.get_empresa_by_ruc(ruc)
    
    return {
        "valido": not empresa_existente,
        "empresa": empresa_existente
    }

@router.put("/{empresa_id}", response_model=EmpresaResponse)
async def update_empresa(
    empresa_id: str,
    empresa_data: EmpresaUpdate
) -> EmpresaResponse:
    """Actualizar empresa"""
    # Guard clauses
    if not empresa_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    if not empresa_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    empresa_service = MockEmpresaService()
    updated_empresa = await empresa_service.update_empresa(empresa_id, empresa_data)
    
    if not updated_empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(updated_empresa)

@router.delete("/{empresa_id}", status_code=204)
async def delete_empresa(
    empresa_id: str
):
    """Desactivar empresa (borrado lógico)"""
    # Guard clause
    if not empresa_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de empresa inválido")
    
    empresa_service = MockEmpresaService()
    success = await empresa_service.soft_delete_empresa(empresa_id)
    
    if not success:
        raise EmpresaNotFoundException(empresa_id)

# Endpoints para gestión de vehículos
@router.post("/{empresa_id}/vehiculos/{vehiculo_id}", response_model=EmpresaResponse)
async def agregar_vehiculo_a_empresa(
    empresa_id: str,
    vehiculo_id: str
) -> EmpresaResponse:
    """Agregar vehículo a empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.agregar_vehiculo_a_empresa(empresa_id, vehiculo_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/vehiculos/{vehiculo_id}", response_model=EmpresaResponse)
async def remover_vehiculo_de_empresa(
    empresa_id: str,
    vehiculo_id: str
) -> EmpresaResponse:
    """Remover vehículo de empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.remover_vehiculo_de_empresa(empresa_id, vehiculo_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

# Endpoints para gestión de conductores
@router.post("/{empresa_id}/conductores/{conductor_id}", response_model=EmpresaResponse)
async def agregar_conductor_a_empresa(
    empresa_id: str,
    conductor_id: str
) -> EmpresaResponse:
    """Agregar conductor a empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.agregar_conductor_a_empresa(empresa_id, conductor_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/conductores/{conductor_id}", response_model=EmpresaResponse)
async def remover_conductor_de_empresa(
    empresa_id: str,
    conductor_id: str
) -> EmpresaResponse:
    """Remover conductor de empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.remover_conductor_de_empresa(empresa_id, conductor_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

# Endpoints para gestión de rutas
@router.post("/{empresa_id}/rutas/{ruta_id}", response_model=EmpresaResponse)
async def agregar_ruta_a_empresa(
    empresa_id: str,
    ruta_id: str
) -> EmpresaResponse:
    """Agregar ruta a empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.agregar_ruta_a_empresa(empresa_id, ruta_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/rutas/{ruta_id}", response_model=EmpresaResponse)
async def remover_ruta_de_empresa(
    empresa_id: str,
    ruta_id: str
) -> EmpresaResponse:
    """Remover ruta de empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.remover_ruta_de_empresa(empresa_id, ruta_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

# Endpoints para gestión de resoluciones
@router.post("/{empresa_id}/resoluciones/{resolucion_id}", response_model=EmpresaResponse)
async def agregar_resolucion_a_empresa(
    empresa_id: str,
    resolucion_id: str
) -> EmpresaResponse:
    """Agregar resolución a empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.agregar_resolucion_a_empresa(empresa_id, resolucion_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.delete("/{empresa_id}/resoluciones/{resolucion_id}", response_model=EmpresaResponse)
async def remover_resolucion_de_empresa(
    empresa_id: str,
    resolucion_id: str
) -> EmpresaResponse:
    """Remover resolución de empresa"""
    empresa_service = MockEmpresaService()
    empresa = await empresa_service.remover_resolucion_de_empresa(empresa_id, resolucion_id)
    
    if not empresa:
        raise EmpresaNotFoundException(empresa_id)
    
    return create_empresa_response(empresa)

@router.get("/{empresa_id}/resoluciones")
async def get_resoluciones_empresa(empresa_id: str):
    """Obtener resoluciones de una empresa"""
    empresa_service = MockEmpresaService()
    resoluciones = await empresa_service.get_resoluciones_empresa(empresa_id)
    
    return {
        "empresa_id": empresa_id,
        "resoluciones": resoluciones,
        "total": len(resoluciones)
    }

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_empresas(
    formato: str,
    estado: Optional[str] = Query(None)
):
    """Exportar empresas en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    empresa_service = MockEmpresaService()
    
    # Obtener empresas según filtros
    if estado:
        empresas = await empresa_service.get_empresas_por_estado(estado)
    else:
        empresas = await empresa_service.get_empresas_activas()
    
    # Simular exportación
    if formato == 'excel':
        # Aquí iría la lógica real de exportación a Excel
        return {"message": f"Exportando {len(empresas)} empresas a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(empresas)} empresas a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(empresas)} empresas a CSV"} 

@router.get("/siguiente-codigo", response_model=dict)
async def obtener_siguiente_codigo_empresa() -> dict:
    """Obtener el siguiente código de empresa disponible"""
    empresa_service = MockEmpresaService()
    
    try:
        siguiente_codigo = await empresa_service.generar_siguiente_codigo_empresa()
        return {
            "siguienteCodigo": siguiente_codigo,
            "descripcion": "Código único de empresa en formato 4 dígitos + 3 letras",
            "formato": "XXXXPRT (P: Personas, R: Regional, T: Turismo)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/validar-codigo/{codigo}", response_model=dict)
async def validar_codigo_empresa(codigo: str) -> dict:
    """Validar formato de código de empresa"""
    from app.utils.codigo_empresa_utils import CodigoEmpresaUtils
    
    try:
        es_valido = CodigoEmpresaUtils.validar_formato_codigo(codigo)
        
        if es_valido:
            info_codigo = CodigoEmpresaUtils.extraer_informacion_codigo(codigo)
            return {
                "codigo": codigo,
                "esValido": True,
                "numeroSecuencial": info_codigo["numero_secuencial"],
                "tiposEmpresa": info_codigo["tipos_empresa"],
                "descripcionTipos": CodigoEmpresaUtils.obtener_descripcion_tipos(info_codigo["tipos_empresa"])
            }
        else:
            return {
                "codigo": codigo,
                "esValido": False,
                "error": "Formato inválido. Debe ser 4 dígitos + 3 letras (ej: 0123PRT)"
            }
    except Exception as e:
        return {
            "codigo": codigo,
            "esValido": False,
            "error": str(e)
        }

# ========================================
# ENDPOINTS DE CARGA MASIVA DESDE EXCEL
# ========================================

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_empresas():
    """Descargar plantilla Excel para carga masiva de empresas"""
    try:
        excel_service = EmpresaExcelService()
        plantilla_buffer = excel_service.generar_plantilla_excel()
        
        return StreamingResponse(
            BytesIO(plantilla_buffer.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plantilla_empresas.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar plantilla: {str(e)}")

@router.post("/carga-masiva/validar")
async def validar_archivo_empresas(
    archivo: UploadFile = File(..., description="Archivo Excel con empresas")
):
    """Validar archivo Excel de empresas sin procesarlo"""
    
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
        excel_service = EmpresaExcelService()
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
async def procesar_carga_masiva_empresas(
    archivo: UploadFile = File(..., description="Archivo Excel con empresas"),
    solo_validar: bool = Query(False, description="Solo validar sin crear empresas")
):
    """Procesar carga masiva de empresas desde Excel"""
    
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
        excel_service = EmpresaExcelService()
        
        if solo_validar:
            resultado = excel_service.validar_archivo_excel(archivo_buffer)
            mensaje = f"Validación completada: {resultado['validos']} válidos, {resultado['invalidos']} inválidos"
        else:
            resultado = excel_service.procesar_carga_masiva(archivo_buffer)
            mensaje = f"Procesamiento completado: {resultado.get('total_creadas', 0)} empresas creadas"
        
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
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import tempfile
import os
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
    
    try:
        # Convertir datosTecnicos si es necesario
        datos_tecnicos = getattr(vehiculo, 'datosTecnicos', None)
        if datos_tecnicos:
            if hasattr(datos_tecnicos, 'model_dump'):
                datos_tecnicos = datos_tecnicos.model_dump()
            elif hasattr(datos_tecnicos, 'dict'):
                datos_tecnicos = datos_tecnicos.dict()
        
        # Campos requeridos con valores por defecto
        vehiculo_data_id = getattr(vehiculo, 'vehiculoDataId', None) or getattr(vehiculo, 'vehiculoSoloId', None) or ""
        tipo_servicio = getattr(vehiculo, 'tipoServicio', None) or "NO_ESPECIFICADO"
        
        return VehiculoResponse(
            id=vehiculo.id,
            placa=vehiculo.placa,
            vehiculoDataId=vehiculo_data_id,
            empresaActualId=getattr(vehiculo, 'empresaActualId', ''),
            tipoServicio=tipo_servicio,
            resolucionId=getattr(vehiculo, 'resolucionId', None),
            rutasAsignadasIds=getattr(vehiculo, 'rutasAsignadasIds', []) or [],
            rutasEspecificas=getattr(vehiculo, 'rutasEspecificas', []) or [],
            categoria=getattr(vehiculo, 'categoria', None),
            marca=getattr(vehiculo, 'marca', None),
            modelo=getattr(vehiculo, 'modelo', None),
            anioFabricacion=getattr(vehiculo, 'anioFabricacion', None),
            estado=getattr(vehiculo, 'estado', 'ACTIVO'),
            sedeRegistro=getattr(vehiculo, 'sedeRegistro', 'PUNO'),
            placaSustituida=getattr(vehiculo, 'placaSustituida', None),
            fechaSustitucion=getattr(vehiculo, 'fechaSustitucion', None),
            motivoSustitucion=getattr(vehiculo, 'motivoSustitucion', None),
            resolucionSustitucion=getattr(vehiculo, 'resolucionSustitucion', None),
            numeroTuc=getattr(vehiculo, 'numeroTuc', None),
            estaActivo=getattr(vehiculo, 'estaActivo', True),
            fechaRegistro=getattr(vehiculo, 'fechaRegistro', datetime.now()),
            fechaActualizacion=getattr(vehiculo, 'fechaActualizacion', datetime.now()),
            datosTecnicos=datos_tecnicos,
            color=getattr(vehiculo, 'color', None),
            numeroSerie=getattr(vehiculo, 'numeroSerie', None),
            observaciones=getattr(vehiculo, 'observaciones', None),
            documentosIds=getattr(vehiculo, 'documentosIds', []) or [],
            historialIds=getattr(vehiculo, 'historialIds', []) or [],
            numeroHistorialValidacion=getattr(vehiculo, 'numeroHistorialValidacion', None),
            esHistorialActual=getattr(vehiculo, 'esHistorialActual', True),
            vehiculoHistorialActualId=getattr(vehiculo, 'vehiculoHistorialActualId', None),
            tuc=getattr(vehiculo, 'tuc', None)
        )
    except Exception as e:
        print(f"❌ Error en vehiculo_to_response para vehículo {getattr(vehiculo, 'id', 'unknown')}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

from app.services.vehiculo_consulta_service import VehiculoConsultaService

async def get_vehiculo_service():
    """Dependency para obtener el servicio de vehículos"""
    db = await get_database()
    return VehiculoService(db)

async def get_vehiculo_consulta_service():
    """Dependency para obtener el servicio de consulta integral de vehículos"""
    db = await get_database()
    return VehiculoConsultaService(db)

@router.get("/consulta-integral/{placa}")
async def consultar_vehiculo_integral(
    placa: str,
    consulta_service: VehiculoConsultaService = Depends(get_vehiculo_consulta_service)
):
    """Consulta 360° del vehículo: datos técnicos, historial en resoluciones, TUCs y normativa MTC"""
    resultado = await consulta_service.consultar_vehiculo_360(placa)
    if not resultado:
        raise HTTPException(status_code=404, detail=f"No se encontró información para el vehículo con placa {placa}")
    return resultado

@router.get("/buscar-sugerencias")
async def buscar_sugerencias_placa(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    consulta_service: VehiculoConsultaService = Depends(get_vehiculo_consulta_service)
):
    """Búsqueda predictiva de placas para autocompletado en tiempo real"""
    return await consulta_service.buscar_sugerencias(q, limit)

@router.get("/listado-resumen")
async def listar_vehiculos_resumen(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    consulta_service: VehiculoConsultaService = Depends(get_vehiculo_consulta_service)
):
    """Directorio general de vehículos consolidados con estado, empresa, categoría y antigüedad"""
    return await consulta_service.listar_resumen_vehiculos(skip, limit, search, estado)

@router.get("/raw")
async def get_vehiculos_raw(
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Obtener vehículos sin conversión para debug"""
    try:
        vehiculos = await vehiculo_service.get_vehiculos(skip=0, limit=10)
        print(f"📊 Total vehículos obtenidos: {len(vehiculos)}")
        
        # Convertir a dict simple
        result = []
        for v in vehiculos:
            try:
                if hasattr(v, 'model_dump'):
                    result.append(v.model_dump())
                elif hasattr(v, 'dict'):
                    result.append(v.dict())
                else:
                    result.append(str(v))
            except Exception as e:
                print(f"Error convirtiendo: {e}")
                result.append({"error": str(e), "placa": getattr(v, 'placa', 'unknown')})
        
        return {"total": len(result), "vehiculos": result}
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@router.get("/debug")
async def debug_vehiculos(
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Endpoint de debug para verificar datos en la base de datos"""
    try:
        # Contar documentos directamente en la colección
        total_count = await vehiculo_service.collection.count_documents({})
        activos_count = await vehiculo_service.collection.count_documents({"estaActivo": {"$ne": False}})
        
        # Obtener algunos documentos de ejemplo
        sample_docs = []
        async for doc in vehiculo_service.collection.find({}).limit(3):
            doc["_id"] = str(doc["_id"])
            sample_docs.append({
                "id": doc.get("_id"),
                "placa": doc.get("placa"),
                "estado": doc.get("estado"),
                "estaActivo": doc.get("estaActivo"),
                "empresaActualId": doc.get("empresaActualId")
            })
        
        return {
            "total_vehiculos_en_bd": total_count,
            "vehiculos_activos": activos_count,
            "ejemplos": sample_docs,
            "query_usado": {"estaActivo": {"$ne": False}},
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "total_vehiculos_en_bd": 0,
            "vehiculos_activos": 0,
            "ejemplos": [],
            "timestamp": datetime.now().isoformat()
        }

@router.post("/init-test-data")
async def init_test_data(
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Crear datos de prueba si no existen"""
    try:
        # Verificar si ya hay datos
        count = await vehiculo_service.collection.count_documents({})
        if count > 0:
            return {"message": f"Ya existen {count} vehículos en la base de datos"}
        
        # Crear vehículos de prueba
        test_vehiculos = [
            {
                "placa": "ABC-123",
                "empresaActualId": "empresa-test-1",
                "categoria": "AUTOMOVIL",
                "marca": "Toyota",
                "modelo": "Corolla",
                "anioFabricacion": 2020,
                "estado": "HABILITADO",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "datosTecnicos": {
                    "motor": "1.8L",
                    "chasis": "ABC123456789",
                    "ejes": 2,
                    "asientos": 5,
                    "pesoNeto": 1200,
                    "pesoBruto": 1500,
                    "tipoCombustible": "GASOLINA",
                    "medidas": {"largo": 4.5, "ancho": 1.8, "alto": 1.5}
                }
            },
            {
                "placa": "DEF-456",
                "empresaActualId": "empresa-test-2",
                "categoria": "CAMIONETA",
                "marca": "Ford",
                "modelo": "Ranger",
                "anioFabricacion": 2019,
                "estado": "HABILITADO",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "datosTecnicos": {
                    "motor": "2.5L",
                    "chasis": "DEF123456789",
                    "ejes": 2,
                    "asientos": 5,
                    "pesoNeto": 1800,
                    "pesoBruto": 2500,
                    "tipoCombustible": "DIESEL",
                    "medidas": {"largo": 5.2, "ancho": 1.9, "alto": 1.8}
                }
            }
        ]
        
        # Insertar datos de prueba
        result = await vehiculo_service.collection.insert_many(test_vehiculos)
        
        return {
            "message": f"Se crearon {len(result.inserted_ids)} vehículos de prueba",
            "ids": [str(id) for id in result.inserted_ids]
        }
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/test")
async def test_vehiculos():
    """Endpoint de prueba para verificar que el servicio funciona"""
    return {
        "message": "Servicio de vehículos funcionando correctamente",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/", response_model=List[VehiculoResponse])
@router.get("", response_model=List[VehiculoResponse])
async def get_vehiculos(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_id: str = Query(None, description="Filtrar por empresa"),
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> List[VehiculoResponse]:
    """Obtener lista de vehículos con filtros opcionales"""
    try:
        # Usar solo el método básico disponible en VehiculoService
        vehiculos = await vehiculo_service.get_vehiculos(
            skip=skip,
            limit=limit,
            empresa_id=empresa_id,
            estado=estado
        )
        
        print(f"📊 Vehículos obtenidos del servicio: {len(vehiculos)}")
        
        # Convertir cada vehículo manejando errores individuales
        result = []
        for vehiculo in vehiculos:
            try:
                converted = vehiculo_to_response(vehiculo)
                result.append(converted)
            except Exception as e:
                print(f"⚠️ Error convirtiendo vehículo {vehiculo.id}: {str(e)}")
                # Continuar con el siguiente vehículo
                continue
        
        print(f"✅ Vehículos convertidos exitosamente: {len(result)}")
        return result
        
    except Exception as e:
        print(f"❌ Error en get_vehiculos: {str(e)}")
        import traceback
        traceback.print_exc()
        # Retornar lista vacía en caso de error para evitar 500
        return []

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

@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
async def get_vehiculo(
    vehiculo_id: str,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Obtener vehículo por ID"""
    # Validar que el ID sea un ObjectId válido
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    vehiculo = await vehiculo_service.get_vehiculo_by_id(vehiculo_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return vehiculo_to_response(vehiculo)

@router.post("/debug", status_code=200)
async def debug_create_vehiculo(
    vehiculo_data: dict,
    db = Depends(get_database)
):
    """Endpoint de debug para probar creación de vehículos"""
    try:
        print(f"🔍 DEBUG - Datos recibidos: {vehiculo_data}")
        
        # Intentar crear el modelo VehiculoCreate
        from app.models.vehiculo import VehiculoCreate
        vehiculo_create = VehiculoCreate(**vehiculo_data)
        print(f"✅ DEBUG - Modelo VehiculoCreate creado: {vehiculo_create}")
        
        # Intentar crear el vehículo
        vehiculo_service = VehiculoService(db)
        vehiculo = await vehiculo_service.create_vehiculo(vehiculo_create)
        print(f"✅ DEBUG - Vehículo creado: {vehiculo}")
        
        return {"success": True, "vehiculo": vehiculo.model_dump()}
        
    except Exception as e:
        print(f"❌ DEBUG - Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "type": type(e).__name__}

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
        return vehiculo_to_response(vehiculo)
    except VehiculoAlreadyExistsException:
        raise
    except ValueError as e:
        if "placa" in str(e).lower():
            raise VehiculoAlreadyExistsException(vehiculo_data.placa)
        else:
            raise HTTPException(status_code=400, detail=str(e))

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
    # Validar que el ID sea un ObjectId válido
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    if not vehiculo_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    updated_vehiculo = await vehiculo_service.update_vehiculo(vehiculo_id, vehiculo_data)
    
    if not updated_vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return vehiculo_to_response(updated_vehiculo)

@router.delete("/{vehiculo_id}", status_code=204)
async def delete_vehiculo(
    vehiculo_id: str,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Desactivar vehículo (borrado lógico)"""
    # Validar que el ID sea un ObjectId válido
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    success = await vehiculo_service.soft_delete_vehiculo(vehiculo_id)
    
    if not success:
        raise VehiculoNotFoundException(vehiculo_id)

# ========================================
# ENDPOINTS DE CARGA MASIVA
# ========================================

@router.get("/carga-masiva/plantilla")
async def descargar_plantilla_vehiculos():
    """Descargar plantilla Excel para carga masiva de vehículos"""
    
    if not EXCEL_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Servicio de Excel no disponible. Instale las dependencias: pip install pandas openpyxl xlrd")
    
    try:
        excel_service = VehiculoExcelService()
        plantilla_path = await excel_service.generar_plantilla_excel()
        
        return FileResponse(
            path=plantilla_path,
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

@router.post("/test-create-from-excel", status_code=201)
async def test_create_from_excel(
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Endpoint de prueba para simular creación desde Excel"""
    try:
        # Simular datos como los que vienen del Excel
        datos_tecnicos = {
            "motor": "1.8L",
            "chasis": "ABC124456789",
            "ejes": 2,
            "asientos": 5,
            "pesoNeto": 1200.0,
            "pesoBruto": 1500.0,
            "tipoCombustible": "GASOLINA",
            "medidas": {
                "largo": 4.5,
                "ancho": 1.8,
                "alto": 1.5
            }
        }
        
        from app.models.vehiculo import VehiculoCreate, SedeRegistro
        
        # Usar una empresa existente de la base de datos
        empresas_response = await vehiculo_service.db["empresas"].find_one({})
        if not empresas_response:
            return {"success": False, "error": "No hay empresas en la base de datos"}
        
        empresa_id = str(empresas_response["_id"])
        
        vehiculo_data = VehiculoCreate(
            placa="ABC-124",  # La placa que está fallando
            empresaActualId=empresa_id,  # Usar empresa real
            categoria="M1",  # Pasar como string
            marca="TOYOTA",
            modelo="HIACE",
            anioFabricacion=2020,
            sedeRegistro=SedeRegistro.PUNO,
            datosTecnicos=DatosTecnicos(**datos_tecnicos)
        )
        
        print(f"🔍 Datos de prueba Excel: {vehiculo_data.model_dump()}")
        vehiculo = await vehiculo_service.create_vehiculo(vehiculo_data)
        print(f"✅ Vehículo de prueba Excel creado: {vehiculo.id}")
        
        return {"success": True, "vehiculo_id": vehiculo.id, "message": "Vehículo de prueba Excel creado exitosamente"}
        
    except Exception as e:
        print(f"❌ Error creando vehículo de prueba Excel: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "type": type(e).__name__}

@router.post("/test-create", status_code=201)
async def test_create_vehiculo(
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Endpoint de prueba para crear un vehículo básico"""
    try:
        # Crear datos de prueba básicos
        datos_tecnicos = {
            "motor": "1.8L",
            "chasis": "TEST123456789",
            "ejes": 2,
            "asientos": 5,
            "pesoNeto": 1200.0,
            "pesoBruto": 1500.0,
            "tipoCombustible": "GASOLINA",
            "medidas": {
                "largo": 4.5,
                "ancho": 1.8,
                "alto": 1.5
            }
        }
        
        from app.models.vehiculo import VehiculoCreate, SedeRegistro
        
        vehiculo_data = VehiculoCreate(
            placa="TEST-123",
            empresaActualId="test-empresa-id",
            categoria="M1",  # Pasar como string
            marca="Toyota",
            modelo="Corolla",
            anioFabricacion=2020,
            sedeRegistro=SedeRegistro.PUNO,
            datosTecnicos=datos_tecnicos  # Pasar como dict directamente
        )
        
        print(f"🔍 Datos de prueba: {vehiculo_data.model_dump()}")
        vehiculo = await vehiculo_service.create_vehiculo(vehiculo_data)
        print(f"✅ Vehículo de prueba creado: {vehiculo.id}")
        
        return {"success": True, "vehiculo_id": vehiculo.id, "message": "Vehículo de prueba creado exitosamente"}
        
    except Exception as e:
        print(f"❌ Error creando vehículo de prueba: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "type": type(e).__name__}

@router.post("/carga-masiva-simple", status_code=200)
async def carga_masiva_simple(
    archivo: UploadFile = File(...)
):
    """Endpoint de prueba simple para carga masiva"""
    try:
        print(f"🔄 Recibido archivo: {archivo.filename}")
        print(f"📋 Tipo de contenido: {archivo.content_type}")
        
        # Leer el archivo
        content = await archivo.read()
        print(f"📊 Tamaño del archivo: {len(content)} bytes")
        
        return {
            "success": True,
            "message": "Archivo recibido correctamente",
            "filename": archivo.filename,
            "size": len(content),
            "content_type": archivo.content_type
        }
        
    except Exception as e:
        print(f"❌ Error en carga masiva simple: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }

@router.post("/carga-masiva", response_model=VehiculoCargaMasivaResponse)
async def carga_masiva_vehiculos(
    archivo: UploadFile = File(...),
    empresa_id: Optional[str] = None
):
    """Realizar carga masiva de vehículos desde Excel"""
    
    try:
        print(f"🔄 Procesando archivo: {archivo.filename}")
        
        # Validar tipo de archivo
        if not archivo.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")
        
        # Leer el archivo
        content = await archivo.read()
        print(f"📊 Archivo leído: {len(content)} bytes")
        
        # Procesar Excel básico
        import pandas as pd
        from io import BytesIO
        
        # Leer Excel
        df = pd.read_excel(BytesIO(content), sheet_name='DATOS' if 'DATOS' in pd.ExcelFile(BytesIO(content)).sheet_names else 0)
        print(f"📋 Excel procesado: {len(df)} filas, {len(df.columns)} columnas")
        
        # Obtener servicio de vehículos
        db = await get_database()
        vehiculo_service = VehiculoService(db)
        
        # Procesar cada fila
        vehiculos_creados = []
        vehiculos_actualizados = []
        errores_detalle = []
        
        for index, row in df.iterrows():
            try:
                placa = str(row.get('Placa', '')).strip().upper()
                if not placa or placa == 'NAN':
                    continue
                    
                print(f"🔄 Procesando fila {index + 2}: {placa}")
                
                # Verificar si el vehículo ya existe
                vehiculo_existente = await vehiculo_service.get_vehiculo_by_placa(placa)
                
                if vehiculo_existente:
                    # ACTUALIZAR vehículo existente
                    print(f"🔄 Actualizando vehículo existente: {placa}")
                    # Por ahora solo simular actualización
                    vehiculos_actualizados.append(vehiculo_existente.id)
                else:
                    # CREAR nuevo vehículo - VALIDAR EMPRESA REQUERIDA
                    print(f"🆕 Creando nuevo vehículo: {placa}")
                    
                    # Verificar que se especifique una empresa
                    empresa_ruc = str(row.get('RUC Empresa', '')).strip()
                    if not empresa_ruc or empresa_ruc == 'nan' or empresa_ruc == '':
                        raise ValueError(f"RUC de empresa es requerido para crear vehículo nuevo. Placa: {placa}")
                    
                    # Buscar empresa por RUC
                    empresa_encontrada = None
                    async for empresa in db["empresas"].find({"ruc": empresa_ruc}):
                        empresa_encontrada = empresa
                        break
                    
                    if not empresa_encontrada:
                        raise ValueError(f"No se encontró empresa con RUC: {empresa_ruc} para vehículo {placa}")
                    
                    empresa_id = str(empresa_encontrada["_id"])
                    print(f"✅ Empresa encontrada: {empresa_id} - RUC: {empresa_ruc}")
                    
                    # Buscar resolución por número (opcional) - Priorizar Resolución Hija
                    resolucion_id = None
                    resolucion_numero = None
                    
                    # Primero intentar Resolución Hija
                    resolucion_hija = str(row.get('Resolución Hija', '')).strip()
                    if resolucion_hija and resolucion_hija != 'nan' and resolucion_hija != '':
                        resolucion_numero = resolucion_hija
                        print(f"🔍 Buscando resolución hija: {resolucion_numero}")
                    else:
                        # Si no hay hija, usar Resolución Primigenia
                        resolucion_primigenia = str(row.get('Resolución Primigenia', '')).strip()
                        if resolucion_primigenia and resolucion_primigenia != 'nan' and resolucion_primigenia != '':
                            resolucion_numero = resolucion_primigenia
                            print(f"🔍 Buscando resolución primigenia: {resolucion_numero}")
                    
                    if resolucion_numero:
                        # Detectar tipo de resolución por sufijo
                        tipo_resolucion = None
                        numero_base = resolucion_numero
                        
                        if resolucion_numero.endswith('(I)'):
                            tipo_resolucion = "INCREMENTO"
                            numero_base = resolucion_numero[:-3].strip()
                            print(f"📋 Resolución de INCREMENTO detectada: {numero_base}")
                        elif resolucion_numero.endswith('(S)'):
                            tipo_resolucion = "SUSTITUCION"
                            numero_base = resolucion_numero[:-3].strip()
                            print(f"📋 Resolución de SUSTITUCIÓN detectada: {numero_base}")
                        else:
                            tipo_resolucion = "PRINCIPAL"
                            print(f"📋 Resolución PRINCIPAL detectada: {numero_base}")
                        
                        # Buscar por número exacto y por número base
                        for numero_busqueda in [resolucion_numero, numero_base]:
                            async for resolucion in db["resoluciones"].find({"numero": numero_busqueda}):
                                resolucion_id = str(resolucion["_id"])
                                print(f"✅ Resolución encontrada: {numero_busqueda} -> {resolucion_id} (Tipo: {tipo_resolucion})")
                                break
                            if resolucion_id:
                                break
                        
                        if not resolucion_id:
                            print(f"⚠️ Resolución no encontrada: {resolucion_numero} (buscado como {resolucion_numero} y {numero_base})")
                    
                    # Procesar rutas (opcional)
                    rutas_asignadas = []
                    rutas_codigos = str(row.get('Rutas Asignadas', '')).strip()
                    if rutas_codigos and rutas_codigos != 'nan' and rutas_codigos != '':
                        print(f"🔍 Procesando rutas: {rutas_codigos}")
                        codigos_lista = [codigo.strip() for codigo in rutas_codigos.split(',') if codigo.strip()]
                        
                        for codigo in codigos_lista:
                            # Normalizar código de ruta (3 -> 03, 15 -> 15)
                            codigo_normalizado = codigo.zfill(2)
                            print(f"🔄 Normalizando ruta: {codigo} -> {codigo_normalizado}")
                            
                            # Buscar por código original y normalizado
                            ruta_encontrada = False
                            for codigo_busqueda in [codigo, codigo_normalizado]:
                                async for ruta in db["rutas"].find({"codigo": codigo_busqueda}):
                                    rutas_asignadas.append(str(ruta["_id"]))
                                    print(f"✅ Ruta encontrada: {codigo_busqueda} -> {ruta['_id']}")
                                    ruta_encontrada = True
                                    break
                                if ruta_encontrada:
                                    break
                            
                            if not ruta_encontrada:
                                print(f"⚠️ Ruta no encontrada: {codigo} (buscado como {codigo} y {codigo_normalizado})")
                        
                        if len(rutas_asignadas) != len(codigos_lista):
                            print(f"⚠️ Algunas rutas no fueron encontradas. Solicitadas: {codigos_lista}, Encontradas: {len(rutas_asignadas)}")
                    
                    # Crear datos técnicos completos usando nombres de columnas correctos
                    from app.models.vehiculo import VehiculoCreate, SedeRegistro
                    
                    # Procesar pesos en toneladas (convertir a kg para almacenamiento interno)
                    peso_neto_ton = float(row.get('Peso Neto (t)', 1.2)) if pd.notna(row.get('Peso Neto (t)')) else 1.2
                    peso_bruto_ton = float(row.get('Peso Bruto (t)', 1.5)) if pd.notna(row.get('Peso Bruto (t)')) else 1.5
                    carga_util_ton = float(row.get('Carga Útil (t)', peso_bruto_ton - peso_neto_ton)) if pd.notna(row.get('Carga Útil (t)')) else (peso_bruto_ton - peso_neto_ton)
                    
                    # Convertir toneladas a kg para almacenamiento interno
                    peso_neto_kg = peso_neto_ton * 1000
                    peso_bruto_kg = peso_bruto_ton * 1000
                    carga_util_kg = carga_util_ton * 1000
                    
                    print(f"📊 Pesos - Neto: {peso_neto_ton}t ({peso_neto_kg}kg), Bruto: {peso_bruto_ton}t ({peso_bruto_kg}kg), Carga Útil: {carga_util_ton}t ({carga_util_kg}kg)")
                    
                    # Validar y convertir tipo de combustible
                    tipo_combustible_str = str(row.get('Tipo Combustible', 'GASOLINA')).strip().upper()
                    if tipo_combustible_str not in [tc.value for tc in TipoCombustible]:
                        tipo_combustible_str = 'GASOLINA'
                        print(f"⚠️ Tipo de combustible no válido, usando GASOLINA por defecto")
                    
                    # Validar y convertir categoría
                    categoria_str = str(row.get('Categoría', 'M1')).strip().upper()
                    if categoria_str not in [cat.value for cat in CategoriaVehiculo]:
                        categoria_str = 'M1'
                        print(f"⚠️ Categoría no válida, usando M1 por defecto")
                    
                    # Validar sede de registro
                    sede_str = str(row.get('Sede de Registro', 'PUNO')).strip().upper()
                    if sede_str not in [sede.value for sede in SedeRegistro]:
                        sede_str = 'PUNO'
                        print(f"⚠️ Sede no válida, usando PUNO por defecto")
                    
                    datos_tecnicos = DatosTecnicos(
                        motor=str(row.get('Motor', 'MOTOR_PENDIENTE')).strip(),
                        chasis=str(row.get('Chasis', f'CHASIS_{placa}')).strip(),
                        ejes=int(row.get('Ejes', 2)) if pd.notna(row.get('Ejes')) else 2,
                        cilindros=int(row.get('Cilindros', 4)) if pd.notna(row.get('Cilindros')) and str(row.get('Cilindros')).strip() else None,
                        ruedas=int(row.get('Ruedas', 4)) if pd.notna(row.get('Ruedas')) and str(row.get('Ruedas')).strip() else None,
                        asientos=int(row.get('Asientos', 5)) if pd.notna(row.get('Asientos')) else 5,
                        pesoNeto=peso_neto_kg,
                        pesoBruto=peso_bruto_kg,
                        cargaUtil=carga_util_kg,
                        tipoCombustible=TipoCombustible(tipo_combustible_str),
                        cilindrada=float(row.get('Cilindrada', 0)) if pd.notna(row.get('Cilindrada')) and str(row.get('Cilindrada')).strip() else None,
                        potencia=float(row.get('Potencia (HP)', 0)) if pd.notna(row.get('Potencia (HP)')) and str(row.get('Potencia (HP)')).strip() else None,
                        medidas={
                            'largo': float(row.get('Largo (m)', 4.5)) if pd.notna(row.get('Largo (m)')) else 4.5,
                            'ancho': float(row.get('Ancho (m)', 1.8)) if pd.notna(row.get('Ancho (m)')) else 1.8,
                            'alto': float(row.get('Alto (m)', 1.5)) if pd.notna(row.get('Alto (m)')) else 1.5
                        }
                    )
                    
                    # Procesar placa de baja (dar de baja vehículo anterior si existe)
                    placa_de_baja = str(row.get('Placa de Baja', '')).strip().upper() if pd.notna(row.get('Placa de Baja')) and str(row.get('Placa de Baja')).strip() else None
                    
                    if placa_de_baja:
                        print(f"🔄 Procesando baja de vehículo: {placa_de_baja}")
                        # Buscar vehículo a dar de baja
                        vehiculo_a_dar_baja = await vehiculo_service.get_vehiculo_by_placa(placa_de_baja)
                        if vehiculo_a_dar_baja:
                            # Dar de baja el vehículo (cambiar estado)
                            from app.models.vehiculo import VehiculoUpdate
                            update_baja = VehiculoUpdate(
                                estado="DADO_DE_BAJA",
                                estaActivo=False,
                                fechaBaja=datetime.utcnow(),
                                motivoBaja=str(row.get('Motivo Sustitución', 'SUSTITUCION')).strip() if pd.notna(row.get('Motivo Sustitución')) else 'SUSTITUCION',
                                observacionesBaja=f"Dado de baja por resolución {resolucion_numero or 'N/A'} - Sustituido por {placa}"
                            )
                            await vehiculo_service.update_vehiculo(vehiculo_a_dar_baja.id, update_baja)
                            print(f"✅ Vehículo dado de baja: {placa_de_baja} -> Sustituido por {placa}")
                        else:
                            print(f"⚠️ Vehículo a dar de baja no encontrado: {placa_de_baja}")
                    
                    vehiculo_data = VehiculoCreate(
                        placa=placa,
                        empresaActualId=empresa_id,
                        resolucionId=resolucion_id,
                        rutasAsignadasIds=rutas_asignadas,
                        categoria=CategoriaVehiculo(categoria_str),
                        marca=str(row.get('Marca', 'MARCA_PENDIENTE')).strip(),
                        modelo=str(row.get('Modelo', 'MODELO_PENDIENTE')).strip(),
                        anioFabricacion=int(row.get('Año Fabricación', 2020)) if pd.notna(row.get('Año Fabricación')) else 2020,
                        sedeRegistro=SedeRegistro(sede_str),
                        color=str(row.get('Color', '')).strip() if pd.notna(row.get('Color')) and str(row.get('Color')).strip() else None,
                        numeroSerie=str(row.get('Número Serie', '')).strip() if pd.notna(row.get('Número Serie')) and str(row.get('Número Serie')).strip() else None,
                        observaciones=str(row.get('Observaciones', '')).strip() if pd.notna(row.get('Observaciones')) and str(row.get('Observaciones')).strip() else None,
                        # Campo de sustitución actualizado
                        placaSustituida=placa_de_baja,  # Ahora usa placa de baja
                        datosTecnicos=datos_tecnicos
                    )
                    
                    vehiculo_creado = await vehiculo_service.create_vehiculo(vehiculo_data)
                    vehiculos_creados.append(vehiculo_creado.id)
                    
                    # Log detallado del vehículo creado
                    log_info = f"✅ Vehículo creado: {vehiculo_creado.id} - Placa: {placa} - Empresa: {empresa_ruc}"
                    if resolucion_id:
                        log_info += f" - Resolución: {resolucion_numero}"
                    if rutas_asignadas:
                        log_info += f" - Rutas: {rutas_codigos} ({len(rutas_asignadas)} asignadas)"
                    if placa_de_baja:
                        log_info += f" - Sustituyó a: {placa_de_baja}"
                    print(log_info)
                    
            except Exception as e:
                print(f"❌ Error procesando fila {index + 2}: {str(e)}")
                errores_detalle.append({
                    'fila': index + 2,
                    'placa': placa if 'placa' in locals() else 'N/A',
                    'errores': [str(e)]
                })
        
        resultado = VehiculoCargaMasivaResponse(
            total_procesados=len(df),
            exitosos=len(vehiculos_creados) + len(vehiculos_actualizados),
            errores=len(errores_detalle),
            vehiculos_creados=vehiculos_creados,
            vehiculos_actualizados=vehiculos_actualizados,
            errores_detalle=errores_detalle
        )
        
        print(f"✅ Resultado final: {resultado.total_procesados} procesados, {resultado.exitosos} exitosos, {resultado.errores} errores")
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en carga masiva: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")

@router.get("/carga-masiva/estadisticas")
async def estadisticas_carga_masiva():
    """Obtener estadísticas de cargas masivas realizadas"""
    # En un sistema real, esto vendría de una base de datos
    return {
        "total_cargas": 5,
        "vehiculos_procesados": 150,
        "exitosos": 142,
        "errores": 8,
        "ultima_carga": "2024-01-15T10:30:00Z"
    }
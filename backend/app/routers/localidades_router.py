from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from fastapi.responses import StreamingResponse
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies.db import get_database
from app.services.localidad_service import LocalidadService
from app.models.localidad import (
    Localidad, LocalidadCreate, LocalidadUpdate, LocalidadResponse,
    FiltroLocalidades, LocalidadesPaginadas, TipoLocalidad,
    ValidacionUbigeo, RespuestaValidacionUbigeo
)

router = APIRouter(prefix="/localidades", tags=["localidades"])

async def get_localidad_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> LocalidadService:
    return LocalidadService(db)

@router.post("/", response_model=LocalidadResponse, status_code=201)
async def crear_localidad(
    localidad_data: LocalidadCreate,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Crear una nueva localidad"""
    try:
        localidad = await service.create_localidad(localidad_data)
        return LocalidadResponse(**localidad.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/", response_model=List[LocalidadResponse])
async def obtener_localidades(
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    tipo: Optional[TipoLocalidad] = Query(None, description="Filtrar por tipo"),
    departamento: Optional[str] = Query(None, description="Filtrar por departamento"),
    provincia: Optional[str] = Query(None, description="Filtrar por provincia"),
    esta_activa: Optional[bool] = Query(None, description="Filtrar por estado"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Obtener localidades con filtros opcionales"""
    try:
        filtros = FiltroLocalidades(
            nombre=nombre,
            tipo=tipo,
            departamento=departamento,
            provincia=provincia,
            estaActiva=esta_activa
        )
        
        localidades = await service.get_localidades(filtros, skip, limit)
        return [LocalidadResponse(**localidad.model_dump()) for localidad in localidades]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error obteniendo localidades")

@router.get("/paginadas", response_model=LocalidadesPaginadas)
async def obtener_localidades_paginadas(
    pagina: int = Query(1, ge=1, description="Número de página"),
    limite: int = Query(10, ge=1, le=100, description="Registros por página"),
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    tipo: Optional[TipoLocalidad] = Query(None, description="Filtrar por tipo"),
    departamento: Optional[str] = Query(None, description="Filtrar por departamento"),
    provincia: Optional[str] = Query(None, description="Filtrar por provincia"),
    esta_activa: Optional[bool] = Query(None, description="Filtrar por estado"),
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadesPaginadas:
    """Obtener localidades paginadas"""
    try:
        filtros = FiltroLocalidades(
            nombre=nombre,
            tipo=tipo,
            departamento=departamento,
            provincia=provincia,
            estaActiva=esta_activa
        )
        
        return await service.get_localidades_paginadas(pagina, limite, filtros)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error obteniendo localidades paginadas")

@router.get("/activas", response_model=List[LocalidadResponse])
async def obtener_localidades_activas(
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Obtener solo localidades activas"""
    try:
        localidades = await service.get_localidades_activas()
        return [LocalidadResponse(**localidad.model_dump()) for localidad in localidades]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error obteniendo localidades activas")

@router.get("/buscar", response_model=List[LocalidadResponse])
async def buscar_localidades(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Buscar localidades por término"""
    try:
        localidades = await service.buscar_localidades(q)
        return [LocalidadResponse(**localidad.model_dump()) for localidad in localidades]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error en la búsqueda")

@router.get("/{localidad_id}", response_model=LocalidadResponse)
async def obtener_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Obtener localidad por ID"""
    try:
        localidad = await service.get_localidad_by_id(localidad_id)
        if not localidad:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return LocalidadResponse(**localidad.model_dump())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error obteniendo localidad")

@router.put("/{localidad_id}", response_model=LocalidadResponse)
async def actualizar_localidad(
    localidad_id: str,
    localidad_data: LocalidadUpdate,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Actualizar localidad"""
    try:
        localidad = await service.update_localidad(localidad_id, localidad_data)
        if not localidad:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return LocalidadResponse(**localidad.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error actualizando localidad")

@router.delete("/{localidad_id}")
async def eliminar_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Eliminar (desactivar) localidad"""
    try:
        success = await service.delete_localidad(localidad_id)
        if not success:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return {"message": "Localidad eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error eliminando localidad")

@router.patch("/{localidad_id}/toggle-estado", response_model=LocalidadResponse)
async def toggle_estado_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Cambiar estado activo/inactivo de localidad"""
    try:
        localidad = await service.toggle_estado_localidad(localidad_id)
        if not localidad:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return LocalidadResponse(**localidad.model_dump())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error cambiando estado de localidad")

@router.post("/validar-ubigeo", response_model=RespuestaValidacionUbigeo)
async def validar_ubigeo_unico(
    validacion: ValidacionUbigeo,
    service: LocalidadService = Depends(get_localidad_service)
) -> RespuestaValidacionUbigeo:
    """Validar que un UBIGEO sea único"""
    try:
        es_unico = await service.validar_ubigeo_unico(validacion.ubigeo, validacion.idExcluir)
        return RespuestaValidacionUbigeo(
            valido=es_unico,
            mensaje="UBIGEO disponible" if es_unico else "UBIGEO ya existe"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error validando UBIGEO")

@router.get("/{origen_id}/distancia/{destino_id}")
async def calcular_distancia(
    origen_id: str,
    destino_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Calcular distancia entre dos localidades"""
    try:
        distancia = await service.calcular_distancia(origen_id, destino_id)
        return {"distancia": distancia, "unidad": "km"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error calculando distancia")

@router.post("/inicializar")
async def inicializar_localidades_default(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Inicializar localidades por defecto"""
    try:
        localidades = await service.inicializar_localidades_default()
        return {
            "message": "Localidades inicializadas exitosamente",
            "count": len(localidades)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error inicializando localidades")

@router.post("/importar-excel")
async def importar_localidades_excel(
    file: UploadFile = File(...),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Importar localidades desde archivo Excel"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="El archivo debe ser Excel (.xlsx o .xls)")
        
        # Leer archivo Excel
        import pandas as pd
        import io
        
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validar columnas requeridas
        columnas_requeridas = ['departamento', 'provincia', 'distrito', 'municipalidad_centro_poblado', 'nivel_territorial']
        columnas_faltantes = [col for col in columnas_requeridas if col not in df.columns]
        
        if columnas_faltantes:
            raise HTTPException(
                status_code=400, 
                detail=f"Faltan columnas requeridas: {', '.join(columnas_faltantes)}"
            )
        
        # Procesar localidades
        localidades_creadas = 0
        errores = []
        
        for index, row in df.iterrows():
            try:
                # Crear datos de localidad
                localidad_data = {
                    'departamento': str(row['departamento']).upper(),
                    'provincia': str(row['provincia']).upper(),
                    'distrito': str(row['distrito']).upper(),
                    'municipalidad_centro_poblado': str(row['municipalidad_centro_poblado']),
                    'nivel_territorial': str(row['nivel_territorial']).upper()
                }
                
                # Campos opcionales
                if 'ubigeo' in df.columns and pd.notna(row['ubigeo']):
                    localidad_data['ubigeo'] = str(row['ubigeo']).zfill(6)
                
                if 'ubigeo_identificador_mcp' in df.columns and pd.notna(row['ubigeo_identificador_mcp']):
                    localidad_data['ubigeo_identificador_mcp'] = str(row['ubigeo_identificador_mcp'])
                
                if 'dispositivo_legal_creacion' in df.columns and pd.notna(row['dispositivo_legal_creacion']):
                    localidad_data['dispositivo_legal_creacion'] = str(row['dispositivo_legal_creacion'])
                
                if 'nombre' in df.columns and pd.notna(row['nombre']):
                    localidad_data['nombre'] = str(row['nombre'])
                
                if 'codigo' in df.columns and pd.notna(row['codigo']):
                    localidad_data['codigo'] = str(row['codigo'])
                
                if 'tipo' in df.columns and pd.notna(row['tipo']):
                    localidad_data['tipo'] = str(row['tipo']).upper()
                
                if 'descripcion' in df.columns and pd.notna(row['descripcion']):
                    localidad_data['descripcion'] = str(row['descripcion'])
                
                # Coordenadas
                if 'latitud' in df.columns and 'longitud' in df.columns:
                    if pd.notna(row['latitud']) and pd.notna(row['longitud']):
                        localidad_data['coordenadas'] = {
                            'latitud': float(row['latitud']),
                            'longitud': float(row['longitud'])
                        }
                
                # Crear localidad
                localidad_create = LocalidadCreate(**localidad_data)
                await service.create_localidad(localidad_create)
                localidades_creadas += 1
                
            except Exception as e:
                errores.append(f"Fila {index + 2}: {str(e)}")
        
        return {
            "message": "Importación completada",
            "localidades_creadas": localidades_creadas,
            "errores": errores[:10],  # Mostrar solo los primeros 10 errores
            "total_errores": len(errores)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")

@router.get("/exportar-excel")
async def exportar_localidades_excel(
    service: LocalidadService = Depends(get_localidad_service)
) -> StreamingResponse:
    """Exportar localidades a archivo Excel"""
    try:
        import pandas as pd
        import io
        from fastapi.responses import StreamingResponse
        
        # Obtener todas las localidades
        localidades = await service.get_localidades()
        
        # Convertir a DataFrame
        data = []
        for localidad in localidades:
            row = {
                'id': localidad.id,
                'ubigeo': localidad.ubigeo or '',
                'ubigeo_identificador_mcp': localidad.ubigeo_identificador_mcp or '',
                'departamento': localidad.departamento,
                'provincia': localidad.provincia,
                'distrito': localidad.distrito,
                'municipalidad_centro_poblado': localidad.municipalidad_centro_poblado,
                'nivel_territorial': localidad.nivel_territorial.value if localidad.nivel_territorial else '',
                'dispositivo_legal_creacion': localidad.dispositivo_legal_creacion or '',
                'nombre': localidad.nombre or '',
                'codigo': localidad.codigo or '',
                'tipo': localidad.tipo.value if localidad.tipo else '',
                'descripcion': localidad.descripcion or '',
                'observaciones': localidad.observaciones or '',
                'latitud': localidad.coordenadas.latitud if localidad.coordenadas else '',
                'longitud': localidad.coordenadas.longitud if localidad.coordenadas else '',
                'esta_activa': localidad.estaActiva,
                'fecha_creacion': localidad.fechaCreacion.strftime('%Y-%m-%d %H:%M:%S'),
                'fecha_actualizacion': localidad.fechaActualizacion.strftime('%Y-%m-%d %H:%M:%S')
            }
            data.append(row)
        
        df = pd.DataFrame(data)
        
        # Crear archivo Excel en memoria
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Localidades', index=False)
        
        output.seek(0)
        
        # Generar nombre de archivo con timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"localidades_{timestamp}.xlsx"
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exportando localidades: {str(e)}")

@router.post("/operaciones-masivas")
async def operaciones_masivas_localidades(
    operacion: str = Query(..., description="Tipo de operación: activar, desactivar, eliminar"),
    ids: List[str] = Query(..., description="Lista de IDs de localidades"),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Realizar operaciones masivas en localidades"""
    try:
        if operacion not in ['activar', 'desactivar', 'eliminar']:
            raise HTTPException(status_code=400, detail="Operación no válida")
        
        procesadas = 0
        errores = []
        
        for localidad_id in ids:
            try:
                if operacion == 'eliminar':
                    success = await service.delete_localidad(localidad_id)
                    if success:
                        procesadas += 1
                elif operacion in ['activar', 'desactivar']:
                    localidad = await service.get_localidad_by_id(localidad_id)
                    if localidad:
                        nuevo_estado = operacion == 'activar'
                        if localidad.estaActiva != nuevo_estado:
                            await service.toggle_estado_localidad(localidad_id)
                        procesadas += 1
            except Exception as e:
                errores.append(f"ID {localidad_id}: {str(e)}")
        
        return {
            "message": f"Operación '{operacion}' completada",
            "procesadas": procesadas,
            "errores": errores,
            "total_errores": len(errores)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en operación masiva: {str(e)}")
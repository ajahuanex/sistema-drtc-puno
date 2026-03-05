from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from fastapi.responses import StreamingResponse
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import logging

from app.dependencies.db import get_database
from app.services.localidad_service import LocalidadService
from app.models.localidad import (
    Localidad, LocalidadCreate, LocalidadUpdate, LocalidadResponse,
    FiltroLocalidades, LocalidadesPaginadas, TipoLocalidad,
    ValidacionUbigeo, RespuestaValidacionUbigeo
)

router = APIRouter(prefix="/localidades", tags=["localidades"])
logger = logging.getLogger(__name__)

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
    limit: int = Query(10000, ge=1, le=20000, description="Número máximo de registros"),
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Obtener localidades con filtros opcionales"""
    try:
        # Verificar si hay localidades en la base de datos
        count = await service.collection.count_documents({})
        
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
        print(f"Error en obtener_localidades: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

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
    limite: int = Query(50, ge=1, le=200, description="Límite de resultados"),
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """
    Buscar localidades por término con jerarquía territorial
    
    La búsqueda prioriza:
    - Coincidencia exacta en nombre
    - Nombre que empieza con el término
    - Jerarquía: Departamento > Provincia > Distrito > Centro Poblado
    - Coincidencias en departamento, provincia, distrito
    """
    try:
        localidades = await service.buscar_localidades(q, limite)
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

@router.get("/{localidad_id}/verificar-uso")
async def verificar_uso_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Verificar si una localidad está siendo usada en rutas"""
    try:
        uso = await service._verificar_localidad_en_uso(localidad_id)
        rutas = await service.obtener_rutas_que_usan_localidad(localidad_id)
        
        return {
            "localidad_id": localidad_id,
            "esta_en_uso": uso['esta_en_uso'],
            "total_rutas": uso['total'],
            "detalle": {
                "como_origen": uso['como_origen'],
                "como_destino": uso['como_destino'],
                "en_itinerario": uso['en_itinerario']
            },
            "rutas": rutas,
            "puede_eliminar": not uso['esta_en_uso'],
            "mensaje": "La localidad está siendo usada en rutas y no puede ser eliminada" if uso['esta_en_uso'] else "La localidad puede ser eliminada"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verificando uso de localidad: {str(e)}")

@router.delete("/{localidad_id}")
async def eliminar_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Eliminar (desactivar) localidad - Solo si no está en uso"""
    try:
        success = await service.delete_localidad(localidad_id)
        if not success:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return {"message": "Localidad eliminada exitosamente"}
    except ValueError as e:
        # Error de validación (localidad en uso)
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando localidad: {str(e)}")

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
async def inicializar_localidades_sistema(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Inicializar localidades básicas del sistema"""
    try:
        localidades = await service.inicializar_localidades_default()
        
        return {
            "message": "Inicialización completada exitosamente",
            "localidades_creadas": len(localidades),
            "localidades": [
                {
                    "id": str(loc.id),
                    "nombre": loc.nombre,
                    "tipo": loc.tipo,
                    "departamento": loc.departamento,
                    "provincia": loc.provincia,
                    "distrito": loc.distrito
                } for loc in localidades
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inicializando localidades: {str(e)}")

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

# ========================================
# 🏘️ ENDPOINTS PARA CENTROS POBLADOS
# ========================================
# NOTA: Los endpoints duplicados de toggle-estado y eliminar fueron removidos
# Las implementaciones originales están en las líneas 194 y 175

@router.post("/importar-centros-poblados-inei")
async def importar_centros_poblados_inei(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Importar centros poblados desde INEI"""
    try:
        # Importar el script de importación
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))
        
        from importar_centros_poblados import ImportadorCentrosPoblados
        
        async with ImportadorCentrosPoblados() as importador:
            resultado = await importador.importar_desde_inei()
            return resultado
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importando desde INEI: {str(e)}")

@router.post("/importar-centros-poblados-reniec")
async def importar_centros_poblados_reniec(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Importar centros poblados desde RENIEC"""
    try:
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))
        
        from importar_centros_poblados import ImportadorCentrosPoblados
        
        async with ImportadorCentrosPoblados() as importador:
            resultado = await importador.importar_desde_reniec()
            return resultado
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importando desde RENIEC: {str(e)}")

@router.post("/sincronizar-oficial")
async def sincronizar_con_base_datos_oficial(
    fuente: str = Query(..., description="Fuente: INEI, RENIEC, MUNICIPALIDAD"),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Sincronizar con base de datos oficial"""
    try:
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))
        
        from importar_centros_poblados import ImportadorCentrosPoblados
        
        async with ImportadorCentrosPoblados() as importador:
            if fuente.upper() == 'INEI':
                resultado = await importador.importar_desde_inei()
            elif fuente.upper() == 'RENIEC':
                resultado = await importador.importar_desde_reniec()
            elif fuente.upper() == 'MUNICIPALIDAD':
                resultado = await importador.importar_desde_municipalidad()
            else:
                raise HTTPException(status_code=400, detail="Fuente no válida")
            
            return resultado
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sincronizando con {fuente}: {str(e)}")

@router.get("/centros-poblados/distrito/{distrito_id}")
async def obtener_centros_poblados_por_distrito(
    distrito_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Obtener centros poblados de un distrito específico"""
    try:
        # Obtener el distrito
        distrito = await service.get_localidad_by_id(distrito_id)
        if not distrito:
            raise HTTPException(status_code=404, detail="Distrito no encontrado")
        
        # Buscar centros poblados del distrito
        filtros = FiltroLocalidades(
            tipo=TipoLocalidad.CENTRO_POBLADO,
            distrito=distrito.distrito,
            estaActiva=True
        )
        
        centros_poblados = await service.get_localidades(filtros)
        return [LocalidadResponse(**cp.model_dump()) for cp in centros_poblados]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo centros poblados: {str(e)}")

@router.get("/estadisticas-centros-poblados")
async def obtener_estadisticas_centros_poblados(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Obtener estadísticas de centros poblados"""
    try:
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'scripts'))
        
        from importar_centros_poblados import ImportadorCentrosPoblados
        
        async with ImportadorCentrosPoblados() as importador:
            estadisticas = await importador.obtener_estadisticas()
            return estadisticas
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")

@router.post("/validar-limpiar-centros-poblados")
async def validar_y_limpiar_centros_poblados(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Validar y limpiar datos de centros poblados"""
    try:
        # Obtener todos los centros poblados
        filtros = FiltroLocalidades(tipo=TipoLocalidad.CENTRO_POBLADO)
        centros_poblados = await service.get_localidades(filtros)
        
        procesados = 0
        corregidos = 0
        eliminados = 0
        errores = []
        
        for cp in centros_poblados:
            try:
                procesados += 1
                
                # Validaciones y correcciones
                cambios = {}
                
                # Normalizar nombres
                if cp.nombre:
                    nombre_normalizado = cp.nombre.upper().strip()
                    if nombre_normalizado != cp.nombre:
                        cambios['nombre'] = nombre_normalizado
                
                # Validar coordenadas
                if cp.coordenadas:
                    if (cp.coordenadas.latitud < -18.5 or cp.coordenadas.latitud > -13.0 or
                        cp.coordenadas.longitud < -71.5 or cp.coordenadas.longitud > -68.0):
                        # Coordenadas fuera del rango de Puno
                        cambios['coordenadas'] = None
                        errores.append(f"Coordenadas inválidas para {cp.nombre}")
                
                # Aplicar cambios si hay alguno
                if cambios:
                    await service.update_localidad(cp.id, LocalidadUpdate(**cambios))
                    corregidos += 1
                    
            except Exception as e:
                errores.append(f"Error procesando {cp.nombre}: {str(e)}")
        
        return {
            'procesados': procesados,
            'corregidos': corregidos,
            'eliminados': eliminados,
            'errores': errores[:20]  # Limitar errores mostrados
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validando datos: {str(e)}")

@router.post("/importar-centros-poblados-archivo")
async def importar_centros_poblados_archivo(
    file: UploadFile = File(...),
    fuente: str = Query(..., description="Fuente del archivo"),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Importar centros poblados desde archivo CSV/Excel"""
    try:
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Formato de archivo no soportado")
        
        import pandas as pd
        import io
        
        # Leer archivo
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validar columnas mínimas requeridas
        columnas_requeridas = ['nombre', 'distrito']
        columnas_faltantes = [col for col in columnas_requeridas if col not in df.columns]
        
        if columnas_faltantes:
            raise HTTPException(
                status_code=400,
                detail=f"Faltan columnas requeridas: {', '.join(columnas_faltantes)}"
            )
        
        procesados = 0
        importados = 0
        actualizados = 0
        errores = []
        
        for index, row in df.iterrows():
            try:
                # Datos básicos
                centro_data = {
                    'nombre': str(row['nombre']).upper().strip(),
                    'tipo': TipoLocalidad.CENTRO_POBLADO,
                    'nivel_territorial': 'CENTRO_POBLADO',
                    'departamento': 'PUNO',
                    'distrito': str(row['distrito']).upper().strip(),
                    'fuente_datos': fuente,
                    'esta_activa': True
                }
                
                # Campos opcionales
                if 'provincia' in df.columns and pd.notna(row['provincia']):
                    centro_data['provincia'] = str(row['provincia']).upper().strip()
                
                if 'ubigeo' in df.columns and pd.notna(row['ubigeo']):
                    centro_data['ubigeo'] = str(row['ubigeo']).zfill(10)
                
                if 'poblacion' in df.columns and pd.notna(row['poblacion']):
                    centro_data['poblacion'] = int(row['poblacion'])
                
                # Coordenadas
                if ('latitud' in df.columns and 'longitud' in df.columns and
                    pd.notna(row['latitud']) and pd.notna(row['longitud'])):
                    centro_data['coordenadas'] = {
                        'latitud': float(row['latitud']),
                        'longitud': float(row['longitud'])
                    }
                
                # Verificar si existe
                if 'ubigeo' in centro_data:
                    existente = await service.obtener_por_ubigeo(centro_data['ubigeo'])
                else:
                    # Buscar por nombre y distrito
                    filtros = FiltroLocalidades(
                        nombre=centro_data['nombre'],
                        distrito=centro_data['distrito'],
                        tipo=TipoLocalidad.CENTRO_POBLADO
                    )
                    existentes = await service.get_localidades(filtros)
                    existente = existentes[0] if existentes else None
                
                if existente:
                    await service.update_localidad(existente.id, LocalidadUpdate(**centro_data))
                    actualizados += 1
                else:
                    await service.create_localidad(LocalidadCreate(**centro_data))
                    importados += 1
                
                procesados += 1
                
                if procesados % 50 == 0:
                    print(f"Procesados {procesados} centros poblados...")
                
            except Exception as e:
                errores.append(f"Fila {index + 2}: {str(e)}")
        
        return {
            'procesados': procesados,
            'importados': importados,
            'actualizados': actualizados,
            'errores': errores[:10]  # Mostrar solo primeros 10 errores
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")

# ========================================
# 🗺️ ENDPOINT PARA IMPORTACIÓN DESDE GEOJSON
# ========================================

@router.post("/importar-geojson")
async def importar_desde_geojson(
    modo: str = Query('ambos', description="Modo: crear, actualizar, ambos"),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """
    Importar localidades completas desde archivos GeoJSON
    Importa: Provincias, Distritos y Centros Poblados
    """
    try:
        import json
        import os
        from pathlib import Path
        
        # Función helper para limpiar ubigeo
        def limpiar_ubigeo(ubigeo_raw) -> Optional[str]:
            """Retorna ubigeo de 6 dígitos o None si no es válido"""
            if not ubigeo_raw:
                return None
            ubigeo_str = str(ubigeo_raw).strip()
            if not ubigeo_str or ubigeo_str == '0' or ubigeo_str == '':
                return None
            # Completar con ceros al FINAL hasta 6 dígitos (ej: "2101" -> "210100")
            if len(ubigeo_str) < 6:
                ubigeo_str = ubigeo_str.ljust(6, '0')
            # Si es más largo de 6, tomar solo los primeros 6
            elif len(ubigeo_str) > 6:
                ubigeo_str = ubigeo_str[:6]
            # Validar que tenga exactamente 6 caracteres
            return ubigeo_str if len(ubigeo_str) == 6 else None
        
        # Rutas a los archivos GeoJSON
        base_path = Path(__file__).parent.parent.parent.parent / 'frontend' / 'src' / 'assets' / 'geojson'
        
        stats = {
            'provincias': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0},
            'distritos': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0},
            'centros_poblados': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0}
        }
        
        # 1. Importar Provincias
        ruta_provincias = base_path / 'peru-provincias.geojson'
        if ruta_provincias.exists():
            with open(ruta_provincias, 'r', encoding='utf-8') as f:
                data = json.load(f)
                features = [f for f in data['features'] if f['properties'].get('NOMBDEP') == 'PUNO']
                
                for feature in features:
                    try:
                        props = feature['properties']
                        geometry = feature.get('geometry', {})
                        
                        # Extraer centroide
                        coords = None
                        if geometry.get('type') == 'Polygon' and geometry.get('coordinates'):
                            polygon_coords = geometry['coordinates'][0]
                            if polygon_coords:
                                lons = [c[0] for c in polygon_coords]
                                lats = [c[1] for c in polygon_coords]
                                coords = {
                                    'longitud': sum(lons) / len(lons),
                                    'latitud': sum(lats) / len(lats)
                                }
                        
                        localidad_data = LocalidadCreate(
                            nombre=props.get('NOMBPROV', '').strip(),
                            tipo=TipoLocalidad.PROVINCIA,
                            departamento='PUNO',
                            provincia=props.get('NOMBPROV', '').strip(),
                            ubigeo=limpiar_ubigeo(props.get('IDPROV')),
                            poblacion=props.get('POBTOTAL'),
                            coordenadas=coords
                        )
                        
                        # Verificar si existe
                        existe = await service.collection.find_one({
                            'nombre': localidad_data.nombre,
                            'tipo': TipoLocalidad.PROVINCIA
                        })
                        
                        if existe:
                            if modo in ['actualizar', 'ambos']:
                                # No sobrescribir estaActiva al actualizar
                                update_dict = localidad_data.model_dump(exclude_unset=True)
                                update_dict.pop('estaActiva', None)  # Remover si existe
                                await service.update_localidad(str(existe['_id']), LocalidadUpdate(**update_dict))
                                stats['provincias']['actualizados'] += 1
                            else:
                                stats['provincias']['omitidos'] += 1
                        else:
                            if modo in ['crear', 'ambos']:
                                await service.create_localidad(localidad_data)
                                stats['provincias']['importados'] += 1
                                
                    except Exception as e:
                        stats['provincias']['errores'] += 1
                        logger.error(f"Error importando provincia: {str(e)}")
        
        # 2. Importar Distritos
        ruta_distritos = base_path / 'puno-distritos.geojson'
        if ruta_distritos.exists():
            with open(ruta_distritos, 'r', encoding='utf-8') as f:
                data = json.load(f)
                features = data['features']
                
                for feature in features:
                    try:
                        props = feature['properties']
                        geometry = feature.get('geometry', {})
                        
                        # Extraer centroide
                        coords = None
                        if geometry.get('type') == 'Polygon' and geometry.get('coordinates'):
                            polygon_coords = geometry['coordinates'][0]
                            if polygon_coords:
                                lons = [c[0] for c in polygon_coords]
                                lats = [c[1] for c in polygon_coords]
                                coords = {
                                    'longitud': sum(lons) / len(lons),
                                    'latitud': sum(lats) / len(lats)
                                }
                        
                        localidad_data = LocalidadCreate(
                            nombre=props.get('DISTRITO', '').strip(),
                            tipo=TipoLocalidad.DISTRITO,
                            departamento=props.get('DEPARTAMEN', 'PUNO').strip(),
                            provincia=props.get('PROVINCIA', '').strip(),
                            distrito=props.get('DISTRITO', '').strip(),
                            ubigeo=limpiar_ubigeo(props.get('UBIGEO')),
                            coordenadas=coords
                        )
                        
                        # Verificar si existe
                        existe = await service.collection.find_one({
                            'ubigeo': localidad_data.ubigeo
                        }) if localidad_data.ubigeo else None
                        
                        if not existe:
                            existe = await service.collection.find_one({
                                'nombre': localidad_data.nombre,
                                'tipo': TipoLocalidad.DISTRITO,
                                'provincia': localidad_data.provincia
                            })
                        
                        if existe:
                            if modo in ['actualizar', 'ambos']:
                                # No sobrescribir estaActiva al actualizar
                                update_dict = localidad_data.model_dump(exclude_unset=True)
                                update_dict.pop('estaActiva', None)  # Remover si existe
                                await service.update_localidad(str(existe['_id']), LocalidadUpdate(**update_dict))
                                stats['distritos']['actualizados'] += 1
                            else:
                                stats['distritos']['omitidos'] += 1
                        else:
                            if modo in ['crear', 'ambos']:
                                await service.create_localidad(localidad_data)
                                stats['distritos']['importados'] += 1
                                
                    except Exception as e:
                        stats['distritos']['errores'] += 1
                        logger.error(f"Error importando distrito: {str(e)}")
        
        # 3. Importar Centros Poblados
        ruta_centros = base_path / 'puno-centrospoblados.geojson'
        if ruta_centros.exists():
            logger.info(f"📍 Iniciando importación de centros poblados desde {ruta_centros}")
            with open(ruta_centros, 'r', encoding='utf-8') as f:
                data = json.load(f)
                features = data['features']
                logger.info(f"📊 Total de centros poblados a procesar: {len(features)}")
                
                for idx, feature in enumerate(features):
                    try:
                        props = feature['properties']
                        geometry = feature.get('geometry', {})
                        
                        # Extraer coordenadas (Point)
                        coords = None
                        if geometry.get('type') == 'Point' and geometry.get('coordinates'):
                            point_coords = geometry['coordinates']
                            if len(point_coords) >= 2:
                                coords = {
                                    'longitud': point_coords[0],
                                    'latitud': point_coords[1]
                                }
                        
                        localidad_data = LocalidadCreate(
                            nombre=props.get('NOMB_CCPP', '').strip(),
                            tipo=TipoLocalidad.CENTRO_POBLADO,
                            departamento=props.get('NOMB_DEPAR', 'PUNO').strip(),
                            provincia=props.get('NOMB_PROVI', '').strip(),
                            distrito=props.get('NOMB_DISTR', '').strip(),
                            ubigeo=None,  # Los centros poblados no tienen UBIGEO único
                            codigo_ccpp=props.get('COD_CCPP', '').strip() or None,
                            tipo_area=props.get('TIPO', '').strip() or None,
                            poblacion=props.get('POBTOTAL'),
                            coordenadas=coords
                        )
                        
                        # Verificar si existe - buscar solo por nombre + ubicación
                        existe = await service.collection.find_one({
                            'nombre': localidad_data.nombre,
                            'tipo': TipoLocalidad.CENTRO_POBLADO,
                            'distrito': localidad_data.distrito,
                            'provincia': localidad_data.provincia
                        })
                        
                        if existe:
                            if modo in ['actualizar', 'ambos']:
                                # No sobrescribir estaActiva al actualizar
                                update_dict = localidad_data.model_dump(exclude_unset=True)
                                update_dict.pop('estaActiva', None)  # Remover si existe
                                await service.update_localidad(str(existe['_id']), LocalidadUpdate(**update_dict))
                                stats['centros_poblados']['actualizados'] += 1
                            else:
                                stats['centros_poblados']['omitidos'] += 1
                        else:
                            if modo in ['crear', 'ambos']:
                                await service.create_localidad(localidad_data)
                                stats['centros_poblados']['importados'] += 1
                        
                        # Log cada 100
                        if (idx + 1) % 100 == 0:
                            logger.info(f"📦 Procesados {idx + 1}/{len(features)} centros poblados... (Importados: {stats['centros_poblados']['importados']}, Actualizados: {stats['centros_poblados']['actualizados']}, Errores: {stats['centros_poblados']['errores']})")
                                
                    except Exception as e:
                        stats['centros_poblados']['errores'] += 1
                        if idx < 5:  # Log solo los primeros 5 errores para no saturar
                            logger.error(f"❌ Error importando centro poblado #{idx+1} '{props.get('NOMB_CCPP', 'SIN NOMBRE')}': {str(e)}")
                
                logger.info(f"✅ Centros poblados procesados: {len(features)}")
        else:
            logger.warning(f"⚠️ Archivo de centros poblados no encontrado en: {ruta_centros}")
        
        # Resumen
        total_importados = sum(s['importados'] for s in stats.values())
        total_actualizados = sum(s['actualizados'] for s in stats.values())
        total_omitidos = sum(s['omitidos'] for s in stats.values())
        total_errores = sum(s['errores'] for s in stats.values())
        
        logger.info(f"✅ Importación completada - Importados: {total_importados}, Actualizados: {total_actualizados}, Omitidos: {total_omitidos}, Errores: {total_errores}")
        logger.info(f"📊 Detalle: {stats}")
        
        return {
            'message': 'Importación completada',
            'total_importados': total_importados,
            'total_actualizados': total_actualizados,
            'total_omitidos': total_omitidos,
            'total_errores': total_errores,
            'detalle': stats
        }
        
    except Exception as e:
        logger.error(f"Error en importación GeoJSON: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error importando desde GeoJSON: {str(e)}")


@router.post("/reactivar-todas")
async def reactivar_todas_localidades(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Reactivar todas las localidades inactivas"""
    try:
        result = await service.collection.update_many(
            {"estaActiva": False},
            {"$set": {"estaActiva": True, "fechaActualizacion": datetime.utcnow()}}
        )
        
        return {
            'message': 'Localidades reactivadas',
            'reactivadas': result.modified_count
        }
    except Exception as e:
        logger.error(f"Error reactivando localidades: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reactivando localidades: {str(e)}")


@router.get("/debug/{nombre}")
async def debug_localidad(
    nombre: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Debug: Ver datos completos de una localidad por nombre"""
    try:
        localidad = await service.collection.find_one({
            "nombre": {"$regex": nombre, "$options": "i"}
        })
        
        if not localidad:
            return {"error": "No encontrada"}
        
        # Convertir ObjectId a string para serialización
        localidad["_id"] = str(localidad["_id"])
        
        return localidad
    except Exception as e:
        return {"error": str(e)}


@router.post("/limpiar-base-datos")
async def limpiar_base_datos_localidades(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Eliminar todas las localidades de la base de datos"""
    try:
        result = await service.collection.delete_many({})
        
        return {
            'message': 'Todas las localidades han sido eliminadas',
            'eliminadas': result.deleted_count
        }
    except Exception as e:
        logger.error(f"Error eliminando localidades: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error eliminando localidades: {str(e)}")


# Variable global para controlar la importación
importacion_activa = {"activa": False, "cancelar": False}

@router.post("/importar-geojson-lotes")
async def importar_desde_geojson_lotes(
    modo: str = Query('ambos', description="Modo: crear, actualizar, ambos"),
    lote_size: int = Query(50, description="Tamaño del lote"),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """
    Importar localidades por lotes con reporte de progreso
    """
    try:
        import json
        from pathlib import Path
        
        if importacion_activa["activa"]:
            raise HTTPException(status_code=409, detail="Ya hay una importación en curso")
        
        importacion_activa["activa"] = True
        importacion_activa["cancelar"] = False
        
        # Función helper para limpiar ubigeo
        def limpiar_ubigeo(ubigeo_raw) -> Optional[str]:
            if not ubigeo_raw:
                return None
            ubigeo_str = str(ubigeo_raw).strip()
            if not ubigeo_str or ubigeo_str == '0':
                return None
            if len(ubigeo_str) < 6:
                ubigeo_str = ubigeo_str.ljust(6, '0')
            return ubigeo_str if len(ubigeo_str) == 6 else None
        
        base_path = Path(__file__).parent.parent.parent.parent / 'frontend' / 'src' / 'assets' / 'geojson'
        
        stats = {
            'provincias': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0},
            'distritos': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0},
            'centros_poblados': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0}
        }
        
        # 1. Importar Provincias (rápido)
        logger.info("🏛️ Importando provincias...")
        ruta_provincias = base_path / 'peru-provincias.geojson'
        if ruta_provincias.exists():
            with open(ruta_provincias, 'r', encoding='utf-8') as f:
                data = json.load(f)
                features = [f for f in data['features'] if f['properties'].get('NOMBDEP') == 'PUNO']
                
                for feature in features:
                    if importacion_activa["cancelar"]:
                        break
                        
                    try:
                        props = feature['properties']
                        geometry = feature.get('geometry', {})
                        
                        coords = None
                        if geometry.get('type') in ['Polygon', 'MultiPolygon']:
                            if geometry.get('coordinates'):
                                polygon_coords = geometry['coordinates'][0] if geometry['type'] == 'Polygon' else geometry['coordinates'][0][0]
                                if polygon_coords:
                                    lons = [c[0] for c in polygon_coords]
                                    lats = [c[1] for c in polygon_coords]
                                    coords = {
                                        'longitud': sum(lons) / len(lons),
                                        'latitud': sum(lats) / len(lats)
                                    }
                        
                        localidad_data = LocalidadCreate(
                            nombre=props.get('NOMBPROV', '').strip(),
                            tipo=TipoLocalidad.PROVINCIA,
                            departamento='PUNO',
                            provincia=props.get('NOMBPROV', '').strip(),
                            ubigeo=limpiar_ubigeo(props.get('IDPROV')),
                            poblacion=props.get('POBTOTAL'),
                            coordenadas=coords
                        )
                        
                        existe = await service.collection.find_one({
                            'nombre': localidad_data.nombre,
                            'tipo': TipoLocalidad.PROVINCIA
                        })
                        
                        if existe:
                            if modo in ['actualizar', 'ambos']:
                                update_dict = localidad_data.model_dump(exclude_unset=True)
                                update_dict.pop('estaActiva', None)
                                await service.update_localidad(str(existe['_id']), LocalidadUpdate(**update_dict))
                                stats['provincias']['actualizados'] += 1
                            else:
                                stats['provincias']['omitidos'] += 1
                        else:
                            if modo in ['crear', 'ambos']:
                                await service.create_localidad(localidad_data)
                                stats['provincias']['importados'] += 1
                                
                    except Exception as e:
                        stats['provincias']['errores'] += 1
                        logger.error(f"Error importando provincia: {str(e)}")
        
        # 2. Importar Distritos (rápido)
        logger.info("🗺️ Importando distritos...")
        ruta_distritos = base_path / 'puno-distritos.geojson'
        if ruta_distritos.exists():
            with open(ruta_distritos, 'r', encoding='utf-8') as f:
                data = json.load(f)
                features = data['features']
                
                for feature in features:
                    if importacion_activa["cancelar"]:
                        break
                        
                    try:
                        props = feature['properties']
                        geometry = feature.get('geometry', {})
                        
                        coords = None
                        if geometry.get('type') == 'Polygon' and geometry.get('coordinates'):
                            polygon_coords = geometry['coordinates'][0]
                            if polygon_coords:
                                lons = [c[0] for c in polygon_coords]
                                lats = [c[1] for c in polygon_coords]
                                coords = {
                                    'longitud': sum(lons) / len(lons),
                                    'latitud': sum(lats) / len(lats)
                                }
                        
                        localidad_data = LocalidadCreate(
                            nombre=props.get('DISTRITO', '').strip(),
                            tipo=TipoLocalidad.DISTRITO,
                            departamento=props.get('DEPARTAMEN', 'PUNO').strip(),
                            provincia=props.get('PROVINCIA', '').strip(),
                            distrito=props.get('DISTRITO', '').strip(),
                            ubigeo=limpiar_ubigeo(props.get('UBIGEO')),
                            coordenadas=coords
                        )
                        
                        existe = await service.collection.find_one({
                            'ubigeo': localidad_data.ubigeo
                        }) if localidad_data.ubigeo else None
                        
                        if not existe:
                            existe = await service.collection.find_one({
                                'nombre': localidad_data.nombre,
                                'tipo': TipoLocalidad.DISTRITO,
                                'provincia': localidad_data.provincia
                            })
                        
                        if existe:
                            if modo in ['actualizar', 'ambos']:
                                update_dict = localidad_data.model_dump(exclude_unset=True)
                                update_dict.pop('estaActiva', None)
                                await service.update_localidad(str(existe['_id']), LocalidadUpdate(**update_dict))
                                stats['distritos']['actualizados'] += 1
                            else:
                                stats['distritos']['omitidos'] += 1
                        else:
                            if modo in ['crear', 'ambos']:
                                await service.create_localidad(localidad_data)
                                stats['distritos']['importados'] += 1
                                
                    except Exception as e:
                        stats['distritos']['errores'] += 1
                        logger.error(f"Error importando distrito: {str(e)}")
        
        # 3. Importar Centros Poblados por lotes
        logger.info("🏘️ Importando centros poblados por lotes...")
        ruta_centros = base_path / 'puno-centrospoblados.geojson'
        
        if ruta_centros.exists():
            with open(ruta_centros, 'r', encoding='utf-8') as f:
                data = json.load(f)
                features = data.get('features', [])
                total_features = len(features)
                logger.info(f"📊 Total de centros poblados: {total_features}")
                
                for idx, feature in enumerate(features):
                    if importacion_activa["cancelar"]:
                        logger.info("⏸️ Importación cancelada por el usuario")
                        break
                    
                    try:
                        props = feature['properties']
                        geometry = feature.get('geometry', {})
                        
                        # Extraer coordenadas Point
                        coords = None
                        if geometry.get('type') == 'Point' and geometry.get('coordinates'):
                            point_coords = geometry['coordinates']
                            if len(point_coords) >= 2:
                                coords = {
                                    'longitud': point_coords[0],
                                    'latitud': point_coords[1]
                                }
                        
                        localidad_data = LocalidadCreate(
                            nombre=props.get('NOMB_CCPP', '').strip(),
                            tipo=TipoLocalidad.CENTRO_POBLADO,
                            departamento=props.get('NOMB_DEPAR', 'PUNO').strip(),
                            provincia=props.get('NOMB_PROVI', '').strip(),
                            distrito=props.get('NOMB_DISTR', '').strip(),
                            ubigeo=None,  # Los centros poblados no tienen UBIGEO único
                            codigo_ccpp=props.get('COD_CCPP', '').strip() or None,
                            tipo_area=props.get('TIPO', '').strip() or None,
                            poblacion=props.get('POBTOTAL'),
                            coordenadas=coords
                        )
                        
                        # Buscar si existe - solo por nombre + ubicación
                        existe = await service.collection.find_one({
                            'nombre': localidad_data.nombre,
                            'tipo': TipoLocalidad.CENTRO_POBLADO,
                            'distrito': localidad_data.distrito,
                            'provincia': localidad_data.provincia
                        })
                        
                        if existe:
                            if modo in ['actualizar', 'ambos']:
                                update_dict = localidad_data.model_dump(exclude_unset=True)
                                update_dict.pop('estaActiva', None)
                                await service.update_localidad(str(existe['_id']), LocalidadUpdate(**update_dict))
                                stats['centros_poblados']['actualizados'] += 1
                            else:
                                stats['centros_poblados']['omitidos'] += 1
                        else:
                            if modo in ['crear', 'ambos']:
                                await service.create_localidad(localidad_data)
                                stats['centros_poblados']['importados'] += 1
                        
                        # Log progreso cada 100
                        if (idx + 1) % 100 == 0:
                            progreso = ((idx + 1) / total_features) * 100
                            logger.info(f"📦 Progreso: {progreso:.1f}% ({idx + 1}/{total_features}) - Importados: {stats['centros_poblados']['importados']}, Actualizados: {stats['centros_poblados']['actualizados']}")
                                
                    except Exception as e:
                        stats['centros_poblados']['errores'] += 1
                        if stats['centros_poblados']['errores'] <= 5:
                            logger.error(f"❌ Error en centro poblado #{idx+1}: {str(e)}")
        
        importacion_activa["activa"] = False
        
        total_importados = sum(s['importados'] for s in stats.values())
        total_actualizados = sum(s['actualizados'] for s in stats.values())
        total_omitidos = sum(s['omitidos'] for s in stats.values())
        total_errores = sum(s['errores'] for s in stats.values())
        
        logger.info(f"✅ Importación completada - Total: {total_importados + total_actualizados}")
        
        return {
            'message': 'Importación completada' if not importacion_activa["cancelar"] else 'Importación cancelada',
            'total_importados': total_importados,
            'total_actualizados': total_actualizados,
            'total_omitidos': total_omitidos,
            'total_errores': total_errores,
            'detalle': stats,
            'cancelada': importacion_activa["cancelar"]
        }
        
    except Exception as e:
        importacion_activa["activa"] = False
        logger.error(f"Error en importación: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/cancelar-importacion")
async def cancelar_importacion() -> dict:
    """Cancelar la importación en curso"""
    if not importacion_activa["activa"]:
        return {"message": "No hay importación activa"}
    
    importacion_activa["cancelar"] = True
    return {"message": "Cancelación solicitada"}

@router.get("/estado-importacion")
async def estado_importacion() -> dict:
    """Obtener estado de la importación"""
    return {
        "activa": importacion_activa["activa"],
        "cancelar": importacion_activa["cancelar"]
    }


@router.post("/importar-geojson-test")
async def importar_desde_geojson_test(
    modo: str = Query('ambos', description="Modo: crear, actualizar, ambos"),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """
    MODO TEST: Importar solo 2 localidades de cada tipo para pruebas
    """
    try:
        import json
        from pathlib import Path
        
        # Función helper para limpiar ubigeo
        def limpiar_ubigeo(ubigeo_raw) -> Optional[str]:
            if not ubigeo_raw:
                return None
            ubigeo_str = str(ubigeo_raw).strip()
            if not ubigeo_str or ubigeo_str == '0' or ubigeo_str == '':
                return None
            if len(ubigeo_str) < 6:
                ubigeo_str = ubigeo_str.ljust(6, '0')
            elif len(ubigeo_str) > 6:
                ubigeo_str = ubigeo_str[:6]
            return ubigeo_str if len(ubigeo_str) == 6 else None
        
        base_path = Path(__file__).parent.parent.parent.parent / 'frontend' / 'src' / 'assets' / 'geojson'
        
        stats = {
            'provincias': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0, 'detalles': []},
            'distritos': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0, 'detalles': []},
            'centros_poblados': {'importados': 0, 'actualizados': 0, 'omitidos': 0, 'errores': 0, 'detalles': []}
        }
        
        # 1. TEST: Importar 2 Provincias
        logger.info("🧪 TEST: Importando 2 provincias...")
        ruta_provincias = base_path / 'peru-provincias.geojson'
        if ruta_provincias.exists():
            with open(ruta_provincias, 'r', encoding='utf-8') as f:
                data = json.load(f)
                features = [f for f in data['features'] if f['properties'].get('NOMBDEP') == 'PUNO'][:2]
                
                for feature in features:
                    try:
                        props = feature['properties']
                        geometry = feature.get('geometry', {})
                        
                        coords = None
                        if geometry.get('type') in ['Polygon', 'MultiPolygon']:
                            if geometry.get('coordinates'):
                                polygon_coords = geometry['coordinates'][0] if geometry['type'] == 'Polygon' else geometry['coordinates'][0][0]
                                if polygon_coords:
                                    lons = [c[0] for c in polygon_coords]
                                    lats = [c[1] for c in polygon_coords]
                                    coords = {
                                        'longitud': sum(lons) / len(lons),
                                        'latitud': sum(lats) / len(lats)
                                    }
                        
                        localidad_data = LocalidadCreate(
                            nombre=props.get('NOMBPROV', '').strip(),
                            tipo=TipoLocalidad.PROVINCIA,
                            departamento='PUNO',
                            provincia=props.get('NOMBPROV', '').strip(),
                            ubigeo=limpiar_ubigeo(props.get('IDPROV')),
                            poblacion=props.get('POBTOTAL'),
                            coordenadas=coords
                        )
                        
                        existe = await service.collection.find_one({
                            'nombre': localidad_data.nombre,
                            'tipo': TipoLocalidad.PROVINCIA
                        })
                        
                        if existe:
                            if modo in ['actualizar', 'ambos']:
                                update_dict = localidad_data.model_dump(exclude_unset=True)
                                update_dict.pop('estaActiva', None)
                                await service.update_localidad(str(existe['_id']), LocalidadUpdate(**update_dict))
                                stats['provincias']['actualizados'] += 1
                                stats['provincias']['detalles'].append(f"✅ Actualizada: {localidad_data.nombre}")
                            else:
                                stats['provincias']['omitidos'] += 1
                        else:
                            if modo in ['crear', 'ambos']:
                                await service.create_localidad(localidad_data)
                                stats['provincias']['importados'] += 1
                                stats['provincias']['detalles'].append(f"✨ Creada: {localidad_data.nombre} (UBIGEO: {localidad_data.ubigeo}, Población: {localidad_data.poblacion}, Coords: {coords is not None})")
                                
                    except Exception as e:
                        stats['provincias']['errores'] += 1
                        stats['provincias']['detalles'].append(f"❌ Error: {props.get('NOMBPROV', 'SIN NOMBRE')} - {str(e)}")
                        logger.error(f"Error importando provincia: {str(e)}")
        
        # 2. TEST: Importar 2 Distritos
        logger.info("🧪 TEST: Importando 2 distritos...")
        ruta_distritos = base_path / 'puno-distritos.geojson'
        if ruta_distritos.exists():
            with open(ruta_distritos, 'r', encoding='utf-8') as f:
                data = json.load(f)
                features = data['features'][:2]
                
                for feature in features:
                    try:
                        props = feature['properties']
                        geometry = feature.get('geometry', {})
                        
                        coords = None
                        if geometry.get('type') == 'Polygon' and geometry.get('coordinates'):
                            polygon_coords = geometry['coordinates'][0]
                            if polygon_coords:
                                lons = [c[0] for c in polygon_coords]
                                lats = [c[1] for c in polygon_coords]
                                coords = {
                                    'longitud': sum(lons) / len(lons),
                                    'latitud': sum(lats) / len(lats)
                                }
                        
                        localidad_data = LocalidadCreate(
                            nombre=props.get('DISTRITO', '').strip(),
                            tipo=TipoLocalidad.DISTRITO,
                            departamento=props.get('DEPARTAMEN', 'PUNO').strip(),
                            provincia=props.get('PROVINCIA', '').strip(),
                            distrito=props.get('DISTRITO', '').strip(),
                            ubigeo=limpiar_ubigeo(props.get('UBIGEO')),
                            coordenadas=coords
                        )
                        
                        existe = await service.collection.find_one({
                            'ubigeo': localidad_data.ubigeo
                        }) if localidad_data.ubigeo else None
                        
                        if not existe:
                            existe = await service.collection.find_one({
                                'nombre': localidad_data.nombre,
                                'tipo': TipoLocalidad.DISTRITO,
                                'provincia': localidad_data.provincia
                            })
                        
                        if existe:
                            if modo in ['actualizar', 'ambos']:
                                update_dict = localidad_data.model_dump(exclude_unset=True)
                                update_dict.pop('estaActiva', None)
                                await service.update_localidad(str(existe['_id']), LocalidadUpdate(**update_dict))
                                stats['distritos']['actualizados'] += 1
                                stats['distritos']['detalles'].append(f"✅ Actualizado: {localidad_data.nombre}")
                            else:
                                stats['distritos']['omitidos'] += 1
                        else:
                            if modo in ['crear', 'ambos']:
                                await service.create_localidad(localidad_data)
                                stats['distritos']['importados'] += 1
                                stats['distritos']['detalles'].append(f"✨ Creado: {localidad_data.nombre} (UBIGEO: {localidad_data.ubigeo}, Coords: {coords is not None})")
                                
                    except Exception as e:
                        stats['distritos']['errores'] += 1
                        stats['distritos']['detalles'].append(f"❌ Error: {props.get('DISTRITO', 'SIN NOMBRE')} - {str(e)}")
                        logger.error(f"Error importando distrito: {str(e)}")
        
        # 3. TEST: Importar 2 Centros Poblados
        logger.info("🧪 TEST: Importando 2 centros poblados...")
        ruta_centros = base_path / 'puno-centrospoblados.geojson'
        if ruta_centros.exists():
            with open(ruta_centros, 'r', encoding='utf-8') as f:
                data = json.load(f)
                features = data.get('features', [])[:2]
                logger.info(f"📊 Features encontrados para test: {len(features)}")
                
                for idx, feature in enumerate(features):
                    try:
                        props = feature['properties']
                        geometry = feature.get('geometry', {})
                        
                        logger.info(f"🔍 Procesando centro poblado: {props.get('NOMB_CCPP', 'SIN NOMBRE')}")
                        
                        # Extraer coordenadas (Point)
                        coords = None
                        if geometry.get('type') == 'Point' and geometry.get('coordinates'):
                            point_coords = geometry['coordinates']
                            if len(point_coords) >= 2:
                                coords = {
                                    'longitud': point_coords[0],
                                    'latitud': point_coords[1]
                                }
                                logger.info(f"  📍 Coordenadas: {coords}")
                        
                        ubigeo_limpio = limpiar_ubigeo(props.get('UBIGEO'))
                        logger.info(f"  🔢 UBIGEO original: {props.get('UBIGEO')} -> limpio: {ubigeo_limpio}")
                        
                        localidad_data = LocalidadCreate(
                            nombre=props.get('NOMB_CCPP', '').strip(),
                            tipo=TipoLocalidad.CENTRO_POBLADO,
                            departamento=props.get('NOMB_DEPAR', 'PUNO').strip(),
                            provincia=props.get('NOMB_PROVI', '').strip(),
                            distrito=props.get('NOMB_DISTR', '').strip(),
                            ubigeo=None,  # Los centros poblados no tienen UBIGEO único, solo el distrito
                            codigo_ccpp=props.get('COD_CCPP', '').strip() or None,
                            tipo_area=props.get('TIPO', '').strip() or None,
                            poblacion=props.get('POBTOTAL'),
                            coordenadas=coords
                        )
                        
                        logger.info(f"  📝 Datos preparados: {localidad_data.nombre}, Población: {localidad_data.poblacion}")
                        
                        # Buscar si existe
                        existe = None
                        if localidad_data.ubigeo:
                            existe = await service.collection.find_one({
                                'ubigeo': localidad_data.ubigeo,
                                'tipo': TipoLocalidad.CENTRO_POBLADO
                            })
                        
                        if not existe:
                            existe = await service.collection.find_one({
                                'nombre': localidad_data.nombre,
                                'tipo': TipoLocalidad.CENTRO_POBLADO,
                                'distrito': localidad_data.distrito,
                                'provincia': localidad_data.provincia
                            })
                        
                        if existe:
                            if modo in ['actualizar', 'ambos']:
                                update_dict = localidad_data.model_dump(exclude_unset=True)
                                update_dict.pop('estaActiva', None)
                                await service.update_localidad(str(existe['_id']), LocalidadUpdate(**update_dict))
                                stats['centros_poblados']['actualizados'] += 1
                                stats['centros_poblados']['detalles'].append(f"✅ Actualizado: {localidad_data.nombre}")
                                logger.info(f"  ✅ Actualizado exitosamente")
                            else:
                                stats['centros_poblados']['omitidos'] += 1
                        else:
                            if modo in ['crear', 'ambos']:
                                resultado = await service.create_localidad(localidad_data)
                                stats['centros_poblados']['importados'] += 1
                                stats['centros_poblados']['detalles'].append(f"✨ Creado: {localidad_data.nombre} (UBIGEO: {localidad_data.ubigeo}, Población: {localidad_data.poblacion}, Coords: {coords is not None})")
                                logger.info(f"  ✨ Creado exitosamente con ID: {resultado.id}")
                                
                    except Exception as e:
                        stats['centros_poblados']['errores'] += 1
                        stats['centros_poblados']['detalles'].append(f"❌ Error: {props.get('NOMB_CCPP', 'SIN NOMBRE')} - {str(e)}")
                        logger.error(f"❌ Error importando centro poblado: {str(e)}")
        
        total_importados = sum(s['importados'] for s in stats.values())
        total_actualizados = sum(s['actualizados'] for s in stats.values())
        total_omitidos = sum(s['omitidos'] for s in stats.values())
        total_errores = sum(s['errores'] for s in stats.values())
        
        logger.info(f"✅ TEST completado - Importados: {total_importados}, Actualizados: {total_actualizados}, Errores: {total_errores}")
        
        return {
            'message': 'TEST: Importación de muestra completada',
            'total_importados': total_importados,
            'total_actualizados': total_actualizados,
            'total_omitidos': total_omitidos,
            'total_errores': total_errores,
            'detalle': stats
        }
        
    except Exception as e:
        logger.error(f"Error en TEST de importación: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en TEST: {str(e)}")



# ========================================
# 🗺️ IMPORTACIÓN DESDE GEOJSON POINT
# ========================================

@router.post("/importar-desde-geojson")
async def importar_desde_geojson(
    modo: str = Query("ambos", description="crear, actualizar o ambos"),
    test: bool = Query(False, description="Modo test: solo 2 de cada tipo"),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    Importa localidades desde archivos GeoJSON
    Usa archivos principales para datos y archivos point para coordenadas
    """
    from pathlib import Path
    import json
    
    collection = db.localidades
    
    # Rutas a los archivos GeoJSON
    FRONTEND_PATH = Path(__file__).parent.parent.parent.parent / "frontend"
    GEOJSON_PATH = FRONTEND_PATH / "src" / "assets" / "geojson"
    
    # Archivos principales (con toda la info)
    PROVINCIAS_MAIN = GEOJSON_PATH / "puno-provincias.geojson"
    DISTRITOS_MAIN = GEOJSON_PATH / "puno-distritos.geojson"
    CENTROS_POBLADOS = GEOJSON_PATH / "puno-centrospoblados.geojson"
    
    # Archivos point (solo coordenadas)
    PROVINCIAS_POINT = GEOJSON_PATH / "puno-provincias-point.geojson"
    DISTRITOS_POINT = GEOJSON_PATH / "puno-distritos-point.geojson"
    
    resultado = {
        "total_importados": 0,
        "total_actualizados": 0,
        "total_omitidos": 0,
        "total_errores": 0,
        "detalle": {
            "provincias": {"importados": 0, "actualizados": 0, "omitidos": 0, "errores": 0},
            "distritos": {"importados": 0, "actualizados": 0, "omitidos": 0, "errores": 0},
            "centros_poblados": {"importados": 0, "actualizados": 0, "omitidos": 0, "errores": 0}
        }
    }
    
    try:
        # 1. Importar provincias
        if PROVINCIAS_MAIN.exists() and PROVINCIAS_POINT.exists():
            # Cargar datos principales
            with open(PROVINCIAS_MAIN, 'r', encoding='utf-8') as f:
                data_main = json.load(f)
            
            # Cargar coordenadas point
            with open(PROVINCIAS_POINT, 'r', encoding='utf-8') as f:
                data_point = json.load(f)
            
            # Crear diccionario de coordenadas por NOMBRE de provincia
            coords_map = {}
            for feature in data_point['features']:
                nombre_prov = feature['properties'].get('NOMBPROV', '').strip().upper()
                coords = feature['geometry']['coordinates']
                coords_map[nombre_prov] = {"longitud": coords[0], "latitud": coords[1]}
            
            # Filtrar solo Puno y procesar
            features = [f for f in data_main['features'] if f['properties'].get('NOMBDEP') == 'PUNO']
            if test:
                features = features[:2]
            
            for feature in features:
                try:
                    props = feature['properties']
                    
                    nombre = props.get('NOMBPROV', '').strip()
                    nombre_upper = nombre.upper()
                    ubigeo = f"21{props.get('IDPROV', '')}01"
                    
                    if not nombre:
                        continue
                    
                    localidad_data = {
                        "nombre": nombre,
                        "tipo": TipoLocalidad.PROVINCIA,
                        "ubigeo": ubigeo,
                        "departamento": "PUNO",
                        "provincia": nombre,
                        "distrito": nombre,
                        "descripcion": f"Provincia de {nombre}",
                        "poblacion": props.get('POBTOTAL'),
                        "estaActiva": True,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    # Agregar coordenadas desde archivo point (match por nombre)
                    if nombre_upper in coords_map:
                        localidad_data["coordenadas"] = coords_map[nombre_upper]
                    
                    existe = await collection.find_one({"ubigeo": ubigeo})
                    
                    if existe:
                        if modo in ["actualizar", "ambos"]:
                            await collection.update_one({"_id": existe["_id"]}, {"$set": localidad_data})
                            resultado["detalle"]["provincias"]["actualizados"] += 1
                        else:
                            resultado["detalle"]["provincias"]["omitidos"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await collection.insert_one(localidad_data)
                            resultado["detalle"]["provincias"]["importados"] += 1
                        else:
                            resultado["detalle"]["provincias"]["omitidos"] += 1
                            
                except Exception as e:
                    logger.error(f"Error importando provincia: {e}")
                    resultado["detalle"]["provincias"]["errores"] += 1
        
        # 2. Importar distritos
        if DISTRITOS_MAIN.exists() and DISTRITOS_POINT.exists():
            # Cargar datos principales
            with open(DISTRITOS_MAIN, 'r', encoding='utf-8') as f:
                data_main = json.load(f)
            
            # Cargar coordenadas point
            with open(DISTRITOS_POINT, 'r', encoding='utf-8') as f:
                data_point = json.load(f)
            
            # Crear diccionario de coordenadas por UBIGEO
            coords_map = {}
            for feature in data_point['features']:
                ubigeo = feature['properties'].get('UBIGEO')
                coords = feature['geometry']['coordinates']
                if ubigeo:
                    coords_map[ubigeo] = {"longitud": coords[0], "latitud": coords[1]}
            
            features = data_main['features']
            if test:
                features = features[:2]
            
            for feature in features:
                try:
                    props = feature['properties']
                    
                    nombre = props.get('DISTRITO', '').strip()
                    provincia = props.get('PROVINCIA', '').strip()
                    ubigeo = props.get('UBIGEO', '')
                    capital = props.get('CAPITAL', '').strip()
                    
                    if not nombre or not ubigeo:
                        continue
                    
                    # Tipo siempre es DISTRITO (respetando el GeoJSON)
                    tipo = TipoLocalidad.DISTRITO
                    
                    localidad_data = {
                        "nombre": nombre,
                        "tipo": tipo,
                        "ubigeo": ubigeo,
                        "departamento": "PUNO",
                        "provincia": provincia,
                        "distrito": nombre,
                        "capital": capital if capital != nombre else None,
                        "descripcion": f"Distrito de {nombre}, provincia de {provincia}",
                        "estaActiva": True,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    # Agregar coordenadas desde archivo point
                    if ubigeo in coords_map:
                        localidad_data["coordenadas"] = coords_map[ubigeo]
                    
                    existe = await collection.find_one({"ubigeo": ubigeo})
                    
                    if existe:
                        if modo in ["actualizar", "ambos"]:
                            await collection.update_one({"_id": existe["_id"]}, {"$set": localidad_data})
                            resultado["detalle"]["distritos"]["actualizados"] += 1
                        else:
                            resultado["detalle"]["distritos"]["omitidos"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await collection.insert_one(localidad_data)
                            resultado["detalle"]["distritos"]["importados"] += 1
                        else:
                            resultado["detalle"]["distritos"]["omitidos"] += 1
                            
                except Exception as e:
                    logger.error(f"Error importando distrito: {e}")
                    resultado["detalle"]["distritos"]["errores"] += 1
        
        # 3. Importar centros poblados
        if CENTROS_POBLADOS.exists():
            with open(CENTROS_POBLADOS, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            features = data['features'][:2] if test else data['features']
            
            for feature in features:
                try:
                    props = feature['properties']
                    
                    if feature['geometry']['type'] != 'Point':
                        continue
                    
                    coords = feature['geometry']['coordinates']
                    
                    nombre = props.get('NOMB_CCPP', '').strip()
                    provincia = props.get('NOMB_PROVI', 'PUNO').strip()
                    distrito = props.get('NOMB_DISTR', '').strip()
                    ubigeo = props.get('UBIGEO', '')
                    poblacion = props.get('POBTOTAL')
                    tipo_area = props.get('TIPO', 'Rural')
                    
                    if not nombre:
                        continue
                    
                    localidad_data = {
                        "nombre": nombre,
                        "tipo": TipoLocalidad.CENTRO_POBLADO,
                        "ubigeo": ubigeo if ubigeo else None,
                        "departamento": "PUNO",
                        "provincia": provincia,
                        "distrito": distrito if distrito else None,
                        "descripcion": f"Centro poblado {tipo_area.lower()} de {nombre}",
                        "coordenadas": {
                            "longitud": coords[0],
                            "latitud": coords[1]
                        },
                        "poblacion": poblacion,
                        "area_tipo": tipo_area,
                        "estaActiva": True,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    # Buscar por nombre y distrito
                    existe = await collection.find_one({
                        "nombre": nombre,
                        "distrito": distrito,
                        "tipo": TipoLocalidad.CENTRO_POBLADO
                    })
                    
                    if existe:
                        if modo in ["actualizar", "ambos"]:
                            await collection.update_one({"_id": existe["_id"]}, {"$set": localidad_data})
                            resultado["detalle"]["centros_poblados"]["actualizados"] += 1
                        else:
                            resultado["detalle"]["centros_poblados"]["omitidos"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await collection.insert_one(localidad_data)
                            resultado["detalle"]["centros_poblados"]["importados"] += 1
                        else:
                            resultado["detalle"]["centros_poblados"]["omitidos"] += 1
                            
                except Exception as e:
                    logger.error(f"Error importando centro poblado: {e}")
                    resultado["detalle"]["centros_poblados"]["errores"] += 1
        
        # Calcular totales
        for categoria in resultado["detalle"].values():
            resultado["total_importados"] += categoria["importados"]
            resultado["total_actualizados"] += categoria["actualizados"]
            resultado["total_omitidos"] += categoria["omitidos"]
            resultado["total_errores"] += categoria["errores"]
        
        return resultado
        
    except Exception as e:
        logger.error(f"Error en importación: {e}")
        raise HTTPException(status_code=500, detail=f"Error en importación: {str(e)}")



@router.post("/eliminar-sin-coordenadas")
async def eliminar_localidades_sin_coordenadas(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    Elimina TODAS las localidades que no tienen coordenadas
    """
    collection = db.localidades
    
    try:
        # Eliminar todas las que no tienen coordenadas o tienen coordenadas vacías
        resultado = await collection.delete_many({
            "$or": [
                {"coordenadas": {"$exists": False}},
                {"coordenadas": None},
                {"coordenadas.latitud": {"$exists": False}},
                {"coordenadas.latitud": None}
            ]
        })
        
        return {
            "message": "Localidades sin coordenadas eliminadas",
            "total_eliminados": resultado.deleted_count
        }
        
    except Exception as e:
        logger.error(f"Error eliminando localidades sin coordenadas: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")



@router.post("/eliminar-duplicados-sin-ubigeo")
async def eliminar_duplicados_sin_ubigeo(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    Elimina localidades que no tienen UBIGEO válido (son duplicados)
    """
    collection = db.localidades
    
    try:
        # Eliminar todas las que no tienen ubigeo válido
        resultado = await collection.delete_many({
            "$or": [
                {"ubigeo": {"$exists": False}},
                {"ubigeo": None},
                {"ubigeo": ""},
                {"ubigeo": {"$type": "null"}}
            ]
        })
        
        return {
            "message": "Duplicados sin UBIGEO eliminados",
            "total_eliminados": resultado.deleted_count
        }
        
    except Exception as e:
        logger.error(f"Error eliminando duplicados: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")



@router.post("/eliminar-coordenadas-invalidas")
async def eliminar_coordenadas_invalidas(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    Elimina localidades con coordenadas inválidas (0,0) o fuera de rango
    """
    collection = db.localidades
    
    try:
        # Eliminar las que tienen coordenadas en 0,0 o fuera del rango de Puno
        resultado = await collection.delete_many({
            "$or": [
                {"coordenadas.latitud": 0},
                {"coordenadas.longitud": 0},
                {"coordenadas.latitud": {"$lt": -18.5}},
                {"coordenadas.latitud": {"$gt": -13.0}},
                {"coordenadas.longitud": {"$lt": -71.5}},
                {"coordenadas.longitud": {"$gt": -68.0}}
            ]
        })
        
        return {
            "message": "Localidades con coordenadas inválidas eliminadas",
            "total_eliminados": resultado.deleted_count
        }
        
    except Exception as e:
        logger.error(f"Error eliminando coordenadas inválidas: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")



@router.post("/eliminar-centros-poblados-duplicados-distritos")
async def eliminar_centros_poblados_duplicados_distritos(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    Elimina centros poblados que tienen el mismo nombre que un distrito
    (son duplicados incorrectos)
    """
    collection = db.localidades
    
    try:
        # Obtener todos los distritos
        distritos = await collection.find({"tipo": TipoLocalidad.DISTRITO}).to_list(None)
        nombres_distritos = {d['nombre'].upper() for d in distritos}
        
        # Eliminar centros poblados que tienen el mismo nombre que un distrito
        eliminados = []
        for nombre in nombres_distritos:
            resultado = await collection.delete_many({
                "tipo": TipoLocalidad.CENTRO_POBLADO,
                "nombre": {"$regex": f"^{nombre}$", "$options": "i"}
            })
            if resultado.deleted_count > 0:
                eliminados.append({"nombre": nombre, "cantidad": resultado.deleted_count})
        
        return {
            "message": "Centros poblados duplicados eliminados",
            "total_eliminados": sum(e['cantidad'] for e in eliminados),
            "detalles": eliminados
        }
        
    except Exception as e:
        logger.error(f"Error eliminando duplicados: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")



@router.post("/limpiar-provincias-duplicadas")
async def limpiar_provincias_duplicadas(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    Elimina provincias duplicadas manteniendo solo las que tienen UBIGEO válido
    """
    collection = db.localidades
    
    try:
        # Obtener todas las provincias
        provincias = await collection.find({"tipo": TipoLocalidad.PROVINCIA}).to_list(None)
        
        # Agrupar por nombre
        grupos = {}
        for prov in provincias:
            nombre = prov['nombre']
            if nombre not in grupos:
                grupos[nombre] = []
            grupos[nombre].append(prov)
        
        eliminados = 0
        detalles = []
        
        # Para cada grupo, mantener solo el que tiene UBIGEO válido
        for nombre, provs in grupos.items():
            if len(provs) > 1:
                # Separar los que tienen y no tienen UBIGEO válido
                con_ubigeo = [p for p in provs if p.get('ubigeo') and len(p['ubigeo']) == 6]
                sin_ubigeo = [p for p in provs if not (p.get('ubigeo') and len(p['ubigeo']) == 6)]
                
                # Si hay uno con UBIGEO, eliminar los que no tienen
                if con_ubigeo and sin_ubigeo:
                    for prov in sin_ubigeo:
                        await collection.delete_one({"_id": prov["_id"]})
                        eliminados += 1
                    
                    detalles.append({
                        "nombre": nombre,
                        "eliminados": len(sin_ubigeo),
                        "mantenido_ubigeo": con_ubigeo[0]['ubigeo']
                    })
        
        return {
            "message": "Provincias duplicadas limpiadas",
            "total_eliminados": eliminados,
            "detalles": detalles
        }
        
    except Exception as e:
        logger.error(f"Error limpiando provincias: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")



@router.post("/eliminar-distritos-duplicados-por-ubigeo")
async def eliminar_distritos_duplicados_por_ubigeo(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    Elimina distritos duplicados que tienen el mismo UBIGEO
    Mantiene solo el más reciente
    """
    collection = db.localidades
    
    try:
        # Obtener todos los distritos
        distritos = await collection.find({"tipo": TipoLocalidad.DISTRITO}).to_list(None)
        
        # Agrupar por UBIGEO
        grupos = {}
        for dist in distritos:
            ubigeo = dist.get('ubigeo')
            if ubigeo:
                if ubigeo not in grupos:
                    grupos[ubigeo] = []
                grupos[ubigeo].append(dist)
        
        eliminados = 0
        detalles = []
        
        # Para cada grupo con duplicados, mantener solo el más reciente
        for ubigeo, dists in grupos.items():
            if len(dists) > 1:
                # Ordenar por fecha de creación (más reciente primero)
                dists_ordenados = sorted(dists, key=lambda x: x.get('fechaCreacion', datetime.min), reverse=True)
                
                # Mantener el primero (más reciente), eliminar el resto
                for dist in dists_ordenados[1:]:
                    await collection.delete_one({"_id": dist["_id"]})
                    eliminados += 1
                
                detalles.append({
                    "nombre": dists_ordenados[0]['nombre'],
                    "ubigeo": ubigeo,
                    "duplicados_eliminados": len(dists) - 1,
                    "mantenido_id": str(dists_ordenados[0]['_id'])
                })
        
        return {
            "message": "Distritos duplicados eliminados",
            "total_eliminados": eliminados,
            "detalles": detalles
        }
        
    except Exception as e:
        logger.error(f"Error eliminando duplicados: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

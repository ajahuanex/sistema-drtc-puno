"""
Router de importación/exportación para localidades
Endpoints para importar y exportar datos desde/hacia diferentes fuentes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from fastapi.responses import StreamingResponse
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
import pandas as pd
import io
from datetime import datetime

from app.dependencies.db import get_database
from app.services.localidad_service import LocalidadService
from app.models.localidad import LocalidadCreate, TipoLocalidad

router = APIRouter(prefix="/localidades", tags=["localidades-import"])

async def get_localidad_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> LocalidadService:
    return LocalidadService(db)

@router.post("/importar")
async def importar_localidades(
    file: UploadFile = File(...),
    fuente: str = Query("MANUAL", description="Fuente: INEI, RENIEC, MANUAL"),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """
    Importar localidades desde archivo Excel/CSV
    Consolidado para todas las fuentes
    """
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Formato no soportado. Use Excel o CSV")
    
    try:
        contents = await file.read()
        
        # Leer archivo según formato
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validar columnas mínimas
        columnas_requeridas = ['nombre']
        columnas_faltantes = [col for col in columnas_requeridas if col not in df.columns]
        
        if columnas_faltantes:
            raise HTTPException(
                status_code=400,
                detail=f"Faltan columnas requeridas: {', '.join(columnas_faltantes)}"
            )
        
        localidades_creadas = 0
        errores = []
        
        for index, row in df.iterrows():
            try:
                localidad_data = {
                    'nombre': str(row['nombre']).strip()
                }
                
                # Campos opcionales
                if 'tipo' in df.columns and pd.notna(row['tipo']):
                    localidad_data['tipo'] = str(row['tipo']).upper()
                
                if 'ubigeo' in df.columns and pd.notna(row['ubigeo']):
                    localidad_data['ubigeo'] = str(row['ubigeo']).zfill(6)
                
                if 'departamento' in df.columns and pd.notna(row['departamento']):
                    localidad_data['departamento'] = str(row['departamento']).upper()
                
                if 'provincia' in df.columns and pd.notna(row['provincia']):
                    localidad_data['provincia'] = str(row['provincia']).upper()
                
                if 'distrito' in df.columns and pd.notna(row['distrito']):
                    localidad_data['distrito'] = str(row['distrito']).upper()
                
                if 'codigo' in df.columns and pd.notna(row['codigo']):
                    localidad_data['codigo'] = str(row['codigo'])
                
                if 'descripcion' in df.columns and pd.notna(row['descripcion']):
                    localidad_data['descripcion'] = str(row['descripcion'])
                
                # Coordenadas
                if 'latitud' in df.columns and 'longitud' in df.columns:
                    if pd.notna(row['latitud']) and pd.notna(row['longitud']):
                        localidad_data['coordenadas'] = {
                            'latitud': float(row['latitud']),
                            'longitud': float(row['longitud'])
                        }
                
                # Campos de centros poblados
                if 'codigo_ccpp' in df.columns and pd.notna(row['codigo_ccpp']):
                    localidad_data['codigo_ccpp'] = str(row['codigo_ccpp'])
                
                if 'tipo_area' in df.columns and pd.notna(row['tipo_area']):
                    localidad_data['tipo_area'] = str(row['tipo_area'])
                
                if 'poblacion' in df.columns and pd.notna(row['poblacion']):
                    localidad_data['poblacion'] = int(row['poblacion'])
                
                if 'altitud' in df.columns and pd.notna(row['altitud']):
                    localidad_data['altitud'] = int(row['altitud'])
                
                # Agregar metadata de fuente
                localidad_data['metadata'] = {
                    'fuenteDatos': fuente,
                    'fechaImportacion': datetime.utcnow().isoformat()
                }
                
                localidad_create = LocalidadCreate(**localidad_data)
                await service.create_localidad(localidad_create)
                localidades_creadas += 1
                
            except Exception as e:
                errores.append(f"Fila {index + 2}: {str(e)}")
        
        return {
            "message": "Importación completada",
            "fuente": fuente,
            "localidades_creadas": localidades_creadas,
            "errores": errores[:10],
            "total_errores": len(errores)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")

@router.get("/exportar")
async def exportar_localidades(
    formato: str = Query("excel", description="Formato: excel, csv"),
    service: LocalidadService = Depends(get_localidad_service)
) -> StreamingResponse:
    """Exportar localidades a Excel o CSV"""
    try:
        localidades = await service.get_localidades()
        
        # Convertir a DataFrame
        data = []
        for localidad in localidades:
            row = {
                'id': localidad.id,
                'nombre': localidad.nombre or '',
                'tipo': localidad.tipo.value if localidad.tipo else '',
                'ubigeo': localidad.ubigeo or '',
                'departamento': localidad.departamento,
                'provincia': localidad.provincia,
                'distrito': localidad.distrito,
                'codigo': localidad.codigo or '',
                'descripcion': localidad.descripcion or '',
                'observaciones': localidad.observaciones or '',
                'latitud': localidad.coordenadas.latitud if localidad.coordenadas else '',
                'longitud': localidad.coordenadas.longitud if localidad.coordenadas else '',
                'codigo_ccpp': localidad.codigo_ccpp or '',
                'tipo_area': localidad.tipo_area or '',
                'poblacion': localidad.poblacion or '',
                'altitud': localidad.altitud or '',
                'esta_activa': localidad.estaActiva,
                'fecha_creacion': localidad.fechaCreacion.strftime('%Y-%m-%d %H:%M:%S'),
                'fecha_actualizacion': localidad.fechaActualizacion.strftime('%Y-%m-%d %H:%M:%S')
            }
            data.append(row)
        
        df = pd.DataFrame(data)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if formato.lower() == 'csv':
            output = io.StringIO()
            df.to_csv(output, index=False)
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.getvalue().encode('utf-8')),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=localidades_{timestamp}.csv"}
            )
        else:
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Localidades', index=False)
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.read()),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=localidades_{timestamp}.xlsx"}
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exportando: {str(e)}")

@router.post("/operaciones-masivas")
async def operaciones_masivas_localidades(
    operacion: str = Query(..., description="Tipo de operación: activar, desactivar, eliminar"),
    ids: List[str] = Query(..., description="Lista de IDs de localidades"),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Realizar operaciones masivas en localidades"""
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

"""
Router para gestión de alias de localidades
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.dependencies.db import get_database
from app.services.localidad_alias_service import LocalidadAliasService
from app.models.localidad_alias import (
    LocalidadAlias,
    LocalidadAliasCreate,
    LocalidadAliasUpdate,
    BusquedaLocalidadResult
)

router = APIRouter(prefix="/localidades-alias", tags=["localidades-alias"])

@router.post("/", response_model=LocalidadAlias, status_code=201)
async def create_alias(
    alias_data: LocalidadAliasCreate,
    db = Depends(get_database)
):
    """Crear un nuevo alias de localidad"""
    try:
        service = LocalidadAliasService(db)
        return await service.create_alias(alias_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear alias: {str(e)}")

@router.get("/", response_model=List[LocalidadAlias])
async def get_all_alias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    solo_activos: bool = Query(True),
    db = Depends(get_database)
):
    """Obtener todos los alias"""
    try:
        service = LocalidadAliasService(db)
        return await service.get_all_alias(skip, limit, solo_activos)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener alias: {str(e)}")

@router.get("/buscar/{nombre}", response_model=BusquedaLocalidadResult)
async def buscar_por_alias(
    nombre: str,
    db = Depends(get_database)
):
    """Buscar localidad por nombre o alias"""
    try:
        service = LocalidadAliasService(db)
        result = await service.buscar_por_alias(nombre)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"No se encontró localidad ni alias para '{nombre}'"
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en búsqueda: {str(e)}")

@router.get("/estadisticas/mas-usados")
async def get_alias_mas_usados(
    limit: int = Query(10, ge=1, le=50),
    db = Depends(get_database)
):
    """Obtener los alias más usados"""
    try:
        service = LocalidadAliasService(db)
        return await service.get_alias_mas_usados(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/estadisticas/sin-usar", response_model=List[LocalidadAlias])
async def get_alias_sin_usar(
    db = Depends(get_database)
):
    """Obtener alias que no se están usando"""
    try:
        service = LocalidadAliasService(db)
        return await service.get_alias_sin_usar()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{alias_id}", response_model=LocalidadAlias)
async def get_alias_by_id(
    alias_id: str,
    db = Depends(get_database)
):
    """Obtener alias por ID"""
    try:
        service = LocalidadAliasService(db)
        alias = await service.get_alias_by_id(alias_id)
        
        if not alias:
            raise HTTPException(status_code=404, detail=f"Alias {alias_id} no encontrado")
        
        return alias
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.put("/{alias_id}", response_model=LocalidadAlias)
async def update_alias(
    alias_id: str,
    alias_data: LocalidadAliasUpdate,
    db = Depends(get_database)
):
    """Actualizar un alias"""
    try:
        service = LocalidadAliasService(db)
        alias = await service.update_alias(alias_id, alias_data)
        
        if not alias:
            raise HTTPException(status_code=404, detail=f"Alias {alias_id} no encontrado")
        
        return alias
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.delete("/{alias_id}")
async def delete_alias(
    alias_id: str,
    db = Depends(get_database)
):
    """Eliminar (desactivar) un alias"""
    try:
        service = LocalidadAliasService(db)
        success = await service.delete_alias(alias_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Alias {alias_id} no encontrado")
        
        return {"message": "Alias eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/actualizar-ids-antiguos")
async def actualizar_ids_antiguos(db = Depends(get_database)):
    """
    Actualizar los localidad_id de los alias en la colección localidades_alias
    """
    try:
        alias_collection = db.localidades_alias
        localidades_collection = db.localidades
        
        # Obtener todos los alias
        alias_docs = await alias_collection.find({}).to_list(length=None)
        
        actualizados = 0
        eliminados = 0
        errores = 0
        detalles = []
        
        for alias_doc in alias_docs:
            localidad_nombre = alias_doc.get("localidad_nombre")
            if not localidad_nombre:
                errores += 1
                detalles.append(f"Error: Alias '{alias_doc.get('alias')}' sin localidad_nombre")
                continue
            
            # Buscar la localidad principal por nombre
            localidad_principal = await localidades_collection.find_one({
                "nombre": localidad_nombre
            })
            
            if localidad_principal:
                nuevo_id = str(localidad_principal["_id"])
                id_actual = alias_doc.get("localidad_id")
                
                if nuevo_id != id_actual:
                    await alias_collection.update_one(
                        {"_id": alias_doc["_id"]},
                        {"$set": {"localidad_id": nuevo_id}}
                    )
                    actualizados += 1
                    detalles.append(f"Actualizado: {alias_doc.get('alias')} -> {localidad_nombre}")
            else:
                # Eliminar alias huérfano
                await alias_collection.delete_one({"_id": alias_doc["_id"]})
                eliminados += 1
                detalles.append(f"Eliminado: Alias '{alias_doc.get('alias')}' (localidad '{localidad_nombre}' no existe)")
        
        return {
            "total_procesados": len(alias_docs),
            "actualizados": actualizados,
            "eliminados": eliminados,
            "errores": errores,
            "detalles": detalles[:50]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

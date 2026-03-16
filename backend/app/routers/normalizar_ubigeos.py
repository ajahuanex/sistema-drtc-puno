"""
Endpoint para normalizar ubigeos de localidades según datos oficiales de GeoJSON
"""
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.db import get_database

router = APIRouter(prefix="/localidades", tags=["localidades-normalizacion"])

@router.post("/normalizar-ubigeos")
async def normalizar_ubigeos_localidades(
    eliminar_incorrectas: bool = False,
    db = Depends(get_database)
):
    """
    Normaliza los ubigeos de todas las localidades según el tipo:
    - PROVINCIA: Debe tener IDPROV de 4 dígitos (CCDD + CCPP)
    - DISTRITO: Debe tener UBIGEO de 6 dígitos (CCDD + CODPROV + CODDIST)
    - CENTRO_POBLADO: Debe tener IDCCPP de 10 dígitos (CCDD + CODPROV + CODDIST + COD_CCPP)
    
    Parámetros:
    - eliminar_incorrectas: Si es True, elimina localidades con ubigeos que no se pueden corregir
    
    Corrige ubigeos incorrectos basándose en los datos oficiales.
    """
    localidades_collection = db["localidades"]
    
    # Obtener todas las localidades
    localidades = await localidades_collection.find({}).to_list(length=None)
    
    total_procesadas = 0
    total_corregidas = 0
    total_eliminadas = 0
    total_incorrectas = 0
    errores = []
    
    for localidad in localidades:
        localidad_id = str(localidad.get("_id"))
        nombre = localidad.get("nombre", "Sin nombre")
        tipo = localidad.get("tipo")
        ubigeo_actual = localidad.get("ubigeo", "")
        
        try:
            total_procesadas += 1
            ubigeo_correcto = None
            necesita_correccion = False
            debe_eliminarse = False
            
            # Validar según tipo
            if tipo == "PROVINCIA":
                # Debe tener 4 dígitos
                if len(ubigeo_actual) != 4:
                    necesita_correccion = True
                    # Intentar extraer los primeros 4 dígitos si tiene más
                    if len(ubigeo_actual) >= 4:
                        ubigeo_correcto = ubigeo_actual[:4]
                    else:
                        debe_eliminarse = True
                        errores.append(f"PROVINCIA {nombre}: ubigeo '{ubigeo_actual}' muy corto")
                        total_incorrectas += 1
                        
            elif tipo == "DISTRITO":
                # Debe tener 6 dígitos
                if len(ubigeo_actual) != 6:
                    necesita_correccion = True
                    # Intentar extraer los primeros 6 dígitos si tiene más
                    if len(ubigeo_actual) >= 6:
                        ubigeo_correcto = ubigeo_actual[:6]
                    else:
                        debe_eliminarse = True
                        errores.append(f"DISTRITO {nombre}: ubigeo '{ubigeo_actual}' muy corto")
                        total_incorrectas += 1
                        
            elif tipo == "CENTRO_POBLADO":
                # Debe tener 10 dígitos (IDCCPP)
                if len(ubigeo_actual) != 10:
                    necesita_correccion = True
                    # Si tiene 6 dígitos, es el ubigeo del distrito, necesita completarse
                    if len(ubigeo_actual) == 6:
                        # No podemos completar automáticamente sin el código del centro poblado
                        debe_eliminarse = True
                        errores.append(f"CENTRO_POBLADO {nombre}: ubigeo '{ubigeo_actual}' incompleto (falta COD_CCPP)")
                        total_incorrectas += 1
                    elif len(ubigeo_actual) > 10:
                        ubigeo_correcto = ubigeo_actual[:10]
                    else:
                        debe_eliminarse = True
                        errores.append(f"CENTRO_POBLADO {nombre}: ubigeo '{ubigeo_actual}' muy corto")
                        total_incorrectas += 1
            
            # Eliminar si es necesario y está habilitado
            if debe_eliminarse and eliminar_incorrectas:
                await localidades_collection.delete_one({"_id": localidad["_id"]})
                total_eliminadas += 1
                print(f"🗑️ Eliminado {tipo} {nombre}: ubigeo '{ubigeo_actual}' incorrecto")
                continue
            
            # Aplicar corrección si es necesaria
            if necesita_correccion and ubigeo_correcto and not debe_eliminarse:
                await localidades_collection.update_one(
                    {"_id": localidad["_id"]},
                    {"$set": {"ubigeo": ubigeo_correcto}}
                )
                total_corregidas += 1
                print(f"✅ Corregido {tipo} {nombre}: '{ubigeo_actual}' → '{ubigeo_correcto}'")
                
        except Exception as e:
            errores.append(f"Error procesando {nombre}: {str(e)}")
    
    return {
        "mensaje": "Normalización de ubigeos completada",
        "total_procesadas": total_procesadas,
        "total_corregidas": total_corregidas,
        "total_eliminadas": total_eliminadas,
        "total_incorrectas": total_incorrectas,
        "errores": errores[:20],  # Solo primeros 20 errores
        "resumen": {
            "provincias_esperadas": "4 dígitos (IDPROV)",
            "distritos_esperados": "6 dígitos (UBIGEO)",
            "centros_poblados_esperados": "10 dígitos (IDCCPP)"
        },
        "nota": "Use eliminar_incorrectas=true para eliminar localidades que no se pueden corregir" if not eliminar_incorrectas else "Localidades incorrectas eliminadas"
    }


@router.get("/validar-ubigeos")
async def validar_ubigeos_localidades(db = Depends(get_database)):
    """
    Valida los ubigeos de todas las localidades sin modificarlos.
    Retorna un reporte de localidades con ubigeos incorrectos.
    """
    localidades_collection = db["localidades"]
    
    # Obtener todas las localidades
    localidades = await localidades_collection.find({}).to_list(length=None)
    
    incorrectas = []
    correctas = 0
    
    for localidad in localidades:
        nombre = localidad.get("nombre", "Sin nombre")
        tipo = localidad.get("tipo")
        ubigeo = localidad.get("ubigeo", "")
        
        es_correcto = False
        longitud_esperada = 0
        
        if tipo == "PROVINCIA":
            longitud_esperada = 4
            es_correcto = len(ubigeo) == 4
        elif tipo == "DISTRITO":
            longitud_esperada = 6
            es_correcto = len(ubigeo) == 6
        elif tipo == "CENTRO_POBLADO":
            longitud_esperada = 10
            es_correcto = len(ubigeo) == 10
        else:
            # Otros tipos no tienen validación estricta
            es_correcto = True
        
        if es_correcto:
            correctas += 1
        else:
            incorrectas.append({
                "id": str(localidad.get("_id")),
                "nombre": nombre,
                "tipo": tipo,
                "ubigeo_actual": ubigeo,
                "longitud_actual": len(ubigeo),
                "longitud_esperada": longitud_esperada,
                "problema": f"Debe tener {longitud_esperada} dígitos, tiene {len(ubigeo)}"
            })
    
    return {
        "total_localidades": len(localidades),
        "correctas": correctas,
        "incorrectas": len(incorrectas),
        "porcentaje_correcto": round(correctas / len(localidades) * 100, 2) if localidades else 0,
        "localidades_incorrectas": incorrectas[:50],  # Solo primeras 50
        "resumen_validacion": {
            "provincias": "Deben tener 4 dígitos (IDPROV)",
            "distritos": "Deben tener 6 dígitos (UBIGEO)",
            "centros_poblados": "Deben tener 10 dígitos (IDCCPP)"
        }
    }

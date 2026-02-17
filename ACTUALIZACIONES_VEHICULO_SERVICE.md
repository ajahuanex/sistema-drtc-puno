# ACTUALIZACIONES NECESARIAS EN VEHICULO_SERVICE.PY

## Métodos a Agregar

### 1. Método para obtener vehículo con datos técnicos completos

```python
async def get_vehiculo_completo(self, vehiculo_id: str) -> Optional[dict]:
    """
    Obtiene vehículo con datos técnicos completos mediante join
    """
    try:
        # 1. Obtener datos administrativos
        vehiculo = await self.collection.find_one({"_id": ObjectId(vehiculo_id)})
        if not vehiculo:
            return None
        
        # 2. Obtener datos técnicos si existe referencia
        datos_tecnicos = None
        vehiculo_data_id = vehiculo.get("vehiculoDataId") or vehiculo.get("vehiculoSoloId")
        
        if vehiculo_data_id:
            try:
                vehiculos_solo_collection = self.db["vehiculos_solo"]
                vehiculo_solo = await vehiculos_solo_collection.find_one(
                    {"_id": ObjectId(vehiculo_data_id)}
                )
                
                if vehiculo_solo:
                    # Mapear campos de vehiculo_solo a formato esperado
                    datos_tecnicos = {
                        "marca": vehiculo_solo.get("marca"),
                        "modelo": vehiculo_solo.get("modelo"),
                        "version": vehiculo_solo.get("version"),
                        "anioFabricacion": vehiculo_solo.get("anio_fabricacion"),
                        "anioModelo": vehiculo_solo.get("anio_modelo"),
                        "categoria": vehiculo_solo.get("categoria"),
                        "carroceria": vehiculo_solo.get("carroceria"),
                        "color": vehiculo_solo.get("color"),
                        "combustible": vehiculo_solo.get("combustible"),
                        "motor": vehiculo_solo.get("numero_motor"),
                        "chasis": vehiculo_solo.get("numero_serie"),
                        "vin": vehiculo_solo.get("vin"),
                        "asientos": vehiculo_solo.get("numero_asientos"),
                        "pasajeros": vehiculo_solo.get("numero_pasajeros"),
                        "ejes": vehiculo_solo.get("numero_ejes"),
                        "ruedas": vehiculo_solo.get("numero_ruedas"),
                        "pesoSeco": vehiculo_solo.get("peso_seco"),
                        "pesoBruto": vehiculo_solo.get("peso_bruto"),
                        "cargaUtil": vehiculo_solo.get("carga_util"),
                        "cilindrada": vehiculo_solo.get("cilindrada"),
                        "potencia": vehiculo_solo.get("potencia"),
                        "transmision": vehiculo_solo.get("transmision"),
                        "traccion": vehiculo_solo.get("traccion"),
                        "medidas": {
                            "largo": vehiculo_solo.get("longitud"),
                            "ancho": vehiculo_solo.get("ancho"),
                            "alto": vehiculo_solo.get("altura")
                        },
                        "estadoFisico": vehiculo_solo.get("estado_fisico"),
                        "kilometraje": vehiculo_solo.get("kilometraje"),
                        "paisOrigen": vehiculo_solo.get("pais_origen"),
                        "paisProcedencia": vehiculo_solo.get("pais_procedencia")
                    }
            except Exception as e:
                print(f"⚠️ Error obteniendo datos técnicos: {e}")
                datos_tecnicos = None
        
        # 3. Combinar datos
        vehiculo["id"] = str(vehiculo.pop("_id"))
        vehiculo["datosTecnicos"] = datos_tecnicos
        
        # 4. Agregar campos legacy para compatibilidad
        if datos_tecnicos:
            vehiculo["marca"] = datos_tecnicos.get("marca")
            vehiculo["modelo"] = datos_tecnicos.get("modelo")
            vehiculo["anioFabricacion"] = datos_tecnicos.get("anioFabricacion")
            vehiculo["categoria"] = datos_tecnicos.get("categoria")
            vehiculo["color"] = datos_tecnicos.get("color")
        
        return vehiculo
        
    except Exception as e:
        print(f"❌ Error en get_vehiculo_completo: {e}")
        return None
```

### 2. Método para obtener múltiples vehículos con datos técnicos

```python
async def get_vehiculos_completos(
    self,
    skip: int = 0,
    limit: int = 100,
    empresa_id: Optional[str] = None,
    estado: Optional[str] = None,
    incluir_inactivos: bool = False
) -> List[dict]:
    """
    Obtiene lista de vehículos con datos técnicos completos
    Usa aggregation pipeline para mejor performance
    """
    
    # Construir query base
    match_stage = {}
    
    if not incluir_inactivos:
        match_stage["estaActivo"] = {"$ne": False}
    
    if empresa_id:
        match_stage["empresaActualId"] = empresa_id
    
    if estado:
        match_stage["estado"] = estado
    
    # Pipeline de agregación con lookup
    pipeline = [
        {"$match": match_stage},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "vehiculos_solo",
                "let": {
                    "vehiculo_data_id": {
                        "$cond": {
                            "if": {"$ne": ["$vehiculoDataId", None]},
                            "then": {"$toObjectId": "$vehiculoDataId"},
                            "else": {
                                "$cond": {
                                    "if": {"$ne": ["$vehiculoSoloId", None]},
                                    "then": {"$toObjectId": "$vehiculoSoloId"},
                                    "else": None
                                }
                            }
                        }
                    }
                },
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$_id", "$$vehiculo_data_id"]}}}
                ],
                "as": "vehiculo_data"
            }
        },
        {
            "$addFields": {
                "datosTecnicos": {
                    "$cond": {
                        "if": {"$gt": [{"$size": "$vehiculo_data"}, 0]},
                        "then": {"$arrayElemAt": ["$vehiculo_data", 0]},
                        "else": None
                    }
                }
            }
        },
        {"$project": {"vehiculo_data": 0}}
    ]
    
    vehiculos = []
    async for vehiculo in self.collection.aggregate(pipeline):
        vehiculo["id"] = str(vehiculo.pop("_id"))
        
        # Mapear datos técnicos si existen
        if vehiculo.get("datosTecnicos"):
            dt = vehiculo["datosTecnicos"]
            vehiculo["datosTecnicos"] = {
                "marca": dt.get("marca"),
                "modelo": dt.get("modelo"),
                "anioFabricacion": dt.get("anio_fabricacion"),
                "categoria": dt.get("categoria"),
                "color": dt.get("color"),
                "motor": dt.get("numero_motor"),
                "chasis": dt.get("numero_serie"),
                "asientos": dt.get("numero_asientos"),
                "ejes": dt.get("numero_ejes"),
                # ... más campos según necesidad
            }
            
            # Campos legacy
            vehiculo["marca"] = dt.get("marca")
            vehiculo["modelo"] = dt.get("modelo")
            vehiculo["anioFabricacion"] = dt.get("anio_fabricacion")
            vehiculo["categoria"] = dt.get("categoria")
        
        vehiculos.append(vehiculo)
    
    return vehiculos
```

### 3. Actualizar método create_vehiculo

```python
async def create_vehiculo(self, vehiculo_data: VehiculoCreate) -> VehiculoInDB:
    """Crear un nuevo vehículo - ACTUALIZADO para usar vehiculoDataId"""
    
    # Verificar si la placa ya existe
    existing = await self.collection.find_one({"placa": vehiculo_data.placa})
    if existing:
        raise VehiculoAlreadyExistsException(vehiculo_data.placa)
    
    # NUEVO: Validar que vehiculoDataId existe (si se proporciona)
    vehiculo_data_id = vehiculo_data.vehiculoDataId or vehiculo_data.vehiculoSoloId
    
    if vehiculo_data_id:
        vehiculos_solo_collection = self.db["vehiculos_solo"]
        vehiculo_solo = await vehiculos_solo_collection.find_one(
            {"_id": ObjectId(vehiculo_data_id)}
        )
        if not vehiculo_solo:
            raise ValidationErrorException(
                "vehiculoDataId",
                f"No se encontraron datos técnicos con ID: {vehiculo_data_id}"
            )
    
    # Preparar datos - SOLO CAMPOS ADMINISTRATIVOS
    vehiculo_dict = {
        "placa": vehiculo_data.placa,
        "vehiculoDataId": vehiculo_data_id,
        "empresaActualId": vehiculo_data.empresaActualId,
        "tipoServicio": vehiculo_data.tipoServicio,
        "resolucionId": vehiculo_data.resolucionId,
        "rutasAsignadasIds": vehiculo_data.rutasAsignadasIds or [],
        "rutasEspecificas": vehiculo_data.rutasEspecificas or [],
        "estado": vehiculo_data.estado or "ACTIVO",
        "sedeRegistro": vehiculo_data.sedeRegistro or "PUNO",
        "observaciones": vehiculo_data.observaciones,
        "estaActivo": True,
        "documentosIds": [],
        "historialIds": [],
        "esHistorialActual": True,
        "fechaRegistro": datetime.now(),
        "fechaActualizacion": datetime.now()
    }
    
    # Campos opcionales
    if vehiculo_data.placaSustituida:
        vehiculo_dict["placaSustituida"] = vehiculo_data.placaSustituida
    if vehiculo_data.fechaSustitucion:
        vehiculo_dict["fechaSustitucion"] = vehiculo_data.fechaSustitucion
    if vehiculo_data.motivoSustitucion:
        vehiculo_dict["motivoSustitucion"] = vehiculo_data.motivoSustitucion
    if vehiculo_data.numeroTuc:
        vehiculo_dict["numeroTuc"] = vehiculo_data.numeroTuc
    
    # COMPATIBILIDAD LEGACY: Guardar campos deprecated si vienen
    if vehiculo_data.marca:
        vehiculo_dict["marca"] = vehiculo_data.marca
    if vehiculo_data.modelo:
        vehiculo_dict["modelo"] = vehiculo_data.modelo
    if vehiculo_data.anioFabricacion:
        vehiculo_dict["anioFabricacion"] = vehiculo_data.anioFabricacion
    if vehiculo_data.categoria:
        vehiculo_dict["categoria"] = vehiculo_data.categoria
    if vehiculo_data.datosTecnicos:
        vehiculo_dict["datosTecnicos"] = vehiculo_data.datosTecnicos
    
    # Insertar en MongoDB
    insert_result = await self.collection.insert_one(vehiculo_dict)
    vehiculo_id = str(insert_result.inserted_id)
    
    # Actualizar empresa
    if vehiculo_data.empresaActualId:
        try:
            empresa_query = {}
            if ObjectId.is_valid(vehiculo_data.empresaActualId):
                empresa_query = {"_id": ObjectId(vehiculo_data.empresaActualId)}
            else:
                empresa_query = {"id": vehiculo_data.empresaActualId}
            
            await self.empresas_collection.update_one(
                empresa_query,
                {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
            )
        except Exception as e:
            print(f"⚠️ Error actualizando empresa: {e}")
    
    # Actualizar resolución
    if vehiculo_data.resolucionId:
        try:
            resoluciones_collection = self.db["resoluciones"]
            resolucion_query = {}
            if ObjectId.is_valid(vehiculo_data.resolucionId):
                resolucion_query = {"$or": [
                    {"_id": ObjectId(vehiculo_data.resolucionId)},
                    {"id": vehiculo_data.resolucionId}
                ]}
            else:
                resolucion_query = {"id": vehiculo_data.resolucionId}
            
            await resoluciones_collection.update_one(
                resolucion_query,
                {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
            )
        except Exception as e:
            print(f"⚠️ Error actualizando resolución: {e}")
    
    # Obtener el vehículo creado con datos completos
    return await self.get_vehiculo_completo(vehiculo_id)
```

## Resumen de Cambios

1. ✅ Nuevo método `get_vehiculo_completo()` - Join con vehiculos_solo
2. ✅ Nuevo método `get_vehiculos_completos()` - Aggregation pipeline
3. ✅ Actualizado `create_vehiculo()` - Validación de vehiculoDataId
4. ✅ Mantener compatibilidad legacy con campos deprecated
5. ✅ Mapeo de campos entre vehiculos_solo y formato esperado

## Próximos Pasos

1. Aplicar estos cambios a `vehiculo_service.py`
2. Actualizar `vehiculos_router.py` para usar nuevos métodos
3. Crear tests unitarios
4. Documentar API actualizada

# SOLUCIÓN: Error CORS y 500 en Endpoint de Vehículos

**Fecha:** 16 de febrero de 2026  
**Problema:** Error CORS y 500 Internal Server Error al cargar vehículos

---

## 🔴 ERRORES IDENTIFICADOS

### 1. Error CORS
```
Access to fetch at 'http://localhost:8000/api/v1/vehiculos/' 
from origin 'http://localhost:4200' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present
```

### 2. Error 500 Internal Server Error
```
GET http://localhost:8000/api/v1/vehiculos/ 
net::ERR_FAILED 500 (Internal Server Error)
```

### 3. Redirección Incorrecta
```
redirected from 'http://localhost:8000/api/v1/vehiculos'
```
El endpoint sin `/` al final está redirigiendo, lo que causa problemas con CORS.

---

## 🔍 ANÁLISIS DEL MODELO DE DATOS

### **Frontend (TypeScript)**
```typescript
export interface Vehiculo {
  id: string;
  placa: string;
  vehiculoDataId: string;  // ← Referencia a datos técnicos
  empresaActualId: string;
  tipoServicio: string;
  rutasAsignadasIds: string[];
  estado: EstadoVehiculo | string;
  // ... más campos
  
  // Campos legacy para compatibilidad
  datosTecnicos?: DatosTecnicos;
  marca?: string;
  modelo?: string;
  categoria?: string;
}
```

### **Backend (Python)**
```python
class Vehiculo(BaseModel):
    id: Optional[str] = None
    placa: str
    vehiculoDataId: Optional[str] = None  # ← Referencia a VehiculoData
    empresaActualId: str
    tipoServicio: Optional[str] = None
    rutasAsignadasIds: List[str] = []
    estado: EstadoVehiculo = EstadoVehiculo.ACTIVO
    # ... más campos
    
    # Campos legacy (temporal)
    categoria: Optional[str] = None
    marca: Optional[str] = None
    # ...
```

**✅ Los modelos están alineados correctamente**

---

## 🛠️ SOLUCIONES

### **Solución 1: Verificar CORS en el Backend**

**Archivo:** `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CONFIGURACIÓN CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:4201",  # Por si usas otro puerto
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permitir todos los headers
    expose_headers=["*"]  # Exponer todos los headers en la respuesta
)
```

### **Solución 2: Verificar el Endpoint de Vehículos**

**Archivo:** `backend/app/routers/vehiculos_router.py`

Verificar que el endpoint esté correctamente definido:

```python
@router.get("/", response_model=List[VehiculoResponse])
async def get_vehiculos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    incluir_inactivos: bool = False,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Obtener lista de vehículos"""
    try:
        vehiculos = await vehiculo_service.get_vehiculos(
            skip=skip,
            limit=limit,
            incluir_inactivos=incluir_inactivos
        )
        return [vehiculo_to_response(v) for v in vehiculos]
    except Exception as e:
        print(f"❌ Error en get_vehiculos: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### **Solución 3: Verificar el Servicio de Vehículos**

**Archivo:** `backend/app/services/vehiculo_service.py`

Asegurarse de que el método `get_vehiculos` maneje correctamente los datos:

```python
async def get_vehiculos(
    self, 
    skip: int = 0, 
    limit: int = 100,
    empresa_id: Optional[str] = None,
    estado: Optional[str] = None,
    incluir_inactivos: bool = False
) -> List[VehiculoInDB]:
    """Obtener lista de vehículos con filtros opcionales"""
    
    query = {}
    
    # Por defecto, solo mostrar vehículos activos
    if not incluir_inactivos:
        query["estaActivo"] = {"$ne": False}
    
    if empresa_id:
        query["empresaActualId"] = empresa_id
    
    if estado:
        query["estado"] = estado
    
    try:
        cursor = self.collection.find(query).skip(skip).limit(limit)
        vehiculos = []
        
        async for vehiculo in cursor:
            vehiculo["id"] = str(vehiculo.pop("_id"))
            vehiculos.append(VehiculoInDB(**vehiculo))
        
        return vehiculos
    except Exception as e:
        print(f"❌ Error en get_vehiculos service: {e}")
        raise
```

### **Solución 4: Verificar la Función `vehiculo_to_response`**

Esta función puede estar causando el error 500 si no maneja correctamente los campos:

```python
def vehiculo_to_response(vehiculo: VehiculoInDB) -> VehiculoResponse:
    """Convertir VehiculoInDB a VehiculoResponse manejando campos faltantes"""
    
    # Convertir datosTecnicos si es necesario
    datos_tecnicos = getattr(vehiculo, 'datosTecnicos', None)
    if datos_tecnicos:
        if hasattr(datos_tecnicos, 'model_dump'):
            datos_tecnicos = datos_tecnicos.model_dump()
        elif hasattr(datos_tecnicos, 'dict'):
            datos_tecnicos = datos_tecnicos.dict()
    
    # Construir respuesta con valores por defecto seguros
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        vehiculoDataId=getattr(vehiculo, 'vehiculoDataId', None) or getattr(vehiculo, 'vehiculoSoloId', None),
        empresaActualId=vehiculo.empresaActualId,
        tipoServicio=getattr(vehiculo, 'tipoServicio', 'NO_ESPECIFICADO'),
        resolucionId=vehiculo.resolucionId,
        rutasAsignadasIds=vehiculo.rutasAsignadasIds or [],
        rutasEspecificas=getattr(vehiculo, 'rutasEspecificas', []),
        categoria=getattr(vehiculo, 'categoria', None),
        marca=getattr(vehiculo, 'marca', None),
        modelo=getattr(vehiculo, 'modelo', None),
        anioFabricacion=getattr(vehiculo, 'anioFabricacion', None),
        estado=vehiculo.estado,
        estaActivo=vehiculo.estaActivo,
        sedeRegistro=getattr(vehiculo, 'sedeRegistro', 'PUNO'),
        observaciones=getattr(vehiculo, 'observaciones', None),
        placaSustituida=getattr(vehiculo, 'placaSustituida', None),
        fechaSustitucion=getattr(vehiculo, 'fechaSustitucion', None),
        motivoSustitucion=getattr(vehiculo, 'motivoSustitucion', None),
        resolucionSustitucion=getattr(vehiculo, 'resolucionSustitucion', None),
        numeroTuc=getattr(vehiculo, 'numeroTuc', None),
        tuc=getattr(vehiculo, 'tuc', None),
        documentosIds=vehiculo.documentosIds or [],
        historialIds=vehiculo.historialIds or [],
        numeroHistorialValidacion=getattr(vehiculo, 'numeroHistorialValidacion', None),
        esHistorialActual=getattr(vehiculo, 'esHistorialActual', True),
        vehiculoHistorialActualId=getattr(vehiculo, 'vehiculoHistorialActualId', None),
        fechaRegistro=vehiculo.fechaRegistro,
        fechaActualizacion=vehiculo.fechaActualizacion,
        datosTecnicos=datos_tecnicos,
        color=getattr(vehiculo, 'color', None),
        numeroSerie=getattr(vehiculo, 'numeroSerie', None),
        carroceria=getattr(vehiculo, 'carroceria', None)
    )
```

### **Solución 5: Agregar Logging para Debugging**

Agregar logs en el endpoint para identificar el error exacto:

```python
@router.get("/", response_model=List[VehiculoResponse])
async def get_vehiculos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    incluir_inactivos: bool = False,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Obtener lista de vehículos"""
    print(f"🔍 GET /vehiculos - skip={skip}, limit={limit}, incluir_inactivos={incluir_inactivos}")
    
    try:
        vehiculos = await vehiculo_service.get_vehiculos(
            skip=skip,
            limit=limit,
            incluir_inactivos=incluir_inactivos
        )
        
        print(f"✅ Vehículos obtenidos: {len(vehiculos)}")
        
        # Convertir a response
        responses = []
        for i, vehiculo in enumerate(vehiculos):
            try:
                response = vehiculo_to_response(vehiculo)
                responses.append(response)
            except Exception as e:
                print(f"❌ Error convirtiendo vehículo {i} (placa: {vehiculo.placa}): {e}")
                # Continuar con los demás vehículos
                continue
        
        print(f"✅ Responses generados: {len(responses)}")
        return responses
        
    except Exception as e:
        print(f"❌ Error en get_vehiculos endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error obteniendo vehículos: {str(e)}")
```

---

## 🚀 PASOS PARA APLICAR LA SOLUCIÓN

### **1. Verificar y Actualizar CORS**

```bash
# Editar backend/app/main.py
# Asegurarse de que CORS esté configurado correctamente
```

### **2. Reiniciar el Servidor Backend**

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **3. Verificar el Endpoint Manualmente**

```bash
# Probar el endpoint directamente
curl http://localhost:8000/api/v1/vehiculos/

# O con parámetros
curl "http://localhost:8000/api/v1/vehiculos/?skip=0&limit=10"
```

### **4. Revisar los Logs del Backend**

Observar la consola del backend para ver los mensajes de log y identificar el error exacto.

### **5. Verificar la Base de Datos**

```bash
# Conectarse a MongoDB y verificar los datos
mongosh

use drtc_puno

# Ver un vehículo de ejemplo
db.vehiculos.findOne()

# Contar vehículos
db.vehiculos.countDocuments()
```

---

## 🔧 SOLUCIÓN RÁPIDA (Quick Fix)

Si el problema persiste, crear un endpoint de debug:

```python
@router.get("/debug-simple")
async def debug_simple_vehiculos(
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Endpoint de debug simplificado"""
    try:
        # Obtener directamente de la colección
        vehiculos = []
        async for doc in vehiculo_service.collection.find({}).limit(5):
            doc["_id"] = str(doc["_id"])
            vehiculos.append(doc)
        
        return {
            "success": True,
            "count": len(vehiculos),
            "vehiculos": vehiculos
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
```

Luego probar:
```bash
curl http://localhost:8000/api/v1/vehiculos/debug-simple
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] CORS configurado correctamente en `main.py`
- [ ] Endpoint `/vehiculos/` (con slash) definido correctamente
- [ ] Servicio `get_vehiculos` maneja excepciones
- [ ] Función `vehiculo_to_response` maneja campos opcionales
- [ ] Logs agregados para debugging
- [ ] Backend reiniciado
- [ ] Endpoint probado con curl
- [ ] Base de datos tiene datos válidos
- [ ] Frontend puede conectarse al backend

---

## 🎯 CAUSA MÁS PROBABLE

El error 500 probablemente se debe a:

1. **Campo faltante en la conversión**: `vehiculo_to_response` intenta acceder a un campo que no existe en algunos vehículos
2. **Tipo de dato incorrecto**: Algún campo tiene un tipo de dato que no coincide con el modelo
3. **Error en la serialización**: Pydantic no puede serializar algún campo (como fechas o enums)

**Solución:** Usar `getattr()` con valores por defecto para todos los campos opcionales.

---

**Estado:** 🔧 SOLUCIÓN LISTA PARA APLICAR

# 🔍 Diagnóstico Completo - Tablas No Funcionan

## 📋 Checklist de Verificación

### 1. Backend
```bash
# ¿Está corriendo?
curl http://localhost:8000/docs
# Debe abrir Swagger UI

# ¿Responde el endpoint de vehículos?
curl http://localhost:8000/vehiculos
# Debe retornar JSON con vehículos
```

### 2. Frontend
```bash
# ¿Está corriendo?
# Abrir http://localhost:4200
# Debe cargar la aplicación

# ¿Hay errores en consola?
# F12 → Console
# No debe haber errores rojos
```

### 3. MongoDB
```bash
# ¿Está corriendo?
# Windows
net start MongoDB

# ¿Hay datos?
# En MongoDB Compass:
db.vehiculos.find().limit(5)
db.empresas.find().limit(5)
db.localidades.find().limit(5)
```

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "Cannot read property 'marca' of undefined"

**Causa:** Vehículos sin campos opcionales

**Solución Aplicada:**
- ✅ Frontend: Agregado `|| 'N/A'` en templates
- ✅ Backend: Agregado `getattr()` en helpers

**Verificar:**
```typescript
// En vehiculos.component.html
{{ vehiculo.marca || 'N/A' }}  // ✅ Correcto
{{ vehiculo.marca }}            // ❌ Incorrecto
```

### Problema 2: "tipoServicio is required"

**Causa:** Vehículos antiguos sin el nuevo campo

**Solución:**
```javascript
// En MongoDB Compass
db.vehiculos.updateMany(
  { tipoServicio: { $exists: false } },
  { $set: { tipoServicio: "NO_ESPECIFICADO" } }
)
```

### Problema 3: Tabla Vacía Sin Errores

**Causa:** Datos no llegan del backend

**Verificar:**
1. Abrir DevTools (F12)
2. Ir a Network tab
3. Refrescar página
4. Buscar request a `/vehiculos`
5. Ver la respuesta

**Solución:**
- Si respuesta está vacía: No hay datos en BD
- Si hay error 401: Problema de autenticación
- Si hay error 500: Error en backend

### Problema 4: "Failed to fetch"

**Causa:** Backend no está corriendo o CORS

**Solución:**
```bash
# Verificar que backend esté en puerto 8000
cd backend
uvicorn app.main:app --reload --port 8000

# Verificar CORS en backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problema 5: Tabla Carga Pero Sin Datos

**Causa:** Filtros activos o paginación

**Solución:**
1. Limpiar todos los filtros
2. Verificar que paginación esté en página 1
3. Verificar que `dataSource.data` tenga elementos

```typescript
// En consola del navegador
// Obtener referencia al componente
ng.getComponent($0).vehiculos()
// Debe mostrar array con vehículos
```

## 🔧 Correcciones Aplicadas

### Frontend

#### 1. `vehiculos.component.html`
```html
<!-- Antes -->
<span>{{ vehiculo.marca }}</span>

<!-- Después -->
<span>{{ vehiculo.marca || 'N/A' }}</span>
```

#### 2. `vehiculo-detalle.component.ts`
```typescript
// Antes
{{ vehiculo().datosTecnicos.motor }}

// Después
{{ vehiculo().datosTecnicos?.motor || 'N/A' }}
```

#### 3. `vehiculos-consolidado.component.ts`
```typescript
// Antes
return vehiculo.marca.toLowerCase()

// Después
return vehiculo.marca?.toLowerCase() || false
```

### Backend

#### 1. `vehiculos_router.py`
```python
# Antes
marca=vehiculo.marca

# Después
marca=getattr(vehiculo, 'marca', None)
```

#### 2. `vehiculo.py` (modelo)
```python
# Campos opcionales
marca: Optional[str] = None
modelo: Optional[str] = None
categoria: Optional[str] = None
tipoServicio: Optional[str] = None
vehiculoDataId: Optional[str] = None
```

## 📊 Script de Diagnóstico Automático

```python
# diagnostico.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def diagnosticar():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["sirret_db"]
    
    print("🔍 DIAGNÓSTICO DEL SISTEMA")
    print("="*60)
    
    # 1. Verificar colecciones
    collections = await db.list_collection_names()
    print(f"\n✅ Colecciones encontradas: {len(collections)}")
    for col in ['vehiculos', 'empresas', 'localidades', 'rutas']:
        if col in collections:
            count = await db[col].count_documents({})
            print(f"   - {col}: {count} documentos")
        else:
            print(f"   ❌ {col}: NO EXISTE")
    
    # 2. Verificar vehículos problemáticos
    vehiculos = db["vehiculos"]
    
    sin_tipo_servicio = await vehiculos.count_documents({
        "tipoServicio": {"$exists": False}
    })
    print(f"\n⚠️  Vehículos sin tipoServicio: {sin_tipo_servicio}")
    
    sin_vehiculo_data_id = await vehiculos.count_documents({
        "vehiculoDataId": {"$exists": False},
        "vehiculoSoloId": {"$exists": False}
    })
    print(f"⚠️  Vehículos sin vehiculoDataId: {sin_vehiculo_data_id}")
    
    sin_marca = await vehiculos.count_documents({
        "marca": {"$exists": False}
    })
    print(f"⚠️  Vehículos sin marca: {sin_marca}")
    
    # 3. Mostrar ejemplo de vehículo
    ejemplo = await vehiculos.find_one({})
    if ejemplo:
        print(f"\n📄 Ejemplo de vehículo:")
        print(f"   Placa: {ejemplo.get('placa')}")
        print(f"   Marca: {ejemplo.get('marca', 'N/A')}")
        print(f"   TipoServicio: {ejemplo.get('tipoServicio', 'N/A')}")
        print(f"   VehiculoDataId: {ejemplo.get('vehiculoDataId', 'N/A')}")
    
    # 4. Recomendaciones
    print(f"\n💡 RECOMENDACIONES:")
    if sin_tipo_servicio > 0:
        print(f"   - Ejecutar migración para agregar tipoServicio")
    if sin_vehiculo_data_id > 0:
        print(f"   - Ejecutar migración para agregar vehiculoDataId")
    if sin_marca > 0:
        print(f"   - Estos vehículos mostrarán 'N/A' en la tabla")
    
    if sin_tipo_servicio == 0 and sin_vehiculo_data_id == 0:
        print(f"   ✅ Base de datos está lista!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(diagnosticar())
```

Ejecutar:
```bash
cd backend
python diagnostico.py
```

## 🚀 Plan de Acción

### Paso 1: Verificar Estado Actual
```bash
# 1. Backend corriendo
curl http://localhost:8000/vehiculos

# 2. Frontend corriendo
# Abrir http://localhost:4200

# 3. MongoDB corriendo
# Abrir MongoDB Compass
```

### Paso 2: Aplicar Correcciones
```bash
# 1. Reiniciar backend
cd backend
# Ctrl+C
uvicorn app.main:app --reload

# 2. Refrescar frontend
# En navegador: Ctrl+Shift+R
```

### Paso 3: Migrar Datos (Si es necesario)
```javascript
// En MongoDB Compass
db.vehiculos.updateMany(
  { tipoServicio: { $exists: false } },
  { $set: { tipoServicio: "NO_ESPECIFICADO" } }
)
```

### Paso 4: Verificar Funcionamiento
1. Abrir http://localhost:4200/vehiculos
2. Tabla debe cargar
3. Vehículos deben mostrarse
4. No debe haber errores en consola

## ✅ Criterios de Éxito

- [ ] Backend responde en http://localhost:8000
- [ ] Frontend carga en http://localhost:4200
- [ ] Tabla de vehículos muestra datos
- [ ] Tabla de empresas muestra datos
- [ ] Tabla de localidades muestra datos
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en terminal del backend
- [ ] Campos opcionales muestran "N/A"
- [ ] Botones de acciones funcionan

## 📞 Siguiente Paso

Si después de seguir todos estos pasos las tablas aún no funcionan:

1. **Captura de pantalla** de la tabla
2. **Errores completos** de la consola (F12)
3. **Response del backend** (Network tab)
4. **Versión de navegador**

---

**Última actualización:** 9 de Febrero de 2026

# Soluciones: Modales y Relaciones de Empresa

## Problema 1: Modales Tapados por el Menú

### ✅ Solución Aplicada

Se agregaron reglas de z-index en `frontend/src/styles.scss` para asegurar que los modales siempre estén encima de todo:

```scss
/* Z-INDEX FIX PARA MODALES */
.cdk-overlay-container {
  z-index: 9999 !important;
}

.cdk-overlay-pane {
  z-index: 10000 !important;
}

.mat-dialog-container {
  z-index: 10001 !important;
}

.mat-menu-panel {
  z-index: 10002 !important;
}

/* Sidebar no debe tapar modales */
.mat-sidenav,
.mat-drawer {
  z-index: 100 !important;
}
```

### Verificación
Después de reiniciar el servidor, los modales deberían aparecer encima del menú lateral.

---

## Problema 2: Empresa sin Mostrar Resoluciones ni Vehículos

### Diagnóstico

El componente de detalle de empresa (`empresa-detail.component.ts`) está cargando las resoluciones correctamente:

```typescript
cargarResolucionesEmpresa(empresaId: string): void {
  this.resolucionService.getResoluciones(0, 100, undefined, empresaId).subscribe({
    next: (resoluciones) => {
      this.resoluciones = resoluciones;
    }
  });
}
```

### Posibles Causas

1. **Backend no devuelve resoluciones filtradas por empresa**
   - El endpoint `/resoluciones` con filtro `empresaId` no funciona correctamente

2. **Resoluciones no están asociadas a la empresa**
   - Al crear una resolución, no se guarda el `empresaId`

3. **Vehículos no están en el array de la empresa**
   - Los vehículos no se agregan a `vehiculosHabilitadosIds`

### Soluciones

#### Solución A: Verificar Backend

1. **Verificar endpoint de resoluciones**:
```bash
# Probar el endpoint con filtro de empresa
curl "http://localhost:8000/api/resoluciones?empresaId=<ID_EMPRESA>"
```

2. **Verificar que las resoluciones tengan empresaId**:
```python
# En el backend, verificar que al crear resolución se guarde empresaId
# backend/app/routers/resoluciones_router.py
```

#### Solución B: Verificar Creación de Resoluciones

Cuando se crea una resolución desde el detalle de empresa, debe incluir el `empresaId`:

```typescript
// En crear-resolucion-modal.component.ts
crearResolucion() {
  const resolucionData = {
    ...this.form.value,
    empresaId: this.data.empresaId  // ← Debe incluirse
  };
}
```

#### Solución C: Verificar Relación Vehículos-Empresa

Cuando se crea un vehículo, debe agregarse al array de la empresa:

```python
# backend/app/services/vehiculo_service.py
async def create_vehiculo(vehiculo_data):
    # Crear vehículo
    vehiculo = await vehiculos_collection.insert_one(vehiculo_data)
    
    # Agregar a la empresa
    await empresas_collection.update_one(
        {"_id": ObjectId(vehiculo_data["empresaActualId"])},
        {"$addToSet": {"vehiculosHabilitadosIds": str(vehiculo.inserted_id)}}
    )
```

### Verificación Rápida

#### 1. Verificar Resoluciones en MongoDB

```bash
# Conectar a MongoDB
mongo

# Usar la base de datos
use drtc_puno

# Ver resoluciones de una empresa
db.resoluciones.find({ empresaId: "ID_EMPRESA" })
```

#### 2. Verificar Vehículos en MongoDB

```bash
# Ver vehículos de una empresa
db.vehiculos.find({ empresaActualId: "ID_EMPRESA" })

# Ver si la empresa tiene los IDs de vehículos
db.empresas.findOne({ _id: ObjectId("ID_EMPRESA") }, { vehiculosHabilitadosIds: 1 })
```

#### 3. Verificar en el Frontend

Abrir la consola del navegador (F12) y verificar:

```javascript
// Ver qué devuelve el servicio
// En la pestaña Network, buscar la llamada a /resoluciones
// Verificar que devuelva datos
```

### Script de Verificación

Crear un script para verificar las relaciones:

```python
# verificar_relaciones_empresa.py
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['drtc_puno']

empresa_id = "ID_EMPRESA"  # Reemplazar con ID real

# Verificar empresa
empresa = db.empresas.find_one({"_id": ObjectId(empresa_id)})
print(f"Empresa: {empresa['razonSocial']}")
print(f"Vehículos en array: {len(empresa.get('vehiculosHabilitadosIds', []))}")
print(f"Resoluciones en array: {len(empresa.get('resolucionesPrimigeniasIds', []))}")

# Verificar resoluciones
resoluciones = list(db.resoluciones.find({"empresaId": empresa_id}))
print(f"\nResoluciones en DB: {len(resoluciones)}")
for res in resoluciones:
    print(f"  - {res['nroResolucion']}: {res.get('empresaId', 'SIN EMPRESA')}")

# Verificar vehículos
vehiculos = list(db.vehiculos.find({"empresaActualId": empresa_id}))
print(f"\nVehículos en DB: {len(vehiculos)}")
for veh in vehiculos:
    print(f"  - {veh['placa']}: {veh.get('empresaActualId', 'SIN EMPRESA')}")
```

### Solución Temporal (Frontend)

Si el backend no está devolviendo las relaciones correctamente, podemos cargar los datos directamente:

```typescript
// En empresa-detail.component.ts
cargarVehiculosEmpresa(empresaId: string): void {
  // Cargar TODOS los vehículos y filtrar por empresaId
  this.vehiculoService.getVehiculos().subscribe({
    next: (vehiculos) => {
      this.vehiculos = vehiculos.filter(v => v.empresaActualId === empresaId);
    }
  });
}
```

### Próximos Pasos

1. **Reiniciar servidor frontend** para aplicar fix de z-index
2. **Verificar en MongoDB** si las relaciones existen
3. **Revisar backend** para asegurar que guarda las relaciones
4. **Probar creación** de resolución y vehículo desde el detalle de empresa

---

## Resumen

### Problema 1: Modales
- ✅ **Solucionado**: Agregadas reglas de z-index en styles.scss
- **Acción**: Reiniciar servidor frontend

### Problema 2: Relaciones
- ⏳ **En investigación**: Verificar backend y MongoDB
- **Acción**: Ejecutar scripts de verificación
- **Posible causa**: Backend no guarda/devuelve relaciones correctamente

---

**Fecha**: 4 de diciembre de 2024
**Estado**: Problema 1 solucionado, Problema 2 requiere verificación

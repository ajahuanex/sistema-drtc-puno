# 📊 ANÁLISIS: Estructura de Resoluciones, Vehículos y Rutas

## 🔍 Estructura Actual

### Modelo de Resolución
```python
class Resolucion:
    id: str
    nroResolucion: str
    empresaId: str
    tipoResolucion: TipoResolucion  # PADRE o HIJO
    tipoTramite: TipoTramite  # AUTORIZACION_NUEVA, RENOVACION, etc.
    
    # Arrays de relaciones
    resolucionesHijasIds: List[str]  # IDs de resoluciones hijas
    vehiculosHabilitadosIds: List[str]  # ✅ IDs de vehículos habilitados
    rutasAutorizadasIds: List[str]  # ✅ IDs de rutas autorizadas
```

### Modelo de Vehículo
```python
class Vehiculo:
    id: str
    placa: str
    empresaActualId: str
    resolucionId: Optional[str]  # ✅ ID de la resolución
    rutasAsignadasIds: List[str]  # ✅ IDs de rutas asignadas al vehículo
    categoria: CategoriaVehiculo
    marca: str
    modelo: str
    estado: EstadoVehiculo
```

### Modelo de Ruta
```python
class Ruta:
    id: str
    codigoRuta: str
    nombre: str
    empresaId: Optional[str]  # ✅ Empresa propietaria
    resolucionId: Optional[str]  # ✅ Resolución primigenia (PADRE y VIGENTE)
    vehiculosAsignadosIds: List[str]  # ✅ IDs de vehículos asignados
    estado: EstadoRuta
    tipoRuta: TipoRuta
```

---

## 📋 Relaciones Actuales

### Jerarquía de Datos

```
EMPRESA
  └── RESOLUCIÓN PADRE (Primigenia)
       ├── vehiculosHabilitadosIds: [v1, v2, v3, ...]
       ├── rutasAutorizadasIds: [r1, r2, r3, ...]
       └── resolucionesHijasIds: [hijo1, hijo2, ...]
            └── RESOLUCIÓN HIJO (Renovación/Incremento)
                 ├── vehiculosHabilitadosIds: [v4, v5, ...]
                 ├── rutasAutorizadasIds: [r4, r5, ...]
                 └── resolucionPadreId: padre_id

VEHÍCULO
  ├── empresaActualId: empresa_id
  ├── resolucionId: resolucion_id
  └── rutasAsignadasIds: [r1, r2, r3, ...]

RUTA
  ├── empresaId: empresa_id
  ├── resolucionId: resolucion_padre_id
  └── vehiculosAsignadosIds: [v1, v2, v3, ...]
```

---

## ✅ Lo que YA ESTÁ IMPLEMENTADO

### 1. Resolución tiene arrays de:
- ✅ `vehiculosHabilitadosIds` - Todos los vehículos habilitados en esta resolución
- ✅ `rutasAutorizadasIds` - Todas las rutas autorizadas en esta resolución
- ✅ `resolucionesHijasIds` - Resoluciones derivadas (renovaciones, incrementos)

### 2. Vehículo tiene:
- ✅ `resolucionId` - Resolución a la que pertenece
- ✅ `rutasAsignadasIds` - Rutas específicas asignadas a este vehículo

### 3. Ruta tiene:
- ✅ `empresaId` - Empresa propietaria
- ✅ `resolucionId` - Resolución primigenia (PADRE)
- ✅ `vehiculosAsignadosIds` - Vehículos que operan en esta ruta

---

## 🎯 Flujo de Trabajo Actual

### Crear Resolución PADRE
1. Se crea una resolución tipo PADRE
2. Se asocia a una empresa
3. Inicialmente tiene arrays vacíos:
   - `vehiculosHabilitadosIds: []`
   - `rutasAutorizadasIds: []`

### Agregar Rutas a la Resolución
1. Se crea una ruta
2. Se asocia a la empresa y resolución PADRE
3. La ruta se agrega automáticamente a `rutasAutorizadasIds` de la resolución

### Agregar Vehículos a la Resolución
1. Se crea un vehículo
2. Se asocia a la empresa y resolución
3. El vehículo se agrega automáticamente a `vehiculosHabilitadosIds` de la resolución

### Asignar Rutas a Vehículos
1. Un vehículo puede tener múltiples rutas asignadas
2. Se actualiza `rutasAsignadasIds` del vehículo
3. Se actualiza `vehiculosAsignadosIds` de cada ruta

---

## 🔄 Relaciones Bidireccionales

### Resolución ↔ Vehículo
```
Resolución.vehiculosHabilitadosIds = [v1, v2, v3]
Vehiculo.resolucionId = resolucion_id
```

### Resolución ↔ Ruta
```
Resolución.rutasAutorizadasIds = [r1, r2, r3]
Ruta.resolucionId = resolucion_id
```

### Vehículo ↔ Ruta
```
Vehiculo.rutasAsignadasIds = [r1, r2]
Ruta.vehiculosAsignadosIds = [v1, v2, v3]
```

---

## 📊 Ejemplo Práctico

### Empresa: "Transportes San Martín"

#### Resolución PADRE: R-0001-2025
```json
{
  "id": "res_001",
  "nroResolucion": "R-0001-2025",
  "empresaId": "emp_001",
  "tipoResolucion": "PADRE",
  "tipoTramite": "AUTORIZACION_NUEVA",
  "vehiculosHabilitadosIds": ["veh_001", "veh_002", "veh_003"],
  "rutasAutorizadasIds": ["ruta_001", "ruta_002"],
  "resolucionesHijasIds": []
}
```

#### Rutas Autorizadas

**Ruta 01: Puno - Juliaca**
```json
{
  "id": "ruta_001",
  "codigoRuta": "01",
  "nombre": "Puno - Juliaca",
  "empresaId": "emp_001",
  "resolucionId": "res_001",
  "vehiculosAsignadosIds": ["veh_001", "veh_002"]
}
```

**Ruta 02: Puno - Arequipa**
```json
{
  "id": "ruta_002",
  "codigoRuta": "02",
  "nombre": "Puno - Arequipa",
  "empresaId": "emp_001",
  "resolucionId": "res_001",
  "vehiculosAsignadosIds": ["veh_003"]
}
```

#### Vehículos Habilitados

**Vehículo 1: ABC-123**
```json
{
  "id": "veh_001",
  "placa": "ABC-123",
  "empresaActualId": "emp_001",
  "resolucionId": "res_001",
  "rutasAsignadasIds": ["ruta_001"]  // Solo opera en Puno-Juliaca
}
```

**Vehículo 2: DEF-456**
```json
{
  "id": "veh_002",
  "placa": "DEF-456",
  "empresaActualId": "emp_001",
  "resolucionId": "res_001",
  "rutasAsignadasIds": ["ruta_001"]  // Solo opera en Puno-Juliaca
}
```

**Vehículo 3: GHI-789**
```json
{
  "id": "veh_003",
  "placa": "GHI-789",
  "empresaActualId": "emp_001",
  "resolucionId": "res_001",
  "rutasAsignadasIds": ["ruta_002"]  // Solo opera en Puno-Arequipa
}
```

---

## 🎨 Visualización de la Estructura

```
┌─────────────────────────────────────────────────────────────┐
│ RESOLUCIÓN PADRE: R-0001-2025                               │
│ Empresa: Transportes San Martín                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📋 RUTAS AUTORIZADAS (rutasAutorizadasIds)                 │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Ruta 01: Puno - Juliaca                             │   │
│ │   Vehículos: ABC-123, DEF-456                       │   │
│ └─────────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Ruta 02: Puno - Arequipa                            │   │
│ │   Vehículos: GHI-789                                │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ 🚗 VEHÍCULOS HABILITADOS (vehiculosHabilitadosIds)         │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ABC-123 → Rutas: [01]                               │   │
│ │ DEF-456 → Rutas: [01]                               │   │
│ │ GHI-789 → Rutas: [02]                               │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CONCLUSIÓN

### La estructura actual YA TIENE todo lo necesario:

1. ✅ **Resolución tiene arrays de vehículos y rutas totales**
   - `vehiculosHabilitadosIds: List[str]`
   - `rutasAutorizadasIds: List[str]`

2. ✅ **Vehículo tiene array de rutas asignadas**
   - `rutasAsignadasIds: List[str]`
   - Esto permite que cada vehículo tenga sus rutas específicas

3. ✅ **Ruta tiene array de vehículos asignados**
   - `vehiculosAsignadosIds: List[str]`
   - Relación bidireccional con vehículos

4. ✅ **Relaciones jerárquicas**
   - Resolución PADRE → Resoluciones HIJAS
   - Empresa → Resoluciones → Vehículos → Rutas

### Lo que falta implementar (si es necesario):

1. **Servicios de actualización automática**
   - Cuando se agrega un vehículo a una resolución, actualizar `vehiculosHabilitadosIds`
   - Cuando se agrega una ruta a una resolución, actualizar `rutasAutorizadasIds`
   - Cuando se asigna una ruta a un vehículo, actualizar ambos arrays

2. **Validaciones**
   - Un vehículo solo puede tener rutas de su resolución
   - Una ruta solo puede tener vehículos de su resolución
   - Validar que la resolución sea PADRE y VIGENTE para crear rutas

3. **Endpoints de consulta**
   - GET /resoluciones/{id}/vehiculos - Obtener vehículos de una resolución
   - GET /resoluciones/{id}/rutas - Obtener rutas de una resolución
   - GET /vehiculos/{id}/rutas - Obtener rutas de un vehículo
   - GET /rutas/{id}/vehiculos - Obtener vehículos de una ruta

---

## 🚀 Recomendación

**La estructura de datos actual es CORRECTA y COMPLETA**. No necesitas modificar los modelos. Lo que necesitas es:

1. Asegurarte de que los servicios actualicen correctamente los arrays
2. Implementar las validaciones necesarias
3. Crear endpoints de consulta para facilitar el acceso a las relaciones

¿Quieres que implemente alguna de estas mejoras?

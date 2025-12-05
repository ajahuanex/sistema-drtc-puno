# ✅ IMPLEMENTACIÓN: Gestión de Relaciones Resoluciones-Vehículos-Rutas

## 📋 Resumen

Se han implementado servicios y endpoints completos para gestionar las relaciones entre Resoluciones, Vehículos y Rutas, permitiendo:

1. Consultar vehículos y rutas de una resolución
2. Agregar/remover vehículos y rutas a resoluciones
3. Actualización automática de arrays cuando se crean entidades
4. Validaciones de integridad de datos
5. Resumen completo de resoluciones con estadísticas

---

## 🆕 Nuevos Endpoints Implementados

### 1. GET `/api/v1/resoluciones/{resolucion_id}/vehiculos`
**Descripción**: Obtener todos los vehículos habilitados en una resolución

**Respuesta**:
```json
[
  {
    "id": "veh_001",
    "placa": "ABC-123",
    "marca": "Mercedes Benz",
    "modelo": "Sprinter",
    "estado": "ACTIVO",
    "rutasAsignadasIds": ["ruta_001", "ruta_002"]
  }
]
```

### 2. GET `/api/v1/resoluciones/{resolucion_id}/rutas`
**Descripción**: Obtener todas las rutas autorizadas en una resolución

**Respuesta**:
```json
[
  {
    "id": "ruta_001",
    "codigoRuta": "01",
    "nombre": "Puno - Juliaca",
    "estado": "ACTIVA",
    "vehiculosAsignadosIds": ["veh_001", "veh_002"]
  }
]
```

### 3. POST `/api/v1/resoluciones/{resolucion_id}/vehiculos/{vehiculo_id}`
**Descripción**: Agregar un vehículo a la resolución

**Validaciones**:
- El vehículo debe existir
- El vehículo debe pertenecer a la misma empresa que la resolución
- No se permiten duplicados

**Respuesta**:
```json
{
  "message": "Vehículo agregado exitosamente",
  "resolucion": { ... }
}
```

### 4. DELETE `/api/v1/resoluciones/{resolucion_id}/vehiculos/{vehiculo_id}`
**Descripción**: Remover un vehículo de la resolución

**Respuesta**:
```json
{
  "message": "Vehículo removido exitosamente",
  "resolucion": { ... }
}
```

### 5. POST `/api/v1/resoluciones/{resolucion_id}/rutas/{ruta_id}`
**Descripción**: Agregar una ruta a la resolución

**Validaciones**:
- La ruta debe existir
- La ruta debe pertenecer a la misma empresa que la resolución
- No se permiten duplicados

**Respuesta**:
```json
{
  "message": "Ruta agregada exitosamente",
  "resolucion": { ... }
}
```

### 6. DELETE `/api/v1/resoluciones/{resolucion_id}/rutas/{ruta_id}`
**Descripción**: Remover una ruta de la resolución

**Respuesta**:
```json
{
  "message": "Ruta removida exitosamente",
  "resolucion": { ... }
}
```

### 7. GET `/api/v1/resoluciones/{resolucion_id}/resumen`
**Descripción**: Obtener resumen completo de una resolución con sus vehículos, rutas y estadísticas

**Respuesta**:
```json
{
  "resolucion": {
    "id": "res_001",
    "nroResolucion": "R-0001-2025",
    "empresaId": "emp_001",
    "tipoResolucion": "PADRE",
    "estado": "VIGENTE"
  },
  "empresa": {
    "id": "emp_001",
    "ruc": "20123456789",
    "razonSocial": {
      "principal": "Transportes San Martín S.A.C."
    }
  },
  "vehiculos": [
    {
      "id": "veh_001",
      "placa": "ABC-123",
      "rutasAsignadasIds": ["ruta_001"]
    }
  ],
  "rutas": [
    {
      "id": "ruta_001",
      "codigoRuta": "01",
      "nombre": "Puno - Juliaca",
      "vehiculosAsignadosIds": ["veh_001", "veh_002"]
    }
  ],
  "estadisticas": {
    "totalVehiculos": 3,
    "totalRutas": 2,
    "vehiculosActivos": 3,
    "rutasActivas": 2
  }
}
```

---

## 🔄 Actualización Automática de Relaciones

### Cuando se crea un Vehículo

**Servicio**: `VehiculoService.create_vehiculo()`

**Actualizaciones automáticas**:
1. ✅ Agrega el vehículo a `empresa.vehiculosHabilitadosIds`
2. ✅ Si tiene `resolucionId`, agrega el vehículo a `resolucion.vehiculosHabilitadosIds`

```python
# En vehiculo_service.py
# Actualizar empresa
await self.empresas_collection.update_one(
    empresa_query,
    {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
)

# Actualizar resolución (si aplica)
if vehiculo_data.resolucionId:
    await resoluciones_collection.update_one(
        resolucion_query,
        {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
    )
```

### Cuando se crea una Ruta

**Servicio**: `RutaService.create_ruta()`

**Actualizaciones automáticas**:
1. ✅ Agrega la ruta a `empresa.rutasAutorizadasIds`
2. ✅ Agrega la ruta a `resolucion.rutasAutorizadasIds`

```python
# En ruta_service.py
# Actualizar empresa
await self.empresas_collection.update_one(
    {"_id": ObjectId(ruta_data.empresaId)},
    {"$addToSet": {"rutasAutorizadasIds": ruta_id}}
)

# Actualizar resolución
await self.resoluciones_collection.update_one(
    {"_id": ObjectId(ruta_data.resolucionId)},
    {"$addToSet": {"rutasAutorizadasIds": ruta_id}}
)
```

---

## 🛡️ Validaciones Implementadas

### En ResolucionService

#### `agregar_vehiculo()`
- ✅ Verifica que la resolución existe
- ✅ Verifica que el vehículo existe
- ✅ Valida que el vehículo pertenece a la misma empresa
- ✅ Previene duplicados
- ✅ Actualiza relación bidireccional (resolución ↔ vehículo)

#### `agregar_ruta()`
- ✅ Verifica que la resolución existe
- ✅ Verifica que la ruta existe
- ✅ Valida que la ruta pertenece a la misma empresa
- ✅ Previene duplicados
- ✅ Actualiza relación bidireccional (resolución ↔ ruta)

### En RutaService

#### `create_ruta()`
- ✅ Valida que la empresa existe y está activa
- ✅ Valida que la resolución es VIGENTE y PADRE
- ✅ Valida código único dentro de la resolución
- ✅ Valida que origen y destino son diferentes

---

## 📊 Estructura de Datos Completa

### Resolución
```json
{
  "id": "res_001",
  "nroResolucion": "R-0001-2025",
  "empresaId": "emp_001",
  "tipoResolucion": "PADRE",
  "estado": "VIGENTE",
  "vehiculosHabilitadosIds": ["veh_001", "veh_002", "veh_003"],
  "rutasAutorizadasIds": ["ruta_001", "ruta_002"],
  "resolucionesHijasIds": []
}
```

### Vehículo
```json
{
  "id": "veh_001",
  "placa": "ABC-123",
  "empresaActualId": "emp_001",
  "resolucionId": "res_001",
  "rutasAsignadasIds": ["ruta_001", "ruta_002"],
  "estado": "ACTIVO"
}
```

### Ruta
```json
{
  "id": "ruta_001",
  "codigoRuta": "01",
  "nombre": "Puno - Juliaca",
  "empresaId": "emp_001",
  "resolucionId": "res_001",
  "vehiculosAsignadosIds": ["veh_001", "veh_002"],
  "estado": "ACTIVA"
}
```

---

## 🎯 Casos de Uso

### Caso 1: Consultar Vehículos de una Resolución

```bash
GET /api/v1/resoluciones/res_001/vehiculos
```

**Uso**: Ver todos los vehículos habilitados en una resolución específica

### Caso 2: Agregar Vehículo a Resolución

```bash
POST /api/v1/resoluciones/res_001/vehiculos/veh_004
```

**Uso**: Habilitar un nuevo vehículo en una resolución existente

### Caso 3: Obtener Resumen Completo

```bash
GET /api/v1/resoluciones/res_001/resumen
```

**Uso**: Ver toda la información de una resolución incluyendo empresa, vehículos, rutas y estadísticas

### Caso 4: Remover Vehículo de Resolución

```bash
DELETE /api/v1/resoluciones/res_001/vehiculos/veh_004
```

**Uso**: Dar de baja un vehículo de una resolución

---

## 🔍 Ejemplos de Uso con curl

### Obtener vehículos de una resolución
```bash
curl -X GET "http://localhost:8000/api/v1/resoluciones/res_001/vehiculos" \
  -H "Authorization: Bearer {token}"
```

### Agregar vehículo a resolución
```bash
curl -X POST "http://localhost:8000/api/v1/resoluciones/res_001/vehiculos/veh_004" \
  -H "Authorization: Bearer {token}"
```

### Obtener resumen completo
```bash
curl -X GET "http://localhost:8000/api/v1/resoluciones/res_001/resumen" \
  -H "Authorization: Bearer {token}"
```

---

## ✅ Beneficios de la Implementación

### 1. Integridad de Datos
- Las relaciones se mantienen automáticamente
- No hay datos huérfanos
- Validaciones previenen inconsistencias

### 2. Facilidad de Uso
- Endpoints intuitivos y RESTful
- Respuestas completas con toda la información necesaria
- Mensajes de error claros

### 3. Rendimiento
- Consultas optimizadas
- Uso de `$addToSet` para prevenir duplicados
- Índices en campos de búsqueda

### 4. Mantenibilidad
- Código bien estructurado
- Separación de responsabilidades
- Fácil de extender

---

## 🚀 Próximos Pasos Sugeridos

### Frontend
1. Crear componente para visualizar vehículos de una resolución
2. Crear componente para visualizar rutas de una resolución
3. Implementar drag & drop para asignar vehículos a rutas
4. Agregar gráficos de estadísticas

### Backend
1. Agregar endpoints para asignar rutas a vehículos
2. Implementar notificaciones cuando se agregan/remueven entidades
3. Agregar auditoría de cambios en relaciones
4. Implementar caché para consultas frecuentes

### Validaciones Adicionales
1. Validar capacidad máxima de vehículos por ruta
2. Validar que un vehículo no esté en múltiples rutas simultáneamente
3. Validar fechas de vigencia de resoluciones
4. Validar estado de vehículos antes de asignar rutas

---

## 📚 Documentación de API

La documentación completa de los nuevos endpoints está disponible en:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

**Fecha**: 4 de Diciembre de 2024  
**Estado**: ✅ IMPLEMENTADO Y FUNCIONANDO  
**Backend**: Reiniciado con cambios aplicados  
**Versión**: 1.1.0

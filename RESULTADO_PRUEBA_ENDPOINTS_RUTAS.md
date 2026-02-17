# Resultado de Prueba de Endpoints CRUD - Módulo de Rutas

**Fecha:** 15/02/2026  
**Backend:** http://localhost:8000/api/v1

## Resumen de Pruebas

| Prueba | Estado | Observaciones |
|--------|--------|---------------|
| 1. Login | ❌ FALLIDO | Credenciales incorrectas (admin/admin123) |
| 2. Obtener Empresa y Resolución | ✅ EXITOSO | Sin autenticación requerida |
| 3. CREATE - Crear Ruta | ❌ FALLIDO | Faltan campos obligatorios |
| 4. READ - Leer Ruta por ID | ❌ FALLIDO | Error por ruta_id null |
| 5. READ - Listar Todas las Rutas | ✅ EXITOSO | 5 rutas listadas correctamente |
| 6. UPDATE - Actualizar Ruta | ❌ FALLIDO | Error por ruta_id null |
| 7. READ - Rutas por Resolución | ✅ EXITOSO | 3 rutas obtenidas |
| 8. READ - Estadísticas | ✅ EXITOSO | Endpoint funciona (stats en 0) |
| 9. DELETE - Eliminar Ruta | ❌ FALLIDO | Error por ruta_id null |

**Total:** 4/9 pruebas exitosas (44%)

## Detalles de Endpoints

### ✅ Endpoints Funcionando

#### 1. GET /api/v1/empresas
- **Estado:** Funcional
- **Autenticación:** No requerida
- **Respuesta:** Lista de empresas

#### 2. GET /api/v1/resoluciones
- **Estado:** Funcional
- **Autenticación:** No requerida
- **Respuesta:** Lista de resoluciones

#### 3. GET /api/v1/rutas
- **Estado:** Funcional
- **Autenticación:** No requerida
- **Respuesta:** Lista de rutas con paginación
- **Ejemplo de respuesta:**
```json
[
  {
    "codigoRuta": "01",
    "origen": { "nombre": "PUTINA" },
    "destino": { "nombre": "JULIACA" }
  },
  {
    "codigoRuta": "02",
    "origen": { "nombre": "JULIACA" },
    "destino": { "nombre": "C.P. LA RINCONADA" }
  }
]
```

#### 4. GET /api/v1/rutas/resolucion/{resolucion_id}
- **Estado:** Funcional
- **Autenticación:** No requerida
- **Respuesta:** Rutas filtradas por resolución

#### 5. GET /api/v1/rutas/estadisticas
- **Estado:** Funcional
- **Autenticación:** No requerida
- **Respuesta:** Estadísticas de rutas

### ❌ Endpoints con Problemas

#### 1. POST /api/v1/auth/login
- **Problema:** Credenciales incorrectas
- **Error:** `{"detail":"DNI o contraseña incorrectos"}`
- **Solución:** Verificar credenciales correctas del sistema

#### 2. POST /api/v1/rutas
- **Problema:** Campos obligatorios faltantes
- **Campos requeridos:**
  - `nombre` (falta en el modelo)
  - `empresa.ruc`
  - `empresa.razonSocial`
  - `resolucion.nroResolucion`
  - `resolucion.tipoResolucion`
  - `resolucion.estado`
  - `tipoServicio`

**Error completo:**
```json
{
  "detail": [
    {"type": "missing", "loc": ["body", "nombre"], "msg": "Field required"},
    {"type": "missing", "loc": ["body", "empresa", "ruc"], "msg": "Field required"},
    {"type": "missing", "loc": ["body", "empresa", "razonSocial"], "msg": "Field required"},
    {"type": "missing", "loc": ["body", "resolucion", "nroResolucion"], "msg": "Field required"},
    {"type": "missing", "loc": ["body", "resolucion", "tipoResolucion"], "msg": "Field required"},
    {"type": "missing", "loc": ["body", "resolucion", "estado"], "msg": "Field required"},
    {"type": "missing", "loc": ["body", "tipoServicio"], "msg": "Field required"}
  ]
}
```

#### 3. GET /api/v1/rutas/{ruta_id}
- **Problema:** Error cuando ruta_id es None
- **Error:** `'None' is not a valid ObjectId`
- **Causa:** La ruta no se creó, por lo tanto ruta_id_creada es None

#### 4. PUT /api/v1/rutas/{ruta_id}
- **Problema:** Mismo error que GET por ID
- **Causa:** Dependiente de la creación exitosa

#### 5. DELETE /api/v1/rutas/{ruta_id}
- **Problema:** Mismo error que GET por ID
- **Causa:** Dependiente de la creación exitosa

## Recomendaciones

### 1. Autenticación
- Verificar las credenciales correctas del sistema
- Considerar si todos los endpoints deben requerir autenticación

### 2. Modelo de Creación de Ruta
El modelo `RutaCreate` necesita incluir todos los campos obligatorios:

```typescript
{
  "codigoRuta": "TEST-001",
  "nombre": "PUNO - JULIACA",  // ⚠️ Campo faltante
  "tipoRuta": "INTERREGIONAL",
  "tipoServicio": "REGULAR",   // ⚠️ Campo faltante
  "origen": {
    "id": "xxx",
    "nombre": "PUNO"
  },
  "destino": {
    "id": "xxx",
    "nombre": "JULIACA"
  },
  "frecuencia": {
    "tipo": "DIARIO",
    "cantidad": 1,
    "dias": [],
    "descripcion": "01 DIARIA"
  },
  "descripcion": "Ruta de prueba",
  "observaciones": "Prueba",
  "estado": "ACTIVA",
  "empresa": {
    "id": "xxx",
    "nombre": "Empresa Test",
    "ruc": "20123456789",        // ⚠️ Campo faltante
    "razonSocial": "Empresa SA"  // ⚠️ Campo faltante
  },
  "resolucion": {
    "id": "xxx",
    "numeroResolucion": "R-001",
    "nroResolucion": "R-001",      // ⚠️ Campo faltante
    "tipoResolucion": "PRIMIGENIA", // ⚠️ Campo faltante
    "estado": "VIGENTE"            // ⚠️ Campo faltante
  }
}
```

### 3. Validación de ObjectId
- Mejorar el manejo de errores cuando el ID es None o inválido
- Retornar 400 Bad Request en lugar de 500 Internal Server Error

### 4. Sincronización Frontend-Backend
- Actualizar el modelo `RutaCreate` en el frontend para incluir todos los campos obligatorios
- Verificar que el servicio de rutas envíe todos los campos requeridos

## Conclusión

Los endpoints de **lectura (GET)** funcionan correctamente:
- ✅ Listar rutas
- ✅ Obtener rutas por resolución
- ✅ Estadísticas

Los endpoints de **escritura (POST, PUT, DELETE)** tienen problemas:
- ❌ CREATE: Faltan campos obligatorios en el modelo
- ❌ UPDATE: Dependiente de CREATE
- ❌ DELETE: Dependiente de CREATE

**Acción requerida:** Actualizar el modelo `RutaCreate` en el frontend para incluir todos los campos obligatorios que requiere el backend.

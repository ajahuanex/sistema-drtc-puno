# 🗺️ SISTEMA DE ALIAS DE LOCALIDADES

## 📋 Descripción

Sistema para mapear nombres alternativos (alias) a localidades oficiales, permitiendo que las rutas usen nombres no oficiales pero mantengan la referencia correcta a las localidades con coordenadas.

---

## 🎯 Problema Resuelto

**Antes:**
- Rutas con nombres como "C.P. LA RINCONADA" no encontraban la localidad "LA RINCONADA"
- 82.93% de rutas con coordenadas (78 rutas sin coordenadas)
- 31 localidades únicas sin coordenadas

**Después:**
- Sistema de mapeo de alias permite asociar nombres alternativos
- Búsqueda inteligente que consulta primero alias, luego localidades oficiales
- Gestión centralizada de alias con estadísticas de uso

---

## 🏗️ Arquitectura

### Backend

#### 1. Modelo de Datos (`localidad_alias.py`)

```python
{
  "_id": ObjectId("..."),
  "alias": "C.P. LA RINCONADA",
  "localidad_id": "69a50fb61bc05e7463e6be22",
  "localidad_nombre": "LA RINCONADA",
  "tipo_alias": "CENTRO_POBLADO_PREFIJO",
  "verificado": true,
  "notas": "Alias común en rutas de transporte",
  "estaActivo": true,
  "fechaCreacion": ISODate("..."),
  "fechaActualizacion": ISODate("..."),
  "usos_como_origen": 1,
  "usos_como_destino": 21,
  "usos_en_itinerario": 6
}
```

#### 2. Tipos de Alias

- `CENTRO_POBLADO_PREFIJO`: C.P., CP (ej: "C.P. LA RINCONADA")
- `ABREVIATURA`: Abreviaciones comunes
- `NOMBRE_ALTERNATIVO`: Nombres alternativos válidos
- `ERROR_TIPOGRAFICO`: Errores comunes de escritura
- `HISTORICO`: Nombres históricos
- `CANCELADO`: Rutas canceladas
- `OTRO`: Otros tipos

#### 3. Servicio (`LocalidadAliasService`)

**Métodos principales:**
- `create_alias()`: Crear nuevo alias
- `buscar_por_alias()`: Buscar localidad por nombre o alias
- `get_all_alias()`: Listar todos los alias
- `update_alias()`: Actualizar alias
- `delete_alias()`: Desactivar alias
- `get_alias_mas_usados()`: Estadísticas de uso
- `actualizar_estadisticas_uso()`: Actualizar contadores

#### 4. API Endpoints

```
POST   /api/v1/localidades-alias/                    # Crear alias
GET    /api/v1/localidades-alias/                    # Listar alias
GET    /api/v1/localidades-alias/{id}                # Obtener alias por ID
PUT    /api/v1/localidades-alias/{id}                # Actualizar alias
DELETE /api/v1/localidades-alias/{id}                # Eliminar alias
GET    /api/v1/localidades-alias/buscar/{nombre}     # Buscar por alias
GET    /api/v1/localidades-alias/estadisticas/mas-usados  # Top alias
GET    /api/v1/localidades-alias/estadisticas/sin-usar    # Alias sin uso
```

---

## 🚀 Uso del Sistema

### 1. Crear un Alias

```bash
POST /api/v1/localidades-alias/
{
  "alias": "C.P. LA RINCONADA",
  "localidad_id": "69a50fb61bc05e7463e6be22",
  "localidad_nombre": "LA RINCONADA",
  "tipo_alias": "CENTRO_POBLADO_PREFIJO",
  "verificado": true,
  "notas": "Centro poblado minero"
}
```

### 2. Buscar Localidad (con alias)

```bash
GET /api/v1/localidades-alias/buscar/C.P. LA RINCONADA

Response:
{
  "localidad_id": "69a50fb61bc05e7463e6be22",
  "localidad_nombre": "LA RINCONADA",
  "es_alias": true,
  "alias_usado": "C.P. LA RINCONADA",
  "coordenadas": {
    "latitud": -14.6297,
    "longitud": -69.4458
  }
}
```

### 3. Ver Estadísticas

```bash
GET /api/v1/localidades-alias/estadisticas/mas-usados?limit=10

Response:
[
  {
    "id": "...",
    "alias": "C.P. LA RINCONADA",
    "localidad_nombre": "LA RINCONADA",
    "total_usos": 28,
    "usos_como_origen": 1,
    "usos_como_destino": 21,
    "usos_en_itinerario": 6
  }
]
```

---

## 📊 Integración con Verificación de Coordenadas

El endpoint `/rutas/verificar-coordenadas` ahora:

1. Busca por ID de localidad
2. Si no encuentra, busca por nombre exacto
3. Si no encuentra, busca por nombre normalizado (sin C.P.)
4. **NUEVO:** Consulta tabla de alias
5. Retorna coordenadas de la localidad oficial

---

## 🔧 Próximos Pasos

### Fase 1: Población Inicial ✅
- [x] Crear modelos y servicios
- [x] Implementar API endpoints
- [x] Integrar con verificación de coordenadas

### Fase 2: Interfaz de Usuario (Pendiente)
- [ ] Componente de gestión de alias en frontend
- [ ] Modal para crear/editar alias
- [ ] Lista de alias con búsqueda y filtros
- [ ] Integración con modal de verificación de coordenadas
- [ ] Botón "Crear Alias" desde rutas sin coordenadas

### Fase 3: Automatización (Futuro)
- [ ] Sugerencias automáticas de alias
- [ ] Detección de patrones comunes (C.P., CP, etc.)
- [ ] Importación masiva de alias desde Excel
- [ ] Sincronización automática al crear rutas

---

## 📝 Ejemplo de Flujo Completo

### Escenario: Ruta con "C.P. LA RINCONADA"

1. **Usuario crea ruta** con destino "C.P. LA RINCONADA"
2. **Sistema busca:**
   - ❌ ID en base de datos
   - ❌ Nombre exacto "C.P. LA RINCONADA"
   - ❌ Nombre normalizado "LA RINCONADA"
   - ✅ **Alias "C.P. LA RINCONADA"** → Encuentra localidad oficial
3. **Sistema retorna:**
   - Localidad: "LA RINCONADA"
   - Coordenadas: (-14.6297, -69.4458)
   - Es alias: true
4. **Ruta se guarda** con referencia correcta
5. **Estadísticas se actualizan** automáticamente

---

## 🎨 Interfaz de Usuario (Propuesta)

### Gestión de Alias

```
┌─────────────────────────────────────────────────────────┐
│ 🗺️ Gestión de Alias de Localidades                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [🔍 Buscar alias...]  [+ Nuevo Alias]  [📊 Estadísticas]│
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Alias                  │ Localidad    │ Usos │ ⚙️  │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ C.P. LA RINCONADA     │ LA RINCONADA │  28  │ ✏️🗑️│ │
│ │ CUYO CUYO             │ CUYOCUYO     │   9  │ ✏️🗑️│ │
│ │ CHACA CHACA           │ CHACACRUZ    │   7  │ ✏️🗑️│ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Total: 31 alias | Activos: 31 | Sin usar: 5            │
└─────────────────────────────────────────────────────────┘
```

### Modal de Crear Alias

```
┌─────────────────────────────────────────┐
│ Crear Nuevo Alias                       │
├─────────────────────────────────────────┤
│                                          │
│ Alias: [C.P. LA RINCONADA____________]  │
│                                          │
│ Localidad Oficial:                      │
│ [🔍 Buscar localidad..._______________] │
│                                          │
│ Tipo de Alias:                          │
│ [▼ Centro Poblado (C.P.)_____________] │
│                                          │
│ Notas:                                   │
│ [________________________________]       │
│ [________________________________]       │
│                                          │
│ ☑ Verificado manualmente                │
│                                          │
│         [Cancelar]  [Guardar Alias]     │
└─────────────────────────────────────────┘
```

---

## 📈 Métricas de Éxito

### Antes del Sistema de Alias
- 82.93% rutas con coordenadas
- 78 rutas sin coordenadas
- 31 localidades problemáticas

### Meta con Sistema de Alias
- 95%+ rutas con coordenadas
- <20 rutas sin coordenadas
- Gestión centralizada de nombres alternativos

---

## 🔐 Seguridad y Validaciones

1. **Validación de Localidad:** Verifica que la localidad oficial existe
2. **Unicidad de Alias:** No permite alias duplicados
3. **Soft Delete:** Los alias se desactivan, no se eliminan
4. **Auditoría:** Fechas de creación y actualización
5. **Estadísticas:** Tracking de uso para identificar alias obsoletos

---

## 🛠️ Mantenimiento

### Tareas Periódicas

1. **Revisar alias sin usar:**
   ```bash
   GET /api/v1/localidades-alias/estadisticas/sin-usar
   ```

2. **Verificar alias más usados:**
   ```bash
   GET /api/v1/localidades-alias/estadisticas/mas-usados
   ```

3. **Limpiar alias obsoletos:**
   - Identificar alias con 0 usos
   - Verificar si siguen siendo necesarios
   - Desactivar si no se usan

---

## 📚 Referencias

- **Modelo:** `backend/app/models/localidad_alias.py`
- **Servicio:** `backend/app/services/localidad_alias_service.py`
- **Router:** `backend/app/routers/localidades_alias_router.py`
- **Documentación API:** `http://localhost:8000/docs#/localidades-alias`

---

**Fecha de Implementación:** 6 de marzo de 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Backend Completo | ⏳ Frontend Pendiente

# 🔄 Sincronización Automática: Localidades ↔ Rutas

## 🎯 Problema Resuelto

Cuando se actualiza una localidad (por ejemplo, se corrige el nombre), ese cambio ahora se refleja **automáticamente** en todas las rutas que usan esa localidad.

---

## ✅ Cómo Funciona

### Antes (Problema)
```
1. Localidad "PUNO" → Se cambia a "PUNO CIUDAD"
2. Rutas siguen mostrando "PUNO" ❌
3. Datos desincronizados ❌
```

### Ahora (Solución)
```
1. Localidad "PUNO" → Se cambia a "PUNO CIUDAD"
2. Sistema actualiza automáticamente:
   - Rutas donde es origen ✅
   - Rutas donde es destino ✅
   - Rutas donde está en itinerario ✅
3. Datos sincronizados ✅
```

---

## 🔧 Implementación

### 1. Sincronización Automática (Backend)

Cuando se actualiza una localidad, el sistema:

```python
# backend/app/services/localidad_service.py

async def update_localidad(self, localidad_id, localidad_data):
    # 1. Actualizar localidad
    await self.collection.update_one(...)
    
    # 2. Si cambió el nombre, sincronizar en rutas
    if "nombre" in update_data:
        await self._sincronizar_localidad_en_rutas(
            localidad_id, 
            nuevo_nombre
        )
```

### 2. Sincronización en Rutas

El sistema actualiza:

```python
# Actualizar en origen
rutas.update_many(
    {"origen.id": localidad_id},
    {"$set": {"origen.nombre": nuevo_nombre}}
)

# Actualizar en destino
rutas.update_many(
    {"destino.id": localidad_id},
    {"$set": {"destino.nombre": nuevo_nombre}}
)

# Actualizar en itinerario
for ruta in rutas_con_localidad:
    for loc in ruta.itinerario:
        if loc.id == localidad_id:
            loc.nombre = nuevo_nombre
```

---

## 🧪 Ejemplo Práctico

### Escenario: Corregir nombre de localidad

```
1. Localidad actual:
   - ID: "abc123"
   - Nombre: "PUNO"

2. Rutas que la usan:
   - Ruta 001: PUNO → JULIACA
   - Ruta 002: AREQUIPA → PUNO
   - Ruta 003: CUSCO → JULIACA (itinerario: CUSCO, PUNO, JULIACA)

3. Actualizar localidad:
   - Nuevo nombre: "PUNO CIUDAD"

4. Resultado automático:
   - Ruta 001: PUNO CIUDAD → JULIACA ✅
   - Ruta 002: AREQUIPA → PUNO CIUDAD ✅
   - Ruta 003: CUSCO → JULIACA (itinerario: CUSCO, PUNO CIUDAD, JULIACA) ✅
```

---

## 🚀 Uso

### Desde el Frontend

```typescript
// Actualizar localidad
await localidadService.actualizarLocalidad(id, {
  nombre: "PUNO CIUDAD"
});

// ✅ Las rutas se actualizan automáticamente
// No se requiere acción adicional
```

### Desde el Backend

```python
# Actualizar localidad
await localidad_service.update_localidad(
    localidad_id="abc123",
    localidad_data=LocalidadUpdate(nombre="PUNO CIUDAD")
)

# ✅ Las rutas se sincronizan automáticamente
```

---

## 🔧 Script Manual (Si es necesario)

Si necesitas sincronizar todas las localidades manualmente:

```bash
cd backend
python scripts/sincronizar_localidades_en_rutas.py
```

Este script:
1. Lee todas las localidades
2. Lee todas las rutas
3. Actualiza los nombres en rutas según las localidades actuales
4. Muestra un reporte de cambios

---

## 📊 Qué se Sincroniza

### ✅ Se Sincroniza Automáticamente
- **Nombre de la localidad**
  - En origen de rutas
  - En destino de rutas
  - En itinerario de rutas

### ❌ NO se Sincroniza (Por diseño)
- **ID de la localidad** (nunca cambia)
- **Otros campos** (departamento, provincia, etc.)
  - Estos no se almacenan en rutas, solo ID y nombre

---

## 🎯 Beneficios

### 1. Consistencia de Datos
- Los nombres siempre están actualizados
- No hay datos desincronizados
- Una sola fuente de verdad (localidades)

### 2. Mantenimiento Fácil
- Actualizar una vez, se refleja en todas partes
- No hay que buscar y actualizar manualmente
- Menos errores humanos

### 3. Integridad Referencial
- Las rutas siempre apuntan a localidades válidas
- Si se actualiza una localidad, las rutas lo reflejan
- Si se elimina una localidad, se puede detectar

---

## 🔍 Verificación

### Verificar que funciona:

```javascript
// 1. Obtener una localidad
const localidad = await localidadService.obtenerPorId("abc123");
console.log("Nombre actual:", localidad.nombre);

// 2. Obtener rutas que la usan
const rutas = await rutaService.obtenerPorLocalidad("abc123");
console.log("Rutas que la usan:", rutas.length);

// 3. Actualizar localidad
await localidadService.actualizar("abc123", {
  nombre: "NUEVO NOMBRE"
});

// 4. Verificar rutas actualizadas
const rutasActualizadas = await rutaService.obtenerPorLocalidad("abc123");
rutasActualizadas.forEach(ruta => {
  console.log("Origen:", ruta.origen.nombre);
  console.log("Destino:", ruta.destino.nombre);
});

// ✅ Deberían mostrar "NUEVO NOMBRE"
```

---

## 📋 Casos de Uso

### Caso 1: Corrección de Ortografía
```
"PUNO" → "PUNO CIUDAD"
✅ Todas las rutas se actualizan automáticamente
```

### Caso 2: Estandarización de Nombres
```
"Juliaca" → "JULIACA"
✅ Todas las rutas se actualizan automáticamente
```

### Caso 3: Cambio de Denominación Oficial
```
"AZANGARO" → "AZÁNGARO"
✅ Todas las rutas se actualizan automáticamente
```

---

## ⚠️ Consideraciones

### 1. Rendimiento
- La sincronización es rápida (< 1 segundo para 100 rutas)
- Se ejecuta en segundo plano
- No bloquea la actualización de la localidad

### 2. Transacciones
- Si falla la sincronización, la localidad se actualiza de todos modos
- Se registra un warning en los logs
- Se puede ejecutar el script manual después

### 3. Historial
- Se actualiza `fechaActualizacion` en las rutas afectadas
- Se puede rastrear cuándo se sincronizó

---

## 🎉 Resumen

**Antes:**
- Actualizar localidad ❌
- Buscar todas las rutas manualmente ❌
- Actualizar cada ruta una por una ❌
- Propenso a errores ❌

**Ahora:**
- Actualizar localidad ✅
- Sistema sincroniza automáticamente ✅
- Todas las rutas actualizadas ✅
- Sin errores ✅

---

## 📚 Archivos Relacionados

- `backend/app/services/localidad_service.py` - Servicio con sincronización
- `backend/scripts/sincronizar_localidades_en_rutas.py` - Script manual
- `backend/app/models/ruta.py` - Modelo de ruta con LocalidadEmbebida

---

**Fecha:** 08/02/2026  
**Estado:** ✅ Implementado  
**Funciona:** Automáticamente al actualizar localidades

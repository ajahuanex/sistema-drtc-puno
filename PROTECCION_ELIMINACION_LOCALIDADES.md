# 🔒 Protección de Eliminación de Localidades

## 🎯 Problema Resuelto

**Pregunta:** ¿Qué pasa si se borra por error una localidad que ya se está usando en el módulo de rutas?

**Respuesta:** Ahora el sistema **NO PERMITE** eliminar una localidad que está siendo usada en rutas.

---

## ✅ Cómo Funciona

### Antes (Problema)
```
1. Usuario intenta eliminar localidad "PUNO"
2. Sistema elimina la localidad ❌
3. Rutas quedan con referencias rotas ❌
4. Datos inconsistentes ❌
```

### Ahora (Solución)
```
1. Usuario intenta eliminar localidad "PUNO"
2. Sistema verifica si está en uso ✅
3. Si está en uso → Bloquea eliminación ✅
4. Muestra en qué rutas se usa ✅
5. Usuario debe eliminar rutas primero ✅
```

---

## 🔧 Implementación

### 1. Verificación Automática

Cuando se intenta eliminar una localidad:

```python
# backend/app/services/localidad_service.py

async def delete_localidad(self, localidad_id: str):
    # 1. Verificar si está en uso
    uso = await self._verificar_localidad_en_uso(localidad_id)
    
    # 2. Si está en uso, bloquear eliminación
    if uso['total'] > 0:
        raise ValueError(
            f"No se puede eliminar porque está en {uso['total']} ruta(s)"
        )
    
    # 3. Si no está en uso, permitir eliminación
    await self.collection.update_one(...)
```

### 2. Verificación Detallada

El sistema verifica:

```python
# Contar rutas donde es origen
como_origen = rutas.count({"origen.id": localidad_id})

# Contar rutas donde es destino
como_destino = rutas.count({"destino.id": localidad_id})

# Contar rutas donde está en itinerario
en_itinerario = rutas.count({"itinerario.id": localidad_id})

total = como_origen + como_destino + en_itinerario
```

---

## 🧪 Ejemplo Práctico

### Escenario: Intentar eliminar "PUNO"

```
1. Localidad: PUNO (ID: abc123)

2. Rutas que la usan:
   - Ruta 001: PUNO → JULIACA (origen)
   - Ruta 002: AREQUIPA → PUNO (destino)
   - Ruta 003: CUSCO → JULIACA (itinerario: CUSCO, PUNO, JULIACA)

3. Usuario intenta eliminar "PUNO"

4. Sistema responde:
   ❌ Error 400: No se puede eliminar la localidad porque está siendo 
      usada en 3 ruta(s). Origen: 1, Destino: 1, Itinerario: 1
```

---

## 🚀 Uso

### Desde el Frontend

```typescript
// Verificar antes de eliminar
const uso = await localidadService.verificarUso(localidadId);

if (uso.esta_en_uso) {
  // Mostrar advertencia
  alert(`No se puede eliminar. Está en ${uso.total_rutas} rutas`);
  
  // Mostrar lista de rutas
  console.log('Rutas que la usan:', uso.rutas);
} else {
  // Permitir eliminación
  await localidadService.eliminar(localidadId);
}
```

### Desde el Backend

```python
# Verificar uso
uso = await localidad_service._verificar_localidad_en_uso(localidad_id)

if uso['esta_en_uso']:
    print(f"Localidad en uso en {uso['total']} rutas")
else:
    await localidad_service.delete_localidad(localidad_id)
```

---

## 📊 API Endpoints

### 1. Verificar Uso
```http
GET /api/v1/localidades/{localidad_id}/verificar-uso

Response:
{
  "localidad_id": "abc123",
  "esta_en_uso": true,
  "total_rutas": 3,
  "detalle": {
    "como_origen": 1,
    "como_destino": 1,
    "en_itinerario": 1
  },
  "rutas": {
    "rutas_origen": [
      {
        "codigo": "R001",
        "nombre": "Ruta Puno-Juliaca",
        "ruta": "PUNO → JULIACA"
      }
    ],
    "rutas_destino": [...],
    "rutas_itinerario": [...]
  },
  "puede_eliminar": false,
  "mensaje": "La localidad está siendo usada en rutas y no puede ser eliminada"
}
```

### 2. Eliminar Localidad
```http
DELETE /api/v1/localidades/{localidad_id}

Si está en uso:
  Status: 400 Bad Request
  {
    "detail": "No se puede eliminar la localidad porque está siendo usada en 3 ruta(s)..."
  }

Si no está en uso:
  Status: 200 OK
  {
    "message": "Localidad eliminada exitosamente"
  }
```

---

## 🔍 Verificación

### Test Manual

```bash
# Ejecutar script de prueba
python test_proteccion_localidades.py
```

**Resultado esperado:**
```
✅ Localidad seleccionada: PUNO
ℹ️  Está en uso: True
ℹ️  Total de rutas: 3
ℹ️  Como origen: 1
ℹ️  Como destino: 1
ℹ️  En itinerario: 1
⚠️  La localidad está siendo usada en rutas y no puede ser eliminada

Rutas que la usan:
  Como ORIGEN (1):
    - R001: PUNO → JULIACA
  Como DESTINO (1):
    - R002: AREQUIPA → PUNO
  En ITINERARIO (1):
    - R003: CUSCO → JULIACA
```

---

## 📋 Flujo de Eliminación

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. Usuario intenta eliminar localidad                      │
│     ↓                                                        │
│  2. Sistema verifica uso en rutas                           │
│     ↓                                                        │
│  3. ¿Está en uso?                                           │
│     ├─ SÍ → Bloquear eliminación                            │
│     │        Mostrar rutas que la usan                      │
│     │        Usuario debe eliminar rutas primero            │
│     │                                                        │
│     └─ NO → Permitir eliminación                            │
│              Desactivar localidad (soft delete)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Casos de Uso

### Caso 1: Localidad en Uso
```
Acción: Eliminar "PUNO"
Resultado: ❌ Bloqueado
Mensaje: "Está en 3 rutas"
Solución: Eliminar o modificar las 3 rutas primero
```

### Caso 2: Localidad No Usada
```
Acción: Eliminar "LOCALIDAD_NUEVA"
Resultado: ✅ Permitido
Mensaje: "Localidad eliminada exitosamente"
```

### Caso 3: Localidad Usada Solo en Itinerario
```
Acción: Eliminar "AYAVIRI"
Resultado: ❌ Bloqueado
Mensaje: "Está en 5 rutas (itinerario)"
Solución: Modificar itinerarios de las 5 rutas
```

---

## 🎯 Beneficios

### 1. Integridad de Datos
- No se pueden crear referencias rotas
- Las rutas siempre apuntan a localidades válidas
- Datos consistentes

### 2. Prevención de Errores
- Evita eliminaciones accidentales
- Muestra impacto antes de eliminar
- Usuario informado

### 3. Trazabilidad
- Se sabe exactamente dónde se usa cada localidad
- Fácil identificar dependencias
- Mejor mantenimiento

---

## 🔧 Alternativas

### Opción 1: Desactivar en Lugar de Eliminar
```
En lugar de eliminar, desactivar la localidad:
- La localidad sigue existiendo
- Las rutas siguen funcionando
- Se puede reactivar después
```

### Opción 2: Eliminación en Cascada (NO RECOMENDADO)
```
Eliminar localidad y todas las rutas que la usan:
- Peligroso
- Puede eliminar muchas rutas
- No implementado por seguridad
```

### Opción 3: Reemplazo Automático
```
Reemplazar localidad en todas las rutas:
- Seleccionar localidad de reemplazo
- Actualizar todas las rutas
- Luego eliminar localidad original
- Implementación futura
```

---

## 📊 Estadísticas

```
Protección implementada:
  ✅ Verificación automática
  ✅ Bloqueo de eliminación
  ✅ Listado de rutas afectadas
  ✅ Mensajes informativos
  ✅ API endpoint de verificación
```

---

## 🚀 Próximos Pasos

### Mejoras Futuras

1. **Frontend:**
   - Mostrar advertencia antes de eliminar
   - Listar rutas afectadas en modal
   - Botón para ir a cada ruta

2. **Backend:**
   - Endpoint para reemplazar localidad
   - Eliminación en cascada opcional
   - Historial de intentos de eliminación

3. **UX:**
   - Confirmación en dos pasos
   - Mostrar impacto visual
   - Sugerencias de acción

---

## ✅ Resumen

**Problema:**
- Eliminar localidad en uso → Rutas rotas ❌

**Solución:**
- Verificar uso antes de eliminar ✅
- Bloquear si está en uso ✅
- Mostrar rutas afectadas ✅
- Usuario informado ✅

**Resultado:**
- Integridad de datos garantizada ✅
- No hay referencias rotas ✅
- Sistema robusto ✅

---

## 📚 Archivos Relacionados

- `backend/app/services/localidad_service.py` - Servicio con protección
- `backend/app/routers/localidades_router.py` - Endpoint de verificación
- `test_proteccion_localidades.py` - Script de prueba

---

**Fecha:** 08/02/2026  
**Estado:** ✅ Implementado  
**Protección:** Activa automáticamente

# 🧪 Cómo Probar la Protección de Eliminación de Localidades

## 📋 Resumen
Este documento te guía paso a paso para probar que **NO se pueden eliminar localidades que están siendo usadas en rutas**.

---

## 🎯 Escenarios de Prueba

### ✅ Escenario 1: Intentar Eliminar Localidad EN USO

#### Pasos:
1. **Abrir el módulo de Localidades**
   ```
   Frontend → Localidades
   ```

2. **Identificar una localidad que esté en uso**
   - Ejemplo: "PUNO" (si está en rutas)
   - Ejemplo: "JULIACA" (si está en rutas)

3. **Intentar eliminar la localidad**
   - Click en el botón de eliminar (🗑️)

4. **Resultado Esperado:**
   ```
   ❌ NO SE PUEDE ELIMINAR

   La localidad "PUNO" está siendo utilizada en:

   • 5 ruta(s) como ORIGEN
   • 3 ruta(s) como DESTINO
   • 2 ruta(s) en ITINERARIO

   📋 Rutas afectadas:
      - PUNO - JULIACA
      - PUNO - AREQUIPA
      - CUSCO - PUNO
      - PUNO - DESAGUADERO
      - ILAVE - PUNO

   💡 Primero debes actualizar o eliminar estas rutas.
   ```

---

### ✅ Escenario 2: Eliminar Localidad NO EN USO

#### Pasos:
1. **Crear una localidad de prueba**
   ```
   Nombre: "LOCALIDAD_TEST"
   Departamento: PUNO
   Tipo: DISTRITO
   ```

2. **Verificar que NO esté en ninguna ruta**

3. **Intentar eliminar la localidad**
   - Click en el botón de eliminar (🗑️)

4. **Resultado Esperado:**
   ```
   ⚠️ ATENCIÓN: Esta acción eliminará permanentemente la localidad "LOCALIDAD_TEST".

   Esta acción NO se puede deshacer.

   ¿Estás completamente seguro de continuar?
   [Aceptar] [Cancelar]
   ```

5. **Confirmar eliminación**

6. **Resultado Final:**
   ```
   ✅ Localidad eliminada exitosamente
   ```

---

## 🔍 Verificación Backend

### Probar desde el Backend (Python)

```bash
# Ejecutar el script de prueba
python test_proteccion_localidades.py
```

**Salida Esperada:**
```
🧪 TEST: Protección de Eliminación de Localidades
================================================

📍 Creando localidad de prueba...
✅ Localidad creada: LOCALIDAD_TEST_12345

🛣️ Creando ruta que usa la localidad...
✅ Ruta creada: RUTA_TEST_12345

🔍 Verificando uso de la localidad...
✅ Localidad está en uso:
   - Rutas como origen: 1
   - Rutas como destino: 0
   - Rutas en itinerario: 0

❌ Intentando eliminar localidad en uso...
✅ PROTECCIÓN FUNCIONÓ: No se puede eliminar localidad en uso

🧹 Limpiando datos de prueba...
✅ Ruta eliminada
✅ Localidad eliminada

================================================
✅ TODAS LAS PRUEBAS PASARON
```

---

## 🎨 Flujo Visual

```
┌─────────────────────────────────────────────────────────┐
│  Usuario intenta eliminar "PUNO"                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend llama: verificarUsoLocalidad("puno_id")       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Backend verifica en tabla "rutas":                     │
│  - ¿Está en origen_id?                                  │
│  - ¿Está en destino_id?                                 │
│  - ¿Está en itinerario?                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Respuesta:                                             │
│  {                                                      │
│    "en_uso": true,                                      │
│    "rutas_como_origen": 5,                              │
│    "rutas_como_destino": 3,                             │
│    "rutas_en_itinerario": 2,                            │
│    "rutas_afectadas": [...]                             │
│  }                                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend muestra alerta con detalles                   │
│  ❌ NO permite eliminar                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Endpoints Disponibles

### 1. Verificar Uso de Localidad
```http
GET /api/localidades/{localidad_id}/verificar-uso
```

**Respuesta:**
```json
{
  "en_uso": true,
  "rutas_como_origen": 5,
  "rutas_como_destino": 3,
  "rutas_en_itinerario": 2,
  "rutas_afectadas": [
    {
      "id": "ruta_1",
      "nombre": "PUNO - JULIACA",
      "codigo": "R001"
    }
  ]
}
```

### 2. Eliminar Localidad (con protección)
```http
DELETE /api/localidades/{localidad_id}
```

**Respuesta si está en uso:**
```json
{
  "detail": "No se puede eliminar la localidad porque está siendo utilizada en 10 ruta(s)"
}
```

---

## 📊 Casos de Prueba Completos

| # | Escenario | Localidad | En Uso | Resultado Esperado |
|---|-----------|-----------|--------|-------------------|
| 1 | Eliminar localidad en uso como origen | PUNO | ✅ Sí | ❌ Bloqueado |
| 2 | Eliminar localidad en uso como destino | JULIACA | ✅ Sí | ❌ Bloqueado |
| 3 | Eliminar localidad en itinerario | ILAVE | ✅ Sí | ❌ Bloqueado |
| 4 | Eliminar localidad sin uso | TEST_LOC | ❌ No | ✅ Permitido |
| 5 | Eliminar localidad después de quitar de rutas | PUNO | ❌ No | ✅ Permitido |

---

## 🎯 Checklist de Verificación

- [ ] Backend: Endpoint `/verificar-uso` funciona
- [ ] Backend: Protección en `eliminar_localidad()` funciona
- [ ] Frontend: Llamada a `verificarUsoLocalidad()` funciona
- [ ] Frontend: Alerta muestra detalles correctos
- [ ] Frontend: No permite eliminar si está en uso
- [ ] Frontend: Permite eliminar si NO está en uso
- [ ] Test automatizado pasa correctamente

---

## 🚀 Próximos Pasos

Una vez verificado que funciona:

1. **Probar en producción** con datos reales
2. **Documentar** para el equipo
3. **Aplicar mismo patrón** a otros módulos (vehículos, conductores, etc.)

---

## 📝 Notas Importantes

- ⚠️ La protección es **a nivel de backend**, no se puede saltear desde el frontend
- ✅ El usuario siempre recibe **información clara** de por qué no puede eliminar
- 🔄 Si se eliminan las rutas, la localidad queda **disponible para eliminar**
- 📊 El sistema muestra **todas las rutas afectadas** para facilitar la corrección

---

**¿Dudas?** Revisa los archivos:
- `backend/app/services/localidad_service.py`
- `backend/app/routers/localidades_router.py`
- `frontend/src/app/components/localidades/shared/base-localidades.component.ts`
- `frontend/src/app/services/localidad.service.ts`

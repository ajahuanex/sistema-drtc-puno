# ⚠️ Comportamiento con Rutas Duplicadas en Carga Masiva

## 🎯 Pregunta

**¿Qué pasa si envío la misma data con solo una ruta actualizada?**

## 📋 Respuesta Corta

**El sistema rechazará las rutas duplicadas y solo creará las nuevas.**

## 🔍 Análisis Detallado

### Escenario: Archivo con Rutas Duplicadas

Supongamos que tienes estas rutas en la base de datos:

```
Ruta 01 - PUNO → JULIACA (ya existe)
Ruta 02 - JULIACA → AZÁNGARO (ya existe)
Ruta 03 - PUNO → ILAVE (ya existe)
```

Y subes un archivo Excel con:

```
Ruta 01 - PUNO → JULIACA (duplicada, sin cambios)
Ruta 02 - JULIACA → CUSCO (duplicada, pero con destino diferente)
Ruta 03 - PUNO → ILAVE (duplicada, sin cambios)
Ruta 04 - JULIACA → LAMPA (nueva)
```

### ❌ Comportamiento Actual

El sistema **NO actualiza** rutas existentes. En su lugar:

1. **Validación:**
   - Detecta que Ruta 01, 02 y 03 ya existen
   - Marca estas rutas como **INVÁLIDAS**
   - Marca Ruta 04 como **VÁLIDA**

2. **Procesamiento:**
   - **Rechaza** Ruta 01, 02 y 03 (código duplicado)
   - **Crea** solo Ruta 04

3. **Resultado:**
   ```
   Total procesadas: 4
   Exitosas: 1 (Ruta 04)
   Fallidas: 3 (Rutas 01, 02, 03)
   
   Errores:
   - Fila 2: Código '01' ya existe en la resolución
   - Fila 3: Código '02' ya existe en la resolución
   - Fila 4: Código '03' ya existe en la resolución
   ```

## 🔒 Validación de Unicidad

### Nivel 1: Dentro del Archivo Excel

El sistema valida que no haya códigos duplicados **dentro del mismo archivo**:

```python
# Si en el Excel hay:
Fila 2: Ruta 01
Fila 5: Ruta 01  # ❌ Error: duplicado en fila 2

# Resultado:
Error en fila 5: "Código de ruta 01 duplicado en resolución R-001-2024 (ya usado en fila 2)"
```

### Nivel 2: Contra la Base de Datos

El sistema valida que el código no exista en la base de datos **para la misma resolución**:

```python
# Backend: rutas_router.py línea 37-44
ruta_existente = await rutas_collection.find_one({
    "codigoRuta": ruta_data.codigoRuta,
    "resolucion.id": ruta_data.resolucion.id
})

if ruta_existente:
    raise HTTPException(
        status_code=400, 
        detail=f"Ya existe una ruta con código '{ruta_data.codigoRuta}' en esta resolución"
    )
```

## 🚫 Limitaciones Actuales

### ❌ NO Soportado

1. **Actualización de rutas existentes**
   - No puedes actualizar una ruta enviando el mismo código
   - Debes editar manualmente en la interfaz

2. **Modo "upsert"**
   - No hay opción de "crear si no existe, actualizar si existe"
   - Solo modo creación

3. **Actualización masiva**
   - No hay endpoint para actualizar múltiples rutas
   - Solo creación masiva

### ✅ Soportado

1. **Creación de rutas nuevas**
   - Códigos únicos que no existen
   - Validación automática

2. **Detección de duplicados**
   - Dentro del archivo
   - Contra la base de datos

3. **Reportes de errores**
   - Indica qué rutas están duplicadas
   - Muestra en qué fila del Excel

## 💡 Soluciones y Workarounds

### Opción 1: Usar Códigos Nuevos

Si quieres actualizar rutas, usa códigos nuevos:

```
Archivo original:
01 - PUNO → JULIACA

Para actualizar:
01A - PUNO → CUSCO (nuevo código)
```

### Opción 2: Eliminar y Recrear

1. Elimina las rutas existentes manualmente
2. Sube el archivo con las rutas actualizadas
3. Se crearán con los nuevos datos

**⚠️ Advertencia:** Perderás el historial y relaciones

### Opción 3: Editar Manualmente

Para cambios pequeños:
1. Edita las rutas una por una en la interfaz
2. Usa carga masiva solo para rutas nuevas

### Opción 4: Filtrar Rutas Nuevas

Antes de subir el archivo:
1. Exporta las rutas existentes
2. Compara con tu archivo
3. Elimina las rutas duplicadas del Excel
4. Sube solo las rutas nuevas

## 📊 Ejemplo Práctico

### Escenario Real

**Base de datos actual:**
```
01 - PUNO → JULIACA (Frecuencia: 1 diaria)
02 - JULIACA → AZÁNGARO (Frecuencia: 2 diarias)
```

**Archivo Excel a subir:**
```
01 - PUNO → JULIACA (Frecuencia: 3 diarias)  ← Quiero actualizar frecuencia
02 - JULIACA → AZÁNGARO (Frecuencia: 2 diarias)  ← Sin cambios
03 - PUNO → ILAVE (Frecuencia: 1 diaria)  ← Nueva ruta
```

### Resultado de Validación

```
✅ Total filas: 3
❌ Válidos: 1
❌ Inválidos: 2
⚠️ Con advertencias: 0

Errores:
- Fila 2 (Código 01): Ya existe una ruta con código '01' en esta resolución
- Fila 3 (Código 02): Ya existe una ruta con código '02' en esta resolución

Rutas válidas:
- Fila 4 (Código 03): PUNO → ILAVE
```

### Resultado de Procesamiento

```
📊 Total procesadas: 3
✅ Exitosas: 1
❌ Fallidas: 2

Rutas creadas:
- 03 - PUNO → ILAVE (ID: 6991c125ec61906bc86378cc)

Errores:
- Código 01: Ya existe en la resolución
- Código 02: Ya existe en la resolución
```

## 🔧 Recomendaciones

### Para Actualizaciones

1. **No uses carga masiva para actualizar**
   - Usa la interfaz de edición individual
   - O el endpoint PUT /api/v1/rutas/{id}

2. **Usa carga masiva solo para crear**
   - Rutas completamente nuevas
   - Códigos únicos

### Para Evitar Duplicados

1. **Antes de subir:**
   - Verifica qué rutas ya existen
   - Elimina duplicados del Excel
   - Usa solo códigos nuevos

2. **Durante la validación:**
   - Revisa los errores de duplicados
   - Corrige el archivo
   - Vuelve a validar

3. **Después del procesamiento:**
   - Verifica las rutas creadas
   - Edita manualmente las que necesiten cambios

## 🎯 Flujo Recomendado

### Para Importación Inicial

```
1. Preparar archivo con todas las rutas
   ↓
2. Validar (detectará duplicados si hay)
   ↓
3. Procesar (creará solo las nuevas)
   ↓
4. Verificar resultados
```

### Para Agregar Rutas Nuevas

```
1. Exportar rutas existentes (si hay función)
   ↓
2. Identificar códigos ya usados
   ↓
3. Preparar archivo solo con rutas nuevas
   ↓
4. Validar y procesar
```

### Para Actualizar Rutas

```
1. NO usar carga masiva
   ↓
2. Editar manualmente en la interfaz
   ↓
3. O usar endpoint PUT individual
```

## 📝 Resumen

| Acción | ¿Soportado? | Método |
|--------|-------------|--------|
| Crear rutas nuevas | ✅ Sí | Carga masiva |
| Actualizar rutas existentes | ❌ No | Edición manual |
| Detectar duplicados | ✅ Sí | Automático |
| Modo upsert | ❌ No | No disponible |
| Actualización masiva | ❌ No | No disponible |

## 🚀 Mejora Futura Sugerida

Para soportar actualizaciones, se podría implementar:

```python
# Opción en el formulario
modo_procesamiento = "crear" | "actualizar" | "upsert"

if modo_procesamiento == "actualizar":
    # Buscar ruta existente por código
    ruta_existente = await buscar_por_codigo(codigo, resolucion_id)
    if ruta_existente:
        # Actualizar ruta existente
        await actualizar_ruta(ruta_existente.id, nuevos_datos)
    else:
        # Error: ruta no existe
        errores.append("Ruta no encontrada para actualizar")

elif modo_procesamiento == "upsert":
    # Buscar ruta existente
    ruta_existente = await buscar_por_codigo(codigo, resolucion_id)
    if ruta_existente:
        # Actualizar
        await actualizar_ruta(ruta_existente.id, nuevos_datos)
    else:
        # Crear nueva
        await crear_ruta(nuevos_datos)
```

## ✅ Conclusión

**Respuesta a tu pregunta:**

Si envías el mismo archivo con una ruta actualizada:
- ❌ Las rutas duplicadas serán **rechazadas**
- ❌ NO se actualizarán automáticamente
- ✅ Solo se crearán las rutas con códigos nuevos
- ℹ️ Verás errores indicando "código ya existe"

**Para actualizar rutas existentes:**
- Usa la interfaz de edición individual
- O el endpoint PUT /api/v1/rutas/{id}
- NO uses carga masiva

**Para agregar rutas nuevas:**
- Usa carga masiva
- Asegúrate de usar códigos únicos
- Elimina duplicados del archivo Excel

# Diagnóstico y Limpieza de Duplicados en Localidades

## Descripción

El sistema ahora incluye herramientas mejoradas para detectar y eliminar duplicados en la base de datos de localidades. Esto es especialmente importante después de importaciones masivas desde archivos GeoJSON.

## Problemas Resueltos

### 1. Detección Mejorada de Duplicados

**Antes:**
- Solo buscaba coincidencias exactas de nombre
- No detectaba variaciones en mayúsculas/minúsculas
- No consideraba espacios en blanco adicionales
- Podía confundir distritos con el mismo nombre en diferentes provincias

**Ahora:**
- Búsqueda por UBIGEO primero (más específico)
- Búsqueda por nombre normalizado (case-insensitive)
- Búsqueda por nombre + provincia/distrito (para contexto)
- Usa expresiones regulares para mayor flexibilidad

### 2. Búsqueda Robusta por Tipo de Localidad

**Distritos:**
```python
# Primero busca por UBIGEO (6 dígitos INEI)
# Si no encuentra, busca por nombre + provincia (case-insensitive)
```

**Centros Poblados:**
```python
# Primero busca por IDCCPP (10 dígitos INEI)
# Si no encuentra, busca por nombre + distrito (case-insensitive)
```

**Provincias:**
```python
# Primero busca por IDPROV (4 dígitos INEI)
# Si no encuentra, busca por nombre (case-insensitive)
```

## Cómo Usar

### 1. Acceder al Diagnóstico

En la pantalla de Localidades, haz clic en el botón **"Diagnóstico Duplicados"** (ícono de bug_report).

### 2. Revisar el Diagnóstico

El diagnóstico muestra:

- **Resumen**: Total de localidades, problemas detectados
- **Duplicados Encontrados**: Lista de grupos de duplicados con sus IDs
- **Problemas Detectados**: 
  - Localidades sin UBIGEO
  - Localidades sin coordenadas GPS
  - Grupos de duplicados

### 3. Limpiar Duplicados

1. Revisa los duplicados encontrados
2. Haz clic en **"Limpiar Duplicados"**
3. Confirma la acción (no se puede deshacer)
4. El sistema eliminará los duplicados, manteniendo el primero de cada grupo

### 4. Resultados

Después de la limpieza, verás:
- Número de grupos de duplicados procesados
- Número de registros eliminados
- Detalles de cada grupo limpiado

## Endpoints del Backend

### GET `/api/v1/localidades/diagnostico-duplicados`

Analiza la base de datos y retorna un reporte de duplicados.

**Respuesta:**
```json
{
  "total_localidades": 9500,
  "por_tipo": {
    "PROVINCIA": 13,
    "DISTRITO": 110,
    "CENTRO_POBLADO": 9377
  },
  "duplicados_potenciales": [
    {
      "nombre": "PUNO",
      "tipo": "PROVINCIA",
      "cantidad": 2,
      "ids": ["id1", "id2"]
    }
  ],
  "sin_ubigeo": 45,
  "sin_coordenadas": 120
}
```

### POST `/api/v1/localidades/limpiar-duplicados`

Elimina duplicados exactos, manteniendo solo el primero de cada grupo.

**Respuesta:**
```json
{
  "duplicados_encontrados": 5,
  "registros_eliminados": 7,
  "detalles": [
    {
      "nombre": "PUNO",
      "tipo": "PROVINCIA",
      "cantidad_original": 2,
      "eliminados": 1
    }
  ]
}
```

## Mejoras en la Importación

### Búsqueda Mejorada en Distritos

```python
# Búsqueda en dos pasos:
# 1. Por UBIGEO (si existe)
existe = await localidades_collection.find_one({
    "ubigeo": ubigeo,
    "tipo": tipo
})

# 2. Por nombre + provincia (case-insensitive)
if not existe:
    existe = await localidades_collection.find_one({
        "nombre": {"$regex": f"^{nombre_normalizado}$", "$options": "i"},
        "tipo": tipo,
        "provincia": {"$regex": f"^{provincia_normalizada}$", "$options": "i"}
    })
```

### Búsqueda Mejorada en Centros Poblados

```python
# Búsqueda en dos pasos:
# 1. Por IDCCPP (si existe)
existe = await localidades_collection.find_one({
    "ubigeo": ubigeo,
    "tipo": TipoLocalidad.CENTRO_POBLADO
})

# 2. Por nombre + distrito (case-insensitive)
if not existe:
    query = {
        "nombre": {"$regex": f"^{nombre_normalizado}$", "$options": "i"},
        "tipo": TipoLocalidad.CENTRO_POBLADO
    }
    if distrito_normalizado:
        query["distrito"] = {"$regex": f"^{distrito_normalizado}$", "$options": "i"}
    existe = await localidades_collection.find_one(query)
```

## Recomendaciones

1. **Ejecutar diagnóstico regularmente** después de importaciones masivas
2. **Revisar duplicados** antes de limpiar (especialmente si hay variaciones en nombres)
3. **Hacer backup** de la base de datos antes de limpiar duplicados
4. **Verificar UBIGEO** - Los códigos INEI son únicos y son la mejor forma de identificar localidades

## Códigos INEI

- **IDPROV**: 4 dígitos (provincias)
- **UBIGEO**: 6 dígitos (distritos)
- **IDCCPP**: 10 dígitos (centros poblados)

Estos códigos son únicos y no deben duplicarse. Si hay duplicados con diferentes UBIGEO, probablemente sean registros diferentes.

## Troubleshooting

### Problema: Muchos duplicados detectados

**Causa:** Variaciones en los nombres (espacios, mayúsculas, acentos)

**Solución:** 
1. Revisar los datos fuente
2. Normalizar nombres antes de importar
3. Usar UBIGEO como identificador principal

### Problema: Duplicados no se eliminan

**Causa:** Pueden ser registros diferentes con el mismo nombre

**Solución:**
1. Revisar los UBIGEO
2. Verificar provincia/distrito
3. Considerar si son realmente duplicados

### Problema: Faltan localidades después de limpiar

**Causa:** Probablemente se eliminaron registros válidos

**Solución:**
1. Restaurar desde backup
2. Revisar la lógica de duplicados
3. Contactar al equipo de desarrollo

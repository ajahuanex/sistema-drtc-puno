# Mejoras en Carga Masiva de Localidades

## Cambios Implementados

### 1. Botón para Borrar Todas las Localidades

**Ubicación:** Header del módulo de Localidades

**Características:**
- Botón "Borrar Todo" con color de advertencia (rojo)
- Doble confirmación:
  1. Diálogo de confirmación
  2. Prompt pidiendo escribir "BORRAR TODO"
- Elimina localidades y geometrías
- Recarga automáticamente después de eliminar

**Uso:**
```
1. Click en "Borrar Todo"
2. Confirmar en diálogo
3. Escribir "BORRAR TODO" en el prompt
4. Se eliminan todos los registros
```

### 2. Preview de Datos en Carga Masiva

**Características:**
- Cuando seleccionas un archivo GeoJSON personalizado:
  1. Se lee automáticamente
  2. Se extrae la lista de columnas disponibles
  3. Se muestra un preview de los primeros 3 registros
  4. Se abre un diálogo de mapeo de columnas

**Diálogo de Mapeo:**
- Muestra las columnas disponibles en el archivo
- Permite mapear a los campos esperados:
  - nombre
  - tipo
  - ubigeo
  - departamento
  - provincia
  - distrito
  - coordenadas

### 3. Reporte Detallado de Importación

**Información Mostrada:**
- Total de registros procesados
- Registros importados (nuevos)
- Registros actualizados
- Registros omitidos (duplicados)
- Registros con error

**Duplicados Detectados:**
- Lista de localidades que no se importaron
- Razón del duplicado:
  - UBIGEO duplicado
  - Nombre duplicado
- Ubicación (provincia/distrito)
- Acción tomada (omitido)

**Log en Consola del Backend:**
```
================================================================================
📊 REPORTE DE IMPORTACIÓN
================================================================================
✅ Importados: 110
🔄 Actualizados: 0
⏭️  Omitidos: 0
❌ Errores: 0

⚠️  DISTRITOS NO IMPORTADOS (0):

⚠️  CENTROS POBLADOS NO IMPORTADOS (0):

================================================================================
```

## Flujo de Uso

### Importación Inicial (Archivos por Defecto)

1. Click en "Carga Masiva GeoJSON"
2. Seleccionar "Archivos por Defecto"
3. Seleccionar modo de importación (crear, actualizar, ambos)
4. Seleccionar tipos a importar (provincias, distritos, centros poblados)
5. Click en "Confirmar e Importar"
6. Ver resultados con detalles de duplicados

### Importación Personalizada

1. Click en "Carga Masiva GeoJSON"
2. Seleccionar "Archivo Personalizado"
3. Click en "Seleccionar Archivo"
4. Elegir archivo .geojson
5. Se abre automáticamente diálogo de mapeo de columnas
6. Mapear columnas del archivo a campos esperados
7. Click en "Confirmar"
8. Ver resultados

### Limpieza de Base de Datos

1. Click en "Borrar Todo"
2. Confirmar en diálogo
3. Escribir "BORRAR TODO" en prompt
4. Se eliminan todos los registros
5. Se recarga la interfaz

## Información Técnica

### Backend - Logging

El endpoint `/api/v1/localidades/importar-desde-geojson` ahora:
- Registra cada duplicado detectado
- Incluye razón del duplicado
- Imprime reporte en consola del servidor
- Retorna lista de duplicados en respuesta

### Frontend - Visualización

El componente de carga masiva ahora:
- Muestra preview de datos antes de mapear
- Permite mapear columnas personalizadas
- Muestra lista de duplicados detectados
- Indica razón de cada duplicado
- Muestra hasta 10 duplicados (con contador de más)

## Resolución de Problemas

### Faltan Distritos

Si faltan distritos después de importar:

1. **Verificar en el reporte:**
   - Buscar en la sección "DISTRITOS NO IMPORTADOS"
   - Ver la razón (UBIGEO duplicado o Nombre duplicado)

2. **Usar Diagnóstico:**
   - Click en "Diagnóstico Duplicados"
   - Ver lista completa de duplicados
   - Opcionalmente limpiar duplicados

3. **Reintentar:**
   - Click en "Borrar Todo"
   - Reimportar con modo "crear"

### Columnas No Coinciden

Si las columnas del archivo no coinciden:

1. Se abre automáticamente el diálogo de mapeo
2. Mapear cada columna del archivo al campo correcto
3. Ver preview de datos para validar
4. Confirmar mapeo

## Estadísticas Esperadas

**Importación Completa de Puno:**
- Provincias: 13
- Distritos: 110
- Centros Poblados: ~9000
- Total: ~9123

Si faltan registros, revisar el reporte de duplicados.

# Importación de Localidades desde GeoJSON

Este script importa las localidades del departamento de Puno desde archivos GeoJSON con coordenadas precisas.

## Archivos GeoJSON Utilizados

### 1. puno-provincias-point.geojson
- Contiene las 13 provincias de Puno
- Cada provincia tiene sus coordenadas exactas (Point)
- Incluye datos de población y superficie

### 2. puno-distritos-point.geojson
- Contiene los 109 distritos de Puno
- Cada distrito tiene sus coordenadas exactas (Point)
- Incluye información de provincia, capital y UBIGEO

### 3. puno-centrospoblados.geojson
- Contiene los centros poblados de Puno
- Cada centro poblado tiene coordenadas Point
- Incluye datos de población, tipo (Rural/Urbano) y UBIGEO

## Ventajas de este Método

✅ **Coordenadas precisas**: Los archivos point ya contienen las coordenadas exactas, no es necesario calcular centroides

✅ **Datos oficiales**: Basado en información del INEI

✅ **Completo**: Incluye provincias, distritos y centros poblados

✅ **Metadatos**: Incluye población, superficie y otros datos relevantes

## Uso

### Opción 1: Usando el archivo batch (Windows)
```cmd
cd backend
importar_localidades_geojson.bat
```

### Opción 2: Usando Python directamente
```cmd
cd backend
python scripts/importar_localidades_desde_geojson.py
```

## Proceso de Importación

1. **Conexión a MongoDB**: Se conecta a la base de datos configurada

2. **Carga de datos**:
   - Lee puno-provincias-point.geojson
   - Lee puno-distritos-point.geojson
   - Lee puno-centrospoblados.geojson

3. **Procesamiento**:
   - Extrae coordenadas de cada feature
   - Asigna tipo de localidad (PROVINCIA, DISTRITO, CIUDAD, CENTRO_POBLADO)
   - Estructura los datos según el modelo de Localidad

4. **Importación**:
   - Limpia la colección existente (previa confirmación)
   - Inserta todas las localidades
   - Crea índices para búsquedas eficientes

5. **Verificación**:
   - Muestra estadísticas de importación
   - Cuenta localidades por tipo

## Estructura de Datos

Cada localidad se guarda con:

```python
{
    "nombre": "PUNO",
    "tipo": "CIUDAD",
    "ubigeo": "210101",
    "departamento": "PUNO",
    "provincia": "PUNO",
    "distrito": "PUNO",
    "descripcion": "Capital del departamento...",
    "coordenadas": {
        "latitud": -15.8402,
        "longitud": -70.0219
    },
    "poblacion": 230219,  # Opcional
    "superficie": 0.545,  # Opcional
    "activo": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Índices Creados

- `nombre`: Para búsquedas por nombre
- `ubigeo`: Para búsquedas por código UBIGEO
- `tipo`: Para filtrar por tipo de localidad
- `provincia + distrito`: Para búsquedas jerárquicas
- `coordenadas.latitud + coordenadas.longitud`: Para búsquedas geoespaciales

## Tipos de Localidad

- **PROVINCIA**: 13 provincias de Puno
- **CIUDAD**: Capitales provinciales y ciudades principales
- **DISTRITO**: 109 distritos
- **CENTRO_POBLADO**: Centros poblados rurales y urbanos

## Estadísticas Esperadas

Después de la importación exitosa:
- **Provincias**: 13
- **Distritos**: ~109
- **Centros Poblados**: Variable (depende del archivo)
- **Total**: ~1000+ localidades

## Solución de Problemas

### Error: No se encuentra el archivo GeoJSON
- Verifica que los archivos estén en `frontend/src/assets/geojson/`
- Nombres esperados:
  - `puno-provincias-point.geojson`
  - `puno-distritos-point.geojson`
  - `puno-centrospoblados.geojson`

### Error de conexión a MongoDB
- Verifica que MongoDB esté corriendo
- Revisa la variable de entorno `MONGODB_URL`
- Por defecto usa: `mongodb://localhost:27017`

### Coordenadas incorrectas
- Los archivos point ya tienen las coordenadas correctas
- No se calculan centroides, se usan las coordenadas directamente
- Formato: `[longitud, latitud]` (GeoJSON estándar)

## Diferencias con el Script Anterior

### Script Anterior (importar_localidades_puno_completo.py)
- ❌ Coordenadas hardcodeadas manualmente
- ❌ Requería calcular centroides
- ❌ Datos incompletos
- ❌ Difícil de mantener

### Script Nuevo (importar_localidades_desde_geojson.py)
- ✅ Coordenadas desde archivos oficiales
- ✅ No requiere cálculos
- ✅ Datos completos y actualizados
- ✅ Fácil de actualizar (solo cambiar archivos GeoJSON)

## Mantenimiento

Para actualizar las localidades:
1. Reemplaza los archivos GeoJSON en `frontend/src/assets/geojson/`
2. Ejecuta el script de importación
3. Confirma la limpieza de datos anteriores
4. Verifica las estadísticas finales

## Notas

- El script solicita confirmación antes de limpiar la base de datos
- Se crean automáticamente los índices necesarios
- Las coordenadas están en formato WGS84 (latitud/longitud)
- Los centros poblados incluyen información de población y tipo (Rural/Urbano)

# 📊 Estructura de Datos GeoJSON - SIRRET

## Archivos Disponibles

### 1. puno-provincias.geojson
- **Tipo de geometría:** MultiPolygon (polígonos)
- **Uso:** Mostrar límites de provincias en mapa
- **Columnas principales:**
  - `NOMBPROV` - Nombre provincia
  - `IDPROV` - ID provincia (4 dígitos: 2101, 2102, etc)
  - `POBTOTAL` - Población total
  - `FUENTE` - INEI - CPV2017

### 2. puno-provincias-point.geojson ⭐
- **Tipo de geometría:** Point (puntos)
- **Uso:** Mostrar ubicación central de provincias
- **Coordenadas:** [Longitud, Latitud]
- **Ejemplo:** [-70.082360157894925, -16.086076834678124]
- **Mismas columnas que provincias.geojson**

### 3. puno-distritos.geojson
- **Tipo de geometría:** MultiPolygon
- **Columnas principales:**
  - `NOMBDIST` - Nombre distrito
  - `UBIGEO` - UBIGEO (6 dígitos: 210101, 210102, etc)
  - `PROVINCIA` - Nombre provincia
  - `POBTOTAL` - Población

### 4. puno-distritos-point.geojson ⭐
- **Tipo de geometría:** Point
- **Coordenadas:** [Longitud, Latitud]
- **Mismas columnas que distritos.geojson**

### 5. puno-centrospoblados.geojson
- **Tipo de geometría:** Point
- **Columnas principales:**
  - `NOMB_CCPP` - Nombre centro poblado
  - `UBIGEO` - UBIGEO (8 dígitos)
  - `NOMB_DISTR` - Nombre distrito
  - `NOMB_PROVI` - Nombre provincia
  - `POBTOTAL` - Población

## Recomendación para Importación

**Para mostrar datos en mapa con coordenadas, SIEMPRE usar los archivos con "-point":**

```typescript
// ✅ CORRECTO - Usar archivos con Point
const archivosParaMapa = [
  'puno-provincias-point.geojson',    // Puntos de provincias
  'puno-distritos-point.geojson',     // Puntos de distritos
  'puno-centrospoblados.geojson'      // Ya tiene Points
];

// ❌ INCORRECTO - Usar archivos sin -point
const archivosIncorrectos = [
  'puno-provincias.geojson',          // MultiPolygon, sin coordenadas de punto
  'puno-distritos.geojson'            // MultiPolygon, sin coordenadas de punto
];
```

## Estructura de Feature

### Ejemplo: Provincia (Point)
```json
{
  "type": "Feature",
  "id": 1,
  "geometry": {
    "type": "Point",
    "coordinates": [-70.082360157894925, -16.086076834678124]
  },
  "properties": {
    "NOMBPROV": "PUNO",
    "IDPROV": 2101,
    "UBIGEO": "210100",
    "POBTOTAL": 227665,
    "FUENTE": "INEI - CPV2017",
    "DENSIDAD": 910.24,
    "EDAD_PROME": 34.95,
    ...más propiedades
  }
}
```

## Mapeo de Datos para Base de Datos

### Provincias
```
GeoJSON → Base de Datos
NOMBPROV → nombre
IDPROV → ubigeo (4 dígitos)
POBTOTAL → poblacion
coordinates[0] → longitud
coordinates[1] → latitud
```

### Distritos
```
GeoJSON → Base de Datos
NOMBDIST → nombre
UBIGEO → ubigeo (6 dígitos)
PROVINCIA → provincia
POBTOTAL → poblacion
coordinates[0] → longitud
coordinates[1] → latitud
```

### Centros Poblados
```
GeoJSON → Base de Datos
NOMB_CCPP → nombre
UBIGEO → ubigeo (8 dígitos)
NOMB_DISTR → distrito
NOMB_PROVI → provincia
POBTOTAL → poblacion
coordinates[0] → longitud
coordinates[1] → latitud
```

## Actualización Necesaria en Frontend

En `carga-masiva-geojson.component.ts`, cambiar:

```typescript
// ❌ ACTUAL (incorrecto)
archivosDisponibles.set([
  'puno-provincias.geojson',
  'puno-distritos.geojson',
  'puno-provincias-point.geojson',
  'puno-distritos-point.geojson'
]);

// ✅ RECOMENDADO (correcto)
archivosDisponibles.set([
  'puno-provincias-point.geojson',    // Usar Point para provincias
  'puno-distritos-point.geojson',     // Usar Point para distritos
  'puno-centrospoblados.geojson'      // Ya tiene Points
]);
```

## Notas Importantes

1. **Coordenadas:** Siempre en formato [Longitud, Latitud]
2. **UBIGEO:** 
   - Provincias: 4 dígitos (2101)
   - Distritos: 6 dígitos (210101)
   - Centros Poblados: 8 dígitos (21010101)
3. **Fuente:** Todos los datos son del INEI - CPV2017
4. **Población:** Campo `POBTOTAL` en todos los archivos

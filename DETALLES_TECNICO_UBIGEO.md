# 📋 Detalles Técnico: Mapeo de UBIGEO por Tipo de Localidad

## Estructura de UBIGEO en Perú

El UBIGEO (Código de Ubicación Geográfica) es un código de 6 a 10 dígitos que identifica localidades en Perú:

```
DDPPDDCCCC
│  │  │  │
│  │  │  └─ Código de Centro Poblado (4 dígitos) - Solo para CCPP
│  │  └──── Código de Distrito (2 dígitos)
│  └─────── Código de Provincia (2 dígitos)
└────────── Código de Departamento (2 dígitos)
```

## Tipos de UBIGEO Implementados

### 1. PROVINCIA (8 dígitos)
**Formato**: `DDPP0000`

**Ejemplo**: `21010000`
- `21` = Departamento Puno
- `01` = Provincia Puno
- `0000` = Relleno (no hay distrito ni CCPP)

**Extracción de datos**:
```typescript
const idprov = props.IDPROV || props.CODPROV;
// IDPROV viene como "2101" (4 dígitos)
// Necesitamos extraer los últimos 2 dígitos (código provincia)
const provCode = idprov.toString().substring(2);
const ubigeo = '21' + provCode.padStart(2, '0') + '0000';
```

**Archivos GeoJSON**:
- `puno-provincias-point.geojson`
- Propiedades: `IDPROV`, `NOMBPROV`, `POBTOTAL`, `FUENTE`

### 2. DISTRITO (8 dígitos)
**Formato**: `DDPPDD00`

**Ejemplo**: `21050200`
- `21` = Departamento Puno
- `05` = Provincia El Collao
- `02` = Distrito Capazo
- `00` = Relleno (no hay CCPP)

**Extracción de datos**:
```typescript
const ubigeo = props.UBIGEO || props.ubigeo;
// UBIGEO viene como "210502" (6 dígitos)
// Agregamos "00" al final
const ubigeoCompleto = ubigeo.toString().padStart(6, '0') + '00';
```

**Archivos GeoJSON**:
- `puno-distritos-point.geojson`
- Propiedades: `UBIGEO`, `PROVINCIA`, `DISTRITO`, `FUENTE`

### 3. CENTRO POBLADO (10 dígitos)
**Formato**: `DDPPDDCCCC`

**Ejemplo**: `2110020048`
- `21` = Departamento Puno
- `10` = Provincia San Antonio de Putina
- `02` = Distrito Ananea
- `0048` = Centro Poblado Chaquiminas

**Extracción de datos**:
```typescript
const idccpp = props.IDCCPP || props.COD_CCPP;
// IDCCPP viene como "2110020048" (10 dígitos)
// Se usa directamente
const ubigeo = idccpp.toString().padStart(10, '0');
```

**Archivos GeoJSON**:
- `puno-centrospoblados.geojson`
- Propiedades: `IDCCPP`, `NOMB_CCPP`, `NOMB_DISTR`, `NOMB_PROVI`, `POBTOTAL`

## Mapeo de Propiedades por Tipo

### Provincias
```typescript
{
  nombre: props.NOMBPROV,
  tipo: 'PROVINCIA',
  ubigeo: '21' + provCode + '0000',
  departamento: 'PUNO',
  provincia: props.NOMBPROV,
  distrito: '',
  longitud: coords[0],
  latitud: coords[1],
  poblacion: props.POBTOTAL,
  fuente: props.FUENTE
}
```

### Distritos
```typescript
{
  nombre: props.DISTRITO,
  tipo: 'DISTRITO',
  ubigeo: ubigeo + '00',
  departamento: 'PUNO',
  provincia: props.PROVINCIA,
  distrito: props.DISTRITO,
  longitud: coords[0],
  latitud: coords[1],
  poblacion: props.POBTOTAL,
  fuente: props.FUENTE
}
```

### Centros Poblados
```typescript
{
  nombre: props.NOMB_CCPP,
  tipo: 'CENTRO_POBLADO',
  ubigeo: idccpp,
  departamento: 'PUNO',
  provincia: props.NOMB_PROVI,
  distrito: props.NOMB_DISTR,
  longitud: coords[0],
  latitud: coords[1],
  poblacion: props.POBTOTAL,
  fuente: props.FUENTE
}
```

## Extracción de Coordenadas

Todas las coordenadas se extraen desde `geometry.coordinates`:

```typescript
private extraerCoordenadas(feature: any): { longitud: number; latitud: number } | null {
  const coords = feature.geometry?.coordinates;
  
  if (!coords || coords.length < 2) {
    return null;
  }
  
  // GeoJSON usa formato [Longitud, Latitud]
  return {
    longitud: coords[0],  // Eje X (Este-Oeste)
    latitud: coords[1]    // Eje Y (Norte-Sur)
  };
}
```

**Rango válido para Puno**:
- Longitud: -72 a -68 (Oeste)
- Latitud: -18 a -13 (Sur)

## Validaciones Implementadas

### 1. Nombre
```typescript
if (!localidad.nombre || localidad.nombre.trim() === '') {
  errores.push('Nombre vacío');
}
```

### 2. UBIGEO
```typescript
if (!localidad.ubigeo || localidad.ubigeo.length === 0) {
  errores.push('UBIGEO vacío');
}
```

### 3. Coordenadas
```typescript
if (localidad.longitud === null || localidad.latitud === null) {
  errores.push('Coordenadas faltantes');
}
```

### 4. Rango de Coordenadas
```typescript
if (localidad.longitud < -72 || localidad.longitud > -68) {
  errores.push('Longitud fuera de rango para Puno');
}
if (localidad.latitud < -18 || localidad.latitud > -13) {
  errores.push('Latitud fuera de rango para Puno');
}
```

## Flujo de Procesamiento

```
1. Cargar archivos GeoJSON
   ↓
2. Para cada feature:
   a. Extraer tipo de localidad
   b. Mapear localidad (nombre, UBIGEO, coordenadas, etc.)
   c. Validar datos
   d. Contar estadísticas
   ↓
3. Separar ejemplos por tipo
   ↓
4. Mostrar preview con datos reales
   ↓
5. Permitir importación
```

## Ejemplos de Datos Reales

### Provincia Puno
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-70.082360157894925, -16.086076834678124]
  },
  "properties": {
    "IDPROV": "2101",
    "NOMBPROV": "PUNO",
    "POBTOTAL": 227665,
    "FUENTE": "INEI - CPV2017"
  }
}
```

**Resultado**:
```
Nombre: PUNO
UBIGEO: 21010000
Coordenadas: [-70.0824, -16.0861]
```

### Distrito Capazo
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-69.702016679326277, -17.109849061085242]
  },
  "properties": {
    "UBIGEO": "210502",
    "PROVINCIA": "EL COLLAO",
    "DISTRITO": "CAPAZO",
    "FUENTE": "INEI"
  }
}
```

**Resultado**:
```
Nombre: CAPAZO
UBIGEO: 21050200
Provincia: EL COLLAO
Coordenadas: [-69.7020, -17.1098]
```

### Centro Poblado Chaquiminas
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-69.558805214788777, -14.669026784158689]
  },
  "properties": {
    "IDCCPP": "2110020048",
    "NOMB_CCPP": "CHAQUIMINAS",
    "NOMB_DISTR": "ANANEA",
    "NOMB_PROVI": "SAN ANTONIO DE PUTINA",
    "POBTOTAL": 10
  }
}
```

**Resultado**:
```
Nombre: CHAQUIMINAS
UBIGEO: 2110020048
Distrito: ANANEA
Provincia: SAN ANTONIO DE PUTINA
Coordenadas: [-69.5588, -14.6690]
```

## Archivos Modificados

### `frontend/src/app/components/localidades/carga-masiva-geojson.component.ts`

**Métodos nuevos**:
1. `mapearLocalidad(feature, tipo)` - Mapea feature a objeto localidad
2. `extraerNombre(props, tipo)` - Extrae nombre según tipo
3. `extraerCoordenadas(feature)` - Extrae coordenadas desde geometry
4. `generarUBIGEO(feature, tipo)` - Genera UBIGEO correcto
5. `validarLocalidad(localidad)` - Valida datos completos

**Métodos actualizados**:
1. `procesarValidacion(features)` - Usa nuevos métodos
2. `cargarYValidarArchivosPorDefecto()` - Carga archivos con "-point"

## Consideraciones de Rendimiento

- Los archivos se cargan en chunks (primeros 10 para preview)
- La validación es rápida (O(n) donde n = número de features)
- Las coordenadas se validan contra rango geográfico
- Los errores se limitan a los primeros 10 para no saturar la UI

## Próximas Mejoras Posibles

1. Agregar soporte para otros departamentos
2. Validar UBIGEO contra base de datos
3. Detectar duplicados automáticamente
4. Importación en paralelo para archivos grandes
5. Caché de UBIGEO validados


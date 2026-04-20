# 📚 Ejemplos de Uso: Mapeo de UBIGEO

## Ejemplo 1: Mapeo de Provincia

### Datos de Entrada (GeoJSON)
```json
{
  \"type\": \"Feature\",
  \"geometry\": {
    \"type\": \"Point\",
    \"coordinates\": [-70.082360157894925, -16.086076834678124]
  },
  \"properties\": {
    \"IDPROV\": \"2101\",
    \"NOMBPROV\": \"PUNO\",
    \"POBTOTAL\": 227665,
    \"FUENTE\": \"INEI - CPV2017\"
  }
}
```

### Procesamiento
```typescript
const feature = {...};
const tipo = 'PROVINCIA';

// 1. Extraer coordenadas
const coords = this.extraerCoordenadas(feature);
// Resultado: { longitud: -70.0824, latitud: -16.0861 }

// 2. Extraer nombre
const nombre = this.extraerNombre(feature.properties, tipo);
// Resultado: \"PUNO\"

// 3. Generar UBIGEO
const ubigeo = this.generarUBIGEO(feature, tipo);
// Resultado: \"21010000\"

// 4. Mapear localidad
const localidad = this.mapearLocalidad(feature, tipo);
// Resultado: {
//   nombre: \"PUNO\",
//   tipo: \"PROVINCIA\",
//   ubigeo: \"21010000\",
//   departamento: \"PUNO\",
//   provincia: \"PUNO\",
//   distrito: \"\",
//   longitud: -70.0824,
//   latitud: -16.0861,
//   poblacion: 227665,
//   fuente: \"INEI - CPV2017\"
// }

// 5. Validar localidad
const validacion = this.validarLocalidad(localidad);
// Resultado: { valido: true, errores: [] }
```

### Datos de Salida
```
Nombre: PUNO
Tipo: PROVINCIA
UBIGEO: 21010000
Departamento: PUNO
Provincia: PUNO
Distrito: (vacío)
Coordenadas: [-70.0824, -16.0861]
Población: 227665
Fuente: INEI - CPV2017
```

## Ejemplo 2: Mapeo de Distrito

### Datos de Entrada (GeoJSON)
```json
{
  \"type\": \"Feature\",
  \"geometry\": {
    \"type\": \"Point\",
    \"coordinates\": [-69.702016679326277, -17.109849061085242]
  },
  \"properties\": {
    \"UBIGEO\": \"210502\",
    \"CODDEP\": \"21\",
    \"DEPARTAMEN\": \"PUNO\",
    \"CODPROV\": \"05\",
    \"PROVINCIA\": \"EL COLLAO\",
    \"CODDIST\": \"02\",
    \"DISTRITO\": \"CAPAZO\",
    \"CAPITAL\": \"CAPAZO\",
    \"FUENTE\": \"INEI\"
  }
}
```

### Procesamiento
```typescript
const feature = {...};
const tipo = 'DISTRITO';

// 1. Extraer coordenadas
const coords = this.extraerCoordenadas(feature);
// Resultado: { longitud: -69.7020, latitud: -17.1098 }

// 2. Extraer nombre
const nombre = this.extraerNombre(feature.properties, tipo);
// Resultado: \"CAPAZO\"

// 3. Generar UBIGEO
const ubigeo = this.generarUBIGEO(feature, tipo);
// Entrada: UBIGEO = \"210502\"
// Proceso: \"210502\" + \"00\" = \"21050200\"
// Resultado: \"21050200\"

// 4. Mapear localidad
const localidad = this.mapearLocalidad(feature, tipo);
// Resultado: {
//   nombre: \"CAPAZO\",
//   tipo: \"DISTRITO\",
//   ubigeo: \"21050200\",
//   departamento: \"PUNO\",
//   provincia: \"EL COLLAO\",
//   distrito: \"CAPAZO\",
//   longitud: -69.7020,
//   latitud: -17.1098,
//   poblacion: 0,
//   fuente: \"INEI\"
// }

// 5. Validar localidad
const validacion = this.validarLocalidad(localidad);
// Resultado: { valido: true, errores: [] }
```

### Datos de Salida
```
Nombre: CAPAZO
Tipo: DISTRITO
UBIGEO: 21050200
Departamento: PUNO
Provincia: EL COLLAO
Distrito: CAPAZO
Coordenadas: [-69.7020, -17.1098]
Población: 0
Fuente: INEI
```

## Ejemplo 3: Mapeo de Centro Poblado

### Datos de Entrada (GeoJSON)
```json
{
  \"type\": \"Feature\",
  \"geometry\": {
    \"type\": \"Point\",
    \"coordinates\": [-69.558805214788777, -14.669026784158689]
  },
  \"properties\": {
    \"IDCCPP\": \"2110020048\",
    \"NOMB_CCPP\": \"CHAQUIMINAS\",
    \"COD_CCPP\": \"0048\",
    \"NOMB_DISTR\": \"ANANEA\",
    \"NOMB_PROVI\": \"SAN ANTONIO DE PUTINA\",
    \"NOMB_DEPAR\": \"PUNO\",
    \"UBIGEO\": \"211002\",
    \"POBTOTAL\": 10,
    \"TOTHOMBRES\": 6,
    \"TOTMUJERES\": 4
  }
}
```

### Procesamiento
```typescript
const feature = {...};
const tipo = 'CENTRO_POBLADO';

// 1. Extraer coordenadas
const coords = this.extraerCoordenadas(feature);
// Resultado: { longitud: -69.5588, latitud: -14.6690 }

// 2. Extraer nombre
const nombre = this.extraerNombre(feature.properties, tipo);
// Resultado: \"CHAQUIMINAS\"

// 3. Generar UBIGEO
const ubigeo = this.generarUBIGEO(feature, tipo);
// Entrada: IDCCPP = \"2110020048\"
// Proceso: padStart(10, '0') = \"2110020048\"
// Resultado: \"2110020048\"

// 4. Mapear localidad
const localidad = this.mapearLocalidad(feature, tipo);
// Resultado: {
//   nombre: \"CHAQUIMINAS\",
//   tipo: \"CENTRO_POBLADO\",
//   ubigeo: \"2110020048\",
//   departamento: \"PUNO\",
//   provincia: \"SAN ANTONIO DE PUTINA\",
//   distrito: \"ANANEA\",
//   longitud: -69.5588,
//   latitud: -14.6690,
//   poblacion: 10,
//   fuente: \"INEI - CPV2017\"
// }

// 5. Validar localidad
const validacion = this.validarLocalidad(localidad);
// Resultado: { valido: true, errores: [] }
```

### Datos de Salida
```
Nombre: CHAQUIMINAS
Tipo: CENTRO_POBLADO
UBIGEO: 2110020048
Departamento: PUNO
Provincia: SAN ANTONIO DE PUTINA
Distrito: ANANEA
Coordenadas: [-69.5588, -14.6690]
Población: 10
Fuente: INEI - CPV2017
```

## Ejemplo 4: Validación con Errores

### Datos de Entrada (Incompletos)
```json
{
  \"type\": \"Feature\",
  \"geometry\": {
    \"type\": \"Point\",
    \"coordinates\": [-69.5588]
  },
  \"properties\": {
    \"NOMB_CCPP\": \"\"
  }
}
```

### Procesamiento
```typescript
const feature = {...};
const tipo = 'CENTRO_POBLADO';

// 1. Extraer coordenadas
const coords = this.extraerCoordenadas(feature);
// Resultado: null (solo 1 coordenada)

// 2. Extraer nombre
const nombre = this.extraerNombre(feature.properties, tipo);
// Resultado: \"\" (vacío)

// 3. Generar UBIGEO
const ubigeo = this.generarUBIGEO(feature, tipo);
// Resultado: \"\" (sin IDCCPP)

// 4. Mapear localidad
const localidad = this.mapearLocalidad(feature, tipo);
// Resultado: {
//   nombre: \"\",
//   tipo: \"CENTRO_POBLADO\",
//   ubigeo: \"\",
//   departamento: \"PUNO\",
//   provincia: \"\",
//   distrito: \"\",
//   longitud: null,
//   latitud: null,
//   poblacion: 0,
//   fuente: \"INEI - CPV2017\"
// }

// 5. Validar localidad
const validacion = this.validarLocalidad(localidad);
// Resultado: {
//   valido: false,
//   errores: [
//     \"Nombre vacío\",
//     \"UBIGEO vacío\",
//     \"Coordenadas faltantes\"
//   ]
// }
```

### Datos de Salida
```
Validación: FALLIDA
Errores:
- Nombre vacío
- UBIGEO vacío
- Coordenadas faltantes
```

## Ejemplo 5: Validación de Rango Geográfico

### Datos de Entrada (Coordenadas Fuera de Rango)
```json
{
  \"type\": \"Feature\",
  \"geometry\": {
    \"type\": \"Point\",
    \"coordinates\": [-75.0, -20.0]
  },
  \"properties\": {
    \"IDPROV\": \"2101\",
    \"NOMBPROV\": \"PUNO\",
    \"POBTOTAL\": 227665
  }
}
```

### Procesamiento
```typescript
const feature = {...};
const tipo = 'PROVINCIA';

// 1. Extraer coordenadas
const coords = this.extraerCoordenadas(feature);
// Resultado: { longitud: -75.0, latitud: -20.0 }

// 2. Mapear localidad
const localidad = this.mapearLocalidad(feature, tipo);
// Resultado: {
//   nombre: \"PUNO\",
//   tipo: \"PROVINCIA\",
//   ubigeo: \"21010000\",
//   departamento: \"PUNO\",
//   provincia: \"PUNO\",
//   distrito: \"\",
//   longitud: -75.0,
//   latitud: -20.0,
//   poblacion: 227665,
//   fuente: \"INEI - CPV2017\"
// }

// 3. Validar localidad
const validacion = this.validarLocalidad(localidad);
// Resultado: {
//   valido: false,
//   errores: [
//     \"Longitud fuera de rango para Puno\",
//     \"Latitud fuera de rango para Puno\"
//   ]
// }
```

### Datos de Salida
```
Validación: FALLIDA
Errores:
- Longitud fuera de rango para Puno (debe estar entre -72 y -68)
- Latitud fuera de rango para Puno (debe estar entre -18 y -13)
```

## Flujo Completo de Procesamiento

```
1. Cargar archivo GeoJSON
   ↓
2. Para cada feature:
   a. Extraer tipo de localidad
   b. Extraer coordenadas → { longitud, latitud }
   c. Extraer nombre según tipo
   d. Generar UBIGEO según tipo
   e. Mapear localidad completa
   f. Validar localidad
   ↓
3. Contar estadísticas:
   - Total de features
   - Con coordenadas
   - Sin coordenadas
   - Con UBIGEO
   - Sin UBIGEO
   ↓
4. Separar ejemplos por tipo
   ↓
5. Mostrar preview
   ↓
6. Permitir importación
```

## Resumen de Transformaciones

### Provincia
```
IDPROV: \"2101\" → UBIGEO: \"21010000\"
IDPROV: \"2102\" → UBIGEO: \"21020000\"
IDPROV: \"2113\" → UBIGEO: \"21130000\"
```

### Distrito
```
UBIGEO: \"210101\" → UBIGEO: \"21010100\"
UBIGEO: \"210102\" → UBIGEO: \"21010200\"
UBIGEO: \"210502\" → UBIGEO: \"21050200\"
```

### Centro Poblado
```
IDCCPP: \"2110020048\" → UBIGEO: \"2110020048\"
IDCCPP: \"2110020001\" → UBIGEO: \"2110020001\"
```


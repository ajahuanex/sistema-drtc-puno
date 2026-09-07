# 🗺️ Mapeo Real de UBIGEO en Archivos GeoJSON

## Estructura Encontrada

### PROVINCIAS (puno-provincias-point.geojson)
```
Campo: IDPROV (4 dígitos)
Ejemplos:
- 2101 = PUNO
- 2102 = AZANGARO
- 2103 = CARABAYA
- 2104 = CHUCUITO
- 2105 = EL COLLAO

Nota: El campo UBIGEO está vacío en provincias
```

### DISTRITOS (puno-distritos-point.geojson)
```
Campo: UBIGEO (6 dígitos)
Ejemplos:
- 210502 = EL COLLAO (provincia)
- 210405 = CHUCUITO (provincia)
- 210404 = CHUCUITO (provincia)
- 210504 = EL COLLAO (provincia)
- 210403 = CHUCUITO (provincia)

Estructura: PPDD00 (primeros 4 dígitos = provincia, últimos 2 = distrito)
```

### CENTROS POBLADOS (puno-centrospoblados.geojson) ✅
```
Campo: IDCCPP (10 dígitos) ← UBIGEO COMPLETO
Ejemplos:
- 2110020048 = CHAQUIMINAS (distrito ANANEA)
- 2110020049 = PEÑA AZUL (distrito ANANEA)

Estructura: DDPPDDCCCC (10 dígitos)
- DD = Departamento (21 = PUNO)
- PP = Provincia (10 = SAN ANTONIO DE PUTINA)
- DD = Distrito (02 = ANANEA)
- CCCC = Número secuencial del centro poblado (0048)

Otros campos útiles:
- UBIGEO: 211002 (6 dígitos, solo distrito)
- COD_CCPP: 0048 (número secuencial)
- NOMB_CCPP: CHAQUIMINAS
- NOMB_DISTR: ANANEA
- NOMB_PROVI: SAN ANTONIO DE PUTINA
- POBTOTAL: 10
```

## Mapeo Correcto para Base de Datos

### Provincias
```typescript
{
  nombre: NOMBPROV,
  tipo: 'PROVINCIA',
  ubigeo: IDPROV + '0000',  // Convertir 2101 → 21010000 (8 dígitos)
  departamento: 'PUNO',
  provincia: NOMBPROV,
  longitud: coordinates[0],
  latitud: coordinates[1],
  poblacion: POBTOTAL
}
```

### Distritos
```typescript
{
  nombre: NOMBDIST,
  tipo: 'DISTRITO',
  ubigeo: UBIGEO + '00',  // Convertir 210502 → 21050200 (8 dígitos)
  departamento: 'PUNO',
  provincia: PROVINCIA,
  distrito: NOMBDIST,
  longitud: coordinates[0],
  latitud: coordinates[1],
  poblacion: POBTOTAL
}
```

### Centros Poblados ✅
```typescript
{
  nombre: NOMB_CCPP,
  tipo: 'CENTRO_POBLADO',
  ubigeo: IDCCPP,  // ✅ USAR ESTE CAMPO (10 dígitos): 2110020048
  departamento: NOMB_DEPAR,
  provincia: NOMB_PROVI,
  distrito: NOMB_DISTR,
  longitud: coordinates[0],
  latitud: coordinates[1],
  poblacion: POBTOTAL
}
```

## Campos Disponibles por Tipo

### PROVINCIAS
- NOMBPROV
- IDPROV (4 dígitos)
- POBTOTAL
- FUENTE
- Coordenadas (Point)

### DISTRITOS
- NOMBDIST
- UBIGEO (6 dígitos)
- PROVINCIA
- POBTOTAL
- Coordenadas (Point)

### CENTROS POBLADOS
- NOMB_CCPP
- IDCCPP (8 dígitos) ← **UBIGEO COMPLETO**
- UBIGEO (6 dígitos, solo distrito)
- COD_CCPP (número secuencial)
- NOMB_DISTR
- NOMB_PROVI
- NOMB_DEPAR
- POBTOTAL
- TIPO (Rural/Urbano)
- Coordenadas (Point)

## Consultas para Importación

### Obtener todas las provincias
```
SELECT * FROM localidades WHERE tipo = 'PROVINCIA'
```

### Obtener distritos de una provincia
```
SELECT * FROM localidades 
WHERE tipo = 'DISTRITO' AND ubigeo LIKE '2101%'
```

### Obtener centros poblados de un distrito
```
SELECT * FROM localidades 
WHERE tipo = 'CENTRO_POBLADO' AND ubigeo LIKE '211002%'
```

## Recomendación

Para la importación, usar este orden:
1. **Primero:** Provincias (IDPROV → ubigeo)
2. **Segundo:** Distritos (UBIGEO directo)
3. **Tercero:** Centros Poblados (IDCCPP → ubigeo)

Esto asegura que la jerarquía se mantenga correcta.

## Validación de UBIGEO

```typescript
function validarUBIGEO(ubigeo: string, tipo: string): boolean {
  const length = ubigeo.length;
  
  switch(tipo) {
    case 'PROVINCIA':
      return length === 8 && /^\d{8}$/.test(ubigeo);  // 21010000
    case 'DISTRITO':
      return length === 8 && /^\d{8}$/.test(ubigeo);  // 21050200
    case 'CENTRO_POBLADO':
      return length === 10 && /^\d{10}$/.test(ubigeo);  // 2110020048
    default:
      return false;
  }
}

// Ejemplos
validarUBIGEO('21010000', 'PROVINCIA');           // true
validarUBIGEO('21050200', 'DISTRITO');            // true
validarUBIGEO('2110020048', 'CENTRO_POBLADO');    // true
validarUBIGEO('2101', 'PROVINCIA');               // false (longitud incorrecta)
```

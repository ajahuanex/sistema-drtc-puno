# 📍 Estructura Jerárquica de UBIGEO - SIRRET

## Estructura General del UBIGEO

El UBIGEO es un código de 6 dígitos que identifica ubicaciones geográficas en Perú:

```
UBIGEO: DDPPDD
├── DD (primeros 2 dígitos) = Departamento
├── PP (dígitos 3-4) = Provincia
└── DD (últimos 2 dígitos) = Distrito
```

## Ejemplo: PUNO

### Nivel 1: DEPARTAMENTO (PUNO)
```
UBIGEO: 21****
Código: 21
Nombre: PUNO
Archivo: puno-provincias-point.geojson
Campo: IDPROV = 2101 (primeros 4 dígitos)
```

### Nivel 2: PROVINCIAS (dentro de PUNO)
```
UBIGEO: 21PP**
Ejemplos:
- 2101** = PUNO (provincia)
- 2102** = AZÁNGARO
- 2103** = CARABAYA
- 2104** = CHUCUITO
- 2105** = EL COLLAO
- 2106** = HUANCANÉ
- 2107** = LAMPA
- 2108** = MELGAR
- 2109** = MOHO
- 2110** = PUNO (provincia)
- 2111** = SANDIA
- 2112** = SAN ROMÁN
- 2113** = YUNGUYO

Archivo: puno-provincias-point.geojson
Campo: IDPROV = 2101, 2102, 2103, etc (4 dígitos)
```

### Nivel 3: DISTRITOS (dentro de cada provincia)
```
UBIGEO: 21PPDD
Ejemplos para PUNO (2101):
- 210101 = PUNO (distrito)
- 210102 = ACORA
- 210103 = AMANTANÍ
- 210104 = ATUNCOLLA
- 210105 = CAPACHICA
- 210106 = CHUCUITO
- 210107 = COATA
- 210108 = HUATA
- 210109 = MAÑAZO
- 210110 = PLATERÍA
- 210111 = PICHACANI
- 210112 = TIQUILLACA
- 210113 = VILQUE

Ejemplos para AZÁNGARO (2102):
- 210201 = AZÁNGARO (distrito)
- 210202 = ACHAYA
- 210203 = ARAYA
- 210204 = ASILLO
- 210205 = CAPAZO
- 210206 = CHACAMARCA
- 210207 = POTONI
- 210208 = QUEQUEÑO
- 210209 = SAMÁN
- 210210 = TIRAPATA

Archivo: puno-distritos-point.geojson
Campo: UBIGEO = 210101, 210102, 210103, etc (6 dígitos)
```

### Nivel 4: CENTROS POBLADOS (dentro de cada distrito)
```
UBIGEO: 21PPDDCC
Ejemplos para PUNO - PUNO (210101):
- 21010101 = PUNO (centro poblado)
- 21010102 = BARRIO BELLAVISTA
- 21010103 = BARRIO MAÑAZO
- 21010104 = BARRIO SALCEDO
- 21010105 = BARRIO SAN LUIS
- 21010106 = BARRIO SANTA BÁRBARA
- 21010107 = BARRIO SANTA ROSA
- 21010108 = BARRIO SANTIAGO
- 21010109 = BARRIO VALLEJO
- 21010110 = BARRIO VALLEJO ALTO
- ... más centros poblados

Ejemplos para AZÁNGARO - CAPAZO (210205):
- 21020501 = CAPAZO (centro poblado)
- 21020502 = PISACOMA
- 21020503 = CHACAMARCA
- ... más centros poblados

Archivo: puno-centrospoblados.geojson
Campo: UBIGEO = 21010101, 21010102, 21010103, etc (8 dígitos)
```

## Mapeo en Base de Datos

### Tabla: Localidades

```sql
CREATE TABLE localidades (
  id ObjectId,
  nombre VARCHAR(255),
  tipo ENUM('PROVINCIA', 'DISTRITO', 'CENTRO_POBLADO'),
  ubigeo VARCHAR(8),
  
  -- Jerarquía
  departamento VARCHAR(255),
  provincia VARCHAR(255),
  distrito VARCHAR(255),
  
  -- Coordenadas
  longitud DECIMAL(10, 8),
  latitud DECIMAL(10, 8),
  
  -- Datos demográficos
  poblacion INT,
  densidad DECIMAL(10, 2),
  
  -- Metadata
  fuente VARCHAR(255),
  fechaCreacion DATETIME,
  
  -- Índices
  INDEX idx_ubigeo (ubigeo),
  INDEX idx_tipo (tipo),
  INDEX idx_provincia (provincia),
  INDEX idx_distrito (distrito)
);
```

## Ejemplos de Registros

### Provincia: PUNO
```json
{
  "nombre": "PUNO",
  "tipo": "PROVINCIA",
  "ubigeo": "2101",
  "departamento": "PUNO",
  "provincia": "PUNO",
  "distrito": null,
  "longitud": -70.082360,
  "latitud": -16.086076,
  "poblacion": 227665,
  "fuente": "INEI - CPV2017"
}
```

### Distrito: PUNO (dentro de provincia PUNO)
```json
{
  "nombre": "PUNO",
  "tipo": "DISTRITO",
  "ubigeo": "210101",
  "departamento": "PUNO",
  "provincia": "PUNO",
  "distrito": "PUNO",
  "longitud": -70.082360,
  "latitud": -16.086076,
  "poblacion": 120000,
  "fuente": "INEI - CPV2017"
}
```

### Centro Poblado: BARRIO BELLAVISTA
```json
{
  "nombre": "BARRIO BELLAVISTA",
  "tipo": "CENTRO_POBLADO",
  "ubigeo": "21010102",
  "departamento": "PUNO",
  "provincia": "PUNO",
  "distrito": "PUNO",
  "longitud": -70.082360,
  "latitud": -16.086076,
  "poblacion": 5000,
  "fuente": "INEI - CPV2017"
}
```

## Consultas Útiles

### Obtener todas las provincias de PUNO
```
ubigeo LIKE '21%' AND tipo = 'PROVINCIA'
```

### Obtener todos los distritos de la provincia PUNO
```
ubigeo LIKE '2101%' AND tipo = 'DISTRITO'
```

### Obtener todos los centros poblados del distrito PUNO
```
ubigeo LIKE '210101%' AND tipo = 'CENTRO_POBLADO'
```

### Obtener jerarquía completa
```
SELECT * FROM localidades 
WHERE departamento = 'PUNO'
ORDER BY tipo, ubigeo
```

## Validación de UBIGEO

```typescript
// Validar formato de UBIGEO
function validarUBIGEO(ubigeo: string, tipo: string): boolean {
  const length = ubigeo.length;
  
  switch(tipo) {
    case 'PROVINCIA':
      return length === 4 && /^\d{4}$/.test(ubigeo);
    case 'DISTRITO':
      return length === 6 && /^\d{6}$/.test(ubigeo);
    case 'CENTRO_POBLADO':
      return length === 8 && /^\d{8}$/.test(ubigeo);
    default:
      return false;
  }
}

// Ejemplos
validarUBIGEO('2101', 'PROVINCIA');           // true
validarUBIGEO('210101', 'DISTRITO');          // true
validarUBIGEO('21010102', 'CENTRO_POBLADO');  // true
validarUBIGEO('2101', 'DISTRITO');            // false (longitud incorrecta)
```

## Notas Importantes

1. **UBIGEO es jerárquico:** Cada nivel contiene el anterior
2. **Longitud variable:** 4, 6 u 8 dígitos según el tipo
3. **Primeros 2 dígitos:** Siempre son el departamento (21 para PUNO)
4. **Búsquedas:** Usar LIKE para encontrar registros por nivel
5. **Integridad:** Validar que el UBIGEO corresponda al tipo de localidad

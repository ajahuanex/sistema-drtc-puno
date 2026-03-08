# Actualización de Carga Masiva de Localidades

## Resumen de Cambios Necesarios

### Modelo Actualizado de Localidades

El modelo de localidades ha sido simplificado y actualizado con los siguientes cambios:

#### Campos Obligatorios
- `nombre`: Único campo realmente obligatorio

#### Tipo de Localidad (reemplaza nivel_territorial)
```typescript
enum TipoLocalidad {
  PUEBLO = "PUEBLO",                 // Por defecto
  CENTRO_POBLADO = "CENTRO_POBLADO",
  LOCALIDAD = "LOCALIDAD",
  DISTRITO = "DISTRITO",
  PROVINCIA = "PROVINCIA",
  DEPARTAMENTO = "DEPARTAMENTO",
  CIUDAD = "CIUDAD"
}
```

#### Nuevos Campos para Centros Poblados
- `codigo_ccpp`: Código del centro poblado
- `tipo_area`: "Rural" o "Urbano"
- `poblacion`: Población total
- `altitud`: Altitud en metros

#### Coordenadas Extendidas
```typescript
interface Coordenadas {
  latitud: number;
  longitud: number;
  // Nuevos campos opcionales:
  latitudOriginal?: number;
  longitudOriginal?: number;
  esPersonalizada?: boolean;
  fechaModificacion?: string;
  modificadoPor?: string;
  fuenteOriginal?: string; // 'INEI', 'MANUAL', 'GPS'
}
```

#### Campos Eliminados/Deprecados
- `nivel_territorial` → Ahora se calcula automáticamente desde `tipo`
- `municipalidad_centro_poblado` → Opcional, solo para compatibilidad
- `ubigeo_identificador_mcp` → Opcional, solo para compatibilidad
- `dispositivo_legal_creacion` → Opcional, solo para compatibilidad

---

## Componentes a Actualizar

### 1. CargaMasivaGeojsonComponent

**Archivo**: `frontend/src/app/components/localidades/carga-masiva-geojson.component.ts`

**Cambios necesarios**:

1. **Mapeo de propiedades GeoJSON**:
```typescript
// ANTES
const localidad = {
  nombre: props.NOMB_CCPP,
  nivel_territorial: NivelTerritorial.CENTRO_POBLADO,
  municipalidad_centro_poblado: props.MCP,
  // ...
};

// DESPUÉS
const localidad = {
  nombre: props.NOMB_CCPP || props.DISTRITO || props.NOMBPROV,
  tipo: this.determinarTipo(props), // PROVINCIA, DISTRITO, CENTRO_POBLADO
  codigo_ccpp: props.COD_CCPP,
  tipo_area: props.TIPO, // Rural/Urbano
  poblacion: props.POBTOTAL,
  coordenadas: {
    latitud: coords[1],
    longitud: coords[0],
    fuenteOriginal: 'INEI'
  },
  // ...
};
```

2. **Método para determinar tipo**:
```typescript
private determinarTipo(properties: any): TipoLocalidad {
  if (properties.NOMBPROV && !properties.NOMBDIST) {
    return TipoLocalidad.PROVINCIA;
  }
  if (properties.NOMBDIST && !properties.NOMB_CCPP) {
    return TipoLocalidad.DISTRITO;
  }
  if (properties.NOMB_CCPP) {
    return TipoLocalidad.CENTRO_POBLADO;
  }
  return TipoLocalidad.PUEBLO;
}
```

3. **Actualizar validación**:
```typescript
// Validar que tenga nombre
if (!localidad.nombre || localidad.nombre.trim() === '') {
  errores.push(`Fila ${index}: Nombre es obligatorio`);
  continue;
}

// Tipo se asigna automáticamente, no necesita validación
```

4. **Actualizar interfaz de validación**:
```typescript
interface ValidacionPrevia {
  totalFeatures: number;
  conCoordenadas: number;
  sinCoordenadas: number;
  conUbigeo: number;
  sinUbigeo: number;
  porTipo: { [key: string]: number }; // NUEVO: por tipo en lugar de nivel
  porProvincia: { [key: string]: number };
  porDistrito: { [key: string]: number };
  ejemplos: any[];
}
```

---

### 2. ImportExcelDialogComponent

**Archivo**: `frontend/src/app/components/localidades/import-excel-dialog.component.ts`

**Cambios necesarios**:

1. **Actualizar plantilla CSV**:
```typescript
private crearPlantillaEjemplo(): string {
  const headers = [
    'nombre',              // OBLIGATORIO
    'tipo',                // PUEBLO, CENTRO_POBLADO, DISTRITO, PROVINCIA, DEPARTAMENTO
    'ubigeo',              // Opcional
    'departamento',        // Opcional (default: PUNO)
    'provincia',           // Opcional (default: PUNO)
    'distrito',            // Opcional (default: PUNO)
    'codigo_ccpp',         // Nuevo: Código del centro poblado
    'tipo_area',           // Nuevo: Rural/Urbano
    'poblacion',           // Nuevo: Población total
    'altitud',             // Nuevo: Altitud en metros
    'latitud',             // Coordenadas
    'longitud',
    'descripcion',
    'observaciones'
  ];

  const ejemplos = [
    [
      'Puno',                    // nombre
      'CIUDAD',                  // tipo
      '210101',                  // ubigeo
      'PUNO',                    // departamento
      'PUNO',                    // provincia
      'PUNO',                    // distrito
      '',                        // codigo_ccpp
      'Urbano',                  // tipo_area
      '120229',                  // poblacion
      '3827',                    // altitud
      '-15.8402',                // latitud
      '-70.0219',                // longitud
      'Capital del departamento',// descripcion
      'Ciudad a orillas del Lago Titicaca' // observaciones
    ],
    [
      'Acora',                   // nombre
      'CENTRO_POBLADO',          // tipo
      '210102',                  // ubigeo
      'PUNO',                    // departamento
      'PUNO',                    // provincia
      'ACORA',                   // distrito
      '210102001',               // codigo_ccpp
      'Rural',                   // tipo_area
      '5000',                    // poblacion
      '3850',                    // altitud
      '-15.9667',                // latitud
      '-69.7833',                // longitud
      'Centro poblado rural',    // descripcion
      ''                         // observaciones
    ]
  ];

  let csv = headers.join(',') + '\n';
  ejemplos.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });

  return csv;
}
```

2. **Actualizar documentación en el template**:
```html
<div class="info-card">
  <h3>Campos del archivo Excel/CSV</h3>
  <ul>
    <li><strong>nombre</strong> (obligatorio): Nombre de la localidad</li>
    <li><strong>tipo</strong> (obligatorio): PUEBLO, CENTRO_POBLADO, DISTRITO, PROVINCIA, DEPARTAMENTO, CIUDAD</li>
    <li><strong>ubigeo</strong> (opcional): Código UBIGEO de 6 dígitos</li>
    <li><strong>departamento</strong> (opcional): Por defecto PUNO</li>
    <li><strong>provincia</strong> (opcional): Por defecto PUNO</li>
    <li><strong>distrito</strong> (opcional): Por defecto PUNO</li>
    <li><strong>codigo_ccpp</strong> (opcional): Código del centro poblado</li>
    <li><strong>tipo_area</strong> (opcional): Rural o Urbano</li>
    <li><strong>poblacion</strong> (opcional): Población total</li>
    <li><strong>altitud</strong> (opcional): Altitud en metros</li>
    <li><strong>latitud/longitud</strong> (opcional): Coordenadas GPS</li>
  </ul>
</div>
```

---

### 3. ImportarCentrosPobladosModalComponent

**Archivo**: `frontend/src/app/components/localidades/importar-centros-poblados-modal.component.ts`

**Cambios necesarios**:

1. **Actualizar estadísticas**:
```typescript
estadisticas = {
  totalCentrosPoblados: 0,
  porDistrito: [] as { distrito: string; cantidad: number }[],
  porTipo: [] as { tipo: string; cantidad: number }[], // NUEVO
  porTipoArea: [] as { tipo: string; cantidad: number }[], // NUEVO: Rural/Urbano
  conCoordenadas: 0,
  sinCoordenadas: 0,
  conPoblacion: 0, // NUEVO
  sinPoblacion: 0  // NUEVO
};
```

2. **Actualizar template de estadísticas**:
```html
<div class="stats-grid">
  <mat-card class="stat-card">
    <mat-card-content>
      <div class="stat-number">{{ estadisticas.totalCentrosPoblados }}</div>
      <div class="stat-label">Total Localidades</div>
    </mat-card-content>
  </mat-card>

  <mat-card class="stat-card">
    <mat-card-content>
      <div class="stat-number">{{ estadisticas.conCoordenadas }}</div>
      <div class="stat-label">Con Coordenadas GPS</div>
    </mat-card-content>
  </mat-card>

  <mat-card class="stat-card">
    <mat-card-content>
      <div class="stat-number">{{ estadisticas.conPoblacion }}</div>
      <div class="stat-label">Con Datos de Población</div>
    </mat-card-content>
  </mat-card>
</div>

<!-- Distribución por tipo -->
<mat-card class="tipo-stats">
  <mat-card-header>
    <mat-card-title>Distribución por Tipo</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="tipo-list">
      @for (item of estadisticas.porTipo; track item.tipo) {
        <div class="tipo-item">
          <span class="tipo-nombre">{{ item.tipo }}</span>
          <mat-chip class="tipo-cantidad">{{ item.cantidad }}</mat-chip>
        </div>
      }
    </div>
  </mat-card-content>
</mat-card>
```

---

## Backend - Endpoints a Actualizar

### 1. Endpoint de importación desde GeoJSON

**Archivo**: `backend/app/routers/localidades.py`

**Cambios necesarios**:

```python
@router.post("/importar-geojson-lotes")
async def importar_geojson_lotes(
    modo: str = Query("ambos", description="crear, actualizar, o ambos"),
    lote_size: int = Query(50, description="Tamaño del lote"),
    repo: LocalidadRepository = Depends(get_localidad_repository)
):
    """Importar localidades desde GeoJSON en lotes"""
    
    # Cargar archivos GeoJSON
    provincias = cargar_geojson('peru-provincias.geojson')
    distritos = cargar_geojson('puno-distritos.geojson')
    centros = cargar_geojson('puno-centrospoblados.geojson')
    
    resultados = {
        'total_importados': 0,
        'total_actualizados': 0,
        'total_omitidos': 0,
        'total_errores': 0
    }
    
    # Importar provincias
    for feature in provincias['features']:
        props = feature['properties']
        coords = extraer_centroide(feature['geometry'])
        
        localidad = LocalidadCreate(
            nombre=props.get('NOMBPROV', ''),
            tipo=TipoLocalidad.PROVINCIA,
            departamento='PUNO',
            provincia=props.get('NOMBPROV', ''),
            ubigeo=props.get('IDPROV', '')[:4] if props.get('IDPROV') else None,
            poblacion=props.get('POBTOTAL'),
            coordenadas=Coordenadas(
                latitud=coords[1],
                longitud=coords[0]
            ) if coords else None
        )
        
        # Verificar si existe y crear/actualizar según modo
        # ...
    
    # Similar para distritos y centros poblados
    # ...
    
    return resultados
```

### 2. Endpoint de importación desde Excel

**Archivo**: `backend/app/routers/localidades.py`

```python
@router.post("/importar-excel")
async def importar_excel(
    file: UploadFile = File(...),
    repo: LocalidadRepository = Depends(get_localidad_repository)
):
    """Importar localidades desde archivo Excel"""
    
    # Leer Excel
    df = pd.read_excel(file.file)
    
    resultados = {
        'localidades_creadas': 0,
        'total_errores': 0,
        'errores': []
    }
    
    for index, row in df.iterrows():
        try:
            # Validar nombre (obligatorio)
            if pd.isna(row.get('nombre')) or not str(row['nombre']).strip():
                resultados['errores'].append(f"Fila {index + 2}: Nombre es obligatorio")
                resultados['total_errores'] += 1
                continue
            
            # Crear localidad
            localidad = LocalidadCreate(
                nombre=str(row['nombre']).strip(),
                tipo=TipoLocalidad(row.get('tipo', 'PUEBLO')),
                ubigeo=str(row['ubigeo']) if not pd.isna(row.get('ubigeo')) else None,
                departamento=str(row.get('departamento', 'PUNO')),
                provincia=str(row.get('provincia', 'PUNO')),
                distrito=str(row.get('distrito', 'PUNO')),
                codigo_ccpp=str(row['codigo_ccpp']) if not pd.isna(row.get('codigo_ccpp')) else None,
                tipo_area=str(row['tipo_area']) if not pd.isna(row.get('tipo_area')) else None,
                poblacion=int(row['poblacion']) if not pd.isna(row.get('poblacion')) else None,
                altitud=int(row['altitud']) if not pd.isna(row.get('altitud')) else None,
                coordenadas=Coordenadas(
                    latitud=float(row['latitud']),
                    longitud=float(row['longitud'])
                ) if not pd.isna(row.get('latitud')) and not pd.isna(row.get('longitud')) else None,
                descripcion=str(row['descripcion']) if not pd.isna(row.get('descripcion')) else None,
                observaciones=str(row['observaciones']) if not pd.isna(row.get('observaciones')) else None
            )
            
            await repo.crear(localidad)
            resultados['localidades_creadas'] += 1
            
        except Exception as e:
            resultados['errores'].append(f"Fila {index + 2}: {str(e)}")
            resultados['total_errores'] += 1
    
    return resultados
```

---

## Prioridad de Actualización

1. **Alta**: `ImportExcelDialogComponent` - Es el más usado y simple de actualizar
2. **Media**: `CargaMasivaGeojsonComponent` - Requiere actualizar mapeo de GeoJSON
3. **Baja**: `ImportarCentrosPobladosModalComponent` - Funcionalidad avanzada, menos usada

---

## Pruebas Recomendadas

1. Crear archivo Excel de prueba con los nuevos campos
2. Importar 2-3 localidades de cada tipo (PROVINCIA, DISTRITO, CENTRO_POBLADO)
3. Verificar que los campos nuevos se guarden correctamente
4. Verificar que las coordenadas se marquen con `fuenteOriginal: 'INEI'`
5. Probar modo TEST del componente GeoJSON

---

## Notas Adicionales

- El campo `nivel_territorial` ya no se usa, se calcula automáticamente desde `tipo`
- Los campos antiguos (`municipalidad_centro_poblado`, etc.) se mantienen por compatibilidad pero son opcionales
- Las coordenadas ahora tienen campos extendidos para tracking de cambios
- El tipo `PUEBLO` es el valor por defecto cuando no se especifica

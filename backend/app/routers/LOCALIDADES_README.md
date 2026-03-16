# Módulo de Localidades - Documentación

## Estructura del Módulo

El módulo de localidades ha sido refactorizado y dividido en componentes especializados:

```
app/routers/
├── localidades_router.py           # Router principal (combina todos)
├── localidades_crud.py             # CRUD básico
├── localidades_import.py           # Importación/Exportación
└── localidades_centros_poblados.py # Centros poblados específicos

app/services/
└── localidad_service.py            # Lógica de negocio

app/models/
└── localidad.py                    # Modelos Pydantic

scripts/
└── limpiar_localidades_duplicadas.py  # Script de limpieza
```

## Endpoints Disponibles

### CRUD Básico (`localidades_crud.py`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/localidades/` | Crear localidad |
| GET | `/localidades/` | Listar con filtros |
| GET | `/localidades/paginadas` | Listar paginado |
| GET | `/localidades/activas` | Solo activas |
| GET | `/localidades/buscar?q=` | Búsqueda inteligente |
| GET | `/localidades/{id}` | Obtener por ID |
| PUT | `/localidades/{id}` | Actualizar |
| DELETE | `/localidades/{id}` | Eliminar (soft delete) |
| PATCH | `/localidades/{id}/toggle-estado` | Activar/Desactivar |
| GET | `/localidades/{id}/verificar-uso` | Verificar uso en rutas |
| POST | `/localidades/validar-ubigeo` | Validar UBIGEO único |
| GET | `/localidades/{origen_id}/distancia/{destino_id}` | Calcular distancia |
| POST | `/localidades/inicializar` | Datos iniciales |

### Importación/Exportación (`localidades_import.py`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/localidades/importar` | Importar desde Excel/CSV |
| GET | `/localidades/exportar` | Exportar a Excel/CSV |
| POST | `/localidades/operaciones-masivas` | Operaciones en lote |

**Parámetros de importación:**
- `file`: Archivo Excel o CSV
- `fuente`: INEI, RENIEC, MANUAL (opcional)

**Columnas requeridas en archivo:**
- `nombre` (obligatorio)
- `tipo`, `ubigeo`, `departamento`, `provincia`, `distrito` (opcionales)
- `latitud`, `longitud` (opcionales)
- `codigo_ccpp`, `tipo_area`, `poblacion`, `altitud` (para centros poblados)

### Centros Poblados (`localidades_centros_poblados.py`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/localidades/centros-poblados/distrito/{id}` | Por distrito |
| GET | `/localidades/centros-poblados/estadisticas` | Estadísticas |
| POST | `/localidades/centros-poblados/validar-limpiar` | Validar y limpiar |

## Modelo de Datos

```typescript
interface Localidad {
  id: string;
  nombre: string;  // ÚNICO CAMPO OBLIGATORIO
  tipo: TipoLocalidad;
  
  // Opcionales
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  codigo?: string;
  descripcion?: string;
  observaciones?: string;
  
  coordenadas?: {
    latitud: number;
    longitud: number;
  };
  
  metadata?: {
    nombreOficial?: string;
    notas?: string;
    fuenteDatos?: string;
    es_alias?: boolean;
    nombre_original?: string;
    alias_id?: string;
  };
  
  // Centros poblados
  codigo_ccpp?: string;
  tipo_area?: string;
  poblacion?: number;
  altitud?: number;
  
  // Sistema
  estaActiva: boolean;
  fechaCreacion: datetime;
  fechaActualizacion: datetime;
}
```

## Tipos de Localidad

```python
class TipoLocalidad(str, Enum):
    PUEBLO = "PUEBLO"
    CENTRO_POBLADO = "CENTRO_POBLADO"
    LOCALIDAD = "LOCALIDAD"
    DISTRITO = "DISTRITO"
    PROVINCIA = "PROVINCIA"
    DEPARTAMENTO = "DEPARTAMENTO"
    CIUDAD = "CIUDAD"
```

## Búsqueda Inteligente

El endpoint `/localidades/buscar` implementa un sistema de scoring que prioriza:

1. **Coincidencia exacta** en nombre (+100 puntos)
2. **Nombre que empieza** con el término (+50 puntos)
3. **Contiene el término** (+20 puntos)
4. **Jerarquía territorial**:
   - Departamento: +40
   - Provincia: +30
   - Ciudad: +25
   - Distrito: +20
   - Centro Poblado: +10
5. **Coincidencias** en departamento (+10), provincia (+8), distrito (+5)

## Validaciones

### Al crear/actualizar:
- UBIGEO debe ser único
- Coordenadas deben estar en rango válido
- Nombre es obligatorio

### Al eliminar:
- Verifica que no esté en uso en rutas
- Si está en uso, retorna error 400 con detalle

## Sincronización con Rutas

Cuando se actualiza el nombre de una localidad, automáticamente se sincroniza en:
- Rutas donde es origen
- Rutas donde es destino
- Rutas donde está en itinerario

## Scripts de Mantenimiento

### Limpiar duplicados

```bash
cd backend
python scripts/limpiar_localidades_duplicadas.py
```

Ejecuta:
1. Elimina localidades sin UBIGEO
2. Elimina centros poblados duplicados de distritos
3. Elimina distritos duplicados por UBIGEO (mantiene el más reciente)

## Ejemplos de Uso

### Crear localidad

```bash
curl -X POST "http://localhost:8000/localidades/" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "JULIACA",
    "tipo": "CIUDAD",
    "departamento": "PUNO",
    "provincia": "SAN ROMAN",
    "distrito": "JULIACA",
    "ubigeo": "210101",
    "coordenadas": {
      "latitud": -15.5,
      "longitud": -70.13
    }
  }'
```

### Buscar localidades

```bash
curl "http://localhost:8000/localidades/buscar?q=juli&limite=10"
```

### Importar desde Excel

```bash
curl -X POST "http://localhost:8000/localidades/importar?fuente=INEI" \
  -F "file=@localidades.xlsx"
```

### Exportar a Excel

```bash
curl "http://localhost:8000/localidades/exportar?formato=excel" \
  -o localidades.xlsx
```

## Notas Importantes

1. **Alias**: Los alias se gestionan en la colección `localidades_alias` separada
2. **Soft Delete**: Las localidades se desactivan, no se eliminan físicamente
3. **Metadata**: Campo flexible para información adicional
4. **Coordenadas**: Validadas en rango de Puno (-18.5 a -13.0 lat, -71.5 a -68.0 lon)

## Mejoras Futuras

- [ ] Tests unitarios completos
- [ ] Tests de integración
- [ ] Cache para búsquedas frecuentes
- [ ] Validación de coordenadas con servicio externo
- [ ] Importación desde API de INEI/RENIEC
- [ ] Versionado de cambios en localidades

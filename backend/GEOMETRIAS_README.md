# Sistema de Geometrías en Base de Datos

## Descripción

Este sistema almacena los polígonos territoriales (provincias, distritos, centros poblados) en la base de datos MongoDB en lugar de depender de archivos GeoJSON estáticos. Esto proporciona:

- ✅ Mayor rendimiento y velocidad de carga
- ✅ Consultas dinámicas y filtros flexibles
- ✅ Sincronización con localidades
- ✅ Escalabilidad para agregar más geometrías
- ✅ API RESTful para acceso desde cualquier cliente

## Estructura

### Modelos

- **Geometria**: Modelo principal que almacena polígonos territoriales
  - `nombre`: Nombre de la entidad territorial
  - `tipo`: DEPARTAMENTO, PROVINCIA, DISTRITO, CENTRO_POBLADO
  - `ubigeo`: Código UBIGEO
  - `geometry`: Geometría en formato GeoJSON
  - `departamento`, `provincia`, `distrito`: Jerarquía territorial
  - `area_km2`, `perimetro_km`: Metadatos calculados
  - `centroide_lat`, `centroide_lon`: Coordenadas del centroide

### API Endpoints

#### GET /api/geometrias/geojson
Obtiene geometrías en formato GeoJSON estándar

**Parámetros de consulta:**
- `tipo`: PROVINCIA, DISTRITO, CENTRO_POBLADO
- `departamento`: Filtrar por departamento
- `provincia`: Filtrar por provincia
- `distrito`: Filtrar por distrito

**Ejemplo:**
```
GET /api/geometrias/geojson?tipo=DISTRITO&provincia=PUNO
```

#### GET /api/geometrias/
Lista todas las geometrías con filtros opcionales

#### GET /api/geometrias/{id}
Obtiene una geometría específica por ID

#### GET /api/geometrias/ubigeo/{ubigeo}
Obtiene una geometría por código UBIGEO

#### GET /api/geometrias/stats/resumen
Obtiene estadísticas de geometrías almacenadas

## Instalación y Uso

### 1. Importar Geometrías desde GeoJSON

Ejecuta el script de importación:

**Windows:**
```bash
cd backend
importar_geometrias.bat
```

**Linux/Mac:**
```bash
cd backend
source venv/bin/activate
python scripts/importar_geometrias_geojson.py
```

El script:
1. Lee los archivos GeoJSON de `frontend/src/assets/geojson/`
2. Procesa cada feature y extrae información
3. Calcula centroides y áreas
4. Almacena en MongoDB con índices optimizados

### 2. Verificar Importación

Puedes verificar las geometrías importadas:

```bash
# Desde MongoDB shell
use drtc_db
db.geometrias.countDocuments()
db.geometrias.find({tipo: "PROVINCIA"}).count()
db.geometrias.find({tipo: "DISTRITO"}).count()
```

O usando el endpoint de estadísticas:
```
GET http://localhost:8000/api/geometrias/stats/resumen
```

### 3. Usar en el Frontend

El servicio `GeometriaService` ya está configurado:

```typescript
import { GeometriaService } from './services/geometria.service';

// Inyectar en el constructor
constructor(private geometriaService: GeometriaService) {}

// Obtener distritos de una provincia
this.geometriaService.obtenerDistritos('PUNO').subscribe(data => {
  console.log('Distritos:', data);
});

// Obtener provincias
this.geometriaService.obtenerProvincias('PUNO').subscribe(data => {
  console.log('Provincias:', data);
});
```

## Ventajas sobre Archivos Estáticos

### Antes (Archivos GeoJSON)
- ❌ Archivos grandes (varios MB)
- ❌ Carga lenta en el navegador
- ❌ Sin filtros dinámicos
- ❌ Difícil de actualizar
- ❌ No sincronizado con localidades

### Ahora (Base de Datos)
- ✅ Consultas rápidas y optimizadas
- ✅ Filtros dinámicos por provincia, distrito, etc.
- ✅ Fácil actualización y mantenimiento
- ✅ Sincronización con localidades
- ✅ API RESTful estándar
- ✅ Caché y optimizaciones del servidor

## Sincronización con Localidades

Las geometrías se relacionan con las localidades mediante:

1. **UBIGEO**: Código único que identifica cada entidad territorial
2. **Nombres**: Departamento, Provincia, Distrito
3. **Jerarquía**: Cada geometría conoce su ubicación en la jerarquía territorial

Esto permite:
- Mostrar el polígono de una localidad en el mapa
- Filtrar localidades por área geográfica
- Análisis espacial de rutas y servicios

## Mantenimiento

### Actualizar Geometrías

Si necesitas actualizar las geometrías:

1. Actualiza los archivos GeoJSON en `frontend/src/assets/geojson/`
2. Ejecuta el script de importación nuevamente
3. Selecciona "s" cuando pregunte si desea limpiar la colección

### Agregar Nuevas Geometrías

Para agregar geometrías de otros departamentos:

1. Coloca los archivos GeoJSON en el directorio correspondiente
2. Actualiza `ARCHIVOS_GEOJSON` en `importar_geometrias_geojson.py`
3. Ejecuta el script de importación

## Troubleshooting

### Error: "Geometría no encontrada"
- Verifica que las geometrías estén importadas
- Revisa que los nombres coincidan (mayúsculas/minúsculas)
- Verifica los UBIGEOs

### Mapa no carga geometrías
- Verifica que el backend esté corriendo
- Revisa la consola del navegador para errores
- Verifica la URL del API en `environment.ts`

### Geometrías incorrectas
- Reimporta desde los archivos GeoJSON originales
- Verifica la calidad de los datos en los archivos fuente

## Próximos Pasos

- [ ] Agregar caché en el frontend para geometrías frecuentes
- [ ] Implementar búsqueda espacial (punto dentro de polígono)
- [ ] Agregar más metadatos (población, área urbana/rural)
- [ ] Sincronización automática con actualizaciones de INEI
- [ ] Exportar geometrías modificadas a GeoJSON

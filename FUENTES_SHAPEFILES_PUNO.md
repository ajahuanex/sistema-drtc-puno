# Fuentes Oficiales para Shapefiles de Provincias de Puno

## 1. INEI - Instituto Nacional de Estadística e Informática (Oficial)
**URL:** https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/Lib1541/index.html

- Cartografía censal oficial del Perú
- Incluye límites departamentales, provinciales y distritales
- Formato: Shapefile (.shp)
- Descarga gratuita

## 2. GeoGPS Perú
**URL:** https://www.geogpsperu.com/

- Shapefiles de todas las regiones del Perú
- Incluye Puno con sus 13 provincias
- Formato: Shapefile, KML, GeoJSON
- Descarga gratuita

## 3. IDEP - Infraestructura de Datos Espaciales del Perú
**URL:** https://www.idep.gob.pe/

- Portal oficial del gobierno peruano
- Datos geoespaciales oficiales
- Incluye límites políticos administrativos
- Formato: Shapefile, GeoJSON

## 4. MINAM - Ministerio del Ambiente
**URL:** http://geoservidor.minam.gob.pe/geoservidor/

- GeoServidor con capas geográficas
- Límites departamentales y provinciales
- Formato: Shapefile, WMS, WFS

## 5. GitHub - Ubigeo Perú
**URL:** https://github.com/CONCYTEC/ubigeo-peru

- Repositorio con datos de ubigeos
- Incluye coordenadas y límites
- Formato: JSON, CSV, GeoJSON

## 6. OpenStreetMap (Comunidad)
**URL:** https://www.openstreetmap.org/

- Datos colaborativos de alta calidad
- Exportar región de Puno
- Formato: OSM, GeoJSON, Shapefile
- Herramienta: https://export.hotosm.org/

## 7. Natural Earth Data
**URL:** https://www.naturalearthdata.com/

- Datos geográficos de dominio público
- Incluye divisiones administrativas de Perú
- Formato: Shapefile, GeoJSON
- Escala: 1:10m, 1:50m, 1:110m

## Pasos para Convertir Shapefile a GeoJSON

### Opción 1: Usando QGIS (Recomendado)
1. Descargar QGIS: https://qgis.org/
2. Abrir el shapefile (.shp)
3. Click derecho en la capa → Exportar → Guardar objetos como...
4. Formato: GeoJSON
5. Sistema de coordenadas: WGS 84 (EPSG:4326)

### Opción 2: Usando ogr2ogr (Línea de comandos)
```bash
ogr2ogr -f GeoJSON puno-provincias.geojson puno-provincias.shp
```

### Opción 3: Usando herramientas online
- https://mapshaper.org/ (Recomendado)
- https://mygeodata.cloud/converter/shp-to-geojson
- https://ogre.adc4gis.com/

## Estructura Recomendada del GeoJSON

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "DEPARTAMEN": "PUNO",
        "PROVINCIA": "PUNO",
        "CAPITAL": "PUNO",
        "UBIGEO": "2101",
        "POBLACION": 229236
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lon, lat], [lon, lat], ...]]
      }
    }
  ]
}
```

## Recomendación Final

Para obtener las fronteras exactas de las provincias de Puno:

1. **Mejor opción:** Descargar de GeoGPS Perú o INEI (datos oficiales)
2. **Convertir:** Usar QGIS o mapshaper.org para convertir a GeoJSON
3. **Simplificar:** Si el archivo es muy pesado, simplificar la geometría en mapshaper.org
4. **Colocar:** Guardar en `frontend/src/assets/geojson/puno-provincias.geojson`

## Contacto para Datos Oficiales

- **INEI:** atencionalusuario@inei.gob.pe
- **IDEP:** idep@pcm.gob.pe
- **MINAM:** geoservidor@minam.gob.pe

---

Una vez que tengas el archivo GeoJSON con las fronteras reales, solo necesitas:
1. Colocarlo en `frontend/src/assets/geojson/puno-provincias.geojson`
2. El código ya está preparado para cargarlo automáticamente

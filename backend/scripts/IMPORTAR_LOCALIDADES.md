# 🗺️ Importación de Localidades de Puno

## Descripción

Este script importa todas las localidades de Puno desde archivos GeoJSON a MongoDB:

- **13 Provincias** desde `peru-provincias.geojson`
- **~110 Distritos** desde `puno-distritos.geojson`  
- **~3000 Centros Poblados** desde `puno-centrospoblados.geojson`

## Requisitos

- Backend corriendo con MongoDB
- Archivos GeoJSON en `frontend/src/assets/geojson/`
- Python 3.8+
- Motor (async MongoDB driver)

## Uso

### Opción 1: Ejecutar con batch (Windows)

```bash
cd backend
importar_localidades.bat
```

### Opción 2: Ejecutar directamente

```bash
cd backend
python scripts/importar_localidades_completo.py
```

## Modos de Importación

1. **Crear solo nuevos** - No actualiza registros existentes
2. **Actualizar solo existentes** - No crea nuevos registros
3. **Crear y actualizar** (RECOMENDADO) - Hace ambas cosas

## Datos Importados

### Provincias
- nombre: NOMBPROV
- tipo: "PROVINCIA"
- departamento: "PUNO"
- provincia: nombre de la provincia
- ubigeo: primeros 4 dígitos del IDPROV
- poblacion: POBTOTAL
- coordenadas: centroide del polígono

### Distritos
- nombre: DISTRITO
- tipo: "DISTRITO"
- departamento: DEPARTAMEN
- provincia: PROVINCIA
- distrito: nombre del distrito
- ubigeo: UBIGEO (6 dígitos)
- coordenadas: centroide del polígono

### Centros Poblados
- nombre: NOMB_CCPP
- tipo: "CENTRO_POBLADO"
- departamento: NOMB_DEPAR
- provincia: NOMB_PROVI
- distrito: NOMB_DISTR
- ubigeo: UBIGEO (del distrito)
- codigo_ccpp: COD_CCPP
- tipo_area: TIPO (Rural/Urbano)
- poblacion: POBTOTAL
- coordenadas: punto exacto

## Verificación

Después de importar, verifica en el frontend:

1. Ve a http://localhost:4200/localidades
2. Deberías ver:
   - 12 Provincias
   - 100 Distritos
   - 41 Centros Poblados (según tu screenshot)
   - 60 Otros

## Notas

- El script evita duplicados verificando por ubigeo y nombre
- Las coordenadas se extraen automáticamente del GeoJSON
- Los centros poblados incluyen datos de población y tipo de área
- Todos los registros se marcan como activos por defecto

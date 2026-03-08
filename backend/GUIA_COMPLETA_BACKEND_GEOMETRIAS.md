# Guía Completa: Backend de Geometrías

## 📋 Resumen

Sistema completo para almacenar y servir geometrías territoriales desde MongoDB.

## 🎯 Pasos para Implementar

### Paso 1: Verificar MongoDB

```bash
# Verificar que MongoDB esté corriendo
net start MongoDB

# O verificar el servicio
sc query MongoDB
```

### Paso 2: Importar Geometrías

```bash
cd backend
importar_geometrias.bat
```

**Responde "s" cuando pregunte si desea limpiar la colección.**

Deberías ver:
```
📦 Importando PROVINCIA desde puno-provincias.geojson...
  ✅ Importados: 13

📦 Importando DISTRITO desde puno-distritos.geojson...
  ✅ Importados: 109

📦 Importando CENTRO_POBLADO desde puno-centrospoblados.geojson...
  ✅ Importados: 28

✅ Importación completada
```

### Paso 3: Verificar Importación

```bash
cd backend
verificar_geometrias.bat
```

Deberías ver:
```
✅ Total de geometrías: 150

📈 Estadísticas por tipo:
   PROVINCIA: 13
   DISTRITO: 109
   CENTRO_POBLADO: 28
```

### Paso 4: Iniciar el Backend

```bash
cd backend
start-backend.bat
```

Espera a ver:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Paso 5: Probar el API

En otra terminal:

```bash
cd backend
test_geometrias.bat
```

Deberías ver todas las pruebas pasar:
```
✅ Estadísticas
✅ Listar todas
✅ Listar provincias
✅ Listar distritos
✅ GeoJSON provincias
✅ GeoJSON distritos Puno
✅ Buscar UBIGEO 2101
✅ Buscar UBIGEO 210101

📊 Resultado: 8/8 pruebas exitosas
🎉 ¡Todas las pruebas pasaron!
```

## 🔌 Endpoints Disponibles

### 1. Estadísticas

```http
GET /api/geometrias/stats/resumen
```

**Respuesta:**
```json
{
  "total": 150,
  "por_tipo": {
    "PROVINCIA": 13,
    "DISTRITO": 109,
    "CENTRO_POBLADO": 28
  }
}
```

### 2. Listar Geometrías

```http
GET /api/geometrias?tipo=DISTRITO&provincia=PUNO
```

**Parámetros opcionales:**
- `tipo`: PROVINCIA, DISTRITO, CENTRO_POBLADO
- `departamento`: Nombre del departamento
- `provincia`: Nombre de la provincia
- `distrito`: Nombre del distrito
- `ubigeo`: Código UBIGEO
- `nombre`: Buscar por nombre

**Respuesta:**
```json
[
  {
    "id": "...",
    "nombre": "PUNO",
    "tipo": "DISTRITO",
    "ubigeo": "210101",
    "departamento": "PUNO",
    "provincia": "PUNO",
    "distrito": "PUNO",
    "geometry": { ... },
    "area_km2": 460.32,
    "centroide_lat": -15.8402,
    "centroide_lon": -70.0219
  }
]
```

### 3. GeoJSON

```http
GET /api/geometrias/geojson?tipo=DISTRITO&provincia=PUNO
```

**Respuesta:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], ...]]
      },
      "properties": {
        "id": "...",
        "nombre": "PUNO",
        "tipo": "DISTRITO",
        "ubigeo": "210101",
        "area_km2": 460.32
      }
    }
  ]
}
```

### 4. Buscar por ID

```http
GET /api/geometrias/{id}
```

### 5. Buscar por UBIGEO

```http
GET /api/geometrias/ubigeo/210101
```

## 🧪 Pruebas Manuales con cURL

### Estadísticas
```bash
curl http://localhost:8000/api/geometrias/stats/resumen
```

### Listar provincias
```bash
curl "http://localhost:8000/api/geometrias?tipo=PROVINCIA"
```

### GeoJSON de distritos de Puno
```bash
curl "http://localhost:8000/api/geometrias/geojson?tipo=DISTRITO&provincia=PUNO"
```

### Buscar por UBIGEO
```bash
curl http://localhost:8000/api/geometrias/ubigeo/210101
```

## 🧪 Pruebas con Python

```python
import requests

# Estadísticas
response = requests.get("http://localhost:8000/api/geometrias/stats/resumen")
print(response.json())

# GeoJSON de distritos
response = requests.get(
    "http://localhost:8000/api/geometrias/geojson",
    params={"tipo": "DISTRITO", "provincia": "PUNO"}
)
data = response.json()
print(f"Features: {len(data['features'])}")
```

## 🗄️ Consultas MongoDB

### Ver geometrías en MongoDB

```javascript
// Conectar
mongo

// Usar base de datos
use drtc_db

// Contar total
db.geometrias.countDocuments()

// Ver una geometría
db.geometrias.findOne()

// Contar por tipo
db.geometrias.aggregate([
  { $group: { _id: "$tipo", count: { $sum: 1 } } }
])

// Buscar provincia de Puno
db.geometrias.findOne({ tipo: "PROVINCIA", nombre: "PUNO" })

// Listar todos los distritos de Puno
db.geometrias.find(
  { tipo: "DISTRITO", provincia: "PUNO" },
  { nombre: 1, ubigeo: 1 }
)

// Buscar por UBIGEO
db.geometrias.findOne({ ubigeo: "210101" })

// Ver índices
db.geometrias.getIndexes()
```

## 🔧 Troubleshooting

### Error: "No se encontraron archivos GeoJSON"

**Causa:** Los archivos no están en la ubicación esperada.

**Solución:**
```bash
# Verificar que existan
dir frontend\src\assets\geojson\*.geojson

# Deberías ver:
# puno-provincias.geojson
# puno-distritos.geojson
# puno-centrospoblados.geojson
```

### Error: "Error conectando a MongoDB"

**Causa:** MongoDB no está corriendo.

**Solución:**
```bash
# Iniciar MongoDB
net start MongoDB

# Verificar
mongo --eval "db.version()"
```

### Error 404 en /api/geometrias

**Causa:** El router no está registrado o el backend no está corriendo.

**Solución:**
1. Verifica que el backend esté corriendo
2. Revisa los logs del backend
3. Verifica que `geometrias_router` esté en `main.py`

### Las pruebas fallan

**Causa:** El backend no está corriendo o las geometrías no están importadas.

**Solución:**
1. Inicia el backend: `start-backend.bat`
2. Importa geometrías: `importar_geometrias.bat`
3. Verifica: `verificar_geometrias.bat`

## 📊 Estructura de Datos

### Modelo de Geometría

```python
{
    "id": "ObjectId",
    "nombre": "PUNO",
    "tipo": "DISTRITO",  # PROVINCIA, DISTRITO, CENTRO_POBLADO
    "ubigeo": "210101",
    "departamento": "PUNO",
    "provincia": "PUNO",
    "distrito": "PUNO",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], ...]]
    },
    "properties": { ... },  # Propiedades originales del GeoJSON
    "area_km2": 460.32,
    "perimetro_km": 120.5,
    "centroide_lat": -15.8402,
    "centroide_lon": -70.0219,
    "fechaCreacion": "2026-03-07T...",
    "fechaActualizacion": "2026-03-07T..."
}
```

### Índices Creados

```javascript
{ "tipo": 1 }
{ "ubigeo": 1 }
{ "departamento": 1 }
{ "provincia": 1 }
{ "distrito": 1 }
{ "tipo": 1, "provincia": 1 }
```

## 🎯 Checklist de Verificación

- [ ] MongoDB está corriendo
- [ ] Archivos GeoJSON existen en `frontend/src/assets/geojson/`
- [ ] Geometrías importadas (150 total)
- [ ] Backend corriendo en puerto 8000
- [ ] Endpoint `/api/geometrias/stats/resumen` responde
- [ ] Todas las pruebas pasan (8/8)
- [ ] Consultas MongoDB funcionan

## 📚 Archivos Relacionados

- `backend/app/models/geometria.py` - Modelo de datos
- `backend/app/repositories/geometria_repository.py` - Repositorio
- `backend/app/routers/geometrias.py` - API endpoints
- `backend/scripts/importar_geometrias_geojson.py` - Script de importación
- `backend/scripts/verificar_geometrias.py` - Script de verificación
- `backend/test_geometrias_api.py` - Pruebas del API

## ✅ Próximos Pasos

Una vez que todas las pruebas pasen:

1. El backend está listo y funcionando
2. Puedes integrar con el frontend
3. Las geometrías se sirven dinámicamente desde MongoDB
4. El sistema es escalable y mantenible

## 🎉 Conclusión

Si llegaste hasta aquí y todas las pruebas pasan, ¡felicidades! El backend del sistema de geometrías está completamente funcional y listo para usar.

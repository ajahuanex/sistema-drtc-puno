# Importar Centros Poblados de Puno desde GeoJSON

## Descripción

Este script permite importar los centros poblados del departamento de Puno desde el archivo GeoJSON ubicado en `frontend/src/assets/geojson/puno-centrospoblados.geojson` hacia la base de datos MongoDB.

## Datos que se importan

El script extrae y guarda la siguiente información de cada centro poblado:

### Datos principales:
- **Nombre**: Nombre del centro poblado
- **Tipo**: CENTRO_POBLADO
- **UBIGEO**: Código único de 6 dígitos
- **Departamento**: PUNO
- **Provincia**: Nombre de la provincia
- **Distrito**: Nombre del distrito
- **Coordenadas**: Latitud y longitud (Point geometry)

### Metadatos adicionales:
- Código CCPP
- ID CCPP
- Llave IDMA
- Población total
- Población por género (hombres/mujeres)
- Población vulnerable
- Viviendas particulares
- Tipo de área (Rural/Urbano)
- Datos de contacto (si están disponibles)

## Formas de ejecutar

### Opción 1: Usando el archivo .bat (Más fácil)

```bash
importar_centros_poblados.bat
```

### Opción 2: Manualmente

```bash
cd backend
venv\Scripts\activate
python scripts\importar_centros_poblados_geojson.py
```

## Modos de importación

El script ofrece 3 modos:

### 1. Crear solo nuevos
- Importa únicamente los centros poblados que NO existen en la base de datos
- No modifica registros existentes
- Útil para agregar nuevos datos sin afectar los existentes

### 2. Actualizar solo existentes
- Actualiza únicamente los centros poblados que YA existen
- No crea nuevos registros
- Útil para actualizar información de centros poblados ya registrados

### 3. Crear y actualizar (ambos)
- Crea nuevos registros e actualiza los existentes
- Modo más completo
- Recomendado para sincronización completa

### 4. Ver estadísticas
- Muestra estadísticas de los centros poblados ya importados
- No modifica datos
- Útil para verificar el estado actual

## Verificación de duplicados

El script verifica duplicados de dos formas:

1. **Por UBIGEO**: Si el centro poblado tiene UBIGEO, verifica que no exista otro con el mismo código
2. **Por nombre**: Si no tiene UBIGEO, verifica por nombre exacto en el departamento de PUNO

## Estructura de datos en MongoDB

```javascript
{
  "_id": ObjectId("..."),
  "nombre": "CHAQUIMINAS",
  "tipo": "CENTRO_POBLADO",
  "ubigeo": "211002",
  "departamento": "PUNO",
  "provincia": "SAN ANTONIO DE PUTINA",
  "distrito": "ANANEA",
  "coordenadas": {
    "latitud": -14.669026784158689,
    "longitud": -69.558805214788777
  },
  "estaActiva": true,
  "fechaCreacion": ISODate("2026-02-22T..."),
  "fechaActualizacion": ISODate("2026-02-22T..."),
  "fuente_datos": "GeoJSON",
  "metadata": {
    "codigo_ccpp": "0048",
    "idccpp": "2110020048",
    "llave_idma": "211002000000048",
    "poblacion_total": 10,
    "poblacion_hombres": 6,
    "poblacion_mujeres": 4,
    "viviendas_particulares": 8,
    "tipo_area": "Rural",
    "poblacion_vulnerable": 0,
    "contacto": "juan.suyo@geogpsperu.com",
    "whatsapp": "931381206"
  }
}
```

## Requisitos previos

1. **MongoDB corriendo**: Asegúrate de que MongoDB esté activo
2. **Variables de entorno**: Verifica que estén configuradas en `backend/.env`:
   ```
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=drtc_db
   ```
3. **Archivo GeoJSON**: Debe existir en `frontend/src/assets/geojson/puno-centrospoblados.geojson`

## Verificar MongoDB

Antes de importar, verifica que MongoDB esté corriendo:

```bash
# Opción 1: Usando Docker
docker ps | findstr mongo

# Opción 2: Verificar servicio local
sc query MongoDB
```

## Después de importar

### Ver los datos en MongoDB

Puedes verificar los datos importados usando MongoDB Compass o la línea de comandos:

```javascript
// Conectar a MongoDB
use drtc_db

// Ver total de centros poblados
db.localidades.countDocuments({ tipo: "CENTRO_POBLADO", departamento: "PUNO" })

// Ver algunos ejemplos
db.localidades.find({ tipo: "CENTRO_POBLADO", departamento: "PUNO" }).limit(5)

// Ver por provincia
db.localidades.aggregate([
  { $match: { tipo: "CENTRO_POBLADO", departamento: "PUNO" } },
  { $group: { _id: "$provincia", cantidad: { $sum: 1 } } },
  { $sort: { cantidad: -1 } }
])
```

### Usar en el frontend

Una vez importados, los centros poblados estarán disponibles en:

```typescript
// En tu componente de localidades o rutas
this.localidadService.obtenerLocalidades({
  tipo: 'CENTRO_POBLADO',
  departamento: 'PUNO'
}).subscribe(localidades => {
  console.log('Centros poblados:', localidades);
});
```

## Solución de problemas

### Error: No se encontró el archivo GeoJSON
- Verifica que el archivo exista en `frontend/src/assets/geojson/puno-centrospoblados.geojson`
- Verifica la ruta completa

### Error: No se puede conectar a MongoDB
- Verifica que MongoDB esté corriendo
- Verifica las variables de entorno en `backend/.env`
- Prueba la conexión: `python backend/test-mongodb-connection.py`

### Error: Módulo no encontrado
- Asegúrate de activar el entorno virtual: `backend\venv\Scripts\activate`
- Instala dependencias: `pip install -r backend/requirements.txt`

### Duplicados no detectados
- El script verifica por UBIGEO y nombre
- Si quieres forzar la actualización, usa el modo "Actualizar solo existentes"

## Estadísticas esperadas

Según el archivo GeoJSON, deberías tener aproximadamente:

- **Total de centros poblados**: Varios cientos (depende del archivo)
- **Provincias**: 13 provincias de Puno
- **Distritos**: 109 distritos
- **Con coordenadas**: La mayoría debería tener coordenadas
- **Tipo de área**: Principalmente "Rural"

## Próximos pasos

Después de importar los centros poblados:

1. **Visualizar en mapa**: Usa las coordenadas para mostrarlos en el mapa de Leaflet
2. **Filtrar por provincia/distrito**: Implementa filtros en el frontend
3. **Usar en rutas**: Permite seleccionar centros poblados como origen/destino/itinerario
4. **Estadísticas**: Muestra estadísticas de población, viviendas, etc.

## Contacto y soporte

Si tienes problemas con la importación:

1. Revisa los logs del script (se muestran en consola)
2. Verifica el archivo `backend/.env`
3. Consulta la documentación de MongoDB
4. Revisa el código del script en `backend/scripts/importar_centros_poblados_geojson.py`

# 🏘️ Resumen: Importación de Centros Poblados de Puno

## ✅ Archivos creados

### 1. Script principal de importación
**Archivo**: `backend/scripts/importar_centros_poblados_geojson.py`
- Lee el archivo GeoJSON de centros poblados
- Convierte los datos al formato de MongoDB
- Ofrece 3 modos: crear, actualizar, o ambos
- Maneja duplicados inteligentemente
- Muestra progreso y estadísticas

### 2. Script de verificación
**Archivo**: `backend/scripts/verificar_centros_poblados.py`
- Verifica los datos importados
- Muestra estadísticas detalladas
- Distribución por provincia y distrito
- Estadísticas de población
- Ejemplos de registros

### 3. Archivos batch para Windows
- `importar_centros_poblados.bat` - Ejecuta la importación
- `verificar_centros_poblados.bat` - Verifica los datos

### 4. Documentación
- `INSTRUCCIONES_IMPORTAR_CENTROS_POBLADOS.md` - Guía completa

## 🚀 Cómo usar

### Paso 1: Importar los datos

```bash
# Opción más fácil
importar_centros_poblados.bat

# O manualmente
cd backend
venv\Scripts\activate
python scripts\importar_centros_poblados_geojson.py
```

**Menú interactivo**:
```
1. Crear solo nuevos (recomendado para primera vez)
2. Actualizar solo existentes
3. Crear y actualizar (ambos)
4. Ver estadísticas actuales
0. Salir
```

### Paso 2: Verificar los datos

```bash
# Opción más fácil
verificar_centros_poblados.bat

# O manualmente
cd backend
venv\Scripts\activate
python scripts\verificar_centros_poblados.py
```

## 📊 Datos que se importan

### Información básica
- ✅ Nombre del centro poblado
- ✅ UBIGEO (código único)
- ✅ Departamento (PUNO)
- ✅ Provincia
- ✅ Distrito
- ✅ Coordenadas GPS (latitud, longitud)

### Metadatos adicionales
- 👥 Población total
- 👨 Población hombres
- 👩 Población mujeres
- 🏠 Viviendas particulares
- 🌆 Tipo de área (Rural/Urbano)
- ⚠️ Población vulnerable
- 📞 Datos de contacto (si están disponibles)

## 🗂️ Estructura en MongoDB

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
  "fechaCreacion": ISODate("..."),
  "fechaActualizacion": ISODate("..."),
  "fuente_datos": "GeoJSON",
  "metadata": {
    "codigo_ccpp": "0048",
    "poblacion_total": 10,
    "poblacion_hombres": 6,
    "poblacion_mujeres": 4,
    "viviendas_particulares": 8,
    "tipo_area": "Rural",
    "poblacion_vulnerable": 0
  }
}
```

## 🔍 Verificación de duplicados

El script verifica duplicados de dos formas:

1. **Por UBIGEO**: Si existe, verifica que no haya otro con el mismo código
2. **Por nombre**: Si no tiene UBIGEO, verifica por nombre exacto en PUNO

## 📈 Estadísticas esperadas

Después de importar, deberías ver:

- **Total de centros poblados**: Varios cientos (depende del GeoJSON)
- **13 provincias** de Puno
- **109 distritos**
- **Mayoría con coordenadas GPS**
- **Principalmente áreas rurales**

## 🎯 Próximos pasos

### 1. Visualizar en el mapa
```typescript
// En tu componente de localidades
this.localidadService.obtenerLocalidades({
  tipo: 'CENTRO_POBLADO',
  departamento: 'PUNO'
}).subscribe(centros => {
  // Agregar marcadores al mapa
  centros.forEach(centro => {
    if (centro.coordenadas) {
      L.marker([
        centro.coordenadas.latitud,
        centro.coordenadas.longitud
      ]).addTo(this.map);
    }
  });
});
```

### 2. Filtrar por provincia/distrito
```typescript
// Filtrar centros poblados de una provincia específica
this.localidadService.obtenerLocalidades({
  tipo: 'CENTRO_POBLADO',
  provincia: 'SAN ANTONIO DE PUTINA'
}).subscribe(centros => {
  console.log('Centros de la provincia:', centros);
});
```

### 3. Usar en rutas
```typescript
// Seleccionar centro poblado como origen/destino
const ruta = {
  origen: centroPobladoId,
  destino: otroCentroPobladoId,
  itinerario: [centro1Id, centro2Id, centro3Id]
};
```

### 4. Mostrar estadísticas
```typescript
// Obtener estadísticas de población
this.localidadService.obtenerEstadisticas({
  tipo: 'CENTRO_POBLADO',
  provincia: 'PUNO'
}).subscribe(stats => {
  console.log('Población total:', stats.poblacionTotal);
  console.log('Total viviendas:', stats.totalViviendas);
});
```

## 🛠️ Solución de problemas

### ❌ Error: No se encontró el archivo GeoJSON
**Solución**: Verifica que exista en:
```
frontend/src/assets/geojson/puno-centrospoblados.geojson
```

### ❌ Error: No se puede conectar a MongoDB
**Solución**: 
1. Verifica que MongoDB esté corriendo: `docker ps | findstr mongo`
2. Revisa `backend/.env`:
   ```
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=drtc_db
   ```

### ❌ Error: Módulo no encontrado
**Solución**:
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### ⚠️ Duplicados no detectados
**Solución**: Usa el modo "Actualizar solo existentes" para forzar actualización

## 📞 Verificar en MongoDB

### Usando MongoDB Compass
1. Conectar a `mongodb://localhost:27017`
2. Seleccionar base de datos `drtc_db`
3. Abrir colección `localidades`
4. Filtrar: `{ tipo: "CENTRO_POBLADO", departamento: "PUNO" }`

### Usando línea de comandos
```javascript
use drtc_db

// Ver total
db.localidades.countDocuments({ 
  tipo: "CENTRO_POBLADO", 
  departamento: "PUNO" 
})

// Ver ejemplos
db.localidades.find({ 
  tipo: "CENTRO_POBLADO", 
  departamento: "PUNO" 
}).limit(5).pretty()

// Por provincia
db.localidades.aggregate([
  { $match: { tipo: "CENTRO_POBLADO", departamento: "PUNO" } },
  { $group: { _id: "$provincia", cantidad: { $sum: 1 } } },
  { $sort: { cantidad: -1 } }
])
```

## 🎉 Resultado final

Después de ejecutar la importación, tendrás:

✅ Todos los centros poblados de Puno en tu base de datos  
✅ Con coordenadas GPS para visualización en mapas  
✅ Con datos demográficos (población, viviendas)  
✅ Organizados por provincia y distrito  
✅ Listos para usar en tu módulo de rutas  
✅ Disponibles en el API REST del backend  

## 📚 Archivos de referencia

- Script de importación: `backend/scripts/importar_centros_poblados_geojson.py`
- Script de verificación: `backend/scripts/verificar_centros_poblados.py`
- Modelo de datos: `backend/app/models/localidad.py`
- Archivo GeoJSON: `frontend/src/assets/geojson/puno-centrospoblados.geojson`
- Instrucciones completas: `INSTRUCCIONES_IMPORTAR_CENTROS_POBLADOS.md`

---

**¿Listo para importar?** Ejecuta: `importar_centros_poblados.bat` 🚀

# Guía Rápida: Importación de Geometrías

## Paso 1: Verificar Requisitos

Antes de importar, asegúrate de tener:

✅ MongoDB corriendo (puerto 27017)
✅ Archivos GeoJSON en `frontend/src/assets/geojson/`:
   - `puno-provincias.geojson`
   - `puno-distritos.geojson`
   - `puno-centrospoblados.geojson`

## Paso 2: Ejecutar Importación

### Opción A: Windows (Batch)
```bash
cd backend
importar_geometrias.bat
```

### Opción B: Windows (PowerShell)
```powershell
cd backend
.\importar_geometrias.ps1
```

### Opción C: Linux/Mac
```bash
cd backend
source venv/bin/activate
python scripts/importar_geometrias_geojson.py
```

## Paso 3: Verificar Importación

El script mostrará:
```
🗺️  IMPORTACIÓN DE GEOMETRÍAS DESDE GEOJSON
============================================================

📁 Directorio de GeoJSON: C:\...\frontend\src\assets\geojson
   Existe: ✅

📄 Archivos a importar:
   ✅ PROVINCIA: puno-provincias.geojson
   ✅ DISTRITO: puno-distritos.geojson
   ✅ CENTRO_POBLADO: puno-centrospoblados.geojson

🔌 Conectando a MongoDB: mongodb://localhost:27017
✅ Conexión exitosa

📊 Geometrías existentes: 0
¿Desea limpiar la colección antes de importar? (s/N):
```

**Responde "s" si es la primera vez o quieres reimportar todo.**

## Paso 4: Resultado Esperado

```
============================================================
📊 RESUMEN DE IMPORTACIÓN
============================================================
Total importado: 150

  PROVINCIA: 13
  DISTRITO: 109
  CENTRO_POBLADO: 28

✅ Importación completada
```

## Paso 5: Verificar en el API

Abre en tu navegador:
```
http://localhost:8000/api/geometrias/stats/resumen
```

Deberías ver:
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

## Paso 6: Probar en el Frontend

1. Inicia el backend: `cd backend && start-backend.bat`
2. Inicia el frontend: `cd frontend && ng serve`
3. Ve a Localidades
4. Haz clic en "Ver en Mapa" de cualquier localidad
5. Deberías ver los polígonos cargados correctamente

## Troubleshooting

### Error: "No se encontraron archivos GeoJSON"

**Solución:** Verifica que los archivos existan en:
```
frontend/src/assets/geojson/
├── puno-provincias.geojson
├── puno-distritos.geojson
└── puno-centrospoblados.geojson
```

### Error: "Error conectando a MongoDB"

**Solución:** 
1. Verifica que MongoDB esté corriendo:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

2. Verifica la conexión:
   ```bash
   mongo --eval "db.version()"
   ```

### Error: "ModuleNotFoundError: No module named 'pymongo'"

**Solución:**
```bash
cd backend
venv\Scripts\activate
pip install pymongo
```

### Los polígonos no aparecen en el mapa

**Solución:**
1. Verifica que el backend esté corriendo
2. Abre la consola del navegador (F12)
3. Busca errores en la pestaña "Console"
4. Verifica que el API responda:
   ```
   http://localhost:8000/api/geometrias/geojson?tipo=DISTRITO&provincia=PUNO
   ```

## Comandos Útiles

### Ver geometrías en MongoDB
```javascript
// Conectar a MongoDB
mongo

// Usar la base de datos
use drtc_db

// Contar geometrías
db.geometrias.countDocuments()

// Ver una geometría de ejemplo
db.geometrias.findOne()

// Contar por tipo
db.geometrias.aggregate([
  { $group: { _id: "$tipo", count: { $sum: 1 } } }
])

// Ver todas las provincias
db.geometrias.find({ tipo: "PROVINCIA" }, { nombre: 1, ubigeo: 1 })
```

### Limpiar colección de geometrías
```javascript
mongo
use drtc_db
db.geometrias.deleteMany({})
```

### Reimportar geometrías
```bash
cd backend
importar_geometrias.bat
# Responder "s" cuando pregunte si desea limpiar
```

## Próximos Pasos

Una vez importadas las geometrías:

1. ✅ El mapa cargará más rápido
2. ✅ Podrás filtrar por provincia/distrito dinámicamente
3. ✅ Las geometrías estarán sincronizadas con las localidades
4. ✅ Podrás agregar más departamentos fácilmente

## Soporte

Si tienes problemas:
1. Revisa los logs del script de importación
2. Verifica los logs del backend
3. Revisa la consola del navegador
4. Consulta `backend/GEOMETRIAS_README.md` para más detalles

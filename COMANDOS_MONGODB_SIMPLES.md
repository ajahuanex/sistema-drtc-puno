# Comandos MongoDB para Limpiar Rutas y Preparar Carga Masiva

## 1. Conectar a MongoDB
```bash
# Si usas MongoDB local
mongo

# Si usas MongoDB con autenticación
mongo -u usuario -p contraseña nombre_base_datos

# Si usas MongoDB Atlas o remoto
mongo "mongodb+srv://cluster.mongodb.net/database" --username usuario
```

## 2. Ver Estadísticas Actuales
```javascript
// Ver cuántos documentos hay en cada colección
db.rutas.countDocuments()
db.localidades.countDocuments()
db.empresas.countDocuments()
db.resoluciones.countDocuments()
```

## 3. Ver Localidades Existentes
```javascript
// Ver todas las localidades
db.localidades.find().limit(10)

// Ver localidades por departamento
db.localidades.aggregate([
  { $group: { _id: "$departamento", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Buscar localidades específicas
db.localidades.find({ nombre: /PUNO/i })
```

## 4. Verificar Duplicados de Localidades
```javascript
// Buscar posibles duplicados
db.localidades.aggregate([
  {
    $group: {
      _id: { 
        nombre: { $toUpper: { $trim: { input: "$nombre" } } }, 
        departamento: "$departamento" 
      },
      count: { $sum: 1 },
      ids: { $push: "$_id" },
      nombres: { $push: "$nombre" }
    }
  },
  { $match: { count: { $gt: 1 } } },
  { $sort: { count: -1 } }
])
```

## 5. 🚨 ELIMINAR TODAS LAS RUTAS (¡CUIDADO!)
```javascript
// ⚠️ ESTO ELIMINARÁ TODAS LAS RUTAS - Solo ejecutar si estás seguro
db.rutas.deleteMany({})

// Verificar que se eliminaron
db.rutas.countDocuments()
```

## 6. Crear Localidades de Ejemplo (Opcional)
```javascript
// Solo ejecutar si necesitas localidades de prueba
db.localidades.insertMany([
  {
    nombre: "PUNO",
    departamento: "PUNO",
    provincia: "PUNO",
    distrito: "PUNO",
    municipalidad_centro_poblado: "PUNO",
    nivel_territorial: "CIUDAD",
    tipo: "CIUDAD",
    descripcion: "Capital del departamento de Puno",
    esta_activa: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  },
  {
    nombre: "JULIACA",
    departamento: "PUNO",
    provincia: "SAN ROMAN",
    distrito: "JULIACA",
    municipalidad_centro_poblado: "JULIACA",
    nivel_territorial: "CIUDAD",
    tipo: "CIUDAD",
    descripcion: "Ciudad comercial de Puno",
    esta_activa: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  },
  {
    nombre: "PUCARA",
    departamento: "PUNO",
    provincia: "LAMPA",
    distrito: "PUCARA",
    municipalidad_centro_poblado: "PUCARA",
    nivel_territorial: "DISTRITO",
    tipo: "DISTRITO",
    descripcion: "Distrito de Pucará",
    esta_activa: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  },
  {
    nombre: "TARACO",
    departamento: "PUNO",
    provincia: "HUANCANE",
    distrito: "TARACO",
    municipalidad_centro_poblado: "TARACO",
    nivel_territorial: "DISTRITO",
    tipo: "DISTRITO",
    descripcion: "Distrito de Taraco",
    esta_activa: true,
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date()
  }
])
```

## 7. Crear Índices para Optimizar Búsquedas
```javascript
// Crear índices para búsquedas rápidas de localidades
db.localidades.createIndex({ nombre: 1, departamento: 1 })
db.localidades.createIndex({ nombre: "text", departamento: "text" })

// Verificar índices creados
db.localidades.getIndexes()
```

## 8. Verificar que Todo Está Listo
```javascript
// Estadísticas finales
print("Rutas: " + db.rutas.countDocuments())
print("Localidades: " + db.localidades.countDocuments())
print("Empresas: " + db.empresas.countDocuments())

// Ver algunas localidades de ejemplo
db.localidades.find({ departamento: "PUNO" }).limit(5)
```

## 9. Comandos de Respaldo (Opcional)
```javascript
// Hacer backup de localidades antes de cambios importantes
mongoexport --db=tu_base_datos --collection=localidades --out=backup_localidades.json

// Restaurar backup si es necesario
mongoimport --db=tu_base_datos --collection=localidades --file=backup_localidades.json
```

---

## ✅ Pasos Recomendados para la Limpieza:

1. **Conectar a MongoDB**
2. **Ver estadísticas actuales** con `db.rutas.countDocuments()`
3. **Verificar localidades existentes** 
4. **Eliminar rutas** con `db.rutas.deleteMany({})`
5. **Crear índices** para optimizar búsquedas
6. **Verificar que todo está listo**

## 🎯 Después de la Limpieza:

- El sistema estará listo para la carga masiva
- Las localidades se procesarán automáticamente
- No habrá duplicados de localidades
- Cada localidad tendrá un ID único
- Las rutas reutilizarán localidades existentes

## 💡 Notas Importantes:

- **MongoDB usa ObjectId** para los IDs únicos automáticamente
- **Las localidades existentes se reutilizarán** por nombre y departamento
- **Solo se crearán nuevas localidades** cuando no existan
- **El sistema normaliza nombres** para evitar duplicados por acentos/espacios
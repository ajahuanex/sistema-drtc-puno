// COMANDOS MONGODB PARA LIMPIAR RUTAS Y PREPARAR CARGA MASIVA
// Ejecutar uno por uno en MongoDB shell o MongoDB Compass

// 1. VER ESTADÍSTICAS ACTUALES
print("📊 ESTADÍSTICAS ACTUALES:");
print("Rutas: " + db.rutas.countDocuments());
print("Localidades: " + db.localidades.countDocuments());
print("Empresas: " + db.empresas.countDocuments());

// 2. VER LOCALIDADES POR DEPARTAMENTO
print("\n📍 Localidades por departamento:");
db.localidades.aggregate([
  { $group: { _id: "$departamento", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);

// 3. BUSCAR LOCALIDADES DUPLICADAS
print("\n🔍 Buscando duplicados:");
db.localidades.aggregate([
  {
    $group: {
      _id: { nombre: { $toUpper: "$nombre" }, departamento: "$departamento" },
      count: { $sum: 1 },
      ids: { $push: "$_id" }
    }
  },
  { $match: { count: { $gt: 1 } } }
]);

// 4. ⚠️ ELIMINAR TODAS LAS RUTAS (CUIDADO!)
// Descomenta la siguiente línea solo si estás seguro:
// db.rutas.deleteMany({});

// 5. VERIFICAR QUE NO HAY RUTAS
print("\n✅ Rutas después de limpieza: " + db.rutas.countDocuments());

// 6. CREAR LOCALIDADES DE EJEMPLO (opcional)
// Ejecutar solo si necesitas localidades de prueba:

/*
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
]);
*/

// 7. CREAR ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
db.localidades.createIndex({ nombre: 1, departamento: 1 });
db.localidades.createIndex({ nombre: "text", departamento: "text" });

print("\n✅ SISTEMA LISTO PARA CARGA MASIVA");
print("🎯 Ahora puedes usar la interfaz web para cargar rutas");
print("💡 Las localidades se procesarán automáticamente para evitar duplicados");
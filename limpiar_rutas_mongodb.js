// Script MongoDB para limpiar rutas y preparar carga masiva con localidades únicas
// Ejecutar en MongoDB shell o MongoDB Compass

// 1. Mostrar estadísticas antes de la limpieza
print("🚀 PREPARACIÓN PARA CARGA MASIVA DE RUTAS CON LOCALIDADES ÚNICAS");
print("=" * 70);
print("📅 Fecha: " + new Date().toISOString());
print("");

print("📊 ESTADÍSTICAS ANTES DE LA LIMPIEZA");
print("=" * 50);

// Contar documentos en cada colección
const totalRutas = db.rutas.countDocuments();
const totalLocalidades = db.localidades.countDocuments();
const totalEmpresas = db.empresas.countDocuments();
const totalResoluciones = db.resoluciones.countDocuments();

print("Total rutas: " + totalRutas);
print("Total localidades: " + totalLocalidades);
print("Total empresas: " + totalEmpresas);
print("Total resoluciones: " + totalResoluciones);

// 2. Mostrar distribución de localidades por departamento
print("\n📍 LOCALIDADES POR DEPARTAMENTO:");
print("-".repeat(40));
db.localidades.aggregate([
  {
    $group: {
      _id: "$departamento",
      cantidad: { $sum: 1 }
    }
  },
  {
    $sort: { cantidad: -1 }
  }
]).forEach(function(doc) {
  print("  - " + (doc._id || "Sin departamento") + ": " + doc.cantidad);
});

// 3. Mostrar localidades más utilizadas en rutas (si hay rutas)
if (totalRutas > 0) {
  print("\n🎯 LOCALIDADES MÁS UTILIZADAS EN RUTAS:");
  print("-".repeat(40));
  
  // Como origen
  print("Como ORIGEN:");
  db.rutas.aggregate([
    {
      $lookup: {
        from: "localidades",
        localField: "origenId",
        foreignField: "_id",
        as: "origen"
      }
    },
    { $unwind: "$origen" },
    {
      $group: {
        _id: "$origen.nombre",
        departamento: { $first: "$origen.departamento" },
        veces_usada: { $sum: 1 }
      }
    },
    { $sort: { veces_usada: -1 } },
    { $limit: 5 }
  ]).forEach(function(doc) {
    print("  - " + doc._id + " (" + doc.departamento + "): " + doc.veces_usada + " veces");
  });
  
  // Como destino
  print("Como DESTINO:");
  db.rutas.aggregate([
    {
      $lookup: {
        from: "localidades",
        localField: "destinoId",
        foreignField: "_id",
        as: "destino"
      }
    },
    { $unwind: "$destino" },
    {
      $group: {
        _id: "$destino.nombre",
        departamento: { $first: "$destino.departamento" },
        veces_usada: { $sum: 1 }
      }
    },
    { $sort: { veces_usada: -1 } },
    { $limit: 5 }
  ]).forEach(function(doc) {
    print("  - " + doc._id + " (" + doc.departamento + "): " + doc.veces_usada + " veces");
  });
}

// 4. Verificar localidades duplicadas potenciales
print("\n🔍 VERIFICACIÓN DE LOCALIDADES DUPLICADAS:");
print("-".repeat(40));
db.localidades.aggregate([
  {
    $group: {
      _id: {
        nombre: { $toUpper: { $trim: { input: "$nombre" } } },
        departamento: "$departamento"
      },
      cantidad: { $sum: 1 },
      ids: { $push: "$_id" },
      nombres_originales: { $push: "$nombre" }
    }
  },
  {
    $match: { cantidad: { $gt: 1 } }
  },
  {
    $sort: { cantidad: -1 }
  }
]).forEach(function(doc) {
  print("  ⚠️ Duplicado: " + doc._id.nombre + " (" + doc._id.departamento + ") - " + doc.cantidad + " veces");
  print("     IDs: " + doc.ids.join(", "));
  print("     Nombres originales: " + doc.nombres_originales.join(", "));
});

// 5. Mostrar localidades con datos incompletos
print("\n⚠️ LOCALIDADES CON DATOS INCOMPLETOS:");
print("-".repeat(40));
const localidadesIncompletas = db.localidades.find({
  $or: [
    { nombre: { $exists: false } },
    { nombre: null },
    { nombre: "" },
    { departamento: { $exists: false } },
    { departamento: null },
    { departamento: "" }
  ]
}).limit(10);

let countIncompletas = 0;
localidadesIncompletas.forEach(function(doc) {
  countIncompletas++;
  let problema = "";
  if (!doc.nombre) problema += "Sin nombre ";
  if (!doc.departamento) problema += "Sin departamento ";
  print("  - ID: " + doc._id + " - Problema: " + problema);
});

if (countIncompletas === 0) {
  print("  ✅ Todas las localidades tienen datos básicos completos");
}

// 6. LIMPIEZA DE RUTAS
print("\n🗑️ LIMPIEZA DE RUTAS:");
print("-".repeat(40);

if (totalRutas > 0) {
  print("⚠️ Se encontraron " + totalRutas + " rutas en la base de datos");
  print("💡 Para eliminar las rutas, ejecuta el siguiente comando:");
  print("   db.rutas.deleteMany({})");
  print("");
  print("🔧 COMANDO PARA ELIMINAR RUTAS:");
  print("=" * 40);
  print("db.rutas.deleteMany({})");
  print("=" * 40);
} else {
  print("✅ No hay rutas para eliminar");
}

// 7. Crear localidades de ejemplo para pruebas
print("\n🆕 LOCALIDADES DE EJEMPLO PARA PRUEBAS:");
print("-".repeat(40));

const localidadesEjemplo = [
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
];

print("💡 Para crear localidades de ejemplo, ejecuta:");
print("=" * 50);
localidadesEjemplo.forEach(function(localidad, index) {
  print("// Localidad " + (index + 1) + ": " + localidad.nombre);
  print("db.localidades.updateOne(");
  print("  { nombre: '" + localidad.nombre + "', departamento: '" + localidad.departamento + "' },");
  print("  { $setOnInsert: " + JSON.stringify(localidad, null, 2) + " },");
  print("  { upsert: true }");
  print(");");
  print("");
});
print("=" * 50);

// 8. Estadísticas finales y preparación
print("\n✅ PREPARACIÓN COMPLETADA");
print("=" * 50);
print("🎯 El sistema está listo para la carga masiva de rutas");
print("💡 Las localidades se procesarán automáticamente para evitar duplicados");
print("📊 Usa el componente de carga masiva en el frontend para procesar las rutas");
print("");
print("🔧 PASOS SIGUIENTES:");
print("1. Ejecutar: db.rutas.deleteMany({}) para limpiar rutas");
print("2. Opcional: Crear localidades de ejemplo con los comandos mostrados arriba");
print("3. Usar la interfaz web para cargar rutas masivamente");
print("4. El sistema automáticamente:");
print("   - Verificará si cada localidad ya existe");
print("   - Reutilizará localidades existentes");
print("   - Creará nuevas localidades solo cuando sea necesario");
print("   - Asegurará que no haya duplicados");

// 9. Comandos útiles adicionales
print("\n🛠️ COMANDOS ÚTILES ADICIONALES:");
print("-".repeat(40));
print("// Ver todas las colecciones:");
print("show collections");
print("");
print("// Contar documentos:");
print("db.rutas.countDocuments()");
print("db.localidades.countDocuments()");
print("db.empresas.countDocuments()");
print("");
print("// Buscar localidades por nombre:");
print("db.localidades.find({ nombre: /PUNO/i })");
print("");
print("// Ver índices de localidades:");
print("db.localidades.getIndexes()");
print("");
print("// Crear índice para búsquedas rápidas de localidades:");
print("db.localidades.createIndex({ nombre: 1, departamento: 1 })");
print("db.localidades.createIndex({ nombre: 'text', departamento: 'text' })");
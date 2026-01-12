// EJECUTAR LIMPIEZA DE RUTAS EN MONGODB
// Este script elimina todas las rutas y prepara el sistema para carga masiva

print("🚀 INICIANDO LIMPIEZA DE MONGODB PARA CARGA MASIVA");
print("=" * 60);

// 1. Mostrar estadísticas antes de la limpieza
print("\n📊 ESTADÍSTICAS ANTES DE LA LIMPIEZA:");
const rutasAntes = db.rutas.countDocuments();
const localidadesAntes = db.localidades.countDocuments();
const empresasAntes = db.empresas.countDocuments();

print("Rutas: " + rutasAntes);
print("Localidades: " + localidadesAntes);
print("Empresas: " + empresasAntes);

// 2. Eliminar todas las rutas
print("\n🗑️ ELIMINANDO TODAS LAS RUTAS...");
const resultado = db.rutas.deleteMany({});
print("✅ Rutas eliminadas: " + resultado.deletedCount);

// 3. Verificar eliminación
const rutasDespues = db.rutas.countDocuments();
print("✅ Rutas restantes: " + rutasDespues);

// 4. Crear índices para optimizar búsquedas de localidades
print("\n🔧 CREANDO ÍNDICES PARA OPTIMIZACIÓN...");
try {
  db.localidades.createIndex({ nombre: 1, departamento: 1 });
  print("✅ Índice creado: { nombre: 1, departamento: 1 }");
} catch (e) {
  print("ℹ️ Índice ya existe: { nombre: 1, departamento: 1 }");
}

try {
  db.localidades.createIndex({ nombre: "text", departamento: "text" });
  print("✅ Índice de texto creado para búsquedas");
} catch (e) {
  print("ℹ️ Índice de texto ya existe");
}

// 5. Mostrar estadísticas finales
print("\n📊 ESTADÍSTICAS DESPUÉS DE LA LIMPIEZA:");
print("Rutas: " + db.rutas.countDocuments());
print("Localidades: " + db.localidades.countDocuments());
print("Empresas: " + db.empresas.countDocuments());

// 6. Verificar algunas localidades de ejemplo
print("\n📍 LOCALIDADES DE EJEMPLO DISPONIBLES:");
const localidadesPuno = db.localidades.find({ departamento: "PUNO" }).limit(5);
localidadesPuno.forEach(function(loc) {
  print("  - " + loc.nombre + " (" + loc.departamento + ")");
});

// 7. Resultado final
print("\n✅ LIMPIEZA COMPLETADA EXITOSAMENTE");
print("=" * 60);
print("🎯 Sistema listo para carga masiva de rutas");
print("💡 Las localidades se procesarán automáticamente para evitar duplicados");
print("📊 Total de rutas eliminadas: " + resultado.deletedCount);
print("🔧 Índices optimizados para búsquedas rápidas");

if (rutasDespues === 0) {
  print("\n🚀 ¡PERFECTO! Base de datos lista para carga masiva");
} else {
  print("\n⚠️ ADVERTENCIA: Aún quedan " + rutasDespues + " rutas");
}
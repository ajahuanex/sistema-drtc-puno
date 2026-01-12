// ELIMINAR TODAS LAS RUTAS DE MONGODB
// Ejecutar en MongoDB shell

// 1. Ver cuántas rutas hay antes de eliminar
print("📊 Rutas antes de eliminar: " + db.rutas.countDocuments());

// 2. Eliminar todas las rutas
const resultado = db.rutas.deleteMany({});
print("🗑️ Rutas eliminadas: " + resultado.deletedCount);

// 3. Verificar que se eliminaron todas
print("✅ Rutas después de eliminar: " + db.rutas.countDocuments());

// 4. Mostrar estadísticas finales
print("\n📊 ESTADÍSTICAS FINALES:");
print("Rutas: " + db.rutas.countDocuments());
print("Localidades: " + db.localidades.countDocuments());
print("Empresas: " + db.empresas.countDocuments());

print("\n✅ Base de datos lista para carga masiva");
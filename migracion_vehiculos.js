/**
 * Script de Migración para Vehículos
 * Ejecutar en MongoDB Compass o mongo shell
 * 
 * Base de datos: sirret_db
 * Colección: vehiculos
 */

// ============================================
// PASO 1: Agregar tipoServicio
// ============================================
print("🔄 Paso 1: Agregando tipoServicio a vehículos...");

var result1 = db.vehiculos.updateMany(
  { tipoServicio: { $exists: false } },
  { $set: { tipoServicio: "NO_ESPECIFICADO" } }
);

print("✅ Resultado:");
print("   - Documentos encontrados: " + result1.matchedCount);
print("   - Documentos modificados: " + result1.modifiedCount);

// ============================================
// PASO 2: Copiar vehiculoSoloId a vehiculoDataId
// ============================================
print("\n🔄 Paso 2: Copiando vehiculoSoloId a vehiculoDataId...");

var result2 = db.vehiculos.updateMany(
  { 
    vehiculoSoloId: { $exists: true },
    vehiculoDataId: { $exists: false }
  },
  [{ $set: { vehiculoDataId: "$vehiculoSoloId" } }]
);

print("✅ Resultado:");
print("   - Documentos encontrados: " + result2.matchedCount);
print("   - Documentos modificados: " + result2.modifiedCount);

// ============================================
// PASO 3: Verificación
// ============================================
print("\n🔍 Verificando migración...");

var sinTipoServicio = db.vehiculos.find({ 
  tipoServicio: { $exists: false } 
}).count();

var sinVehiculoDataId = db.vehiculos.find({ 
  vehiculoSoloId: { $exists: true },
  vehiculoDataId: { $exists: false }
}).count();

print("\n📊 Estado después de la migración:");
print("   - Vehículos sin tipoServicio: " + sinTipoServicio);
print("   - Vehículos sin vehiculoDataId: " + sinVehiculoDataId);

if (sinTipoServicio === 0 && sinVehiculoDataId === 0) {
  print("\n🎉 ¡Migración completada exitosamente!");
} else {
  print("\n⚠️  Algunos vehículos aún necesitan migración");
}

// ============================================
// PASO 4: Mostrar ejemplo
// ============================================
print("\n📄 Ejemplo de vehículo migrado:");
var ejemplo = db.vehiculos.findOne({});
if (ejemplo) {
  print("   Placa: " + ejemplo.placa);
  print("   TipoServicio: " + (ejemplo.tipoServicio || "N/A"));
  print("   VehiculoDataId: " + (ejemplo.vehiculoDataId || "N/A"));
  print("   VehiculoSoloId: " + (ejemplo.vehiculoSoloId || "N/A"));
}

print("\n✅ Script completado");

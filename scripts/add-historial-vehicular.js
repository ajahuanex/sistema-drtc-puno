// Script para agregar la colección de Historial Vehicular a una base de datos existente
print('🚀 Agregando colección de Historial Vehicular a SIRRET...');

// Cambiar a la base de datos sirret_db
db = db.getSiblingDB('sirret_db');

// Verificar si la colección ya existe
const collections = db.getCollectionNames();
if (collections.includes('historial_vehicular')) {
  print('⚠️ La colección historial_vehicular ya existe. Actualizando índices...');
} else {
  print('📝 Creando nueva colección historial_vehicular...');
  db.createCollection('historial_vehicular');
}

// Crear/actualizar índices para historial vehicular
print('🔍 Creando índices para historial vehicular...');

// Índices básicos
db.historial_vehicular.createIndex({ "vehiculoId": 1 });
db.historial_vehicular.createIndex({ "placa": 1 });
db.historial_vehicular.createIndex({ "tipoEvento": 1 });
db.historial_vehicular.createIndex({ "fechaEvento": -1 }); // Descendente para consultas recientes
db.historial_vehicular.createIndex({ "empresaId": 1 });
db.historial_vehicular.createIndex({ "resolucionId": 1 });
db.historial_vehicular.createIndex({ "usuarioId": 1 });

// Índices compuestos para consultas complejas
db.historial_vehicular.createIndex({ "vehiculoId": 1, "fechaEvento": -1 });
db.historial_vehicular.createIndex({ "placa": 1, "fechaEvento": -1 });
db.historial_vehicular.createIndex({ "empresaId": 1, "fechaEvento": -1 });
db.historial_vehicular.createIndex({ "tipoEvento": 1, "fechaEvento": -1 });

// Índice de texto para búsquedas
db.historial_vehicular.createIndex({ 
  "descripcion": "text", 
  "observaciones": "text",
  "usuarioNombre": "text"
});

print('✅ Índices creados correctamente');

// Aplicar validación de esquema
print('📋 Aplicando validación de esquema...');

try {
  db.runCommand({
    collMod: "historial_vehicular",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["vehiculoId", "placa", "tipoEvento", "fechaEvento", "descripcion"],
        properties: {
          vehiculoId: {
            bsonType: "string",
            description: "ID del vehículo (requerido)"
          },
          placa: {
            bsonType: "string",
            pattern: "^[A-Z0-9]{3}-[0-9]{3}$",
            description: "Placa del vehículo en formato XXX-123 (requerido)"
          },
          tipoEvento: {
            enum: [
              "CREACION",
              "MODIFICACION", 
              "TRANSFERENCIA_EMPRESA",
              "CAMBIO_RESOLUCION",
              "CAMBIO_ESTADO",
              "ASIGNACION_RUTA",
              "DESASIGNACION_RUTA",
              "ACTUALIZACION_TUC",
              "RENOVACION_TUC",
              "SUSPENSION",
              "REACTIVACION",
              "BAJA_DEFINITIVA",
              "MANTENIMIENTO",
              "INSPECCION",
              "ACCIDENTE",
              "MULTA",
              "REVISION_TECNICA",
              "CAMBIO_PROPIETARIO",
              "ACTUALIZACION_DATOS_TECNICOS",
              "OTROS"
            ],
            description: "Tipo de evento del historial (requerido)"
          },
          fechaEvento: {
            bsonType: "date",
            description: "Fecha y hora del evento (requerido)"
          },
          descripcion: {
            bsonType: "string",
            minLength: 1,
            description: "Descripción del evento (requerido)"
          },
          empresaId: {
            bsonType: "string",
            description: "ID de la empresa relacionada (opcional)"
          },
          resolucionId: {
            bsonType: "string", 
            description: "ID de la resolución relacionada (opcional)"
          },
          usuarioId: {
            bsonType: "string",
            description: "ID del usuario que realizó la acción (opcional)"
          },
          usuarioNombre: {
            bsonType: "string",
            description: "Nombre del usuario que realizó la acción (opcional)"
          },
          observaciones: {
            bsonType: "string",
            description: "Observaciones adicionales (opcional)"
          },
          datosAnteriores: {
            bsonType: "object",
            description: "Datos anteriores del vehículo antes del cambio (opcional)"
          },
          datosNuevos: {
            bsonType: "object", 
            description: "Datos nuevos del vehículo después del cambio (opcional)"
          },
          documentosSoporte: {
            bsonType: "array",
            items: {
              bsonType: "string"
            },
            description: "IDs de documentos de soporte (opcional)"
          },
          metadatos: {
            bsonType: "object",
            description: "Metadatos adicionales del evento (opcional)"
          }
        }
      }
    },
    validationLevel: "moderate",
    validationAction: "warn"
  });
  print('✅ Validación de esquema aplicada correctamente');
} catch (e) {
  print('⚠️ Error aplicando validación: ' + e.message);
}

// Mostrar estadísticas de la colección
const stats = db.historial_vehicular.stats();
print('📊 Estadísticas de la colección historial_vehicular:');
print('   - Documentos: ' + stats.count);
print('   - Índices: ' + stats.nindexes);
print('   - Tamaño: ' + Math.round(stats.size / 1024) + ' KB');

print('✅ Historial Vehicular agregado exitosamente a SIRRET');
print('🎯 La colección está lista para recibir eventos de historial vehicular');
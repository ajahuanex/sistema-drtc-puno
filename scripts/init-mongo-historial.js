// Script de inicialización de MongoDB para DRTC Puno - Actualizado con Historial Vehicular
print('🚀 Inicializando base de datos DRTC Puno con Historial Vehicular...');

// Cambiar a la base de datos drtc_puno
db = db.getSiblingDB('drtc_puno');

// Crear usuario para la aplicación (si no existe)
try {
  db.createUser({
    user: 'drtc_user',
    pwd: 'drtc_password_2025',
    roles: [
      {
        role: 'readWrite',
        db: 'drtc_puno'
      }
    ]
  });
  print('✅ Usuario drtc_user creado');
} catch (e) {
  print('ℹ️ Usuario drtc_user ya existe');
}

// Crear colecciones básicas con índices
print('📋 Creando colecciones...');

// Colección de usuarios
db.createCollection('usuarios');
db.usuarios.createIndex({ "username": 1 }, { unique: true });
db.usuarios.createIndex({ "email": 1 }, { unique: true });

// Colección de empresas
db.createCollection('empresas');
db.empresas.createIndex({ "ruc": 1 }, { unique: true });
db.empresas.createIndex({ "codigoEmpresa": 1 }, { unique: true });
db.empresas.createIndex({ "estado": 1 });

// Colección de expedientes
db.createCollection('expedientes');
db.expedientes.createIndex({ "nroExpediente": 1 }, { unique: true });
db.expedientes.createIndex({ "empresaId": 1 });
db.expedientes.createIndex({ "estado": 1 });
db.expedientes.createIndex({ "fechaEmision": 1 });

// Colección de vehículos
db.createCollection('vehiculos');
db.vehiculos.createIndex({ "placa": 1 }, { unique: true });
db.vehiculos.createIndex({ "empresaActualId": 1 });
db.vehiculos.createIndex({ "resolucionId": 1 });
db.vehiculos.createIndex({ "estado": 1 });
db.vehiculos.createIndex({ "fechaRegistro": 1 });

// Colección de TUCs
db.createCollection('tucs');
db.tucs.createIndex({ "numeroTuc": 1 }, { unique: true });
db.tucs.createIndex({ "vehiculoId": 1 });
db.tucs.createIndex({ "fechaVencimiento": 1 });

// Colección de resoluciones
db.createCollection('resoluciones');
db.resoluciones.createIndex({ "nroResolucion": 1 }, { unique: true });
db.resoluciones.createIndex({ "empresaId": 1 });
db.resoluciones.createIndex({ "expedienteId": 1 });
db.resoluciones.createIndex({ "tipoResolucion": 1 });
db.resoluciones.createIndex({ "estado": 1 });

// Colección de oficinas
db.createCollection('oficinas');
db.oficinas.createIndex({ "nombre": 1 }, { unique: true });
db.oficinas.createIndex({ "tipo": 1 });

// Colección de conductores
db.createCollection('conductores');
db.conductores.createIndex({ "dni": 1 }, { unique: true });
db.conductores.createIndex({ "empresaId": 1 });

// Colección de rutas
db.createCollection('rutas');
db.rutas.createIndex({ "codigoRuta": 1 }, { unique: true });
db.rutas.createIndex({ "empresaId": 1 });
db.rutas.createIndex({ "resolucionId": 1 });

// Colección de notificaciones
db.createCollection('notificaciones');
db.notificaciones.createIndex({ "usuarioId": 1 });
db.notificaciones.createIndex({ "fechaCreacion": 1 });

// 🆕 NUEVA COLECCIÓN: Historial Vehicular
print('📝 Creando colección de historial vehicular...');
db.createCollection('historial_vehicular');

// Índices para historial vehicular
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

// Validación de esquema para historial vehicular
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

// Crear datos de ejemplo para historial vehicular
print('📊 Insertando datos de ejemplo para historial vehicular...');

// Ejemplo de registro de creación de vehículo
db.historial_vehicular.insertOne({
  vehiculoId: "ejemplo_vehiculo_id",
  placa: "AAA-111",
  tipoEvento: "CREACION",
  fechaEvento: new Date(),
  descripcion: "Vehículo registrado en el sistema",
  empresaId: "ejemplo_empresa_id",
  resolucionId: "ejemplo_resolucion_id",
  usuarioId: "admin",
  usuarioNombre: "Administrador del Sistema",
  observaciones: "Registro inicial del vehículo",
  datosNuevos: {
    placa: "AAA-111",
    marca: "TOYOTA",
    modelo: "HIACE",
    anioFabricacion: 2020,
    estado: "ACTIVO"
  },
  metadatos: {
    version: "1.0",
    sistemaOrigen: "DRTC_PUNO",
    ipUsuario: "127.0.0.1"
  }
});

print('✅ Base de datos DRTC Puno inicializada correctamente con Historial Vehicular');
print('📊 Colecciones creadas: ' + db.getCollectionNames().length);
print('🔐 Usuario de aplicación: drtc_user');
print('📝 Nueva colección: historial_vehicular con validación de esquema');
print('🎯 Índices optimizados para consultas de historial vehicular');
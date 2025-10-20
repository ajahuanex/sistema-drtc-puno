// Script de inicialización de MongoDB para DRTC Puno
print('🚀 Inicializando base de datos DRTC Puno...');

// Cambiar a la base de datos drtc_puno
db = db.getSiblingDB('drtc_puno');

// Crear usuario para la aplicación
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
db.vehiculos.createIndex({ "empresaId": 1 });

// Colección de TUCs
db.createCollection('tucs');
db.tucs.createIndex({ "numeroTuc": 1 }, { unique: true });
db.tucs.createIndex({ "vehiculoId": 1 });
db.tucs.createIndex({ "fechaVencimiento": 1 });

// Colección de resoluciones
db.createCollection('resoluciones');
db.resoluciones.createIndex({ "nroResolucion": 1 }, { unique: true });
db.resoluciones.createIndex({ "expedienteId": 1 });

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

// Colección de notificaciones
db.createCollection('notificaciones');
db.notificaciones.createIndex({ "usuarioId": 1 });
db.notificaciones.createIndex({ "fechaCreacion": 1 });

print('✅ Base de datos DRTC Puno inicializada correctamente');
print('📊 Colecciones creadas: ' + db.getCollectionNames().length);
print('🔐 Usuario de aplicación creado: drtc_user');
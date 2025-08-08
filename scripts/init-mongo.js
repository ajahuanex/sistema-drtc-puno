// Script de inicialización de MongoDB
db = db.getSiblingDB('drtc_puno');

// Crear colecciones principales
db.createCollection('empresas');
db.createCollection('vehiculos');
db.createCollection('usuarios');
db.createCollection('resoluciones');
db.createCollection('rutas');
db.createCollection('tucs');
db.createCollection('conductores');
db.createCollection('localidades');
db.createCollection('expedientes');
db.createCollection('infracciones');
db.createCollection('fiscalizaciones');
db.createCollection('documentos');
db.createCollection('notificaciones');
db.createCollection('interoperatividad');
db.createCollection('terminales');

// Crear índices
db.empresas.createIndex({ "ruc": 1 }, { unique: true });
db.vehiculos.createIndex({ "placa": 1 }, { unique: true });
db.usuarios.createIndex({ "dni": 1 }, { unique: true });
db.usuarios.createIndex({ "email": 1 }, { unique: true });

print('✅ Base de datos DRTC Puno inicializada');

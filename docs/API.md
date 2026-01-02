# Documentación de API - Sistema SIRRET

## Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Obtener usuario actual

### Empresas
- `GET /api/empresas` - Listar empresas
- `POST /api/empresas` - Crear empresa
- `GET /api/empresas/{id}` - Obtener empresa
- `PUT /api/empresas/{id}` - Actualizar empresa
- `DELETE /api/empresas/{id}` - Desactivar empresa

### Vehículos
- `GET /api/vehiculos` - Listar vehículos
- `POST /api/vehiculos` - Crear vehículo
- `GET /api/vehiculos/{id}` - Obtener vehículo
- `PUT /api/vehiculos/{id}` - Actualizar vehículo
- `DELETE /api/vehiculos/{id}` - Desactivar vehículo

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios/{id}` - Obtener usuario
- `PUT /api/usuarios/{id}` - Actualizar usuario
- `DELETE /api/usuarios/{id}` - Desactivar usuario

### Resoluciones
- `GET /api/resoluciones` - Listar resoluciones
- `POST /api/resoluciones` - Crear resolución
- `GET /api/resoluciones/{id}` - Obtener resolución
- `PUT /api/resoluciones/{id}` - Actualizar resolución
- `DELETE /api/resoluciones/{id}` - Desactivar resolución

### Rutas
- `GET /api/rutas` - Listar rutas
- `POST /api/rutas` - Crear ruta
- `GET /api/rutas/{id}` - Obtener ruta
- `PUT /api/rutas/{id}` - Actualizar ruta
- `DELETE /api/rutas/{id}` - Desactivar ruta

### TUCs
- `GET /api/tucs` - Listar TUCs
- `POST /api/tucs` - Crear TUC
- `GET /api/tucs/{id}` - Obtener TUC
- `PUT /api/tucs/{id}` - Actualizar TUC
- `DELETE /api/tucs/{id}` - Desactivar TUC

## Autenticación
Todos los endpoints requieren autenticación JWT excepto `/api/auth/login`.

## Códigos de Respuesta
- `200` - OK
- `201` - Creado
- `400` - Bad Request
- `401` - No autorizado
- `404` - No encontrado
- `500` - Error interno del servidor

# Sistema de Gestión SIRRET - Backend

Backend FastAPI para el Sistema de Gestión de la Dirección Regional de Transportes y Comunicaciones Puno.

## 🚀 Características

- **FastAPI**: Framework moderno y rápido para APIs
- **MongoDB**: Base de datos NoSQL con Motor (driver asíncrono)
- **JWT**: Autenticación con tokens JWT
- **Pydantic**: Validación de datos y serialización
- **CORS**: Soporte para Cross-Origin Resource Sharing
- **Logging**: Sistema de logging estructurado
- **Documentación**: Auto-generada con Swagger/OpenAPI

## 📋 Requisitos

- Python 3.10+
- MongoDB 5.0+
- pip

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
cd backend
```

2. **Crear entorno virtual**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno**
```bash
cp env.example .env
# Editar .env con tus configuraciones
```

5. **Iniciar MongoDB**
```bash
# Asegúrate de que MongoDB esté ejecutándose
mongod
```

## 🚀 Ejecución

### Desarrollo
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Producción
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 📚 Documentación de la API

Una vez ejecutado el servidor, puedes acceder a:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🏗️ Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Punto de entrada de la aplicación
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py         # Configuración de la aplicación
│   ├── dependencies/
│   │   ├── __init__.py
│   │   ├── db.py              # Dependencias de base de datos
│   │   └── auth.py            # Dependencias de autenticación
│   ├── models/
│   │   ├── __init__.py
│   │   ├── usuario.py         # Modelos de usuario
│   │   ├── empresa.py         # Modelos de empresa
│   │   ├── vehiculo.py        # Modelos de vehículo
│   │   ├── conductor.py       # Modelos de conductor
│   │   ├── ruta.py            # Modelos de ruta
│   │   ├── tuc.py             # Modelos de TUC
│   │   ├── resolucion.py      # Modelos de resolución
│   │   ├── expediente.py      # Modelos de expediente
│   │   ├── infraccion.py      # Modelos de infracción
│   │   ├── fiscalizacion.py   # Modelos de fiscalización
│   │   ├── notificacion.py    # Modelos de notificación
│   │   ├── documento.py       # Modelos de documento
│   │   ├── historial.py       # Modelos de historial
│   │   ├── interoperabilidad.py # Modelos de interoperabilidad
│   │   ├── localidad.py       # Modelos de localidad
│   │   └── terminal.py        # Modelos de terminal
│   ├── services/
│   │   ├── __init__.py
│   │   ├── usuario_service.py # Lógica de negocio de usuarios
│   │   ├── empresa_service.py # Lógica de negocio de empresas
│   │   ├── vehiculo_service.py # Lógica de negocio de vehículos
│   │   ├── conductor_service.py # Lógica de negocio de conductores
│   │   ├── ruta_service.py    # Lógica de negocio de rutas
│   │   ├── tuc_service.py     # Lógica de negocio de TUCs
│   │   ├── resolucion_service.py # Lógica de negocio de resoluciones
│   │   ├── expediente_service.py # Lógica de negocio de expedientes
│   │   ├── infraccion_service.py # Lógica de negocio de infracciones
│   │   ├── fiscalizacion_service.py # Lógica de negocio de fiscalización
│   │   ├── notificacion_service.py # Lógica de negocio de notificaciones
│   │   ├── sunat_service.py   # Servicio de integración con SUNAT
│   │   └── mock_data.py       # Datos de prueba para desarrollo
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth_router.py     # Endpoints de autenticación
│   │   ├── empresas_router.py # Endpoints de empresas
│   │   ├── vehiculos_router.py # Endpoints de vehículos
│   │   ├── conductores_router.py # Endpoints de conductores
│   │   ├── rutas_router.py    # Endpoints de rutas
│   │   ├── tucs_router.py     # Endpoints de TUCs
│   │   ├── resoluciones_router.py # Endpoints de resoluciones
│   │   ├── expedientes_router.py # Endpoints de expedientes
│   │   ├── infracciones_router.py # Endpoints de infracciones
│   │   ├── fiscalizaciones_router.py # Endpoints de fiscalización
│   │   ├── notificaciones_router.py # Endpoints de notificaciones
│   │   └── mock_router.py     # Endpoints de datos de prueba
│   └── utils/
│       ├── __init__.py
│       └── exceptions.py      # Excepciones personalizadas
├── requirements.txt            # Dependencias de Python
├── env.example                # Ejemplo de variables de entorno
└── README.md                  # Este archivo
```

## 🗃️ Modelos de Datos

### 🔐 Usuario
- **Propósito**: Gestión de usuarios del sistema (funcionarios, administradores)
- **Campos clave**: `id`, `username`, `email`, `rol`, `estaActivo`, `fechaRegistro`
- **Roles**: ADMIN, FUNCIONARIO, SUPERVISOR, DIRECTOR

### 🏢 Empresa
- **Propósito**: Empresas de transporte autorizadas para operar
- **Campos clave**: `ruc`, `razonSocial`, `estado`, `datosSunat`, `scoreRiesgo`
- **Relaciones**: Vehículos, conductores, rutas, resoluciones

### 🚗 Vehículo
- **Propósito**: Vehículos autorizados para transporte de pasajeros y carga
- **Campos clave**: `placa`, `marca`, `modelo`, `capacidad`, `estado`
- **Relaciones**: Empresa propietaria, TUCs, rutas autorizadas

### 👨‍💼 Conductor
- **Propósito**: Conductores autorizados para operar vehículos
- **Campos clave**: `dni`, `nombres`, `apellidos`, `licencia`, `estado`
- **Relaciones**: Empresa, vehículos asignados, historial de infracciones

### 🛣️ Ruta
- **Propósito**: Rutas autorizadas para el transporte
- **Campos clave**: `codigoRuta`, `origen`, `destino`, `distancia`, `tipoServicio`
- **Relaciones**: Empresas autorizadas, vehículos habilitados

### 📋 TUC (Tarjeta Única de Circulación)
- **Propósito**: Documento oficial que autoriza la circulación de un vehículo
- **Campos clave**: `numeroTuc`, `fechaEmision`, `fechaVencimiento`, `estado`
- **Relaciones**: Vehículo, empresa, rutas autorizadas

### 📄 Resolución
- **Propósito**: Documento administrativo que autoriza operaciones específicas
- **Campos clave**: `nroResolucion`, `fechaEmision`, `tipoTramite`, `estado`
- **Relaciones**: Empresa, expediente, vehículos autorizados

### 📁 Expediente
- **Propósito**: Conjunto de documentos y trámites para una solicitud
- **Campos clave**: `nroExpediente`, `fechaEmision`, `tipoTramite`, `estado`
- **🆕 Nuevo**: Sistema de seguimiento por oficina

### 🚨 Infracción
- **Propósito**: Registro de violaciones a las normas de transporte
- **Campos clave**: `codigoInfraccion`, `fechaInfraccion`, `gravedad`, `sancion`
- **Relaciones**: Vehículo, conductor, empresa, expediente

### 🔍 Fiscalización
- **Propósito**: Actividades de control y verificación en campo
- **Campos clave**: `fechaFiscalizacion`, `tipoFiscalizacion`, `resultado`
- **Relaciones**: Funcionario, vehículo, empresa, infracciones

## 🆕 Nueva Funcionalidad: Seguimiento de Expedientes por Oficina

### Propósito
Implementar trazabilidad completa de expedientes permitiendo conocer:
- **Dónde se encuentra** físicamente el expediente
- **Quién es el responsable** en cada oficina
- **Cuánto tiempo** permanecerá en cada oficina
- **Historial completo** de movimientos entre oficinas

### Tipos de Oficina
1. **RECEPCIÓN** → Recepción y validación inicial
2. **REVISION_TECNICA** → Análisis técnico de requisitos
3. **LEGAL** → Verificación de cumplimiento normativo
4. **FINANCIERA** → Verificación de pagos
5. **APROBACION** → Decisión final
6. **FISCALIZACION** → Control posterior
7. **ARCHIVO** → Almacenamiento final

### Niveles de Urgencia
- **NORMAL** → Procesamiento estándar
- **URGENTE** → Atención prioritaria
- **MUY_URGENTE** → Atención inmediata
- **CRITICO** → Máxima prioridad

## 🔧 Endpoints Principales

### Autenticación
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/refresh` - Renovación de token
- `POST /api/v1/auth/logout` - Cierre de sesión

### Empresas
- `GET /api/v1/empresas/` - Listar empresas
- `POST /api/v1/empresas/` - Crear empresa
- `GET /api/v1/empresas/{id}` - Obtener empresa
- `PUT /api/v1/empresas/{id}` - Actualizar empresa

### Vehículos
- `GET /api/v1/vehiculos/` - Listar vehículos
- `POST /api/v1/vehiculos/` - Crear vehículo
- `GET /api/v1/vehiculos/{id}` - Obtener vehículo
- `PUT /api/v1/vehiculos/{id}` - Actualizar vehículo

### TUCs
- `GET /api/v1/tucs/` - Listar TUCs
- `POST /api/v1/tucs/` - Crear TUC
- `GET /api/v1/tucs/{id}` - Obtener TUC
- `PUT /api/v1/tucs/{id}` - Actualizar TUC

### Resoluciones
- `GET /api/v1/resoluciones/` - Listar resoluciones
- `POST /api/v1/resoluciones/` - Crear resolución
- `GET /api/v1/resoluciones/{id}` - Obtener resolución
- `PUT /api/v1/resoluciones/{id}` - Actualizar resolución

### Expedientes
- `GET /api/v1/expedientes/` - Listar expedientes
- `POST /api/v1/expedientes/` - Crear expediente
- `GET /api/v1/expedientes/{id}` - Obtener expediente
- `PUT /api/v1/expedientes/{id}` - Actualizar expediente
- `POST /api/v1/expedientes/{id}/transferir` - Transferir a otra oficina

## 🚀 Estado del Desarrollo

### ✅ Completado
- Modelos de datos básicos con Pydantic
- API REST para todas las entidades principales
- Autenticación JWT con roles y permisos
- Validación robusta de datos
- Sistema de logging estructurado
- Documentación automática con Swagger

### 🔄 En Desarrollo
- Sistema de seguimiento por oficina
- Gestión de flujos de trabajo
- Notificaciones automáticas
- Reportes y métricas básicas

### 📋 Planificado
- Integración con sistemas externos (SUNAT, otros)
- Sistema de auditoría avanzado
- API GraphQL para consultas complejas
- Microservicios para funcionalidades específicas

## 🔒 Seguridad

- **JWT Tokens** con expiración configurable
- **CORS** configurado para frontend específico
- **Validación de datos** con Pydantic
- **Logging de auditoría** para todas las operaciones
- **Manejo de errores** estructurado

## 📊 Monitoreo y Logs

- **Health Check** endpoint para monitoreo
- **Logging estructurado** con diferentes niveles
- **Métricas de rendimiento** de endpoints
- **Trazabilidad** de todas las operaciones

## 🤝 Contribución

Ver [CONTRIBUTING.md](../CONTRIBUTING.md) para detalles sobre cómo contribuir al proyecto.

## 📚 Documentación Adicional

- **[📋 Brief Oficial del Sistema](../docs/BRIEF_SISTEMA_DRTC_PUNO.md)** - Documento de referencia para la lógica de negocio
- **[🔌 API Documentation](../docs/API.md)** - Especificaciones detalladas de la API
- **[🏢 Mejoras Empresas](../docs/MEJORAS_EMPRESAS.md)** - Funcionalidades específicas para gestión empresarial

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](../LICENSE) para más detalles. 
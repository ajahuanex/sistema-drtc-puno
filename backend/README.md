# Sistema de Gestión DRTC Puno - Backend

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
│   │   └── empresa.py         # Modelos de empresa
│   ├── services/
│   │   ├── __init__.py
│   │   ├── usuario_service.py # Lógica de negocio de usuarios
│   │   └── empresa_service.py # Lógica de negocio de empresas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth_router.py     # Endpoints de autenticación
│   │   └── empresas_router.py # Endpoints de empresas
│   └── utils/
│       ├── __init__.py
│       └── exceptions.py      # Excepciones personalizadas
├── requirements.txt            # Dependencias de Python
├── env.example               # Ejemplo de variables de entorno
└── README.md                 # Este archivo
```

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación:

1. **Registro**: `POST /api/v1/auth/register`
2. **Login**: `POST /api/v1/auth/login`
3. **Verificar usuario actual**: `GET /api/v1/auth/me`

### Ejemplo de uso:

```bash
# Registrar usuario
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "dni": "12345678",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }'

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=12345678&password=password123"
```

## 🏢 Endpoints de Empresas

### CRUD de Empresas:

- `GET /api/v1/empresas/` - Listar empresas
- `POST /api/v1/empresas/` - Crear empresa
- `GET /api/v1/empresas/{id}` - Obtener empresa por ID
- `GET /api/v1/empresas/ruc/{ruc}` - Obtener empresa por RUC
- `PUT /api/v1/empresas/{id}` - Actualizar empresa
- `DELETE /api/v1/empresas/{id}` - Desactivar empresa

### Ejemplo de creación de empresa:

```bash
curl -X POST "http://localhost:8000/api/v1/empresas/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ruc": "20123456789",
    "razon_social": {
      "principal": "Transportes El Veloz S.A.C.",
      "sunat": "TRANSPORTES EL VELOZ S.A.C.",
      "minimo": "TRANSPORTES EL VELOZ"
    },
    "direccion_fiscal": "Av. El Sol 123, Puno",
    "representante_legal": {
      "dni": "12345678",
      "nombres": "Juan Carlos Pérez"
    }
  }'
```

## 🔧 Configuración

### Variables de Entorno (.env)

```env
# Configuración de la aplicación
PROJECT_NAME=Sistema de Gestión DRTC Puno
VERSION=1.0.0
API_V1_STR=/api/v1
DEBUG=true

# Base de datos MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=drtc_puno_db

# Seguridad
SECRET_KEY=tu_clave_secreta_muy_larga_y_segura_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:4200"]
```

## 🧪 Testing

```bash
# Instalar dependencias de testing
pip install pytest pytest-asyncio httpx

# Ejecutar tests
pytest
```

## 📦 Despliegue

### Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

DRTC Puno - Dirección Regional de Transportes y Comunicaciones Puno 
# Sistema de Gestión DRTC Puno

Sistema integral de gestión para la Dirección Regional de Transportes y Comunicaciones de Puno, desarrollado con FastAPI (backend) y Angular 20 (frontend).

## 🏗️ Arquitectura del Sistema

### Backend (FastAPI)
- **Framework**: FastAPI con Python 3.10+
- **Base de Datos**: MongoDB (configurado con datos mock para desarrollo)
- **Autenticación**: JWT con bcrypt
- **Documentación**: Swagger UI automática

### Frontend (Angular 20)
- **Framework**: Angular 20 con componentes standalone
- **UI Framework**: Angular Material
- **Estado**: Signals y servicios reactivos
- **Rutas**: Lazy loading para optimización

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm
- Python 3.10+
- Git

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd transportes3
```

### 2. Configurar Backend
```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy env.example .env
# Editar .env con tus configuraciones
```

### 3. Configurar Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Las dependencias de Angular Material ya están incluidas
```

## 🏃‍♂️ Ejecución

### Backend
```bash
cd backend
venv\Scripts\Activate.ps1  # Windows
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**URLs del Backend:**
- API: http://localhost:8000
- Documentación: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Frontend
```bash
cd frontend
npm start
```

**URL del Frontend:**
- Aplicación: http://localhost:4200

## 🔐 Credenciales de Prueba

### Usuarios Mock Disponibles

| DNI | Contraseña | Rol | Descripción |
|-----|------------|-----|-------------|
| `12345678` | `password123` | Admin | Administrador del sistema |
| `87654321` | `password123` | Fiscalizador | Fiscalizador de campo |
| `11223344` | `password123` | Usuario | Usuario estándar |

## 📋 Funcionalidades Implementadas

### ✅ Autenticación y Autorización
- Login con DNI y contraseña
- JWT tokens para sesiones
- Roles de usuario (Admin, Fiscalizador, Usuario)
- Protección de rutas

### ✅ Gestión de Empresas
- Listado de empresas con filtros
- Creación de nuevas empresas
- Edición de datos empresariales
- Estados: HABILITADA, EN_TRAMITE, SUSPENDIDA
- Borrado lógico (soft delete)

### ✅ Dashboard Interactivo
- Estadísticas en tiempo real
- Acciones rápidas
- Empresas recientes
- Navegación intuitiva

### ✅ Datos Mock
- 3 empresas de ejemplo
- 3 usuarios de prueba
- Datos realistas para DRTC Puno

## 🔧 Estructura del Proyecto

```
transportes3/
├── backend/
│   ├── app/
│   │   ├── config/          # Configuración
│   │   ├── dependencies/    # Inyección de dependencias
│   │   ├── models/          # Modelos Pydantic
│   │   ├── routers/         # Endpoints API
│   │   ├── services/        # Lógica de negocio
│   │   └── utils/           # Utilidades
│   ├── requirements.txt
│   └── env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Componentes Angular
│   │   │   ├── models/      # Interfaces TypeScript
│   │   │   ├── services/    # Servicios HTTP
│   │   │   └── app.routes.ts
│   │   └── styles.css
│   └── package.json
└── README.md
```

## 🛠️ APIs Disponibles

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/register` - Registrar usuario
- `GET /api/v1/auth/me` - Obtener usuario actual

### Empresas
- `GET /api/v1/empresas/` - Listar empresas
- `POST /api/v1/empresas/` - Crear empresa
- `GET /api/v1/empresas/{id}` - Obtener empresa
- `PUT /api/v1/empresas/{id}` - Actualizar empresa
- `DELETE /api/v1/empresas/{id}` - Eliminar empresa
- `GET /api/v1/empresas/ruc/{ruc}` - Buscar por RUC

### Datos Mock
- `GET /api/v1/mock/info` - Información del sistema
- `GET /api/v1/mock/empresas` - Empresas mock
- `GET /api/v1/mock/credenciales` - Credenciales de prueba

## 🎨 Características del Frontend

### Diseño Responsivo
- Material Design 3
- Tema personalizado para DRTC Puno
- Componentes reutilizables
- Navegación intuitiva

### Componentes Principales
- **LoginComponent**: Autenticación con validaciones
- **DashboardComponent**: Panel principal con estadísticas
- **EmpresasComponent**: Gestión de empresas con tabla

### Servicios
- **AuthService**: Manejo de autenticación y tokens
- **EmpresaService**: Operaciones CRUD de empresas

## 🔍 Pruebas del Sistema

### 1. Verificar Backend
```bash
# Health check
curl http://localhost:8000/health

# Información del sistema
curl http://localhost:8000/

# Credenciales mock
curl http://localhost:8000/api/v1/mock/credenciales
```

### 2. Probar Autenticación
```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=12345678&password=password123"
```

### 3. Probar Empresas
```bash
# Listar empresas (requiere token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/empresas/
```

## 🚧 Próximas Funcionalidades

### Backend
- [ ] Gestión de vehículos
- [ ] Gestión de conductores
- [ ] Sistema de TUCs
- [ ] Fiscalizaciones
- [ ] Generación de QR codes
- [ ] Integración con APIs externas (RENIEC, SUNARP)

### Frontend
- [ ] Formularios de empresa
- [ ] Gestión de vehículos
- [ ] Gestión de conductores
- [ ] Sistema de fiscalizaciones
- [ ] Reportes y estadísticas
- [ ] Dashboard avanzado

## 🐛 Solución de Problemas

### Error de bcrypt
Si encuentras errores con bcrypt, el sistema ya incluye fallbacks para contraseñas mock.

### CORS Issues
El backend está configurado para aceptar requests desde `http://localhost:4200`.

### Puerto en Uso
Si el puerto 8000 está ocupado:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades:
- Crear un issue en el repositorio
- Documentar el problema con logs y pasos de reproducción

## 📄 Licencia

Este proyecto está desarrollado para la Dirección Regional de Transportes y Comunicaciones de Puno.

---

**Sistema DRTC Puno** - Desarrollado con FastAPI y Angular 20 
# Sistema DRTC Puno

Sistema de gestión integral para la Dirección Regional de Transportes y Comunicaciones de Puno.

## 📚 Documentación

- **[📋 Brief Oficial del Sistema](docs/BRIEF_SISTEMA_DRTC_PUNO.md)** - Documento de referencia para la lógica de negocio
- **[📋 Briefing Actualizado](docs/BRIEFING.md)** - Estado actual y cambios recientes implementados
- **[🔌 API Documentation](docs/API.md)** - Especificaciones de la API REST
- **[🏢 Mejoras Empresas](docs/MEJORAS_EMPRESAS.md)** - Funcionalidades específicas para gestión empresarial

## 🏗️ Arquitectura

- **Backend**: Python 3.10+ con FastAPI
- **Base de Datos**: MongoDB
- **Frontend Web**: Angular 20
- **Frontend Móvil**: Flutter (en desarrollo)

## 🚀 Instalación

### Prerrequisitos
- Python 3.10+
- Node.js 18+
- MongoDB
- Git

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
ng serve
```

## 📋 Funcionalidades

- Gestión de empresas de transporte
- Control de vehículos y TUCs
- **🆕 Seguimiento de expedientes por oficina**
- Fiscalización móvil
- Reportes y estadísticas
- Interoperabilidad con sistemas externos

## 🔄 Estado del Desarrollo

### ✅ Completado
- Modelos de datos básicos
- API REST para entidades principales
- Frontend Angular con componentes básicos
- Autenticación JWT

### 🔄 En Desarrollo
- Sistema de seguimiento por oficina
- Gestión de flujos de trabajo
- Notificaciones automáticas
- Reportes y métricas básicas

### 📋 Planificado
- Aplicación móvil Flutter
- Integración con sistemas externos
- Inteligencia artificial para optimización
- Dashboard ejecutivo avanzado

## 🤝 Contribución

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para detalles.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles. 
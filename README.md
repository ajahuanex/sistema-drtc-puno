# Sistema DRTC Puno

Sistema de gestión integral para la Dirección Regional de Transportes y Comunicaciones de Puno.

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
- Fiscalización móvil
- Reportes y estadísticas
- Interoperabilidad con sistemas externos

## 🤝 Contribución

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para detalles.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles. 
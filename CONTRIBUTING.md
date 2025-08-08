# Guía de Contribución - Sistema DRTC Puno

¡Gracias por tu interés en contribuir al Sistema DRTC Puno! Este documento te guiará en el proceso de contribución.

## 🚀 Cómo Contribuir

### 1. Fork del Repositorio

1. Ve a https://github.com/ajahuanex/sistema-drtc-puno
2. Haz clic en el botón "Fork" en la esquina superior derecha
3. Clona tu fork localmente:
   ```bash
   git clone https://github.com/TU_USUARIO/sistema-drtc-puno.git
   cd sistema-drtc-puno
   ```

### 2. Configurar el Entorno de Desarrollo

#### Backend (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
```

#### Frontend (Angular)
```bash
cd frontend
npm install
```

### 3. Crear una Rama para tu Feature

```bash
git checkout -b feature/nombre-de-tu-feature
```

### 4. Desarrollar tu Feature

- Sigue las mejores prácticas de Angular 20
- Mantén el código limpio y bien documentado
- Escribe tests cuando sea apropiado
- Asegúrate de que el código funcione tanto en desarrollo como en producción

### 5. Commit y Push

```bash
git add .
git commit -m "feat: descripción de tu feature"
git push origin feature/nombre-de-tu-feature
```

### 6. Crear un Pull Request

1. Ve a tu fork en GitHub
2. Haz clic en "Compare & pull request"
3. Describe tu contribución detalladamente
4. Envía el PR

## 📋 Estándares de Código

### Angular 20
- Usa componentes standalone
- Implementa Signals para el manejo de estado
- Usa `input()` y `output()` en lugar de decoradores
- Mantén `ChangeDetectionStrategy.OnPush`
- Usa el nuevo control flow (`@if`, `@for`)

### FastAPI
- Sigue las convenciones de FastAPI
- Documenta tus endpoints
- Maneja errores apropiadamente
- Usa tipos Pydantic para validación

### Git Commits
Usa el formato convencional:
- `feat:` para nuevas características
- `fix:` para correcciones de bugs
- `docs:` para documentación
- `style:` para cambios de formato
- `refactor:` para refactorización
- `test:` para tests
- `chore:` para tareas de mantenimiento

## 🐛 Reportar Bugs

1. Verifica que el bug no haya sido reportado ya
2. Crea un issue con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Información del sistema (OS, versiones, etc.)

## 💡 Solicitar Features

1. Verifica que la feature no haya sido solicitada ya
2. Crea un issue con:
   - Descripción detallada de la feature
   - Casos de uso
   - Beneficios esperados

## 📝 Documentación

- Mantén el README.md actualizado
- Documenta nuevas APIs
- Incluye ejemplos de uso
- Actualiza la documentación cuando cambies funcionalidades

## 🧪 Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
ng test
ng e2e
```

## 🔧 Configuración del Entorno

### Variables de Entorno
Copia `backend/env.example` a `backend/.env` y configura:
- `SECRET_KEY`: Clave secreta para JWT
- `DATABASE_URL`: URL de la base de datos
- `CORS_ORIGINS`: Orígenes permitidos para CORS

### Base de Datos
El proyecto usa datos mock por defecto. Para producción:
1. Configura MongoDB
2. Actualiza las variables de entorno
3. Ejecuta las migraciones

## 🤝 Código de Conducta

- Sé respetuoso con otros contribuyentes
- Mantén un ambiente inclusivo
- Ayuda a otros cuando puedas
- Reporta comportamiento inapropiado

## 📞 Contacto

- **Desarrollador Principal**: Juan Carlos Ajahuana
- **GitHub**: https://github.com/ajahuanex
- **Email**: ajahuana@hotmail.com

## 📄 Licencia

Este proyecto está desarrollado para la Dirección Regional de Transportes y Comunicaciones de Puno.

---

¡Gracias por contribuir al Sistema DRTC Puno! 🚀 
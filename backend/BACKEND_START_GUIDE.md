# 🚀 Guía de Inicio del Backend

## Inicio Rápido

### 1. Iniciar el Backend

```bash
cd backend
start-backend.bat
```

El backend se iniciará en: **http://localhost:8003**

### 2. Probar el Backend

```bash
cd backend
test-backend.bat
```

Este script verificará:
- ✅ Si el backend está corriendo
- ✅ Si responde correctamente
- 🌐 Abrirá la documentación de la API

---

## Verificación Manual

### Verificar si el puerto está en uso

```bash
netstat -ano | findstr ":8003"
```

### Probar endpoints manualmente

1. **Documentación Swagger**: http://localhost:8003/docs
2. **Documentación ReDoc**: http://localhost:8003/redoc
3. **Health Check**: http://localhost:8003/api/v1/health (si existe)

### Usando PowerShell

```powershell
# Verificar que el backend responde
Invoke-WebRequest -Uri "http://localhost:8003/docs" -Method HEAD

# Ver la respuesta completa
Invoke-RestMethod -Uri "http://localhost:8003/docs"
```

---

## Solución de Problemas

### El backend no inicia

1. **Verificar que Python está instalado**:
   ```bash
   python --version
   ```

2. **Verificar que el entorno virtual existe**:
   ```bash
   cd backend
   dir venv
   ```

3. **Crear el entorno virtual** (si no existe):
   ```bash
   python -m venv venv
   ```

4. **Instalar dependencias**:
   ```bash
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

### El puerto 8003 ya está en uso

1. **Encontrar el proceso**:
   ```bash
   netstat -ano | findstr ":8003"
   ```

2. **Matar el proceso** (reemplaza PID con el número del proceso):
   ```bash
   taskkill /PID <PID> /F
   ```

3. **O usar otro puerto**:
   ```bash
   uvicorn app.main:app --reload --port 8004
   ```

---

## Endpoints Principales

Una vez iniciado el backend, puedes acceder a:

| Endpoint | Descripción |
|----------|-------------|
| `/docs` | Documentación interactiva Swagger UI |
| `/redoc` | Documentación ReDoc |
| `/api/v1/auth/login` | Login de usuarios |
| `/api/v1/vehiculos` | CRUD de vehículos |
| `/api/v1/resoluciones` | CRUD de resoluciones |
| `/api/v1/empresas` | CRUD de empresas |

---

## Configuración del Puerto

El frontend está configurado para conectarse a: **http://localhost:8003**

Si cambias el puerto del backend, también debes actualizar:
- `frontend/src/environments/environment.ts`
- Cambiar `apiUrl: 'http://localhost:8003'` al nuevo puerto

---

## Logs y Debugging

El backend con `--reload` mostrará:
- ✅ Requests HTTP
- ⚠️ Errores y excepciones
- 🔄 Recargas automáticas al cambiar código

Para más detalles, revisa la consola donde ejecutaste `start-backend.bat`

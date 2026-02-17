# 🔧 Solución al Problema del Frontend

## 🎯 Problema Identificado

El frontend no muestra datos porque:
1. ✅ Las localidades están en MongoDB (108 registros)
2. ❌ El backend no está respondiendo correctamente
3. ❌ El frontend no puede obtener los datos

---

## 🚀 Solución Paso a Paso

### 1. Verificar MongoDB (CRÍTICO)

```bash
# Abrir MongoDB Compass
# O verificar que el servicio esté corriendo
```

**Verificación:**
- MongoDB Compass debe estar abierto y conectado
- Base de datos: `drtc_puno_db`
- Colección: `localidades` (108 documentos)

---

### 2. Reiniciar Backend Correctamente

#### Opción A: Desde CMD (Recomendado)

```cmd
# Terminal 1 - Detener proceso actual
taskkill /F /IM python.exe

# Esperar 2 segundos

# Terminal 2 - Iniciar backend
cd backend
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

#### Opción B: Desde PowerShell

```powershell
# Detener proceso
Get-Process python | Stop-Process -Force

# Iniciar backend
cd backend
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

**Verificación:**
Deberías ver algo como:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

### 3. Verificar que el Backend Responde

Abrir en navegador:
```
http://localhost:8000/docs
```

Deberías ver la documentación de FastAPI (Swagger UI).

---

### 4. Probar Endpoint de Localidades

#### Desde el navegador:
```
http://localhost:8000/api/v1/localidades
```

#### Desde PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/localidades" -Method GET
```

**Resultado esperado:**
- Si requiere auth: Error 401 (normal)
- Si funciona: JSON con 108 localidades

---

### 5. Verificar Login

Desde Swagger UI (`http://localhost:8000/docs`):

1. Buscar endpoint: `POST /api/v1/auth/login`
2. Click en "Try it out"
3. Ingresar:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
4. Click "Execute"
5. Copiar el `access_token`

---

### 6. Probar Localidades con Token

En Swagger UI:

1. Click en el botón "Authorize" (arriba a la derecha)
2. Pegar el token
3. Click "Authorize"
4. Buscar endpoint: `GET /api/v1/localidades`
5. Click "Try it out" → "Execute"

**Resultado esperado:** 108 localidades

---

### 7. Reiniciar Frontend

```bash
# Terminal 3
cd frontend
npm start
```

**Verificación:**
```
http://localhost:4200
```

---

### 8. Hacer Login en el Frontend

1. Ir a: `http://localhost:4200/login`
2. Usuario: `admin`
3. Contraseña: `admin123`
4. Click "Iniciar Sesión"

---

### 9. Verificar Localidades en Frontend

1. Ir a: `http://localhost:4200/localidades`
2. Deberías ver las 108 localidades

---

## 🐛 Si Aún No Funciona

### Problema: Backend no inicia

**Verificar:**
```bash
cd backend
python -c "import app.main"
```

Si hay error, revisar:
- Dependencias instaladas: `pip install -r requirements.txt`
- MongoDB corriendo
- Puerto 8000 libre

---

### Problema: Backend inicia pero no responde

**Verificar logs:**
Buscar errores en la terminal donde corre el backend.

**Errores comunes:**
- `Connection refused` → MongoDB no está corriendo
- `Authentication failed` → Credenciales de MongoDB incorrectas
- `Port already in use` → Puerto 8000 ocupado

---

### Problema: Frontend no muestra datos

**Verificar en DevTools (F12):**

1. **Console:**
   - Buscar errores en rojo
   - Buscar "401" o "403"

2. **Network:**
   - Buscar peticiones a `/api/v1/localidades`
   - Verificar status code
   - Verificar que incluye header `Authorization`

3. **Application → Local Storage:**
   - Verificar que existe `token`
   - Verificar que no es `null` o `undefined`

---

## 📋 Checklist de Verificación

- [ ] MongoDB corriendo
- [ ] Backend corriendo (puerto 8000)
- [ ] Backend responde en `/docs`
- [ ] Login funciona (obtiene token)
- [ ] Endpoint `/api/v1/localidades` funciona con token
- [ ] Frontend corriendo (puerto 4200)
- [ ] Usuario logueado en frontend
- [ ] Token guardado en localStorage
- [ ] Localidades se muestran en frontend

---

## 🎯 Comandos Rápidos

```bash
# Terminal 1 - MongoDB
# Abrir MongoDB Compass

# Terminal 2 - Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 3 - Frontend
cd frontend
npm start

# Navegador
http://localhost:4200/login
```

---

## 📞 Ayuda Adicional

Si después de seguir todos los pasos aún no funciona:

1. **Captura de pantalla** de:
   - Terminal del backend (logs)
   - DevTools → Console (errores)
   - DevTools → Network (peticiones)

2. **Verifica** que:
   - MongoDB tiene las 108 localidades
   - Backend está en el puerto correcto
   - Frontend está en el puerto correcto
   - No hay firewall bloqueando

---

**Fecha:** 08/02/2026  
**Estado:** Guía de solución  
**Siguiente paso:** Seguir los pasos 1-9 en orden

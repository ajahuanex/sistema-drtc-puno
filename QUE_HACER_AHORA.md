# 🎯 ¿Qué Hacer Ahora?

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🔧 PROBLEMA: Frontend no muestra datos                   ║
║                                                              ║
║     ✅ Datos en MongoDB: 108 localidades                     ║
║     ❌ Backend: No responde                                  ║
║     ❌ Frontend: No puede cargar datos                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🚀 ACCIÓN INMEDIATA (5 minutos)

### 1️⃣ Abrir 3 Terminales

```
Terminal 1: MongoDB
Terminal 2: Backend
Terminal 3: Frontend
```

---

### 2️⃣ Terminal 1 - MongoDB

```bash
# Abrir MongoDB Compass
# O verificar que esté corriendo
```

**Verificar:**
- Base de datos: `drtc_puno_db`
- Colección: `localidades` (108 docs)

---

### 3️⃣ Terminal 2 - Backend

```cmd
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Esperar a ver:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Verificar en navegador:**
```
http://localhost:8000/docs
```

Deberías ver Swagger UI.

---

### 4️⃣ Terminal 3 - Frontend

```cmd
cd frontend
npm start
```

**Esperar a ver:**
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on localhost:4200
```

---

### 5️⃣ Navegador - Login

```
1. Ir a: http://localhost:4200/login
2. Usuario: admin
3. Contraseña: admin123
4. Click "Iniciar Sesión"
```

---

### 6️⃣ Navegador - Localidades

```
1. Ir a: http://localhost:4200/localidades
2. Deberías ver 108 localidades
```

---

## 🐛 Si No Funciona

### Backend no inicia

```cmd
# Verificar MongoDB
tasklist | findstr mongod

# Si no está, abrir MongoDB Compass

# Reintentar backend
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

---

### Backend inicia pero no responde

```cmd
# Verificar puerto
netstat -ano | findstr :8000

# Matar proceso si está colgado
taskkill /F /IM python.exe

# Reiniciar
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

---

### Frontend no muestra datos

**Abrir DevTools (F12):**

1. **Console** → Buscar errores
2. **Network** → Buscar peticiones a `/api/v1/localidades`
3. **Application** → Local Storage → Verificar `token`

**Si hay error 401:**
- Hacer login nuevamente
- Verificar que el token se guarda

---

## 📊 Estado Actual

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ✅ MongoDB: 108 localidades importadas                     │
│  ✅ Scripts: Creados y funcionando                          │
│  ✅ Documentación: Completa                                 │
│                                                             │
│  ❌ Backend: Necesita reiniciarse                           │
│  ❌ Frontend: Esperando datos del backend                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Siguiente Paso

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  1. Abrir MongoDB Compass                                    ║
║                                                              ║
║  2. Abrir Terminal → cd backend                              ║
║     python -m uvicorn app.main:app --reload --port 8000      ║
║                                                              ║
║  3. Abrir Terminal → cd frontend                             ║
║     npm start                                                ║
║                                                              ║
║  4. Navegador → http://localhost:4200/login                  ║
║     Login: admin / admin123                                  ║
║                                                              ║
║  5. Ir a: http://localhost:4200/localidades                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 📚 Archivos de Ayuda

- `SOLUCION_PROBLEMA_FRONTEND.md` - Guía detallada
- `LOCALIDADES_LISTAS.md` - Estado de localidades
- `test_backend_simple.py` - Script de prueba

---

**¿Listo?** Sigue los pasos 1-6 y deberías ver las localidades. 🚀

---

**Fecha:** 08/02/2026  
**Tiempo estimado:** 5 minutos  
**Dificultad:** Baja

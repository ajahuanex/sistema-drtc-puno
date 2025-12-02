# ⚡ Inicio Rápido - 3 Pasos

## 🎯 Objetivo
Tener el sistema funcionando en menos de 5 minutos.

---

## 📋 Requisitos Previos

✅ Docker Desktop instalado y **CORRIENDO**  
✅ Python 3.8+ instalado  
✅ Node.js 18+ instalado  

---

## 🚀 3 Pasos para Iniciar

### Paso 1️⃣: Inicia Docker Desktop

1. Abre **Docker Desktop**
2. Espera a que el ícono esté verde
3. Verifica que diga "Docker Desktop is running"

### Paso 2️⃣: Inicia MongoDB

Abre una terminal y ejecuta:

```bash
docker-compose -f docker-compose.db-only.yml up -d
```

Espera 10 segundos y verifica:

```bash
docker ps
```

Debes ver: `drtc-mongodb-local`

### Paso 3️⃣: Inicia Backend y Frontend

**Terminal 1 (Backend):**
```bash
start-backend.bat
```

Espera a ver: `✅ Conectado a MongoDB exitosamente`

**Terminal 2 (Frontend):**
```bash
start-frontend.bat
```

Espera a ver: `✓ Compiled successfully`

---

## ✅ Verificación

Abre tu navegador:

- Frontend: http://localhost:4200
- Backend API: http://localhost:8000/docs

---

## 📝 Crear Datos

1. Ve a http://localhost:4200
2. Navega a "Empresas"
3. Click en "Nueva Empresa"
4. Llena el formulario
5. Guarda

¡Listo! Ya tienes datos en tu base de datos real.

---

## 🛑 Detener Todo

```bash
# Detener MongoDB
docker-compose -f docker-compose.db-only.yml down

# Detener Backend y Frontend
# Presiona Ctrl+C en cada terminal
```

---

## ❓ ¿Problemas?

### "Docker no está corriendo"
→ Abre Docker Desktop y espera a que inicie

### "No se encuentran datos"
→ Normal, la DB está vacía. Crea datos desde el frontend

### "Backend no inicia"
→ Verifica que MongoDB esté corriendo: `docker ps`

### "Frontend no carga"
→ Verifica que el backend esté corriendo: http://localhost:8000/health

---

## 📚 Más Información

- Guía completa: `GUIA_DESPLIEGUE_LOCAL.md`
- DB vacía: `SOLUCION_DB_VACIA.md`
- Resumen: `RESUMEN_DESPLIEGUE.md`

---

**¡Eso es todo!** 🎉

Sistema funcionando con base de datos real en 3 pasos.

# ⚡ Comandos Rápidos

## 🚀 Iniciar Sistema

```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm start

# Navegador
http://localhost:4200/login
```

---

## 🧪 Verificar Estado

```bash
# Verificar localidades
python verificar_localidades_actual.py

# Verificar backend
python test_backend_simple.py

# Verificar imports
python verificar_imports_backend.py
```

---

## 🔄 Sincronización

```bash
# Sincronizar localidades en rutas (manual)
cd backend
python scripts/sincronizar_localidades_en_rutas.py
```

---

## 🧹 Limpieza

```bash
# Limpiar duplicados
python limpiar_localidades_completo.py

# Importar localidades
python importar_localidades_puno_reales.py
```

---

## 🔍 Debug Frontend

```javascript
// En Console del navegador (F12)

// Test 1: Backend
fetch('http://localhost:8000/api/v1/localidades')
  .then(r => r.json())
  .then(data => console.log('Backend OK:', data.length))

// Test 2: Token
console.log('Token:', localStorage.getItem('token') ? 'Existe' : 'No existe')

// Test 3: Con token
const token = localStorage.getItem('token');
fetch('http://localhost:8000/api/v1/localidades', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('Con token OK:', data.length))
```

---

## 📊 Estado Rápido

```bash
# Ver todo el estado
python verificar_localidades_actual.py
python test_backend_simple.py

# Abrir test HTML
start test_frontend_localidades.html
```

---

## 🎯 Solución Rápida

```
Problema: Frontend no muestra localidades

Solución:
1. http://localhost:4200/login
2. admin / admin123
3. http://localhost:4200/localidades
4. F12 → Console → Ver errores
```

---

## 📚 Documentación

```
Inicio:          QUE_HACER_AHORA.md
Verificar:       VERIFICAR_AHORA.md
Backend:         BACKEND_CORREGIDO.md
Sincronización:  SINCRONIZACION_RESUMEN.md
Completo:        RESUMEN_SESION_FINAL.md
```

---

**Usa este archivo como referencia rápida** 🚀

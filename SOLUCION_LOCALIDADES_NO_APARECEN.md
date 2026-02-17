# 🔧 Solución: Localidades No Aparecen en Frontend

## 🎯 Problema

- ✅ Backend funcionando (182 localidades)
- ✅ API responde correctamente
- ❌ Frontend no muestra las localidades

---

## 🔍 Diagnóstico

### 1. Verificar Backend (HECHO ✅)
```bash
python test_backend_simple.py
```
**Resultado:** Backend OK - 182 localidades

### 2. Verificar Frontend

Abrir DevTools (F12) en el navegador y verificar:

#### A. Console (Errores)
Buscar mensajes de error en rojo.

#### B. Network (Peticiones)
1. Ir a tab "Network"
2. Filtrar por "localidades"
3. Verificar:
   - ¿Se hace la petición?
   - ¿Qué status code devuelve? (200, 401, 403, 500)
   - ¿Qué datos devuelve?

#### C. Application (LocalStorage)
1. Ir a tab "Application"
2. Expandir "Local Storage"
3. Click en `http://localhost:4200`
4. Verificar:
   - ¿Existe `token`?
   - ¿El token es válido? (no es `null` o `undefined`)

---

## 🚀 Soluciones Posibles

### Solución 1: No hay token (Error 401)

**Síntoma:** Network muestra error 401

**Solución:**
1. Ir a `http://localhost:4200/login`
2. Login: `admin` / `admin123`
3. Volver a `http://localhost:4200/localidades`

---

### Solución 2: Token inválido

**Síntoma:** Network muestra error 401 o 403

**Solución:**
1. Abrir DevTools → Application → Local Storage
2. Eliminar `token`
3. Hacer login nuevamente

---

### Solución 3: Servicio no carga datos

**Síntoma:** No hay peticiones en Network

**Solución:**
1. Abrir DevTools → Console
2. Escribir:
```javascript
// Verificar si el servicio está cargando
console.log('Verificando servicio...');

// Forzar recarga
location.reload();
```

---

### Solución 4: CORS bloqueando peticiones

**Síntoma:** Network muestra error CORS

**Solución:**
El backend ya tiene CORS configurado, pero verificar en `backend/app/config/settings.py`:
```python
BACKEND_CORS_ORIGINS: List[str] = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]
```

---

### Solución 5: Componente no inicializa

**Síntoma:** Console muestra errores de Angular

**Solución:**
1. Reiniciar frontend:
```bash
# Ctrl+C para detener
cd frontend
npm start
```

---

## 🧪 Test Rápido

### Opción 1: Archivo HTML
1. Abrir `test_frontend_localidades.html` en navegador
2. Click en "1. Probar Backend"
3. Debería mostrar 182 localidades

### Opción 2: Console del Navegador
1. Ir a `http://localhost:4200/localidades`
2. Abrir DevTools (F12) → Console
3. Escribir:
```javascript
fetch('http://localhost:8000/api/v1/localidades')
  .then(r => r.json())
  .then(data => console.log('Localidades:', data.length, data.slice(0, 3)))
```

Deberías ver: `Localidades: 182 [...]`

---

## 📊 Checklist de Verificación

- [ ] Backend corriendo (puerto 8000)
- [ ] Frontend corriendo (puerto 4200)
- [ ] Usuario logueado
- [ ] Token en LocalStorage
- [ ] Petición a `/api/v1/localidades` se hace
- [ ] Petición devuelve 200
- [ ] Datos llegan al frontend
- [ ] Componente renderiza los datos

---

## 🎯 Pasos Específicos

### 1. Verificar que estás logueado
```
http://localhost:4200/login
Usuario: admin
Contraseña: admin123
```

### 2. Ir a localidades
```
http://localhost:4200/localidades
```

### 3. Abrir DevTools (F12)

### 4. Verificar Console
Buscar errores o warnings.

### 5. Verificar Network
- Filtrar por "localidades"
- Ver si la petición se hace
- Ver el status code
- Ver la respuesta

### 6. Si no funciona, verificar LocalStorage
- Application → Local Storage
- Verificar `token`
- Si no existe o es inválido, hacer login nuevamente

---

## 🐛 Errores Comunes

### Error: "Cargando localidades..." infinito

**Causa:** El servicio está esperando datos que nunca llegan

**Solución:**
1. Verificar Network → ¿Se hace la petición?
2. Si no se hace → Problema en el componente
3. Si se hace pero falla → Problema de auth o backend

### Error: Lista vacía

**Causa:** Los datos llegan pero no se muestran

**Solución:**
1. Console → Escribir:
```javascript
// Ver el estado del componente
angular.getComponent(document.querySelector('app-localidades'))
```

### Error: 401 Unauthorized

**Causa:** No hay token o es inválido

**Solución:**
1. Hacer login nuevamente
2. Verificar que el token se guarda en LocalStorage

---

## 📞 Debug Avanzado

Si nada funciona, ejecutar en Console:

```javascript
// 1. Verificar backend
fetch('http://localhost:8000/api/v1/localidades')
  .then(r => r.json())
  .then(data => console.log('Backend OK:', data.length))
  .catch(e => console.error('Backend Error:', e));

// 2. Verificar token
console.log('Token:', localStorage.getItem('token') ? 'Existe' : 'No existe');

// 3. Verificar con token
const token = localStorage.getItem('token');
fetch('http://localhost:8000/api/v1/localidades', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('Con token OK:', data.length))
  .catch(e => console.error('Con token Error:', e));

// 4. Forzar recarga del componente
location.reload();
```

---

## ✅ Solución Más Probable

**El problema más común es que no estás logueado o el token expiró.**

**Solución rápida:**
1. Ir a `http://localhost:4200/login`
2. Login: `admin` / `admin123`
3. Ir a `http://localhost:4200/localidades`
4. Deberías ver las 182 localidades

---

**Fecha:** 08/02/2026  
**Estado:** Guía de solución  
**Siguiente paso:** Verificar login y token

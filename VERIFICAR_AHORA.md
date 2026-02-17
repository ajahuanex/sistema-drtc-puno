# 🔍 Verificar Ahora - Localidades

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ✅ Backend: Funcionando (182 localidades)                ║
║     ❌ Frontend: No muestra datos                            ║
║                                                              ║
║     Causa más probable: No estás logueado                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎯 ACCIÓN INMEDIATA (2 minutos)

### 1. Hacer Login
```
http://localhost:4200/login

Usuario: admin
Contraseña: admin123
```

### 2. Ir a Localidades
```
http://localhost:4200/localidades
```

### 3. Abrir DevTools (F12)
- Tab "Console" → Ver errores
- Tab "Network" → Ver peticiones
- Tab "Application" → Ver token

---

## 🧪 Test Rápido en Console

Abrir DevTools (F12) → Console → Pegar esto:

```javascript
// Test 1: Backend directo
fetch('http://localhost:8000/api/v1/localidades')
  .then(r => r.json())
  .then(data => console.log('✅ Backend OK:', data.length, 'localidades'))
  .catch(e => console.error('❌ Backend Error:', e));

// Test 2: Verificar token
const token = localStorage.getItem('token');
console.log('Token:', token ? '✅ Existe' : '❌ No existe');

// Test 3: Con token
if (token) {
  fetch('http://localhost:8000/api/v1/localidades', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => console.log('✅ Con token OK:', data.length))
    .catch(e => console.error('❌ Con token Error:', e));
}
```

---

## 📊 Qué Deberías Ver

### En Console:
```
✅ Backend OK: 182 localidades
Token: ✅ Existe
✅ Con token OK: 182
```

### En Network:
```
GET /api/v1/localidades
Status: 200 OK
Response: [182 localidades]
```

### En Application → Local Storage:
```
token: "eyJ0eXAiOiJKV1QiLCJhbGc..."
user: {"username":"admin",...}
```

---

## ❌ Si No Funciona

### Problema 1: No hay token
**Solución:** Hacer login

### Problema 2: Error 401
**Solución:** Token expiró, hacer login nuevamente

### Problema 3: No se hace petición
**Solución:** Reiniciar frontend
```bash
# Ctrl+C
cd frontend
npm start
```

---

## 🎯 Archivo de Test

Abrir en navegador:
```
test_frontend_localidades.html
```

Click en botones para probar.

---

## 📞 Siguiente Paso

1. ✅ Hacer login
2. ✅ Abrir DevTools
3. ✅ Ejecutar tests en Console
4. ✅ Ver qué falla
5. ✅ Aplicar solución

---

**¿Qué ves en Console cuando abres localidades?**


# 🔍 Diagnóstico - Problema de Login

## ⚠️ Problema Reportado
El login no funciona en el backend

## 🔧 Posibles Causas

### 1. **Backend no está ejecutándose**
```bash
# Verificar procesos
tasklist | findstr python

# Si no hay procesos, iniciar backend
cd backend
python main.py
```

### 2. **MongoDB no está conectado**
```bash
# Verificar MongoDB
mongosh --eval "db.adminCommand('ping')"

# Si no responde, iniciar MongoDB
# Windows: mongod
# Docker: docker-compose up -d mongodb
```

### 3. **No hay usuarios en la base de datos**
```bash
# Ejecutar script de diagnóstico
python diagnosticar_login.py

# Si no hay usuarios, crear uno
python backend/create_user.py
```

### 4. **Contraseña incorrecta**
- Verificar que la contraseña sea correcta
- Verificar que el usuario esté activo

### 5. **Token JWT expirado o inválido**
- Limpiar localStorage del navegador
- Intentar login nuevamente

---

## 🚀 Soluciones Rápidas

### Solución 1: Reiniciar Backend
```bash
# Detener procesos
taskkill /F /IM python.exe

# Esperar 2 segundos
timeout /t 2

# Iniciar backend
cd backend
python main.py
```

### Solución 2: Verificar Base de Datos
```bash
# Ejecutar diagnóstico
python diagnosticar_login.py

# Crear usuario de prueba si es necesario
python backend/create_user.py
```

### Solución 3: Limpiar Caché del Navegador
1. Abrir DevTools (F12)
2. Ir a Application → Local Storage
3. Eliminar todos los datos
4. Recargar la página
5. Intentar login nuevamente

### Solución 4: Verificar Logs
```bash
# Ver logs del backend
# Los logs deberían mostrar errores de autenticación

# Buscar errores en los logs
# Ejemplo: "DNI o contraseña incorrectos"
```

---

## 📋 Checklist de Verificación

- [ ] Backend está ejecutándose
- [ ] MongoDB está conectado
- [ ] Hay usuarios en la base de datos
- [ ] El usuario está activo
- [ ] La contraseña es correcta
- [ ] El navegador tiene caché limpio
- [ ] El token JWT es válido

---

## 🔐 Credenciales de Prueba

Si no tienes usuarios, crea uno con:
```bash
python backend/create_user.py
```

O manualmente en MongoDB:
```javascript
db.usuarios.insertOne({
  dni: "12345678",
  nombres: "Usuario",
  apellidos: "Prueba",
  email: "usuario@test.com",
  password_hash: "$2b$12$...", // Hash bcrypt
  rolId: "admin",
  estaActivo: true,
  fechaCreacion: new Date()
})
```

---

## 📊 Diagnóstico Automático

Ejecutar el script de diagnóstico:
```bash
python diagnosticar_login.py
```

Este script verificará:
1. ✅ Conexión a MongoDB
2. ✅ Colección de usuarios
3. ✅ Autenticación
4. ✅ Estado del backend

---

## 💡 Recomendaciones

1. **Usar el script de diagnóstico** para identificar el problema
2. **Revisar los logs** del backend para más detalles
3. **Verificar la base de datos** directamente con MongoDB
4. **Limpiar caché** del navegador regularmente
5. **Usar credenciales correctas** para el login

---

## 📞 Contacto

Si el problema persiste:
1. Ejecutar `diagnosticar_login.py`
2. Revisar los logs del backend
3. Verificar la base de datos
4. Contactar al equipo de desarrollo

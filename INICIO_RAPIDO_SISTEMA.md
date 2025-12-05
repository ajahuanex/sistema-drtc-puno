# 🚀 INICIO RÁPIDO - SISTEMA DRTC PUNO

## ✅ Estado: SISTEMA OPERATIVO

El sistema está completamente configurado y listo para usar.

---

## 🔐 Credenciales de Acceso

```
URL:        http://localhost:4200
DNI:        12345678
Contraseña: admin123
```

---

## ⚡ Verificación Rápida

Ejecuta este comando para verificar que todo esté funcionando:

```bash
python verificar_sistema_completo.py
```

Deberías ver:
```
✅ MongoDB: CONECTADO
✅ Backend: CORRIENDO
✅ Frontend: CORRIENDO
✅ Login: FUNCIONANDO
```

---

## 📊 Datos Disponibles

- **1 Usuario Administrador** (DNI: 12345678)
- **3 Empresas de Prueba**:
  - Transportes San Martín S.A.C. (RUC: 20123456789)
  - Empresa de Transportes Los Andes E.I.R.L. (RUC: 20987654321)
  - Transportes Titicaca S.R.L. (RUC: 20456789123)

---

## 🎯 Primeros Pasos

### 1. Acceder al Sistema
1. Abre http://localhost:4200
2. Ingresa DNI: `12345678` y Contraseña: `admin123`
3. Click en "Iniciar Sesión"

### 2. Ver Empresas
1. Click en menú "Empresas"
2. Verás las 3 empresas de prueba
3. Click en cualquier empresa para ver detalles

### 3. Crear un Vehículo
1. Click en menú "Vehículos"
2. Click en "Nuevo Vehículo"
3. Selecciona una empresa
4. Completa los datos (placa, marca, modelo, etc.)
5. Click en "Guardar"

### 4. Crear una Resolución
1. Click en menú "Resoluciones"
2. Click en "Nueva Resolución"
3. Selecciona tipo "PADRE"
4. Selecciona una empresa
5. Completa número, fechas, etc.
6. Click en "Guardar"

### 5. Crear una Ruta
1. Click en menú "Rutas"
2. Click en "Nueva Ruta"
3. Selecciona empresa y resolución (debe ser VIGENTE y PADRE)
4. Completa origen, destino, paradas
5. Click en "Guardar"

---

## 🔧 Scripts Útiles

### Verificar Sistema
```bash
python verificar_sistema_completo.py
```

### Verificar Login
```bash
python probar_login.py
```

### Ver Usuarios
```bash
python verificar_usuarios.py
```

### Ver Empresas
```bash
python verificar_empresas.py
```

### Recrear Usuario Admin
```bash
python crear_usuario_admin.py
```

### Recrear Empresas
```bash
python crear_datos_iniciales.py
```

---

## 🆘 Solución de Problemas

### No puedo hacer login
```bash
python crear_usuario_admin.py
python probar_login.py
```

### No veo empresas
```bash
python crear_datos_iniciales.py
```

### Backend no responde
```bash
# Reiniciar backend
stop-all-local.bat
start-backend.bat
```

### Frontend no carga
```bash
# Reiniciar frontend
cd frontend
npm start
```

---

## 📚 Documentación Completa

Para más información, consulta:
- **SISTEMA_LISTO.md** - Guía completa de uso
- **RESUMEN_FINAL_COMPLETO.md** - Resumen técnico completo

---

## ✨ ¡Listo para Usar!

El sistema está 100% operativo. Puedes empezar a:
- ✅ Registrar empresas de transporte
- ✅ Crear vehículos
- ✅ Emitir resoluciones
- ✅ Gestionar rutas
- ✅ Tramitar expedientes

**¡Bienvenido al Sistema DRTC Puno!** 🎉

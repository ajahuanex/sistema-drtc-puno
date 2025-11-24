# 📋 Guía de Prueba - Módulo de Expedientes

## 🎯 Objetivo
Probar la creación de expedientes en el sistema DRTC Puno

## ✅ Pre-requisitos
- ✅ Backend corriendo en `http://localhost:8000`
- ✅ Frontend corriendo en `http://localhost:4200`
- ✅ Base de datos poblada con datos iniciales
- ✅ 3 empresas disponibles en el sistema

## 🔐 Credenciales de Acceso

### Usuario Administrador
- **DNI:** `12345678`
- **Password:** `password123`
- **Rol:** Administrador del Sistema

### Usuario Fiscalizador
- **DNI:** `87654321`
- **Password:** `password123`
- **Rol:** Fiscalizador de Campo

## 📝 Pasos para Probar

### 1. Acceder al Sistema
1. Abre el navegador en `http://localhost:4200`
2. Inicia sesión con las credenciales del administrador
3. Verifica que el dashboard cargue correctamente

### 2. Navegar al Módulo de Expedientes
1. En el menú lateral, busca la opción **"Expedientes"**
2. Haz clic para acceder al listado de expedientes
3. Deberías ver 3 expedientes existentes:
   - E-0001-2025 (EN_PROCESO)
   - E-0002-2025 (EN_REVISION)
   - E-0003-2025 (APROBADO)

### 3. Crear un Nuevo Expediente

#### Opción A: Desde el Botón Principal
1. Haz clic en el botón **"Nuevo Expediente"** (botón azul con ícono +)
2. Se abrirá un modal/formulario

#### Datos del Expediente a Crear:
```
Número: 0004
Folio: 25
Fecha de Emisión: [Fecha actual]
Tipo de Trámite: PRIMIGENIA
Tipo de Solicitante: EMPRESA
Empresa: Seleccionar una de las 3 empresas disponibles
  - TRANSPORTES PUNO S.A.C. (RUC: 20123456789)
  - TURISMO TITICACA E.I.R.L. (RUC: 20234567890)
  - EXPRESO SUR ORIENTE S.R.L. (RUC: 20345678901)
Descripción: Solicitud de autorización primigenia para transporte de pasajeros
Observaciones: Expediente de prueba creado desde el frontend
Prioridad: ALTA
Urgencia: NORMAL
```

### 4. Verificar la Creación
1. Después de guardar, deberías ver un mensaje de éxito
2. El nuevo expediente debería aparecer en la lista
3. El número generado será: **E-0004-2025**

### 5. Verificar en el Backend
Ejecuta en PowerShell:
```powershell
curl "http://localhost:8000/api/v1/expedientes/"
```

Deberías ver 4 expedientes en la respuesta JSON.

### 6. Verificar en la Base de Datos
```powershell
docker exec drtc-mongodb mongosh -u admin -p password --authenticationDatabase admin drtc_puno_db --eval "db.expedientes.countDocuments({})"
```

Debería devolver: `4`

## 🧪 Casos de Prueba Adicionales

### Caso 1: Expediente de Renovación
```
Número: 0005
Tipo de Trámite: RENOVACION
Empresa: TRANSPORTES PUNO S.A.C.
Descripción: Renovación de autorización de transporte
```

### Caso 2: Expediente de Incremento
```
Número: 0006
Tipo de Trámite: INCREMENTO
Empresa: TURISMO TITICACA E.I.R.L.
Descripción: Incremento de flota vehicular
```

### Caso 3: Expediente de Sustitución
```
Número: 0007
Tipo de Trámite: SUSTITUCION
Empresa: EXPRESO SUR ORIENTE S.R.L.
Descripción: Sustitución de vehículos antiguos
```

## ✅ Validaciones a Verificar

### Validación de Número Único
1. Intenta crear un expediente con número duplicado (ej: 0001)
2. El sistema debe mostrar un error: "Número E-0001-2025 ya existe"

### Validación de Campos Requeridos
1. Intenta guardar sin completar campos obligatorios
2. El sistema debe resaltar los campos faltantes

### Validación de Empresa
1. Verifica que el selector de empresas muestre las 3 empresas
2. Verifica que se pueda buscar por RUC o razón social

## 🐛 Problemas Comunes

### Error: "No se pueden cargar las empresas"
**Solución:** Verifica que el backend esté corriendo y que las empresas estén en la BD
```powershell
curl "http://localhost:8000/api/v1/empresas/?skip=0&limit=10"
```

### Error: "Error de conexión"
**Solución:** Verifica que todos los contenedores estén corriendo
```powershell
docker-compose ps
```

### Error: "Unauthorized"
**Solución:** Vuelve a iniciar sesión con las credenciales correctas

## 📊 Endpoints Útiles

### Listar Expedientes
```bash
GET http://localhost:8000/api/v1/expedientes/
```

### Crear Expediente
```bash
POST http://localhost:8000/api/v1/expedientes/
Content-Type: application/json

{
  "numero": "0008",
  "folio": 30,
  "fechaEmision": "2025-11-23T23:00:00Z",
  "tipoTramite": "PRIMIGENIA",
  "tipoSolicitante": "EMPRESA",
  "empresaId": "[ID_DE_EMPRESA]",
  "descripcion": "Expediente de prueba",
  "prioridad": "MEDIA",
  "urgencia": "NORMAL"
}
```

### Listar Empresas
```bash
GET http://localhost:8000/api/v1/empresas/?skip=0&limit=10
```

## 📸 Capturas Esperadas

1. **Listado de Expedientes:** Tabla con 3-4 expedientes
2. **Modal de Creación:** Formulario con todos los campos
3. **Selector de Empresas:** Dropdown con 3 empresas
4. **Mensaje de Éxito:** Notificación verde "Expediente creado exitosamente"
5. **Nuevo Expediente en Lista:** Fila nueva con E-0004-2025

## ✨ Funcionalidades Adicionales a Probar

- [ ] Filtrar expedientes por tipo de trámite
- [ ] Filtrar expedientes por estado
- [ ] Filtrar expedientes por empresa
- [ ] Ordenar por fecha de emisión
- [ ] Ordenar por número de expediente
- [ ] Ver detalles de un expediente
- [ ] Editar un expediente existente
- [ ] Cambiar el estado de un expediente
- [ ] Agregar observaciones a un expediente

## 🎉 Resultado Esperado

Al finalizar las pruebas, deberías tener:
- ✅ Al menos 4 expedientes en el sistema
- ✅ Diferentes tipos de trámites probados
- ✅ Validaciones funcionando correctamente
- ✅ Integración frontend-backend funcionando
- ✅ Datos persistiendo en MongoDB

---

**Fecha de Prueba:** 23/11/2025  
**Sistema:** DRTC Puno - Gestión de Expedientes  
**Versión:** 1.0.0

# 🧪 Plan de Pruebas Ejecutable - Sistema de Vehículos

## 📊 Estado Detectado
- ✅ MongoDB Compass corriendo
- ✅ Node.js corriendo (puerto 16608)
- ✅ Python corriendo (puerto 20732)
- ✅ Backend refactorizado
- ✅ Frontend actualizado

---

## 🎯 Objetivo
Verificar que el sistema de vehículos simplificado funciona correctamente con la separación:
- **Vehiculo** → Datos administrativos
- **VehiculoData** → Datos técnicos

---

## ✅ CHECKLIST DE PRUEBAS

### 1️⃣ Verificación de Servicios (2 min)

```bash
# Verificar backend
curl http://localhost:8000/health

# Verificar frontend
curl http://localhost:4200
```

**Resultado esperado:**
- Backend responde con status 200
- Frontend carga correctamente

---

### 2️⃣ Prueba de API - VehiculoData (5 min)

#### A. Crear VehiculoData (Datos Técnicos)
```bash
# POST /api/vehiculos-solo
curl -X POST http://localhost:8000/api/vehiculos-solo \
  -H "Content-Type: application/json" \
  -d '{
    "placa_actual": "TEST-001",
    "marca": "TOYOTA",
    "modelo": "HIACE",
    "anio_fabricacion": 2020,
    "categoria": "M3",
    "numero_motor": "TEST1234567890",
    "vin": "TESTVIN1234567890",
    "combustible": "DIESEL",
    "numero_asientos": 15,
    "numero_pasajeros": 15,
    "numero_ejes": 2,
    "peso_seco": 2500,
    "peso_bruto": 4500,
    "longitud": 6.5,
    "ancho": 2.2,
    "altura": 2.8
  }'
```

**Resultado esperado:**
```json
{
  "id": "67890abcdef...",
  "placa_actual": "TEST-001",
  "marca": "TOYOTA",
  ...
}
```

**✅ Anotar el ID generado:** `_________________`

#### B. Buscar VehiculoData por placa
```bash
# GET /api/vehiculos-solo?placa=TEST-001
curl http://localhost:8000/api/vehiculos-solo?placa=TEST-001
```

**Resultado esperado:**
- Debe devolver el vehículo creado
- Verificar que todos los campos están presentes

---

### 3️⃣ Prueba de API - Vehiculo (5 min)

#### A. Crear Vehículo Administrativo
```bash
# POST /api/vehiculos
curl -X POST http://localhost:8000/api/vehiculos \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "TEST-001",
    "vehiculoDataId": "[ID_DEL_PASO_2A]",
    "empresaActualId": "[ID_DE_UNA_EMPRESA]",
    "tipoServicio": "TRANSPORTE INTERPROVINCIAL",
    "estado": "ACTIVO",
    "sedeRegistro": "PUNO",
    "observaciones": "Vehículo de prueba"
  }'
```

**Resultado esperado:**
```json
{
  "id": "12345abcdef...",
  "placa": "TEST-001",
  "vehiculoDataId": "67890abcdef...",
  "empresaActualId": "...",
  "tipoServicio": "TRANSPORTE INTERPROVINCIAL",
  "estado": "ACTIVO"
}
```

#### B. Obtener Vehículo con Datos Técnicos
```bash
# GET /api/vehiculos/[ID_VEHICULO]
curl http://localhost:8000/api/vehiculos/[ID_DEL_PASO_3A]
```

**Resultado esperado:**
- Debe incluir datos administrativos
- Debe incluir `datosTecnicos` obtenidos de VehiculoData

---

### 4️⃣ Prueba de Frontend (10 min)

#### A. Crear VehiculoData desde UI
1. Abrir: `http://localhost:4200/vehiculos-solo/nuevo`
2. Llenar formulario:
   - Placa: `UI-TEST-001`
   - Marca: `MERCEDES`
   - Modelo: `SPRINTER`
   - Año: 2021
   - Motor: `UI1234567890`
   - VIN: `UIVIN1234567890`
   - Categoría: `M2`
   - Combustible: `DIESEL`
   - Asientos: 20
3. Click "Guardar"
4. **✅ Verificar:** Mensaje de éxito
5. **✅ Anotar ID:** `_________________`

#### B. Crear Vehículo desde UI
1. Abrir: `http://localhost:4200/vehiculos/nuevo`
2. Ingresar placa: `UI-TEST-001`
3. **✅ Verificar:** Sistema busca automáticamente
4. **✅ Verificar:** Muestra "Datos técnicos encontrados"
5. **✅ Verificar:** Muestra "MERCEDES SPRINTER (2021) - M2"
6. Completar:
   - Empresa: Seleccionar una
   - Tipo Servicio: TRANSPORTE INTERPROVINCIAL
   - Estado: ACTIVO
7. Click "Guardar"
8. **✅ Verificar:** Mensaje de éxito

#### C. Ver Detalle del Vehículo
1. Ir a lista: `http://localhost:4200/vehiculos`
2. Buscar `UI-TEST-001`
3. Click "Ver Detalle"
4. **✅ Verificar:**
   - Muestra datos administrativos
   - Muestra datos técnicos
   - No hay duplicación

---

### 5️⃣ Prueba de Validaciones (5 min)

#### A. Placa sin datos técnicos
1. Ir a: `http://localhost:4200/vehiculos/nuevo`
2. Ingresar placa: `NO-EXISTE-999`
3. **✅ Verificar:** Mensaje "Vehículo no encontrado"
4. **✅ Verificar:** Botón "Crear Datos Técnicos" aparece
5. **✅ Verificar:** Botón "Guardar" deshabilitado

#### B. Campos requeridos
1. Intentar guardar sin llenar campos
2. **✅ Verificar:** Errores de validación
   - "La placa es requerida"
   - "La empresa es requerida"
   - "El tipo de servicio es requerido"

---

### 6️⃣ Prueba de Compatibilidad Legacy (5 min)

#### A. Vehículos antiguos
1. Abrir un vehículo existente (creado antes de la refactorización)
2. **✅ Verificar:** Se muestra correctamente
3. **✅ Verificar:** Edición funciona
4. **✅ Verificar:** No hay errores en consola

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: Backend no responde
**Solución:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Problema 2: Frontend no carga
**Solución:**
```bash
cd frontend
npm start
```

### Problema 3: Error "vehiculoDataId no encontrado"
**Solución:**
- Verificar que el ID existe en VehiculoData
- Verificar que el ID es correcto (ObjectId de MongoDB)

### Problema 4: Error "empresa no encontrada"
**Solución:**
- Crear al menos una empresa primero
- Verificar que la empresa está activa

---

## 📊 Criterios de Éxito

| Prueba | Estado | Notas |
|--------|--------|-------|
| Servicios corriendo | ⬜ | Backend + Frontend + MongoDB |
| API VehiculoData funciona | ⬜ | POST, GET, búsqueda |
| API Vehiculo funciona | ⬜ | POST, GET, JOIN con VehiculoData |
| UI VehiculoData funciona | ⬜ | Crear, editar, listar |
| UI Vehiculo funciona | ⬜ | Búsqueda automática, crear |
| Validaciones funcionan | ⬜ | Campos requeridos, placa no existe |
| Compatibilidad legacy | ⬜ | Vehículos antiguos funcionan |

---

## 🚀 Siguiente Paso

Una vez completadas todas las pruebas:
1. ✅ Marcar todas las casillas
2. 📝 Documentar problemas encontrados
3. 🔧 Corregir errores si los hay
4. 🎉 Sistema listo para producción

---

## 📞 Comandos Útiles

```bash
# Ver logs del backend
cd backend
tail -f logs/app.log

# Ver logs del frontend (consola del navegador)
F12 → Console

# Verificar MongoDB
# Abrir MongoDB Compass
# Conectar a: mongodb://localhost:27017
# Ver colecciones: vehiculos, vehiculo_solo

# Reiniciar servicios
# Backend: Ctrl+C → uvicorn app.main:app --reload
# Frontend: Ctrl+C → npm start
```

---

**Tiempo estimado total:** 30-40 minutos
**Dificultad:** Media
**Requisitos:** Backend, Frontend, MongoDB corriendo

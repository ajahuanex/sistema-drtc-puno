# 🧪 Prueba del Sistema de Vehículos Simplificado

## 📋 Checklist de Pruebas

### 1. Preparación
- [ ] Backend corriendo en `http://localhost:8000`
- [ ] Frontend corriendo en `http://localhost:4200`
- [ ] Base de datos MongoDB activa
- [ ] Al menos 1 empresa creada
- [ ] Al menos 1 VehiculoData (datos técnicos) creado

### 2. Prueba de Creación de Vehículo

#### Paso 1: Crear Datos Técnicos (VehiculoData)
1. Ir a `/vehiculos-solo/nuevo`
2. Llenar formulario con datos técnicos:
   - Placa: `ABC-123`
   - Marca: `TOYOTA`
   - Modelo: `HIACE`
   - Año: `2020`
   - Motor: `1234567890`
   - VIN/Chasis: `ABCD1234567890123`
   - Categoría: `M3`
   - Combustible: `DIESEL`
   - Asientos: `15`
   - Ejes: `2`
3. Guardar y anotar el ID generado

#### Paso 2: Crear Vehículo Administrativo
1. Ir a `/vehiculos/nuevo`
2. Ingresar placa: `ABC-123`
3. Sistema debe:
   - ✅ Buscar automáticamente en VehiculoData
   - ✅ Mostrar mensaje "Datos técnicos encontrados"
   - ✅ Mostrar resumen: TOYOTA HIACE (2020) - M3
4. Completar campos administrativos:
   - Empresa: Seleccionar una empresa
   - Tipo de Servicio: Seleccionar (ej: "TRANSPORTE INTERPROVINCIAL")
   - Resolución: (Opcional)
   - Estado: ACTIVO
   - Rutas: (Opcional)
   - Observaciones: "Vehículo de prueba"
5. Click en "Guardar"

#### Resultado Esperado:
```json
{
  "id": "...",
  "placa": "ABC-123",
  "vehiculoDataId": "...",  // ✅ Referencia a VehiculoData
  "empresaActualId": "...",
  "tipoServicio": "TRANSPORTE INTERPROVINCIAL",
  "estado": "ACTIVO",
  "observaciones": "Vehículo de prueba"
}
```

### 3. Prueba de Edición

1. Ir a lista de vehículos `/vehiculos`
2. Click en "Editar" del vehículo creado
3. Cambiar:
   - Estado: MANTENIMIENTO
   - Observaciones: "En mantenimiento preventivo"
4. Guardar
5. Verificar que los cambios se guardaron

### 4. Prueba de Visualización

1. Ir a detalle del vehículo
2. Verificar que se muestran:
   - ✅ Datos administrativos (empresa, tipo servicio, estado)
   - ✅ Datos técnicos (marca, modelo, motor, chasis)
   - ✅ Los datos técnicos vienen de VehiculoData

### 5. Prueba de Validaciones

#### Caso 1: Placa sin datos técnicos
1. Ir a `/vehiculos/nuevo`
2. Ingresar placa que NO existe: `XYZ-999`
3. Sistema debe:
   - ❌ Mostrar "Vehículo no encontrado en datos técnicos"
   - ❌ Mostrar botón "Crear Datos Técnicos"
   - ❌ Deshabilitar botón "Guardar"

#### Caso 2: Campos requeridos
1. Intentar guardar sin llenar campos obligatorios
2. Sistema debe mostrar errores:
   - "La placa es requerida"
   - "La empresa es requerida"
   - "El tipo de servicio es requerido"

### 6. Prueba de Compatibilidad Legacy

1. Verificar que vehículos antiguos (con datos técnicos duplicados) siguen funcionando
2. Abrir un vehículo antiguo en edición
3. Verificar que se muestra correctamente

## 🐛 Problemas Conocidos a Verificar

- [ ] ¿El backend acepta `vehiculoDataId`?
- [ ] ¿El backend acepta `tipoServicio`?
- [ ] ¿Los campos legacy siguen funcionando?
- [ ] ¿La búsqueda por placa funciona?
- [ ] ¿El formulario valida correctamente?

## 📊 Datos de Prueba

### VehiculoData de Prueba
```json
{
  "placa_actual": "ABC-123",
  "marca": "TOYOTA",
  "modelo": "HIACE",
  "anio_fabricacion": 2020,
  "categoria": "M3",
  "numero_motor": "1234567890",
  "vin": "ABCD1234567890123",
  "combustible": "DIESEL",
  "numero_asientos": 15,
  "numero_pasajeros": 15,
  "numero_ejes": 2,
  "peso_seco": 2500,
  "peso_bruto": 4500,
  "longitud": 6.5,
  "ancho": 2.2,
  "altura": 2.8
}
```

### Vehículo Administrativo de Prueba
```json
{
  "placa": "ABC-123",
  "vehiculoDataId": "...",
  "empresaActualId": "...",
  "tipoServicio": "TRANSPORTE INTERPROVINCIAL",
  "estado": "ACTIVO",
  "observaciones": "Vehículo de prueba"
}
```

## ✅ Criterios de Éxito

1. ✅ Vehículo se crea correctamente
2. ✅ Búsqueda automática por placa funciona
3. ✅ Datos técnicos se muestran desde VehiculoData
4. ✅ No hay duplicación de datos
5. ✅ Validaciones funcionan correctamente
6. ✅ Edición funciona sin problemas
7. ✅ Compatibilidad con código legacy

## 🚀 Comandos para Iniciar

### Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm start
# o
ng serve
```

## 📝 Notas

- El sistema ahora separa claramente datos técnicos (VehiculoData) de datos administrativos (Vehiculo)
- `vehiculoDataId` es la referencia que conecta ambos módulos
- Los datos técnicos se obtienen mediante JOIN/lookup cuando se necesitan
- El formulario simplificado solo maneja campos administrativos

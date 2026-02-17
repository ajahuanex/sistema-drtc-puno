# 🚀 Guía Rápida de Prueba - Sistema de Vehículos Simplificado

## ✅ REFACTORIZACIÓN COMPLETADA

### 📊 Estado Actual

**Build:** ✅ EXITOSO (0 errores)  
**Backend:** ✅ Modelo actualizado  
**Frontend:** ✅ Componentes actualizados  
**Compatibilidad:** ✅ Código legacy funciona  

---

## 🎯 Arquitectura Nueva

```
┌──────────────────────────────────────────────────────────┐
│                    VEHICULO (Admin)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │ • placa: "ABC-123"                                 │  │
│  │ • vehiculoDataId: "507f1f77bcf86cd799439011" ─────┼──┼─┐
│  │ • empresaActualId: "..."                           │  │ │
│  │ • tipoServicio: "TRANSPORTE INTERPROVINCIAL"       │  │ │
│  │ • resolucionId: "..." (opcional)                   │  │ │
│  │ • rutasAsignadasIds: [...]                         │  │ │
│  │ • estado: "ACTIVO"                                 │  │ │
│  │ • observaciones: "..."                             │  │ │
│  └────────────────────────────────────────────────────┘  │ │
└──────────────────────────────────────────────────────────┘ │
                                                             │
                                    Referencia               │
                                                             ▼
┌──────────────────────────────────────────────────────────────┐
│              VEHICULO_DATA (Datos Técnicos)                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ _id: "507f1f77bcf86cd799439011"                       │  │
│  │ placa_actual: "ABC-123"                               │  │
│  │ marca: "TOYOTA"                                       │  │
│  │ modelo: "HIACE"                                       │  │
│  │ anio_fabricacion: 2020                                │  │
│  │ numero_motor: "1234567890"                            │  │
│  │ vin: "ABCD1234567890123"                              │  │
│  │ categoria: "M3"                                       │  │
│  │ combustible: "DIESEL"                                 │  │
│  │ numero_asientos: 15                                   │  │
│  │ numero_ejes: 2                                        │  │
│  │ peso_seco: 2500                                       │  │
│  │ peso_bruto: 4500                                      │  │
│  │ longitud: 6.5, ancho: 2.2, altura: 2.8               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧪 Pasos para Probar

### 1️⃣ Iniciar Servicios

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
# o
ng serve
```

### 2️⃣ Crear Datos Técnicos (VehiculoData)

1. Abrir navegador: `http://localhost:4200`
2. Login con tus credenciales
3. Ir a: **Vehículos Solo** → **Nuevo**
4. Llenar formulario:
   ```
   Placa: TEST-001
   Marca: TOYOTA
   Modelo: HIACE
   Año: 2020
   Motor: TEST1234567890
   VIN/Chasis: TESTVIN1234567890
   Categoría: M3
   Combustible: DIESEL
   Asientos: 15
   Pasajeros: 15
   Ejes: 2
   Peso Seco: 2500
   Peso Bruto: 4500
   Longitud: 6.5
   Ancho: 2.2
   Altura: 2.8
   ```
5. **Guardar** ✅
6. **Anotar el ID** que aparece en la URL

### 3️⃣ Crear Vehículo Administrativo

1. Ir a: **Vehículos** → **Nuevo**
2. Ingresar placa: `TEST-001`
3. **Esperar** - El sistema buscará automáticamente
4. Debe aparecer:
   ```
   ✅ Datos técnicos encontrados
   TOYOTA HIACE (2020) - M3
   ```
5. Completar campos:
   ```
   Empresa: [Seleccionar una empresa]
   Tipo de Servicio: TRANSPORTE INTERPROVINCIAL
   Estado: ACTIVO
   Observaciones: Prueba del sistema simplificado
   ```
6. **Guardar** ✅

### 4️⃣ Verificar Resultado

1. Ir a lista de vehículos
2. Buscar `TEST-001`
3. Click en **Ver Detalle**
4. Verificar que se muestran:
   - ✅ Datos administrativos (empresa, tipo servicio)
   - ✅ Datos técnicos (marca, modelo, motor)
   - ✅ Todo desde una sola vista

---

## 🔍 Qué Verificar

### ✅ Funcionalidades Nuevas

- [ ] Búsqueda automática por placa funciona
- [ ] Muestra datos técnicos encontrados
- [ ] No permite guardar sin datos técnicos
- [ ] Botón "Crear Datos Técnicos" aparece si no existe
- [ ] Campo `tipoServicio` se guarda correctamente
- [ ] Campo `vehiculoDataId` se guarda correctamente

### ✅ Validaciones

- [ ] Placa requerida
- [ ] Empresa requerida
- [ ] Tipo de servicio requerido
- [ ] No permite guardar sin vincular VehiculoData

### ✅ Compatibilidad

- [ ] Vehículos antiguos siguen funcionando
- [ ] Edición de vehículos existentes funciona
- [ ] Lista de vehículos muestra todos

---

## 🐛 Solución de Problemas

### Problema: "Vehículo no encontrado en datos técnicos"

**Solución:**
1. Verificar que la placa existe en VehiculoData
2. Verificar que la placa está escrita exactamente igual
3. Crear los datos técnicos primero

### Problema: "Error al guardar el vehículo"

**Solución:**
1. Abrir consola del navegador (F12)
2. Ver el error específico
3. Verificar que el backend está corriendo
4. Verificar que todos los campos requeridos están llenos

### Problema: No aparece el botón "Guardar"

**Solución:**
1. Verificar que se encontraron los datos técnicos
2. Verificar que todos los campos obligatorios están llenos
3. Refrescar la página

---

## 📊 Datos de Prueba Rápidos

### VehiculoData Mínimo
```json
{
  "placa_actual": "TEST-001",
  "marca": "TOYOTA",
  "modelo": "HIACE",
  "anio_fabricacion": 2020,
  "categoria": "M3",
  "numero_motor": "TEST123",
  "vin": "TESTVIN123",
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

### Vehículo Administrativo Mínimo
```json
{
  "placa": "TEST-001",
  "vehiculoDataId": "[ID del VehiculoData]",
  "empresaActualId": "[ID de una empresa]",
  "tipoServicio": "TRANSPORTE INTERPROVINCIAL",
  "estado": "ACTIVO"
}
```

---

## 🎉 Criterios de Éxito

✅ **Sistema Funcional** si:
1. Puedes crear VehiculoData
2. Puedes crear Vehículo vinculado
3. La búsqueda automática funciona
4. Los datos se muestran correctamente
5. No hay duplicación de datos técnicos

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs del backend
2. Revisar consola del navegador
3. Verificar que MongoDB está corriendo
4. Verificar que hay empresas creadas

---

## 🚀 Siguiente Paso

Una vez que la prueba funcione:
1. Migrar vehículos existentes (opcional)
2. Actualizar documentación
3. Capacitar usuarios
4. Monitorear sistema en producción

**¡El sistema está listo para usar!** 🎊

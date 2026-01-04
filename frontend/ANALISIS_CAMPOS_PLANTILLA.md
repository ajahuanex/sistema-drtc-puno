# 📊 Análisis de Campos - Plantilla vs Modelos de Datos

## 🎯 Objetivo
Analizar los 36 campos de la plantilla de carga masiva y determinar a qué modelo de datos pertenece cada uno, identificando posibles inconsistencias o campos que requieren relaciones entre modelos.

## 📋 Lista de 36 Campos de la Plantilla

### 1. **RUC Empresa** 
- **Modelo**: `Empresa`
- **Campo**: `empresa.ruc`
- **Relación**: ✅ Directo
- **Nota**: Se usa para buscar/crear la empresa

### 2. **Resolución Primigenia**
- **Modelo**: `Resolucion`
- **Campo**: `resolucion.nroResolucion` (tipo PADRE)
- **Relación**: ✅ Directo
- **Nota**: Resolución padre de la empresa

### 3. **DNI** ⚠️
- **Modelo**: `Empresa` 
- **Campo**: `empresa.representanteLegal.dni`
- **Relación**: ❌ **PROBLEMA** - No pertenece al vehículo
- **Nota**: Es del representante legal de la empresa

### 4. **Resolución Hija**
- **Modelo**: `Resolucion`
- **Campo**: `resolucion.nroResolucion` (tipo HIJO)
- **Relación**: ✅ Directo
- **Nota**: Resolución específica del vehículo

### 5. **Fecha Resolución**
- **Modelo**: `Resolucion`
- **Campo**: `resolucion.fechaEmision`
- **Relación**: ✅ Directo

### 6. **Tipo de Resolución**
- **Modelo**: `Resolucion`
- **Campo**: `resolucion.tipoTramite`
- **Relación**: ✅ Directo

### 7. **Placa de Baja** ⚠️
- **Modelo**: `Vehiculo` (histórico)
- **Campo**: No existe campo específico
- **Relación**: ❌ **PROBLEMA** - Lógica de negocio compleja
- **Nota**: Referencia a vehículo anterior en sustituciones

### 8. **Placa** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.placa`
- **Relación**: ✅ Directo - CAMPO OBLIGATORIO

### 9. **Marca** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.marca`
- **Relación**: ✅ Directo

### 10. **Modelo** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.modelo`
- **Relación**: ✅ Directo

### 11. **Año Fabricación** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.anioFabricacion`
- **Relación**: ✅ Directo

### 12. **Color** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.color`
- **Relación**: ✅ Directo

### 13. **Categoría** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.categoria`
- **Relación**: ✅ Directo

### 14. **Carroceria** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.carroceria`
- **Relación**: ✅ Directo

### 15. **Tipo Combustible** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.tipoCombustible`
- **Relación**: ✅ Directo

### 16. **Motor** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.motor`
- **Relación**: ✅ Directo

### 17. **Número Serie VIN** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.numeroSerie`
- **Relación**: ✅ Directo

### 18. **Numero de pasajeros** ⚠️
- **Modelo**: `Vehiculo`
- **Campo**: No existe campo específico
- **Relación**: ❌ **PROBLEMA** - Diferente de asientos
- **Nota**: Podría ser capacidad total vs asientos disponibles

### 19. **Asientos** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.asientos`
- **Relación**: ✅ Directo

### 20. **Cilindros** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.cilindros`
- **Relación**: ✅ Directo

### 21. **Ejes** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.ejes`
- **Relación**: ✅ Directo

### 22. **Ruedas** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.ruedas`
- **Relación**: ✅ Directo

### 23. **Peso Bruto (t)** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.pesoBruto`
- **Relación**: ✅ Directo

### 24. **Peso Neto (t)** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.pesoNeto`
- **Relación**: ✅ Directo

### 25. **Carga Útil (t)** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.cargaUtil`
- **Relación**: ✅ Directo (calculado)

### 26. **Largo (m)** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.medidas.largo`
- **Relación**: ✅ Directo

### 27. **Ancho (m)** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.medidas.ancho`
- **Relación**: ✅ Directo

### 28. **Alto (m)** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.medidas.alto`
- **Relación**: ✅ Directo

### 29. **Cilindrada** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.cilindrada`
- **Relación**: ✅ Directo

### 30. **Potencia (HP)** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.datosTecnicos.potencia`
- **Relación**: ✅ Directo

### 31. **Estado** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.estado`
- **Relación**: ✅ Directo

### 32. **Observaciones** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.observaciones`
- **Relación**: ✅ Directo

### 33. **Sede de Registro** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.sedeRegistro`
- **Relación**: ✅ Directo

### 34. **Expediente** ⚠️
- **Modelo**: `Expediente` (no revisado)
- **Campo**: Número de expediente
- **Relación**: ❌ **PROBLEMA** - Modelo no analizado
- **Nota**: Relacionado con resoluciones

### 35. **TUC** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.tuc.nroTuc`
- **Relación**: ✅ Directo

### 36. **Rutas Asignadas** ✅
- **Modelo**: `Vehiculo`
- **Campo**: `vehiculo.rutasAsignadasIds`
- **Relación**: ✅ Directo (array de IDs)

## 🚨 Problemas Identificados

### **Campos que NO pertenecen al modelo Vehiculo:**

#### 1. **DNI (Campo #3)**
- **Problema**: Es del representante legal de la empresa
- **Modelo correcto**: `Empresa.representanteLegal.dni`
- **Solución**: 
  - Usar para buscar/validar la empresa
  - No almacenar en el vehículo
  - Validar que coincida con la empresa del RUC

#### 2. **Placa de Baja (Campo #7)**
- **Problema**: Lógica de sustitución de vehículos
- **Modelo correcto**: Relación entre vehículos o resoluciones
- **Solución**:
  - Usar para lógica de sustitución
  - Relacionar con `BajaVehiculoResolucion`
  - No almacenar directamente en el vehículo

#### 3. **Numero de pasajeros (Campo #18)**
- **Problema**: No existe en el modelo actual
- **Diferencia**: `asientos` vs `pasajeros`
- **Solución**:
  - Agregar campo al modelo si es necesario
  - O usar `asientos` como equivalente
  - Clarificar la diferencia conceptual

#### 4. **Expediente (Campo #34)**
- **Problema**: Pertenece a otro modelo
- **Modelo correcto**: `Expediente`
- **Solución**:
  - Usar para relacionar con resoluciones
  - No almacenar en el vehículo directamente

### **Campos de otros modelos necesarios para relaciones:**

#### 5. **RUC Empresa (Campo #1)**
- **Uso**: Buscar/crear empresa
- **Relación**: `vehiculo.empresaActualId`

#### 6. **Resolución Primigenia/Hija (Campos #2, #4)**
- **Uso**: Buscar/crear resoluciones
- **Relación**: `vehiculo.resolucionId`

#### 7. **Fecha/Tipo Resolución (Campos #5, #6)**
- **Uso**: Datos de la resolución
- **No almacenar**: En el vehículo

## 📊 Resumen Estadístico

### **Distribución por Modelo:**
- **Vehiculo directo**: 26 campos (72%)
- **Empresa**: 2 campos (6%) - RUC, DNI
- **Resolucion**: 4 campos (11%) - Resoluciones, fecha, tipo
- **Expediente**: 1 campo (3%) - Número expediente
- **Lógica especial**: 3 campos (8%) - Placa baja, pasajeros, rutas

### **Estado de Implementación:**
- ✅ **Correctos**: 26 campos (72%)
- ⚠️ **Requieren análisis**: 6 campos (17%)
- ❌ **Problemáticos**: 4 campos (11%)

## 🔧 Recomendaciones de Implementación

### **1. Campos a procesar en carga masiva:**

#### **Vehiculo (almacenar directamente):**
```typescript
// Campos que van directo al modelo Vehiculo
const camposVehiculo = [
  'placa', 'marca', 'modelo', 'anioFabricacion', 'color', 
  'categoria', 'carroceria', 'numeroSerie', 'estado', 
  'observaciones', 'sedeRegistro'
];

const datosTecnicos = [
  'tipoCombustible', 'motor', 'asientos', 'cilindros', 
  'ejes', 'ruedas', 'pesoBruto', 'pesoNeto', 'cargaUtil',
  'largo', 'ancho', 'alto', 'cilindrada', 'potencia'
];

const tuc = ['nroTuc']; // de TUC
const rutas = ['rutasAsignadasIds']; // de Rutas Asignadas
```

#### **Relaciones (buscar/crear entidades):**
```typescript
// Campos para buscar/crear entidades relacionadas
const camposRelacion = {
  empresa: ['rucEmpresa', 'dni'], // Buscar empresa por RUC, validar DNI
  resolucion: ['resolucionPrimigenia', 'resolucionHija', 'fechaResolucion', 'tipoResolucion'],
  expediente: ['expediente'], // Buscar expediente
  sustitucion: ['placaBaja'] // Lógica de sustitución
};
```

### **2. Flujo de procesamiento recomendado:**

```typescript
async function procesarVehiculoCargaMasiva(fila: any[]) {
  // 1. Buscar/validar empresa por RUC
  const empresa = await buscarEmpresaPorRUC(fila.rucEmpresa);
  if (empresa && fila.dni) {
    validarDNIRepresentante(empresa, fila.dni);
  }
  
  // 2. Buscar/crear resoluciones
  const resolucion = await buscarResolucion(fila.resolucionHija || fila.resolucionPrimigenia);
  
  // 3. Procesar sustitución si hay placa de baja
  if (fila.placaBaja) {
    await procesarSustitucionVehiculo(fila.placaBaja, fila.placa);
  }
  
  // 4. Crear/actualizar vehículo
  const vehiculo = {
    ...camposDirectosVehiculo,
    empresaActualId: empresa.id,
    resolucionId: resolucion.id,
    datosTecnicos: { ...datosTecnicos },
    tuc: { nroTuc: fila.tuc }
  };
  
  return await crearOActualizarVehiculo(vehiculo);
}
```

### **3. Campos que requieren decisión:**

#### **Numero de pasajeros:**
- **Opción A**: Agregar al modelo `DatosTecnicos`
- **Opción B**: Usar `asientos` como equivalente
- **Opción C**: Calcular automáticamente

#### **Placa de baja:**
- **Opción A**: Implementar lógica de sustitución completa
- **Opción B**: Solo validar que existe el vehículo anterior
- **Opción C**: Ignorar en primera fase

## 🎯 Conclusiones

1. **La mayoría de campos (72%) pertenecen correctamente al modelo Vehiculo**
2. **Hay 4 campos problemáticos que requieren lógica especial**
3. **La carga masiva debe manejar relaciones entre múltiples modelos**
4. **Se necesita un procesador inteligente que identifique y relacione entidades**

### **Próximos pasos recomendados:**
1. ✅ Implementar procesamiento de campos directos del vehículo
2. ⚠️ Decidir sobre campos problemáticos (pasajeros, placa baja)
3. 🔄 Implementar búsqueda/validación de entidades relacionadas
4. 🧪 Probar con datos reales para validar el flujo completo

---

**Fecha**: Enero 2025  
**Análisis**: Plantilla 36 campos vs Modelos de datos  
**Estado**: 📊 Análisis completado - Requiere decisiones de implementación
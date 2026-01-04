# Funcionalidad Crear/Actualizar - Carga Masiva de Vehículos

## ✅ Funcionalidad Implementada

### 🎯 **Objetivo**
Permitir que la carga masiva **cree nuevos vehículos** o **actualice vehículos existentes** basándose en la placa.

## 🔧 Cambios Implementados

### 1. Validación Mejorada
**Antes**: Rechazaba placas duplicadas
```typescript
// ❌ Antes
if (placaExiste) {
  validacion.errores.push('Placa ya existe');
}
```

**Ahora**: Permite placas existentes para actualización
```typescript
// ✅ Ahora
if (placaValida) {
  validacion.advertencias.push('Si la placa existe, se actualizarán los datos del vehículo');
}
```

### 2. Método `cargaMasivaVehiculos()` Implementado
```typescript
cargaMasivaVehiculos(archivo: File): Observable<any> {
  // 1. Validar archivo
  // 2. Procesar vehículos válidos
  // 3. Para cada vehículo:
  //    - Si placa NO existe → CREAR
  //    - Si placa SÍ existe → ACTUALIZAR
  // 4. Retornar resultados detallados
}
```

### 3. Procesamiento Inteligente
```typescript
// Verificar si el vehículo existe
this.verificarPlacaDisponible(placa).subscribe(disponible => {
  if (disponible) {
    // CREAR nuevo vehículo
    this.createVehiculo(vehiculoData).subscribe(...)
  } else {
    // ACTUALIZAR vehículo existente
    this.obtenerVehiculoPorPlaca(placa).subscribe(vehiculoExistente => {
      const vehiculoActualizado = { ...vehiculoExistente, ...vehiculoData };
      this.updateVehiculo(vehiculoExistente.id, vehiculoActualizado).subscribe(...)
    })
  }
});
```

### 4. Resultados Detallados
```typescript
interface ResultadoCarga {
  total_procesados: number;
  exitosos: number;
  errores: number;
  vehiculos_creados: string[];      // ← NUEVO
  vehiculos_actualizados: string[]; // ← NUEVO
  errores_detalle: any[];
}
```

### 5. UI Actualizada
**Pantalla de Resultados**:
- ✅ **Vehículos Creados**: Contador y lista de placas
- ✅ **Vehículos Actualizados**: Contador y lista de placas
- ✅ **Errores**: Contador y detalles
- ✅ **Total Procesados**: Suma total

**Mensajes de Éxito**:
```
"Carga completada: 2 vehículos creados, 1 vehículo actualizado"
```

## 🎯 Flujo de Trabajo

### Escenario 1: Vehículos Nuevos
```
Excel: ABC-123, DEF-456 (no existen)
Resultado: 
- ✅ 2 Vehículos Creados: ABC-123, DEF-456
- 🔄 0 Vehículos Actualizados
```

### Escenario 2: Vehículos Existentes
```
Excel: ABC-123, DEF-456 (ya existen)
Resultado:
- ✅ 0 Vehículos Creados
- 🔄 2 Vehículos Actualizados: ABC-123, DEF-456
```

### Escenario 3: Mixto
```
Excel: ABC-123 (existe), DEF-456 (nuevo), GHI-789 (error)
Resultado:
- ✅ 1 Vehículo Creado: DEF-456
- 🔄 1 Vehículo Actualizado: ABC-123
- ❌ 1 Error: GHI-789
```

## 🔄 Lógica de Actualización

### Campos que se Actualizan
```typescript
const vehiculoActualizado = {
  ...vehiculoExistente,  // Mantiene datos existentes
  ...vehiculoData        // Sobrescribe con datos del Excel
};
```

### Campos Preservados
- `id`: ID único del vehículo
- `fechaCreacion`: Fecha original de creación
- `historial`: Historial de cambios

### Campos Actualizables
- Todos los campos técnicos (marca, modelo, año, etc.)
- Estado del vehículo
- Información de TUC
- Dimensiones y pesos
- Sede de registro
- Empresa y resolución asociadas

## 🧪 Casos de Prueba

### Prueba 1: Crear Vehículos Nuevos
```
Excel:
NUEVO-001,,,,,,,,,,,,,,,,,,,,,,LIMA,,
NUEVO-002,,,,,,,,,,,,,,,,,,,,,,AREQUIPA,,

Resultado Esperado:
✅ 2 Vehículos Creados: NUEVO-001, NUEVO-002
```

### Prueba 2: Actualizar Vehículos Existentes
```
Excel (con placas que ya existen):
EXIST-001,TOYOTA,HIACE,2024,,,,,,,,,,,,,,,,,,,CUSCO,,

Resultado Esperado:
🔄 1 Vehículo Actualizado: EXIST-001
(Marca cambia a TOYOTA, modelo a HIACE, año a 2024, sede a CUSCO)
```

### Prueba 3: Mixto
```
Excel:
EXIST-001,TOYOTA,HIACE,2024,,,,,,,,,,,,,,,,,,,CUSCO,,    (existe)
NUEVO-003,,,,,,,,,,,,,,,,,,,,,,LIMA,,                    (nuevo)
MALO-XXX,,,,,,,,,,,,,,,,,,,,,,SEDE-INEXISTENTE,,        (error)

Resultado Esperado:
✅ 1 Vehículo Creado: NUEVO-003
🔄 1 Vehículo Actualizado: EXIST-001
❌ 1 Error: MALO-XXX
```

## 📊 Beneficios

### Para Usuarios
1. **Flexibilidad**: Pueden actualizar vehículos existentes
2. **Eficiencia**: No necesitan eliminar y recrear vehículos
3. **Transparencia**: Ven claramente qué se creó vs qué se actualizó
4. **Seguridad**: Los datos existentes se preservan y solo se actualizan campos específicos

### Para el Sistema
1. **Integridad**: Mantiene IDs y relaciones existentes
2. **Historial**: Preserva el historial de cambios
3. **Rendimiento**: Actualización es más eficiente que eliminar/crear
4. **Auditoría**: Registro claro de qué cambió

## 🚀 Estado Actual

### ✅ Implementado
- Validación que permite placas existentes
- Método de carga masiva completo
- Lógica crear/actualizar
- UI con resultados detallados
- Mensajes de éxito específicos
- Estilos para nueva funcionalidad

### 🧪 Listo para Probar
1. Subir archivo con placas nuevas → Debe crear
2. Subir archivo con placas existentes → Debe actualizar
3. Subir archivo mixto → Debe mostrar ambos resultados

---

**Estado**: ✅ **COMPLETAMENTE IMPLEMENTADO**  
**Próxima acción**: Probar funcionalidad crear/actualizar
# Plan de Limpieza del Módulo de Vehículos

## 🔍 Problemas Identificados

### 1. Componentes Duplicados/Incompletos
- `vehiculo-historial-modal.component.ts` - **ELIMINAR** (archivo vacío)
- Múltiples componentes de cambio de estado que podrían consolidarse
- Componentes no exportados en index.ts

### 2. Servicios Duplicados
- `historial-vehiculo.service.ts` vs `vehiculo-historial.service.ts`
- Múltiples servicios especializados que podrían consolidarse

### 3. Inconsistencias de Nombres
- Servicios con nombres muy similares que causan confusión
- Modelos con nombres inconsistentes

## 📋 Acciones Recomendadas

### Fase 1: Eliminar Archivos Vacíos/Duplicados
1. **ELIMINAR**: `vehiculo-historial-modal.component.ts` (archivo vacío)
2. **REVISAR**: Servicios de historial duplicados
3. **CONSOLIDAR**: Componentes de cambio de estado

### Fase 2: Actualizar index.ts
1. Agregar componentes faltantes que se usan
2. Remover referencias a componentes eliminados
3. Organizar mejor las exportaciones

### Fase 3: Consolidar Servicios
1. Mantener `HistorialVehicularService` (más completo)
2. Evaluar consolidación de servicios especializados
3. Estandarizar nombres de servicios

### Fase 4: Verificar Dependencias
1. Actualizar imports en componentes
2. Verificar que no hay referencias rotas
3. Ejecutar build para confirmar

## 🎯 Componentes por Categoría

### Componentes Principales (Mantener)
- `vehiculos.component.ts` - Lista principal
- `vehiculo-modal.component.ts` - Modal de creación/edición
- `vehiculo-detalle.component.ts` - Vista de detalle
- `vehiculo-form.component.ts` - Formulario

### Componentes de Historial (Consolidar)
- ✅ `historial-vehicular.component.ts` - MANTENER
- ✅ `historial-detalle-modal.component.ts` - MANTENER
- ❌ `vehiculo-historial-modal.component.ts` - ELIMINAR

### Componentes de Estado (Revisar)
- `cambiar-estado-vehiculo-modal.component.ts` - Individual
- `cambiar-estado-bloque-modal.component.ts` - Masivo
- `vehiculo-estado-selector.component.ts` - Selector

### Componentes de Búsqueda (Mantener)
- `vehiculo-busqueda-avanzada.component.ts`
- `vehiculo-busqueda-global.component.ts`

### Componentes de Gestión (Mantener)
- `carga-masiva-vehiculos.component.ts`
- `solicitudes-baja.component.ts`
- `transferir-empresa-modal.component.ts`

### Componentes Especializados (Evaluar)
- `vehiculos-dashboard.component.ts`
- `vehiculos-estadisticas-avanzadas.component.ts`
- `vehiculos-reportes.component.ts`
- `keyboard-shortcuts-help.component.ts`
- `user-preferences-modal.component.ts`

## 🔧 Servicios por Categoría

### Servicios Principales (Mantener)
- ✅ `vehiculo.service.ts` - Servicio principal

### Servicios de Historial (Consolidar)
- ✅ `historial-vehicular.service.ts` - MANTENER (más usado)
- ❓ `historial-vehiculo.service.ts` - EVALUAR
- ❓ `vehiculo-historial.service.ts` - EVALUAR

### Servicios Especializados (Evaluar Consolidación)
- `vehiculo-busqueda.service.ts`
- `vehiculo-estado.service.ts`
- `vehiculo-notification.service.ts`
- `vehiculo-modal.service.ts`
- `vehiculo-keyboard-navigation.service.ts`
- `vehiculo-vencimiento.service.ts`

## ⚠️ Precauciones
1. Verificar que los componentes a eliminar no se usan en rutas
2. Comprobar imports en otros módulos
3. Ejecutar tests después de cada cambio
4. Mantener backup de archivos importantes
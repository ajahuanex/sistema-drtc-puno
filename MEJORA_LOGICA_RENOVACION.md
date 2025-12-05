# MEJORA: Lógica de Renovación vs Resoluciones Hijas

## Problema Actual

El formulario de resoluciones trata RENOVACIÓN e INCREMENTO de la misma manera, pidiendo una "Resolución Padre". Esto es conceptualmente incorrecto.

## Lógica Correcta

### 1. RENOVACIÓN (Reemplazo)
- **Concepto**: Una nueva resolución que REEMPLAZA/RENUEVA una anterior
- **Campo necesario**: "Resolución a Renovar" o "Resolución que Reemplaza"
- **Comportamiento**:
  - La resolución antigua se marca como `VENCIDA` o `RENOVADA`
  - La nueva resolución es independiente (tipo PADRE)
  - Hereda vehículos y rutas de la anterior (opcional)
- **Ejemplo**: R-0001-2025 (VENCIDA) → R-0007-2025 (RENOVACIÓN que la reemplaza)

### 2. INCREMENTO/SUSTITUCIÓN/OTROS (Resoluciones Hijas)
- **Concepto**: Resoluciones que COMPLEMENTAN o MODIFICAN una resolución padre
- **Campo necesario**: "Resolución Padre" (a la que está vinculada)
- **Comportamiento**:
  - La resolución padre sigue VIGENTE
  - La resolución hija está vinculada a la padre
  - Agrega vehículos/rutas adicionales o sustituye algunos
- **Ejemplo**: R-0001-2025 (PADRE) ← R-0008-2025 (HIJO de tipo INCREMENTO)

## Cambios Necesarios

### 1. Modelo de Datos

Agregar campo para diferenciar:
```typescript
interface Resolucion {
  // ... campos existentes
  
  // Para RENOVACIÓN
  resolucionRenovadaId?: string;  // ID de la resolución que esta renueva/reemplaza
  
  // Para HIJAS
  resolucionPadreId?: string;     // ID de la resolución padre (ya existe)
}
```

### 2. Formulario de Creación

**Cuando tipoTramite === 'RENOVACION':**
```html
<mat-form-field>
  <mat-label>Resolución a Renovar *</mat-label>
  <mat-select formControlName="resolucionRenovadaId">
    <!-- Mostrar resoluciones PADRE VIGENTES o VENCIDAS -->
  </mat-select>
  <mat-hint>Seleccione la resolución que será renovada/reemplazada</mat-hint>
</mat-form-field>
```

**Cuando tipoTramite === 'INCREMENTO' | 'SUSTITUCION' | 'OTROS':**
```html
<mat-form-field>
  <mat-label>Resolución Padre *</mat-label>
  <mat-select formControlName="resolucionPadreId">
    <!-- Mostrar solo resoluciones PADRE VIGENTES -->
  </mat-select>
  <mat-hint>Seleccione la resolución padre a la que estará vinculada</mat-hint>
</mat-form-field>
```

### 3. Lógica de Negocio

**Al crear RENOVACIÓN:**
```typescript
if (tipoTramite === 'RENOVACION' && resolucionRenovadaId) {
  // 1. Crear la nueva resolución (tipo PADRE)
  const nuevaResolucion = await crearResolucion({
    ...datos,
    tipoResolucion: 'PADRE',
    resolucionRenovadaId: resolucionRenovadaId
  });
  
  // 2. Marcar la anterior como RENOVADA
  await actualizarResolucion(resolucionRenovadaId, {
    estado: 'RENOVADA',
    renovadaPorId: nuevaResolucion.id
  });
  
  // 3. Opcionalmente heredar vehículos y rutas
  if (heredarVehiculos) {
    nuevaResolucion.vehiculosHabilitadosIds = resolucionAnterior.vehiculosHabilitadosIds;
  }
}
```

**Al crear INCREMENTO/etc:**
```typescript
if (tipoTramite === 'INCREMENTO' && resolucionPadreId) {
  // 1. Crear la resolución hija
  const resolucionHija = await crearResolucion({
    ...datos,
    tipoResolucion: 'HIJO',
    resolucionPadreId: resolucionPadreId
  });
  
  // 2. Actualizar la padre agregando esta hija
  await actualizarResolucion(resolucionPadreId, {
    $push: { resolucionesHijasIds: resolucionHija.id }
  });
}
```

## Estados de Resolución

Agregar nuevo estado:
```typescript
enum EstadoResolucion {
  VIGENTE = 'VIGENTE',
  VENCIDA = 'VENCIDA',
  RENOVADA = 'RENOVADA',  // ← NUEVO: Indica que fue renovada por otra
  SUSPENDIDA = 'SUSPENDIDA',
  REVOCADA = 'REVOCADA',
  DADA_DE_BAJA = 'DADA_DE_BAJA'
}
```

## Visualización

### En la lista de resoluciones:
```
R-0001-2025 [PADRE] RENOVADA → R-0007-2025
R-0007-2025 [PADRE] VIGENTE (Renueva a R-0001-2025)
R-0008-2025 [HIJO] VIGENTE (Padre: R-0007-2025)
```

### En el detalle de resolución:
```
Resolución: R-0007-2025
Tipo: PADRE
Estado: VIGENTE
Tipo de Trámite: RENOVACIÓN

📋 Renovación:
  ✓ Renueva a: R-0001-2025 (ahora RENOVADA)
  ✓ Heredó 5 vehículos
  ✓ Heredó 3 rutas
```

## Beneficios

1. ✅ **Claridad conceptual**: Diferencia clara entre renovar y crear hijas
2. ✅ **Trazabilidad**: Se puede seguir la cadena de renovaciones
3. ✅ **Validaciones correctas**: Renovar solo PADRE, hijas solo de PADRE VIGENTE
4. ✅ **Reportes precisos**: Saber qué resoluciones fueron renovadas y por cuál
5. ✅ **Herencia de datos**: Facilita copiar vehículos/rutas de la renovada

## Implementación Sugerida

### Fase 1: Backend
1. Agregar campo `resolucionRenovadaId` al modelo
2. Agregar estado `RENOVADA`
3. Implementar lógica de renovación en el servicio

### Fase 2: Frontend
1. Modificar formulario para diferenciar RENOVACIÓN vs HIJAS
2. Actualizar validaciones
3. Mejorar visualización de cadenas de renovación

### Fase 3: Migración de Datos
1. Script para identificar renovaciones existentes
2. Actualizar estados de resoluciones renovadas
3. Establecer relaciones correctas

## Notas

- Esta mejora no rompe la funcionalidad actual
- Se puede implementar gradualmente
- Mejora significativamente la claridad del sistema
- Facilita auditorías y reportes regulatorios

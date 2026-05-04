# Cambios en el Modelo de Datos de Resoluciones

## Resumen de Cambios

Se ha simplificado el modelo de resoluciones removiendo expedientes y descripción de la ecuación del componente, siguiendo el patrón de separación de responsabilidades usado con empresas.

### 1. Modelo `Resolucion` (resolucion.model.ts)

**Campos removidos:**
- `expedientesIds` - Las resoluciones no incluyen expedientes en el componente
- `descripcion` - La descripción se maneja en otro módulo

**Campos que permanecen:**
- `tipoTramite` - Tipo de trámite (PRIMIGENIA, RENOVACION, INCREMENTO, etc.)
- `tipoResolucion` - PADRE o HIJO
- `vehiculosHabilitadosIds` - IDs de vehículos
- `rutasAutorizadasIds` - IDs de rutas
- `usuarioEmisionId` - Usuario que emitió
- `ruc` - RUC de la empresa
- `observacionesList` - Lista de observaciones
- `resolucionesRenovadas` - Resoluciones que renovaron a esta

### 2. Interfaz `ResolucionCreate` (resolucion.model.ts)

**Cambios realizados:**
- Removido: `expedienteId`, `expedientesIds`, `descripcion`, `observaciones`
- Mantiene: Campos esenciales para crear una resolución

```typescript
export interface ResolucionCreate {
  nroResolucion: string;
  fechaEmision: Date;
  fechaVigenciaInicio?: Date;
  fechaVigenciaFin?: Date;
  aniosVigencia?: number;
  tipoResolucion: TipoResolucion;
  tipoTramite: TipoTramite;
  empresaId: string;
  resolucionPadreId?: string;
  usuarioEmisionId: string;
  vehiculosHabilitadosIds?: string[];
  rutasAutorizadasIds?: string[];
  // ... campos de bajas vehiculares
}
```

### 3. Servicio `ResolucionService` (resolucion.service.ts)

**Cambios realizados en `createResolucion()`:**
- Removido mapeo de `expedienteId` y `expedientesIds`
- Removido mapeo de `descripcion` y `observaciones`
- Simplificado el objeto `resolucionBackend`

### 4. Componentes Actualizados

#### CrearResolucionComponent
- ✓ Removido: Campo `expedienteId` del formulario
- ✓ Removido: Campo `descripcion` del formulario
- ✓ Removido: Campo `observaciones` del formulario
- ✓ Simplificado: Construcción de `ResolucionCreate`

#### ResolucionDetailComponent
- ✓ Removido: Sección de "Expediente Relacionado"
- ✓ Removido: Sección de "Descripción y Observaciones"
- ✓ Removido: Inyección de `ExpedienteService`
- ✓ Removido: Signal `expediente`
- ✓ Removido: Importación de `Expediente`

## Patrón de Separación de Responsabilidades

Siguiendo el mismo patrón que empresas:
- **Resoluciones**: Solo guardan `empresaId` (referencia), no datos completos
- **Expedientes**: Se manejan en su propio módulo
- **Descripción**: Se maneja en otro contexto

## Archivos Modificados

1. `frontend/src/app/models/resolucion.model.ts`
   - Removido `expedientesIds` de `Resolucion`
   - Removido `descripcion` de `Resolucion`
   - Simplificado `ResolucionCreate`

2. `frontend/src/app/services/resolucion.service.ts`
   - Simplificado `createResolucion()`
   - Removido mapeo de expedientes y descripción

3. `frontend/src/app/components/resoluciones/crear-resolucion.component.ts`
   - Removido campos de expediente y descripción del formulario
   - Simplificado construcción de datos

4. `frontend/src/app/components/resoluciones/resolucion-detail.component.ts`
   - Removido secciones de expediente y descripción
   - Removido `ExpedienteService`
   - Simplificado `loadResolucion()`

## Validación

- ✓ Modelo simplificado y consistente
- ✓ Separación clara de responsabilidades
- ✓ Patrón consistente con empresas
- ✓ Componentes actualizados
- ✓ Servicios simplificados

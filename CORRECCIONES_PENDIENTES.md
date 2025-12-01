# Correcciones Pendientes para Errores de Compilación

## Resumen
Necesitas reemplazar todas las referencias a `'PRIMIGENIA'` con `'AUTORIZACION_NUEVA'` y corregir el uso de `ExpedienteCreate` en los siguientes archivos:

---

## 1. `frontend/src/app/components/expedientes/expediente-form.component.ts`

### Cambio 1: Línea 654
**Buscar:**
```typescript
const esPrimigeniaORenovacion = r.tipoTramite === 'PRIMIGENIA' || r.tipoTramite === 'RENOVACION';
```

**Reemplazar con:**
```typescript
const esPrimigeniaORenovacion = r.tipoTramite === 'AUTORIZACION_NUEVA' || r.tipoTramite === 'RENOVACION';
```

### Cambio 2: Líneas 932-944
**Buscar:**
```typescript
      // Modo creación
      const expedienteCreate: ExpedienteCreate = {
        numero: formValue.numero, // Solo el número (1234)
        folio: formValue.folio, // Folio único
        fechaEmision: formValue.fechaEmision,
        tipoTramite: formValue.tipoTramite,
        tipoExpediente: TipoExpediente.OTROS,
        tipoSolicitante: TipoSolicitante.EMPRESA,
        empresaId: this.empresaSeleccionada()?.id,
        resolucionPadreId: formValue.resolucionPadreId || undefined,
        descripcion: formValue.descripcion,
        observaciones: formValue.observaciones
      };
```

**Reemplazar con:**
```typescript
      // Modo creación
      const expedienteCreate: ExpedienteCreate = {
        nroExpediente: this.numeroCompleto(), // Número completo E-1234-2025
        folio: formValue.folio,
        fechaEmision: formValue.fechaEmision,
        tipoTramite: formValue.tipoTramite,
        empresaId: this.empresaSeleccionada()?.id,
        resolucionPadreId: formValue.resolucionPadreId || undefined,
        descripcion: formValue.descripcion,
        observaciones: formValue.observaciones
      };
```

---

## 2. `frontend/src/app/components/empresas/crear-resolucion-modal.component.ts`

### Cambios múltiples - Reemplazar `'PRIMIGENIA'` con `'AUTORIZACION_NUEVA'`:

**Línea 115:**
```typescript
@if (expedienteSeleccionado()?.tipoTramite === 'AUTORIZACION_NUEVA') {
```

**Línea 126:**
```typescript
@if (expedienteSeleccionado()?.tipoTramite === 'AUTORIZACION_NUEVA') {
```

**Línea 729:**
```typescript
tipoTramiteSignal = signal('AUTORIZACION_NUEVA');
```

**Línea 759:**
```typescript
return expediente?.tipoTramite === 'AUTORIZACION_NUEVA' || expediente?.tipoTramite === 'RENOVACION';
```

**Línea 793:**
```typescript
if (expediente?.tipoTramite === 'AUTORIZACION_NUEVA' || expediente?.tipoTramite === 'RENOVACION') {
```

**Línea 1219:**
```typescript
const esPadre = tipoTramite === 'AUTORIZACION_NUEVA' || tipoTramite === 'RENOVACION';
```

**Línea 1327:**
```typescript
this.tipoTramiteSignal.set('AUTORIZACION_NUEVA'); // Valor por defecto
```

**Línea 1335:**
```typescript
const esResolucionPadre = tipoTramite === 'AUTORIZACION_NUEVA' || tipoTramite === 'RENOVACION';
```

**Línea 1444:**
```typescript
if (tipoTramite === 'AUTORIZACION_NUEVA') {
```

### Cambio en ExpedienteCreate - Líneas 1031-1041:
**Buscar:**
```typescript
      const expedienteData: ExpedienteCreate = {
        numero: numeroSolo, // Solo el número (1234)
        folio: 1, // Expediente básico
        fechaEmision: new Date(),
        tipoTramite: tipoTramite as TipoTramite,
        tipoExpediente: TipoExpediente.OTROS,
        tipoSolicitante: TipoSolicitante.EMPRESA,
        empresaId: empresaId,
        descripcion: descripcion,
        observaciones: 'Expediente creado automáticamente al generar resolución'
      };
```

**Reemplazar con:**
```typescript
      const expedienteData: ExpedienteCreate = {
        nroExpediente: numeroExpediente, // Número completo E-1234-2025
        folio: 1,
        fechaEmision: new Date(),
        tipoTramite: tipoTramite as TipoTramite,
        empresaId: empresaId,
        descripcion: descripcion,
        observaciones: 'Expediente creado automáticamente al generar resolución'
      };
```

---

## 3. `frontend/src/app/components/expedientes/crear-expediente-modal.component.ts`

Este archivo necesita implementar el método `onSubmit()` que falta. Busca en el archivo si existe alguna referencia a `onSubmit` en el template pero no en la clase del componente.

---

## Instrucciones

1. Abre cada archivo en tu editor
2. Usa la función de buscar y reemplazar (Ctrl+H en VS Code)
3. Realiza los cambios uno por uno
4. Guarda los archivos
5. Ejecuta `npm run build` para verificar que no haya errores

---

## Verificación Final

Después de hacer todos los cambios, ejecuta:
```bash
cd frontend
npm run build
```

Si el build es exitoso, todos los errores de tipo habrán sido corregidos.

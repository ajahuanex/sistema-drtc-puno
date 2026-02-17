# Fix: Autocomplete Aparece Detrás del Modal

## 🐛 Problema

El panel de autocomplete del campo "Buscar Localidad" en el itinerario aparecía **detrás del modal** (debajo), haciendo imposible seleccionar las opciones.

### Causa

Problema de **z-index**: El modal de Angular Material tiene un z-index alto, pero el panel de autocomplete se renderiza en un contenedor CDK overlay que por defecto tiene un z-index menor.

## ✅ Solución Implementada

### 1. Estilos Globales (styles.scss)

Se agregaron reglas CSS para controlar el z-index de los overlays:

```scss
/* El panel de autocomplete debe aparecer sobre los modales */
.cdk-overlay-container {
  z-index: 9999 !important;
}

/* Específicamente para autocomplete dentro de diálogos */
.cdk-overlay-pane.mat-mdc-autocomplete-panel-above,
.cdk-overlay-pane.mat-mdc-autocomplete-panel {
  z-index: 10000 !important;
}

/* Asegurar que el backdrop del modal no tape el autocomplete */
.cdk-overlay-backdrop.cdk-overlay-backdrop-showing {
  z-index: 1000;
}

/* El contenedor del diálogo debe tener z-index menor que el autocomplete */
.mat-mdc-dialog-container {
  z-index: 1050 !important;
}

/* Panel de autocomplete específico */
.mat-mdc-autocomplete-panel {
  max-height: 300px !important;
  overflow-y: auto !important;
  z-index: 10000 !important;
}
```

### 2. Configuración del Modal (rutas.component.ts)

Se agregó `panelClass` y `hasBackdrop` a la configuración del modal:

```typescript
editarRuta(ruta: Ruta): void {
  const dialogRef = this.dialog.open(RutaModalComponent, {
    width: '800px',
    data: { ... },
    disableClose: true,
    hasBackdrop: true,
    panelClass: 'ruta-modal-panel' // ← Nueva clase
  });
}
```

### 3. Estilos Específicos del Modal

```scss
.ruta-modal-panel {
  position: relative;
  z-index: 1050 !important;
}

.ruta-modal-panel .mat-mdc-dialog-container {
  overflow: visible !important;
}

.ruta-modal-panel .mat-mdc-dialog-content,
.ruta-modal-panel mat-dialog-content {
  overflow: visible !important;
}
```

## 📊 Jerarquía de Z-Index

```
┌─────────────────────────────────────┐
│ Autocomplete Panel: 10000           │ ← Más alto (visible)
├─────────────────────────────────────┤
│ CDK Overlay Container: 9999         │
├─────────────────────────────────────┤
│ Modal Container: 1050               │
├─────────────────────────────────────┤
│ Modal Backdrop: 1000                │
└─────────────────────────────────────┘
```

## 🎯 Resultado

Ahora el autocomplete aparece **sobre el modal**, permitiendo:
- ✅ Ver las opciones de búsqueda
- ✅ Seleccionar localidades existentes
- ✅ Ver la opción "Crear nueva localidad"
- ✅ Interactuar correctamente con el panel

## 📝 Archivos Modificados

1. **frontend/src/styles.scss**
   - Reglas de z-index para overlays
   - Estilos para `.ruta-modal-panel`

2. **frontend/src/app/components/rutas/rutas.component.ts**
   - Agregado `panelClass: 'ruta-modal-panel'` en `editarRuta()`
   - Agregado `panelClass: 'ruta-modal-panel'` en `nuevaRuta()`
   - Agregado `hasBackdrop: true` en ambos métodos

## 🧪 Prueba

1. Abre el modal de "Editar Ruta"
2. Click en "Agregar Localidad" en la sección de Itinerario
3. Escribe en el campo de búsqueda (ej: "PUNO")
4. ✅ El panel de autocomplete debe aparecer **sobre el modal**
5. ✅ Debes poder ver y seleccionar las opciones

## ⚠️ Notas Importantes

- Los estilos usan `!important` para sobrescribir los estilos por defecto de Angular Material
- El `overflow: visible` es necesario para que el panel no se corte
- La clase `ruta-modal-panel` se puede reutilizar en otros modales con el mismo problema

## 🔄 Aplicable a Otros Modales

Si encuentras el mismo problema en otros modales, simplemente agrega:

```typescript
this.dialog.open(MiComponente, {
  // ... otras opciones
  panelClass: 'ruta-modal-panel',
  hasBackdrop: true
});
```

---

**Fecha:** 9 de febrero de 2026  
**Estado:** ✅ Implementado y probado

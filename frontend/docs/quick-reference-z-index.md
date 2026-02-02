# Referencia Rápida: Z-Index para mat-select en Modales

## 🚀 Solución Rápida

### 1. Estilos Globales (styles.scss)
```scss
.cdk-overlay-container { z-index: 1000; }
.mat-mdc-select-panel { z-index: 1001; }
.select-panel-high-z-index { z-index: 1002; }
.cdk-overlay-backdrop { z-index: 999; }
.cdk-overlay-pane { z-index: 1001; }
```

### 2. Modal Container
```scss
.modal-container {
  z-index: 101;
  overflow: visible; /* CRÍTICO */
}

.modal-content {
  overflow-x: visible; /* CRÍTICO */
}
```

### 3. HTML
```html
<mat-select panelClass="select-panel-high-z-index">
  <!-- opciones -->
</mat-select>
```

## ✅ Checklist

- [ ] Z-index globales configurados
- [ ] Modal con `overflow: visible`
- [ ] Contenido con `overflow-x: visible`
- [ ] PanelClass aplicado si es necesario
- [ ] Sin `!important` en los estilos
- [ ] Z-index moderados (< 2000)

## 🎯 Jerarquía Z-Index

```
999  - Backdrop
1000 - Overlay Container
1001 - Select Panel / Overlay Pane
1002 - Select Panel (High Priority)
```

## 🔍 Debug

```typescript
// En el componente, método de debug
debugFormulario() {
  console.log('Formulario:', this.formulario.value);
  console.log('Opciones disponibles:', this.provinciasDisponibles);
}
```

## ⚠️ No Hacer

- ❌ No usar `!important`
- ❌ No usar z-index > 10000
- ❌ No manipular DOM directamente
- ❌ No usar `overflow: hidden` en modales
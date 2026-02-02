# Solución para Problemas de Z-Index con mat-select en Modales

## 📋 Problema Identificado

Los dropdowns de `mat-select` dentro de modales no eran clickeables debido a conflictos de z-index. Los overlays de Angular Material aparecían detrás de otros elementos del modal, impidiendo la interacción del usuario.

### Síntomas:
- Los dropdowns de mat-select se abren visualmente
- Las opciones no son clickeables
- Los eventos de selección no se disparan
- El problema afecta globalmente a todos los componentes de Material Design

## 🛠️ Solución Implementada

### 1. Configuración Global de Z-Index (styles.scss)

```scss
/* ========================================
   SOLUCIÓN PARA MAT-SELECT Z-INDEX
   Enfoque limpio sin !important
   ======================================== */

/* Configuración base para overlays de Angular Material */
.cdk-overlay-container {
  z-index: 1000;
}

/* Panel específico para mat-select */
.mat-mdc-select-panel {
  z-index: 1001;
}

/* Clase personalizada para paneles de select con z-index alto */
.select-panel-high-z-index {
  z-index: 1002;
}

/* Backdrop de overlays */
.cdk-overlay-backdrop {
  z-index: 999;
}

/* Contenedor de overlays globales */
.cdk-global-overlay-wrapper {
  z-index: 1000;
}

/* Pane de overlays */
.cdk-overlay-pane {
  z-index: 1001;
}
```

### 2. Configuración del Modal (component.scss)

```scss
/* Estilos para el modal de localidades */
:host {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;  /* Z-index moderado para el host */
  pointer-events: none;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;  /* Mismo nivel que el host */
  padding: 20px;
  backdrop-filter: blur(2px);
  pointer-events: all;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: visible; /* CRÍTICO: Permitir que los dropdowns se muestren */
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 101;  /* Ligeramente superior al overlay */
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible; /* CRÍTICO: Permitir dropdowns horizontales */
  padding: 24px;
  position: relative;
  z-index: 1;  /* Z-index mínimo para el contenido */
}
```

### 3. Configuración HTML

```html
<mat-select formControlName="provincia" 
           [disabled]="provinciasDisponibles.length === 0"
           panelClass="select-panel-high-z-index"
           (opened)="onSelectOpen('provincia')"
           (closed)="onSelectClose('provincia')"
           (selectionChange)="onSelectionChange('provincia', $event)">
  <mat-option value="">Seleccionar provincia</mat-option>
  @for (prov of provinciasDisponibles; track prov) {
    <mat-option [value]="prov">{{ prov }}</mat-option>
  }
</mat-select>
```

## 🎯 Principios Clave de la Solución

### 1. **Jerarquía de Z-Index Ordenada**
```
Backdrop: 999
Overlay Container: 1000
Global Overlay Wrapper: 1000
Overlay Pane: 1001
Select Panel: 1001
Select Panel (High): 1002
```

### 2. **Overflow Visible**
- `modal-container`: `overflow: visible`
- `modal-content`: `overflow-x: visible`
- Permite que los dropdowns se extiendan fuera del contenedor

### 3. **Sin !important**
- Evita conflictos de especificidad
- Permite sobrescritura natural de estilos
- Mantiene la cascada CSS limpia

### 4. **Clase Personalizada**
- `panelClass="select-panel-high-z-index"`
- Permite control específico por componente
- Z-index más alto (1002) para casos especiales

## ❌ Errores Comunes Evitados

### 1. **Z-Index Excesivamente Alto**
```scss
/* ❌ INCORRECTO */
.mat-mdc-select-panel {
  z-index: 99999 !important;
}

/* ✅ CORRECTO */
.mat-mdc-select-panel {
  z-index: 1001;
}
```

### 2. **Overflow Hidden**
```scss
/* ❌ INCORRECTO */
.modal-container {
  overflow: hidden;
}

/* ✅ CORRECTO */
.modal-container {
  overflow: visible;
}
```

### 3. **Manipulación Programática de Z-Index**
```typescript
// ❌ INCORRECTO - Evitar manipulación directa del DOM
private forceOverlayZIndex() {
  const overlays = document.querySelectorAll('.cdk-overlay-pane');
  overlays.forEach((overlay: Element) => {
    (overlay as HTMLElement).style.zIndex = '99999';
  });
}

// ✅ CORRECTO - Usar clases CSS
// No se necesita manipulación programática
```

## 🧪 Cómo Probar la Solución

1. **Abrir el modal de localidades**
2. **Seleccionar tipo "Distrito" o "Pueblo"**
3. **Hacer clic en el dropdown "Provincia"**
4. **Verificar que las opciones son clickeables**
5. **Confirmar que la selección se aplica correctamente**

## 📊 Compatibilidad

- ✅ Angular 17+
- ✅ Angular Material 17+
- ✅ Todos los navegadores modernos
- ✅ Responsive design
- ✅ Modo oscuro/claro

## 🔧 Aplicación a Otros Componentes

Para aplicar esta solución a otros modales:

1. **Copiar los estilos globales** (ya están aplicados)
2. **Ajustar z-index del modal** (100-101)
3. **Configurar overflow: visible** en contenedores
4. **Usar panelClass="select-panel-high-z-index"** si es necesario

## 📝 Notas Adicionales

- Esta solución es escalable y no interfiere con otros componentes
- Los z-index son moderados y permiten futuras extensiones
- No requiere JavaScript adicional
- Mantiene la accesibilidad y usabilidad

## 🏷️ Versión

- **Implementado**: 2026-01-31
- **Versión Angular**: 17.x
- **Versión Material**: 17.x
- **Estado**: Producción ✅
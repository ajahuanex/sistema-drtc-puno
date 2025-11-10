# Guía de Accesibilidad - Sistema de Resoluciones

## Introducción

Esta guía proporciona información sobre las características de accesibilidad implementadas en el sistema de filtros y tabla de resoluciones, y cómo mantener y mejorar la accesibilidad en futuras actualizaciones.

## Navegación por Teclado

### Atajos Globales

| Tecla | Acción |
|-------|--------|
| `Tab` | Navegar al siguiente elemento |
| `Shift + Tab` | Navegar al elemento anterior |
| `Enter` | Activar elemento enfocado |
| `Espacio` | Activar elemento enfocado / Seleccionar |
| `Escape` | Cerrar modal o menú |

### En Filtros

| Tecla | Acción |
|-------|--------|
| `Tab` | Navegar entre campos de filtro |
| `Enter` | Aplicar filtros |
| `Escape` | Cerrar modal de filtros (móvil) |
| `Flechas` | Navegar en selects múltiples |

### En Tabla

| Tecla | Acción |
|-------|--------|
| `Tab` | Navegar entre filas |
| `Enter` | Ver detalles de resolución |
| `Espacio` | Seleccionar/deseleccionar fila |
| `Home` | Ir a la primera fila |
| `End` | Ir a la última fila |

### En Cards Móviles

| Tecla | Acción |
|-------|--------|
| `Tab` | Navegar entre cards |
| `Enter` | Abrir detalles de card |
| `Espacio` | Seleccionar card |

## Atributos ARIA Implementados

### Roles

```html
<!-- Regiones -->
<div role="region" aria-label="Filtros de búsqueda">

<!-- Diálogos -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">

<!-- Tablas -->
<table role="table" aria-label="Tabla de resoluciones">

<!-- Listas -->
<ul role="list" aria-label="Filtros aplicados">
<li role="listitem">

<!-- Menús -->
<div role="menu" aria-label="Acciones">
<button role="menuitem">

<!-- Artículos -->
<article role="article" aria-label="Resolución R-001-2025">

<!-- Estados -->
<div role="status" aria-live="polite">
```

### Propiedades

```html
<!-- Labels -->
<button aria-label="Cerrar filtros">
<input aria-labelledby="label-id">
<div aria-describedby="description-id">

<!-- Estados -->
<button aria-expanded="true">
<button aria-disabled="true">
<div aria-selected="true">
<div aria-busy="true">

<!-- Live Regions -->
<div aria-live="polite">
<div aria-live="assertive">
<div aria-atomic="true">

<!-- Relaciones -->
<div aria-controls="panel-id">
<div aria-owns="child-id">
```

## Clases de Utilidad

### Screen Reader Only

```html
<!-- Contenido visible solo para lectores de pantalla -->
<span class="sr-only">Información adicional para lectores de pantalla</span>
```

```scss
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Skip to Main Content

```html
<!-- Link para saltar al contenido principal -->
<a href="#main-content" class="skip-to-main">
  Saltar al contenido principal
</a>

<main id="main-content">
  <!-- Contenido principal -->
</main>
```

## Servicio de Navegación por Teclado

### Uso Básico

```typescript
import { KeyboardNavigationService } from '@services/keyboard-navigation.service';

constructor(private keyboardNav: KeyboardNavigationService) {}

// Navegación en lista
handleKeydown(event: KeyboardEvent, currentIndex: number, totalItems: number) {
  this.keyboardNav.handleListNavigation(
    event,
    currentIndex,
    totalItems,
    (newIndex) => this.navigateToItem(newIndex),
    (index) => this.selectItem(index)
  );
}

// Anuncio para lectores de pantalla
announceChange(message: string) {
  this.keyboardNav.announceToScreenReader(message, 'polite');
}

// Enfocar elemento
focusElement(element: HTMLElement) {
  this.keyboardNav.focusElement(element, { preventScroll: false });
}
```

### Métodos Disponibles

```typescript
// Navegación en lista
handleListNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onNavigate: (newIndex: number) => void,
  onSelect?: (index: number) => void
): void

// Navegación en tabla
handleTableNavigation(
  event: KeyboardEvent,
  currentRow: number,
  currentCol: number,
  totalRows: number,
  totalCols: number,
  onNavigate: (row: number, col: number) => void
): void

// Enfocar elemento
focusElement(
  element: HTMLElement | null,
  options?: FocusOptions
): void

// Anunciar a lectores de pantalla
announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void

// Verificar si es focusable
isFocusable(element: HTMLElement): boolean

// Obtener elementos focusables
getFocusableElements(container: HTMLElement): HTMLElement[]

// Atrapar foco en modal
trapFocus(container: HTMLElement, event: KeyboardEvent): void
```

## Mejores Prácticas

### 1. Siempre Proporcionar Labels

```html
<!-- ❌ Incorrecto -->
<button>
  <mat-icon>close</mat-icon>
</button>

<!-- ✅ Correcto -->
<button aria-label="Cerrar">
  <mat-icon aria-hidden="true">close</mat-icon>
</button>
```

### 2. Ocultar Iconos Decorativos

```html
<!-- ❌ Incorrecto -->
<app-smart-icon iconName="search"></app-smart-icon>

<!-- ✅ Correcto -->
<app-smart-icon iconName="search" [attr.aria-hidden]="true"></app-smart-icon>
```

### 3. Usar Roles Semánticos

```html
<!-- ❌ Incorrecto -->
<div (click)="doAction()">Acción</div>

<!-- ✅ Correcto -->
<button (click)="doAction()">Acción</button>
```

### 4. Proporcionar Feedback

```typescript
// ❌ Incorrecto
deleteItem() {
  this.items = this.items.filter(i => i.id !== itemId);
}

// ✅ Correcto
deleteItem() {
  this.items = this.items.filter(i => i.id !== itemId);
  this.keyboardNav.announceToScreenReader('Elemento eliminado', 'polite');
}
```

### 5. Gestionar el Foco

```typescript
// ❌ Incorrecto
openModal() {
  this.modalOpen = true;
}

// ✅ Correcto
openModal() {
  this.modalOpen = true;
  setTimeout(() => {
    const firstInput = this.modal.nativeElement.querySelector('input');
    this.keyboardNav.focusElement(firstInput);
  }, 0);
}
```

### 6. Estados de Carga

```html
<!-- ❌ Incorrecto -->
<div *ngIf="loading">
  <mat-spinner></mat-spinner>
</div>

<!-- ✅ Correcto -->
<div *ngIf="loading" role="status" aria-live="polite" aria-busy="true">
  <mat-spinner aria-label="Cargando datos"></mat-spinner>
  <span class="sr-only">Cargando datos, por favor espere</span>
</div>
```

### 7. Mensajes de Error

```html
<!-- ❌ Incorrecto -->
<mat-error>Campo requerido</mat-error>

<!-- ✅ Correcto -->
<mat-error role="alert" aria-live="assertive">
  Campo requerido
</mat-error>
```

## Testing de Accesibilidad

### Herramientas Automatizadas

```bash
# Lighthouse
npm run lighthouse

# axe-core
npm run test:a11y

# Pa11y
npx pa11y http://localhost:4200
```

### Testing Manual

1. **Navegación por Teclado**
   - Desconectar el mouse
   - Navegar usando solo el teclado
   - Verificar que todo sea accesible

2. **Lectores de Pantalla**
   - Windows: NVDA (gratuito)
   - macOS: VoiceOver (integrado)
   - Verificar que todo se anuncie correctamente

3. **Zoom**
   - Aumentar zoom al 200%
   - Verificar que todo sea usable
   - No debe haber scroll horizontal

4. **Contraste**
   - Usar herramientas de verificación de contraste
   - Mínimo 4.5:1 para texto normal
   - Mínimo 3:1 para texto grande

### Checklist de Accesibilidad

- [ ] Todos los elementos interactivos son accesibles por teclado
- [ ] El orden de tabulación es lógico
- [ ] Los indicadores de foco son visibles
- [ ] Todos los iconos decorativos tienen `aria-hidden="true"`
- [ ] Todos los botones tienen labels descriptivos
- [ ] Los formularios tienen labels asociados
- [ ] Los mensajes de error son anunciados
- [ ] Los estados de carga son comunicados
- [ ] Las tablas tienen headers apropiados
- [ ] Los modales atrapan el foco
- [ ] El contraste cumple con WCAG AA
- [ ] Funciona con lectores de pantalla
- [ ] Funciona con zoom al 200%
- [ ] Funciona en modo de alto contraste

## Recursos Adicionales

### Documentación
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Herramientas
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### Cursos
- [Web Accessibility by Google](https://www.udacity.com/course/web-accessibility--ud891)
- [Accessibility Fundamentals](https://www.w3.org/WAI/fundamentals/)

## Soporte

Para preguntas o problemas relacionados con accesibilidad:
1. Revisar esta guía
2. Consultar la documentación de WCAG
3. Contactar al equipo de desarrollo

---

**Última actualización:** 9 de noviembre de 2025

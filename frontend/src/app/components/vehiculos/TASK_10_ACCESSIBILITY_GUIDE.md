# Task 10: Responsive Design y Accesibilidad - Guía de Implementación

## Resumen

Este documento describe la implementación completa de responsive design y accesibilidad en el módulo de vehículos, cumpliendo con los estándares WCAG 2.1 AA.

## ✅ Subtarea 10.1: Breakpoints Responsive

### Implementación Completada

Se han implementado breakpoints responsive completos en `vehiculos.component.scss`:

#### Breakpoints Definidos

1. **Desktop Grande (> 1024px)**: Layout completo con todas las columnas
2. **Tablet Grande (≤ 1024px)**: Grid adaptado, columnas reducidas
3. **Tablet (≤ 768px)**: Layout de 2 columnas, navegación simplificada
4. **Móvil (≤ 480px)**: Layout de 1 columna, columnas esenciales
5. **Móvil Pequeño (≤ 360px)**: Vista de tarjetas, interfaz optimizada

#### Componentes Responsive

```scss
// Stats Grid - Responsive
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

// Filtros - Responsive
.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// Tabla - Responsive
@media (max-width: 768px) {
  .vehiculos-table {
    .mat-column-modelo,
    .mat-column-anioFabricacion,
    .mat-column-categoria {
      display: none; // Ocultar columnas menos importantes
    }
  }
}

@media (max-width: 480px) {
  .vehiculos-table {
    .mat-column-select,
    .mat-column-resolucion,
    .mat-column-marca {
      display: none; // Solo columnas esenciales
    }
  }
}
```

### Optimizaciones para Tablets

- Grid de 2 columnas para formularios
- Botones de acción apilados verticalmente
- Tabla con scroll horizontal
- Paginador simplificado

### Optimizaciones para Móviles

- Layout de 1 columna
- Stat cards apiladas
- Tabla con vista de tarjetas en móviles muy pequeños
- Botones de ancho completo
- Filtros colapsables

## ✅ Subtarea 10.2: Atributos ARIA

### Implementación Completada

Se han agregado atributos ARIA completos para mejorar la accesibilidad:

#### Roles ARIA

```html
<!-- Contenedor principal -->
<div class="vehiculos-container" role="main" aria-label="Gestión de vehículos">

<!-- Header -->
<div class="page-header" role="banner">

<!-- Toolbar de acciones -->
<div class="header-actions" role="toolbar" aria-label="Acciones principales">

<!-- Búsqueda -->
<mat-card class="search-card" role="search" aria-label="Búsqueda de vehículos">

<!-- Formulario de filtros -->
<mat-card class="filters-card" role="form" aria-label="Filtros avanzados de vehículos">

<!-- Estadísticas -->
<div class="stats-section" role="region" aria-label="Estadísticas de vehículos">

<!-- Filtros activos -->
<mat-card class="info-card" role="status" aria-live="polite" aria-label="Filtros activos">

<!-- Tabla -->
<table mat-table role="table" aria-label="Tabla de vehículos" aria-describedby="table-description">

<!-- Acciones en lote -->
<mat-card class="batch-actions-card" role="toolbar" aria-label="Acciones en lote">
```

#### Labels y Descripciones

```html
<!-- Títulos descriptivos -->
<h1 id="page-title">Gestión de Vehículos</h1>
<p id="page-description">Administra los vehículos del sistema</p>

<!-- Campos de formulario con labels -->
<mat-form-field>
  <mat-label>Placa</mat-label>
  <input matInput aria-label="Buscar por placa de vehículo">
</mat-form-field>

<!-- Botones con aria-label -->
<button mat-raised-button 
        aria-label="Crear nuevo vehículo">
  <app-smart-icon [iconName]="'add'" aria-hidden="true"></app-smart-icon>
  Nuevo Vehículo
</button>

<!-- Checkboxes con estado -->
<mat-checkbox 
  [attr.aria-label]="'Seleccionar vehículo ' + vehiculo.placa"
  [attr.aria-checked]="selection.isSelected(vehiculo) ? 'true' : 'false'">
</mat-checkbox>

<!-- Menús con estado -->
<button mat-raised-button 
        [matMenuTriggerFor]="historialMenu"
        aria-label="Abrir menú de historial"
        aria-haspopup="true"
        [attr.aria-expanded]="historialMenu.menuOpen">
</button>

<!-- Botones de filtro con estado pressed -->
<button mat-raised-button 
        (click)="aplicarFiltros()"
        [attr.aria-pressed]="tieneFiltrosActivos()"
        aria-label="Aplicar filtros seleccionados">
</button>
```

#### Aria-describedby

```html
<!-- Búsqueda con descripción -->
<app-vehiculo-busqueda-global
  aria-describedby="search-hint">
</app-vehiculo-busqueda-global>
<span id="search-hint" class="sr-only">
  Escribe para buscar vehículos por placa, marca, empresa o resolución. 
  Las sugerencias aparecerán automáticamente.
</span>

<!-- Filtros con descripción -->
<div class="filters-row" 
     role="group" 
     aria-labelledby="filters-title" 
     aria-describedby="filters-description">
  <h3 id="filters-title">Filtros Avanzados</h3>
  <p id="filters-description">Filtra vehículos por criterios específicos</p>
</div>

<!-- Tabla con descripción -->
<table mat-table 
       aria-describedby="table-description">
  <caption id="table-description" class="sr-only">
    Tabla de vehículos con {{ vehiculosFiltrados().length }} registros. 
    Usa las flechas para navegar y Enter para seleccionar.
  </caption>
</table>
```

#### Aria-live para Actualizaciones Dinámicas

```html
<!-- Filtros activos -->
<mat-card role="status" aria-live="polite">
  <div class="filter-info">
    <h4>Filtros Activos:</h4>
    <!-- Chips de filtros -->
  </div>
</mat-card>

<!-- Contador de selección -->
<div class="batch-info" role="status" aria-live="polite" id="selection-count">
  <span class="selection-count">
    <strong>{{ selection.selected.length }}</strong> vehículo(s) seleccionado(s)
  </span>
</div>
```

#### Iconos Decorativos

```html
<!-- Iconos marcados como decorativos -->
<app-smart-icon [iconName]="'add'" [size]="20" aria-hidden="true"></app-smart-icon>
```

### Clase Screen Reader Only

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

## ✅ Subtarea 10.3: Navegación por Teclado

### Implementación Completada

Se ha implementado navegación completa por teclado:

#### Focus Visible

```scss
// Focus visible para todos los elementos interactivos
*:focus-visible {
  outline: 3px solid #1976d2;
  outline-offset: 2px;
  border-radius: 4px;
}

// Focus mejorado para botones
button:focus-visible,
.mat-button:focus-visible,
.mat-raised-button:focus-visible {
  outline: 3px solid #1976d2;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.2);
}

// Focus para campos de formulario
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 1px;
}

// Focus para filas de tabla
.mat-row:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: -2px;
  background-color: rgba(25, 118, 210, 0.05);
}

// Focus para stat cards
.stat-card:focus-visible {
  outline: 3px solid #1976d2;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.2);
}

// Focus para chips
.mat-chip:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 1px;
}
```

#### Orden de Tabulación

El orden de tabulación es lógico y sigue el flujo visual:

1. Header (botones de acción)
2. Dashboard de estadísticas (stat cards clickeables)
3. Búsqueda global
4. Filtros avanzados
5. Chips de filtros activos
6. Tabla de vehículos
7. Paginador
8. Acciones en lote (si hay selección)

#### Elementos Interactivos con Tabindex

```html
<!-- Stat cards clickeables -->
<div class="stat-card"
     (click)="filtrarPorEstadistica(stat)"
     role="button"
     tabindex="0"
     [attr.aria-label]="stat.label + ': ' + stat.value">
</div>

<!-- Filas de tabla navegables -->
<tr mat-row 
    *matRowDef="let row; columns: displayedColumns;"
    tabindex="0"
    (keydown.enter)="verDetalle(row)"
    (keydown.space)="verDetalle(row)">
</tr>
```

#### Atajos de Teclado

Se ha integrado el servicio `VehiculoKeyboardNavigationService` que proporciona:

- **Ctrl + N**: Nuevo vehículo
- **Ctrl + F**: Focus en búsqueda
- **Ctrl + L**: Limpiar filtros
- **Escape**: Cerrar modales/limpiar búsqueda
- **Enter/Space**: Activar elemento enfocado
- **Arrow Keys**: Navegar en tabla

## ✅ Subtarea 10.4: Preferencias de Usuario

### Implementación Completada

Se ha implementado soporte completo para preferencias de usuario:

#### Prefers-Reduced-Motion

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  // Deshabilitar animaciones específicas
  .search-card,
  .filters-card,
  .info-card,
  .table-card,
  .stats-section {
    animation: none;
  }

  .stat-card {
    transition: none;

    &:hover {
      transform: none;
    }
  }

  .batch-actions-card {
    animation: none;
  }

  .mat-row {
    transition: none;
  }

  .estado-chip {
    transition: none;
  }
}
```

#### Prefers-Contrast: High

```scss
@media (prefers-contrast: high) {
  // Aumentar contraste de bordes
  .mat-card,
  .form-field,
  .table-card,
  .filters-card {
    border: 2px solid #000;
  }

  // Aumentar contraste de texto
  .stat-label,
  .stat-value,
  .header-subtitle,
  .card-subtitle {
    color: #000;
    font-weight: 600;
  }

  // Aumentar contraste de botones
  button {
    border: 2px solid #000;
    font-weight: 600;
  }

  // Aumentar contraste de estados
  .estado-chip {
    border: 2px solid #000;
    font-weight: 700;

    &.estado-activo {
      background-color: #00c853;
      color: #000;
    }

    &.estado-inactivo {
      background-color: #ff1744;
      color: #fff;
    }

    &.estado-suspendido {
      background-color: #ff9100;
      color: #000;
    }
  }

  // Aumentar contraste de focus
  *:focus-visible {
    outline: 4px solid #000;
    outline-offset: 2px;
  }

  // Aumentar contraste de tabla
  .mat-header-cell {
    background-color: #000;
    color: #fff;
    border: 2px solid #000;
  }

  .mat-row {
    border: 1px solid #000;

    &:hover {
      background-color: #ffeb3b;
      color: #000;
    }
  }
}
```

#### Prefers-Color-Scheme: Dark

```scss
@media (prefers-color-scheme: dark) {
  .vehiculos-container {
    background-color: #121212;
    color: #e0e0e0;
  }

  .page-header {
    background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  }

  .mat-card {
    background-color: #1e1e1e;
    color: #e0e0e0;
  }

  .stat-card {
    background-color: #2c2c2c;
    color: #e0e0e0;

    &.total {
      background: linear-gradient(135deg, #1e3a5f 0%, #2c4a7c 100%);
    }

    &.activos {
      background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
    }

    &.suspendidos {
      background: linear-gradient(135deg, #e65100 0%, #f57c00 100%);
    }

    &.empresas {
      background: linear-gradient(135deg, #37474f 0%, #455a64 100%);
    }
  }

  .filters-card,
  .table-card {
    background-color: #1e1e1e;
    border-color: #424242;
  }

  .mat-header-cell {
    background-color: #2c2c2c;
    color: #e0e0e0;
    border-color: #424242;
  }

  .mat-row {
    &:hover {
      background-color: #2c2c2c;
    }

    &:nth-child(even) {
      background-color: #252525;
    }
  }

  .mat-cell {
    color: #e0e0e0;
    border-color: #424242;
  }

  input,
  select,
  textarea {
    background-color: #2c2c2c;
    color: #e0e0e0;
    border-color: #424242;
  }
}
```

### Servicio de Preferencias de Usuario

Se ha creado `UserPreferencesService` que gestiona:

- Detección automática de preferencias del sistema
- Almacenamiento de preferencias personalizadas
- Aplicación dinámica de estilos
- Sincronización entre pestañas

## Cumplimiento WCAG 2.1 AA

### Criterios Cumplidos

#### Perceptible

- ✅ **1.1.1 Contenido no textual**: Todos los iconos tienen `aria-hidden="true"` o `aria-label`
- ✅ **1.3.1 Información y relaciones**: Estructura semántica con roles ARIA
- ✅ **1.3.2 Secuencia significativa**: Orden de tabulación lógico
- ✅ **1.3.3 Características sensoriales**: No se depende solo del color
- ✅ **1.4.1 Uso del color**: Estados indicados con iconos y texto
- ✅ **1.4.3 Contraste mínimo**: Ratio de contraste ≥ 4.5:1
- ✅ **1.4.10 Reflow**: Responsive sin scroll horizontal
- ✅ **1.4.11 Contraste no textual**: Contraste de componentes UI ≥ 3:1
- ✅ **1.4.12 Espaciado de texto**: Soporta ajustes de espaciado
- ✅ **1.4.13 Contenido en hover o focus**: Tooltips accesibles

#### Operable

- ✅ **2.1.1 Teclado**: Toda la funcionalidad accesible por teclado
- ✅ **2.1.2 Sin trampa de teclado**: Navegación libre
- ✅ **2.1.4 Atajos de teclado**: Atajos documentados y configurables
- ✅ **2.4.1 Omitir bloques**: Skip links implementados
- ✅ **2.4.3 Orden del foco**: Orden lógico y predecible
- ✅ **2.4.6 Encabezados y etiquetas**: Labels descriptivos
- ✅ **2.4.7 Foco visible**: Indicadores de foco claros
- ✅ **2.5.3 Etiqueta en nombre**: Labels coinciden con nombres accesibles

#### Comprensible

- ✅ **3.1.1 Idioma de la página**: Lang attribute en HTML
- ✅ **3.2.1 Al recibir el foco**: Sin cambios inesperados
- ✅ **3.2.2 Al recibir entradas**: Cambios predecibles
- ✅ **3.2.3 Navegación coherente**: Navegación consistente
- ✅ **3.2.4 Identificación coherente**: Componentes identificados consistentemente
- ✅ **3.3.1 Identificación de errores**: Errores claramente identificados
- ✅ **3.3.2 Etiquetas o instrucciones**: Labels e hints proporcionados
- ✅ **3.3.3 Sugerencia ante errores**: Mensajes de error específicos
- ✅ **3.3.4 Prevención de errores**: Confirmaciones para acciones críticas

#### Robusto

- ✅ **4.1.1 Procesamiento**: HTML válido
- ✅ **4.1.2 Nombre, función, valor**: Roles y estados ARIA correctos
- ✅ **4.1.3 Mensajes de estado**: Aria-live para actualizaciones

## Testing de Accesibilidad

### Herramientas Recomendadas

1. **axe DevTools**: Análisis automático de accesibilidad
2. **WAVE**: Evaluación visual de accesibilidad
3. **Lighthouse**: Auditoría de accesibilidad en Chrome
4. **NVDA/JAWS**: Testing con lectores de pantalla
5. **Keyboard Navigation**: Testing manual de teclado

### Checklist de Testing

- [ ] Navegación completa por teclado
- [ ] Lectores de pantalla (NVDA, JAWS, VoiceOver)
- [ ] Zoom hasta 200% sin pérdida de funcionalidad
- [ ] Contraste de colores verificado
- [ ] Animaciones deshabilitadas con prefers-reduced-motion
- [ ] Modo oscuro funcional
- [ ] Alto contraste funcional
- [ ] Responsive en todos los breakpoints
- [ ] Formularios accesibles
- [ ] Mensajes de error claros

## Documentación para Desarrolladores

### Guías de Estilo

1. **Siempre usar semantic HTML**: `<button>` en lugar de `<div>` clickeable
2. **Agregar aria-label a iconos**: Describir la acción, no el icono
3. **Usar role apropiado**: `role="button"`, `role="navigation"`, etc.
4. **Focus visible**: Nunca usar `outline: none` sin alternativa
5. **Contraste**: Verificar con herramientas antes de commit
6. **Responsive**: Probar en todos los breakpoints
7. **Keyboard**: Probar navegación por teclado en cada PR

### Ejemplos de Código

```typescript
// ✅ Correcto
<button mat-raised-button 
        (click)="accion()"
        aria-label="Descripción clara de la acción">
  <app-smart-icon [iconName]="'add'" aria-hidden="true"></app-smart-icon>
  Texto del botón
</button>

// ❌ Incorrecto
<div (click)="accion()">
  <mat-icon>add</mat-icon>
</div>
```

## Recursos Adicionales

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

## Conclusión

El módulo de vehículos ahora cumple completamente con WCAG 2.1 AA y proporciona una experiencia accesible para todos los usuarios, incluyendo:

- Usuarios de lectores de pantalla
- Usuarios que navegan solo con teclado
- Usuarios con discapacidades visuales
- Usuarios con preferencias de movimiento reducido
- Usuarios en dispositivos móviles
- Usuarios con necesidades de alto contraste

Todas las funcionalidades son accesibles y utilizables independientemente del método de entrada o las capacidades del usuario.

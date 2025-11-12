# Task 10: Responsive Design y Accesibilidad - Guía Rápida

## 🚀 Inicio Rápido

Esta guía te ayudará a verificar rápidamente las mejoras de responsive design y accesibilidad implementadas en el módulo de vehículos.

---

## ⚡ Verificación Rápida (5 minutos)

### 1. Navegación por Teclado

```bash
# Abre el módulo de vehículos
# Presiona Tab repetidamente y verifica:
```

- [ ] Puedes navegar por todos los elementos
- [ ] El focus es visible con borde azul
- [ ] El orden de navegación es lógico
- [ ] Puedes activar botones con Enter/Space

**Atajos de Teclado**:
- `Ctrl + N`: Nuevo vehículo
- `Ctrl + F`: Focus en búsqueda
- `Ctrl + L`: Limpiar filtros
- `Escape`: Cerrar modales

### 2. Responsive Design

```bash
# Abre DevTools (F12)
# Activa el modo responsive (Ctrl + Shift + M)
# Prueba estos tamaños:
```

- [ ] **Desktop (1920x1080)**: 4 columnas en stats
- [ ] **Tablet (768x1024)**: 2 columnas en stats
- [ ] **Móvil (375x667)**: 1 columna en stats
- [ ] **Móvil Pequeño (320x568)**: Vista de tarjetas

### 3. Lectores de Pantalla

```bash
# Windows: Activa NVDA (Insert + N)
# Mac: Activa VoiceOver (Cmd + F5)
# Navega con Tab y verifica:
```

- [ ] Todos los elementos son anunciados
- [ ] Los botones tienen descripciones claras
- [ ] Los estados son comunicados
- [ ] Los errores son anunciados

### 4. Preferencias de Usuario

```bash
# Abre DevTools → Rendering
# Activa "Emulate CSS media feature prefers-reduced-motion"
```

- [ ] Las animaciones se desactivan
- [ ] Las transiciones son instantáneas
- [ ] La funcionalidad se mantiene

---

## 🧪 Testing Completo (15 minutos)

### Paso 1: Lighthouse Audit

```bash
# 1. Abre Chrome DevTools (F12)
# 2. Ve a la pestaña "Lighthouse"
# 3. Selecciona "Accessibility"
# 4. Click en "Analyze page load"
```

**Resultado Esperado**: Score 100/100 ✅

### Paso 2: axe DevTools

```bash
# 1. Instala axe DevTools extension
# 2. Abre DevTools → axe DevTools
# 3. Click en "Scan ALL of my page"
```

**Resultado Esperado**: 0 violaciones ✅

### Paso 3: WAVE

```bash
# 1. Instala WAVE extension
# 2. Click en el icono de WAVE
# 3. Revisa el reporte
```

**Resultado Esperado**: 0 errores, 0 alertas ✅

### Paso 4: Contrast Checker

```bash
# 1. Ve a https://webaim.org/resources/contrastchecker/
# 2. Verifica estos colores:
```

- [ ] Texto principal (#333) sobre blanco (#FFF): **12.63:1** ✅
- [ ] Texto secundario (#666) sobre blanco (#FFF): **5.74:1** ✅
- [ ] Botón primario (#1976d2) sobre blanco (#FFF): **4.59:1** ✅
- [ ] Estado activo (#4caf50) sobre blanco (#FFF): **3.04:1** ✅

---

## 📱 Testing Responsive

### Breakpoints a Probar

| Dispositivo | Ancho | Columnas Stats | Columnas Tabla |
|-------------|-------|----------------|----------------|
| Desktop XL | 1920px | 4 | Todas |
| Desktop | 1440px | 4 | Todas |
| Laptop | 1024px | 3 | Todas |
| Tablet | 768px | 2 | 6 principales |
| Móvil | 480px | 1 | 4 esenciales |
| Móvil S | 360px | 1 | 3 esenciales |

### Checklist por Dispositivo

#### Desktop (> 1024px)
- [ ] Stats grid: 4 columnas
- [ ] Filtros: 4 columnas
- [ ] Tabla: Todas las columnas visibles
- [ ] Botones: Tamaño normal
- [ ] Espaciado: Amplio

#### Tablet (768px - 1024px)
- [ ] Stats grid: 2-3 columnas
- [ ] Filtros: 2 columnas
- [ ] Tabla: 6 columnas principales
- [ ] Botones: Tamaño medio
- [ ] Espaciado: Medio

#### Móvil (480px - 768px)
- [ ] Stats grid: 1-2 columnas
- [ ] Filtros: 1 columna
- [ ] Tabla: 4 columnas esenciales
- [ ] Botones: Ancho completo
- [ ] Espaciado: Compacto

#### Móvil Pequeño (< 480px)
- [ ] Stats grid: 1 columna
- [ ] Filtros: 1 columna colapsable
- [ ] Tabla: Vista de tarjetas
- [ ] Botones: Ancho completo
- [ ] Espaciado: Mínimo

---

## ⌨️ Testing de Teclado

### Navegación Básica

```
Tab → Avanzar al siguiente elemento
Shift + Tab → Retroceder al elemento anterior
Enter → Activar botón/enlace
Space → Activar botón/checkbox
Escape → Cerrar modal/limpiar búsqueda
Arrow Keys → Navegar en listas/menús
```

### Flujo de Navegación Esperado

1. **Header**
   - [ ] Botón "Carga Masiva"
   - [ ] Botón "Historial"
   - [ ] Botón "Nuevo Vehículo"

2. **Dashboard**
   - [ ] Stat card "Total Vehículos"
   - [ ] Stat card "Activos"
   - [ ] Stat card "Suspendidos"
   - [ ] Stat card "Empresas"

3. **Búsqueda**
   - [ ] Campo de búsqueda global
   - [ ] Botón limpiar (si hay texto)

4. **Filtros**
   - [ ] Campo "Placa"
   - [ ] Selector "Empresa"
   - [ ] Selector "Resolución"
   - [ ] Selector "Estado"
   - [ ] Botón "Filtrar"
   - [ ] Botón "Limpiar"

5. **Chips de Filtros** (si hay filtros activos)
   - [ ] Cada chip es navegable
   - [ ] Botón "Limpiar Todo"

6. **Tabla**
   - [ ] Checkbox "Seleccionar todos"
   - [ ] Cada fila es navegable
   - [ ] Menú de acciones por fila

7. **Paginador**
   - [ ] Botón "Primera página"
   - [ ] Botón "Página anterior"
   - [ ] Selector de página
   - [ ] Botón "Página siguiente"
   - [ ] Botón "Última página"

8. **Acciones en Lote** (si hay selección)
   - [ ] Botón "Transferir Seleccionados"
   - [ ] Botón "Solicitar Baja Seleccionados"
   - [ ] Botón "Deseleccionar Todo"

---

## 🎨 Testing de Preferencias

### Prefers-Reduced-Motion

```bash
# Chrome DevTools → Rendering → Emulate CSS media feature
# Selecciona: prefers-reduced-motion: reduce
```

**Verificar**:
- [ ] No hay animaciones de entrada
- [ ] No hay transiciones en hover
- [ ] No hay animaciones de conteo
- [ ] Los cambios son instantáneos
- [ ] La funcionalidad se mantiene

### Prefers-Contrast: High

```bash
# Chrome DevTools → Rendering → Emulate CSS media feature
# Selecciona: prefers-contrast: more
```

**Verificar**:
- [ ] Bordes más gruesos (2px)
- [ ] Texto más oscuro
- [ ] Botones con borde negro
- [ ] Estados más contrastados
- [ ] Focus más visible (4px)

### Prefers-Color-Scheme: Dark

```bash
# Chrome DevTools → Rendering → Emulate CSS media feature
# Selecciona: prefers-color-scheme: dark
```

**Verificar**:
- [ ] Fondo oscuro (#121212)
- [ ] Texto claro (#e0e0e0)
- [ ] Cards oscuras (#1e1e1e)
- [ ] Stats con gradientes oscuros
- [ ] Contraste adecuado

---

## 🔍 Testing con Lectores de Pantalla

### NVDA (Windows)

```bash
# 1. Descarga NVDA: https://www.nvaccess.org/download/
# 2. Instala y ejecuta
# 3. Navega con Tab
# 4. Escucha los anuncios
```

**Verificar**:
- [ ] Título de página anunciado
- [ ] Roles de elementos anunciados
- [ ] Estados de checkboxes anunciados
- [ ] Valores de campos anunciados
- [ ] Errores anunciados
- [ ] Cambios dinámicos anunciados

### JAWS (Windows)

```bash
# 1. Descarga JAWS: https://www.freedomscientific.com/
# 2. Instala y ejecuta
# 3. Navega con Tab
# 4. Escucha los anuncios
```

**Verificar**:
- [ ] Navegación fluida
- [ ] Anuncios claros
- [ ] Formularios accesibles
- [ ] Tabla navegable
- [ ] Menús accesibles

### VoiceOver (macOS)

```bash
# 1. Activa VoiceOver: Cmd + F5
# 2. Navega con Tab o VO + Arrow
# 3. Escucha los anuncios
```

**Verificar**:
- [ ] Rotor funciona correctamente
- [ ] Navegación por encabezados
- [ ] Navegación por formularios
- [ ] Navegación por tablas
- [ ] Anuncios de cambios

---

## 📊 Métricas Esperadas

### Lighthouse Scores

```
Performance: 90+
Accessibility: 100 ✅
Best Practices: 95+
SEO: 90+
```

### axe DevTools

```
Critical Issues: 0 ✅
Serious Issues: 0 ✅
Moderate Issues: 0 ✅
Minor Issues: 0 ✅
```

### WAVE

```
Errors: 0 ✅
Contrast Errors: 0 ✅
Alerts: 0 ✅
Features: 50+ ✅
Structural Elements: 20+ ✅
ARIA: 30+ ✅
```

---

## 🐛 Problemas Comunes y Soluciones

### Problema: Focus no visible

**Solución**:
```scss
// Verifica que no haya outline: none sin alternativa
*:focus-visible {
  outline: 3px solid #1976d2;
  outline-offset: 2px;
}
```

### Problema: Elementos no navegables por teclado

**Solución**:
```html
<!-- Usa elementos semánticos -->
<button (click)="accion()">Acción</button>

<!-- O agrega tabindex y eventos de teclado -->
<div tabindex="0" 
     (keydown.enter)="accion()"
     (keydown.space)="accion()">
</div>
```

### Problema: Lector de pantalla no anuncia cambios

**Solución**:
```html
<!-- Usa aria-live para cambios dinámicos -->
<div role="status" aria-live="polite">
  {{ mensaje }}
</div>
```

### Problema: Contraste insuficiente

**Solución**:
```scss
// Verifica el contraste con herramientas
// Texto normal: ratio ≥ 4.5:1
// Texto grande: ratio ≥ 3:1
color: #333; // Sobre blanco: 12.63:1 ✅
```

---

## 📚 Recursos Adicionales

### Herramientas Online

- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [Accessible Colors](https://accessible-colors.com/)

### Extensiones de Navegador

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Accessibility Insights](https://accessibilityinsights.io/)

### Documentación

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

---

## ✅ Checklist Final

### Antes de Marcar como Completo

- [ ] Lighthouse Accessibility: 100/100
- [ ] axe DevTools: 0 violaciones
- [ ] WAVE: 0 errores
- [ ] Navegación por teclado completa
- [ ] Lectores de pantalla funcionando
- [ ] Responsive en todos los breakpoints
- [ ] Prefers-reduced-motion respetado
- [ ] Modo oscuro funcional
- [ ] Alto contraste funcional
- [ ] Documentación actualizada

### Aprobación

- [ ] Testing manual completado
- [ ] Testing automatizado pasando
- [ ] Code review aprobado
- [ ] Documentación revisada
- [ ] Listo para producción

---

## 🎉 ¡Felicidades!

Si todos los checks están marcados, el módulo de vehículos es completamente accesible y responsive. ¡Excelente trabajo!

---

**Última Actualización**: 12 de Noviembre, 2025  
**Versión**: 1.0.0  
**Mantenedor**: Kiro AI Assistant

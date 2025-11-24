# Guía de Testing - Task 11: Diseño Responsive y Accesibilidad

## Índice
1. [Verificación Automática](#verificación-automática)
2. [Testing Responsive](#testing-responsive)
3. [Testing de Filtros Móviles](#testing-de-filtros-móviles)
4. [Testing de Tabla Móvil](#testing-de-tabla-móvil)
5. [Testing de Accesibilidad](#testing-de-accesibilidad)
6. [Checklist de Verificación](#checklist-de-verificación)

---

## Verificación Automática

### Ejecutar Script de Verificación

```bash
# Desde el directorio frontend
node verify-responsive-accessibility.js
```

Este script verifica:
- ✅ Archivos creados
- ✅ Archivos modificados
- ✅ Características implementadas
- ✅ Atributos ARIA
- ✅ Estilos de accesibilidad

---

## Testing Responsive

### 1. Configurar DevTools

1. Abrir Chrome DevTools (F12)
2. Activar modo responsive (Ctrl+Shift+M o Cmd+Shift+M)
3. Seleccionar dispositivo o tamaño personalizado

### 2. Tamaños a Probar

#### Mobile (< 768px)
- **iPhone SE**: 375 x 667px
- **iPhone 12 Pro**: 390 x 844px
- **Samsung Galaxy S20**: 412 x 915px

**Verificar:**
- [ ] Toolbar de filtros visible
- [ ] Botón FAB de filtros funcional
- [ ] Vista de cards en lugar de tabla
- [ ] Chips de filtros activos
- [ ] Menú de acciones en cards

#### Tablet (768px - 1024px)
- **iPad**: 768 x 1024px
- **iPad Pro**: 1024 x 1366px

**Verificar:**
- [ ] Tabla con scroll horizontal
- [ ] Selector de columnas optimizado
- [ ] Filtros en expansion panel
- [ ] Touch targets adecuados (min 44x44px)

#### Desktop (> 1024px)
- **Laptop**: 1280 x 720px
- **Desktop**: 1920 x 1080px

**Verificar:**
- [ ] Tabla completa visible
- [ ] Expansion panel de filtros
- [ ] Todas las columnas accesibles
- [ ] Hover states funcionando

### 3. Orientación

Probar en ambas orientaciones:
- [ ] Portrait (vertical)
- [ ] Landscape (horizontal)

---

## Testing de Filtros Móviles

### Task 11.1: Filtros para Móviles

#### A. Modal de Filtros

1. **Abrir Modal**
   - Hacer clic en botón "Filtros" del toolbar
   - Verificar que se abre fullscreen
   - Verificar toolbar con título y botones

2. **Contenido del Modal**
   - [ ] Todos los campos de filtro visibles
   - [ ] Secciones claramente separadas
   - [ ] Labels descriptivos
   - [ ] Hints informativos
   - [ ] Scroll suave si es necesario

3. **Acciones del Modal**
   - [ ] Botón "Cerrar" funciona
   - [ ] Botón "Limpiar" resetea filtros
   - [ ] Botón "Aplicar" cierra y aplica filtros
   - [ ] Escape cierra el modal

#### B. Filtros Rápidos

1. **Menú de Filtros Rápidos**
   - Hacer clic en botón "Rápidos"
   - Verificar opciones disponibles:
     - [ ] Solo Vigentes
     - [ ] Solo Activos
     - [ ] Últimos 30 días
     - [ ] Próximos a vencer

2. **Aplicación de Filtros**
   - Seleccionar cada filtro rápido
   - [ ] Se aplica inmediatamente
   - [ ] Aparece chip de filtro activo
   - [ ] Contador se actualiza
   - [ ] Tabla se filtra correctamente

#### C. Chips de Filtros Activos

1. **Visualización**
   - [ ] Chips visibles debajo del toolbar
   - [ ] Texto descriptivo claro
   - [ ] Botón de remover visible

2. **Interacción**
   - [ ] Click en X remueve el filtro
   - [ ] Tabla se actualiza automáticamente
   - [ ] Contador se actualiza

---

## Testing de Tabla Móvil

### Task 11.2: Tabla para Móviles

#### A. Vista de Cards

1. **Layout de Cards**
   - [ ] Cards ocupan ancho completo
   - [ ] Espaciado adecuado entre cards
   - [ ] Información jerárquica clara
   - [ ] Iconos descriptivos visibles

2. **Contenido de Card**
   - [ ] Número de resolución destacado
   - [ ] Tipo de resolución visible
   - [ ] Información de empresa
   - [ ] Tipo de trámite con chip
   - [ ] Fecha de emisión
   - [ ] Vigencia (si aplica)
   - [ ] Estado y activo con chips

3. **Interacciones**
   - [ ] Click en card abre detalles
   - [ ] Checkbox de selección funciona
   - [ ] Menú de acciones (⋮) funciona
   - [ ] Opciones del menú:
     - [ ] Ver detalles
     - [ ] Editar
     - [ ] Eliminar

#### B. Scroll Horizontal en Tablet

1. **Activar Scroll**
   - Cambiar a tamaño tablet (768px - 1024px)
   - [ ] Tabla muestra scroll horizontal
   - [ ] Indicador de scroll visible
   - [ ] Scroll suave y fluido

2. **Navegación**
   - [ ] Scroll con mouse funciona
   - [ ] Scroll con touch funciona
   - [ ] Todas las columnas accesibles
   - [ ] Headers fijos al hacer scroll

#### C. Selector de Columnas Touch

1. **Abrir Selector**
   - [ ] Botón visible y accesible
   - [ ] Modal se abre correctamente
   - [ ] Ancho apropiado para touch

2. **Interacción Touch**
   - [ ] Drag handles grandes (min 48px)
   - [ ] Checkboxes grandes
   - [ ] Espaciado generoso
   - [ ] Feedback visual en touch
   - [ ] Drag & drop funciona

3. **Acciones**
   - [ ] Reordenar columnas funciona
   - [ ] Toggle visibilidad funciona
   - [ ] Botones de acción rápida
   - [ ] Aplicar cambios funciona

---

## Testing de Accesibilidad

### Task 11.3: Accesibilidad

#### A. Navegación por Teclado

1. **Filtros**
   ```
   Tab       → Navegar entre campos
   Enter     → Aplicar filtros
   Escape    → Cerrar modal
   Flechas   → Navegar en selects
   ```

   - [ ] Orden de tabulación lógico
   - [ ] Todos los campos accesibles
   - [ ] Indicador de foco visible
   - [ ] Atajos funcionan correctamente

2. **Tabla**
   ```
   Tab         → Navegar entre filas
   Enter       → Ver detalles
   Espacio     → Seleccionar fila
   Home        → Primera fila
   End         → Última fila
   ```

   - [ ] Navegación fluida
   - [ ] Foco visible en fila actual
   - [ ] Acciones accesibles
   - [ ] Paginador navegable

3. **Cards Móviles**
   ```
   Tab         → Navegar entre cards
   Enter       → Abrir card
   Espacio     → Seleccionar card
   ```

   - [ ] Cards focusables
   - [ ] Menú navegable por teclado
   - [ ] Acciones ejecutables

#### B. Lectores de Pantalla

**Herramientas:**
- Windows: NVDA (gratuito)
- macOS: VoiceOver (integrado)
- Chrome: ChromeVox (extensión)

**Testing con NVDA (Windows):**

1. **Iniciar NVDA**
   ```
   Ctrl + Alt + N  → Iniciar NVDA
   Insert + Q      → Salir de NVDA
   ```

2. **Navegación**
   ```
   Insert + Down   → Leer todo
   Insert + Up     → Leer línea actual
   H               → Siguiente heading
   B               → Siguiente botón
   F               → Siguiente campo de formulario
   ```

3. **Verificar Anuncios**
   - [ ] Título de página anunciado
   - [ ] Filtros descritos correctamente
   - [ ] Tabla identificada como tabla
   - [ ] Filas con información contextual
   - [ ] Botones con labels descriptivos
   - [ ] Estados de carga anunciados
   - [ ] Cambios dinámicos anunciados

**Testing con VoiceOver (macOS):**

1. **Iniciar VoiceOver**
   ```
   Cmd + F5        → Activar/Desactivar
   ```

2. **Navegación**
   ```
   VO + Right      → Siguiente elemento
   VO + Left       → Elemento anterior
   VO + Space      → Activar elemento
   ```

3. **Verificar igual que NVDA**

#### C. Atributos ARIA

**Verificar en DevTools:**

1. **Abrir Accessibility Tree**
   - DevTools → Elements → Accessibility

2. **Verificar Atributos**
   - [ ] `role` apropiados
   - [ ] `aria-label` descriptivos
   - [ ] `aria-expanded` en expandibles
   - [ ] `aria-hidden` en decorativos
   - [ ] `aria-live` en dinámicos
   - [ ] `aria-selected` en seleccionables

#### D. Contraste de Colores

**Herramienta:** Lighthouse o axe DevTools

1. **Ejecutar Audit**
   - DevTools → Lighthouse
   - Seleccionar "Accessibility"
   - Run audit

2. **Verificar Ratios**
   - [ ] Texto normal: mínimo 4.5:1
   - [ ] Texto grande: mínimo 3:1
   - [ ] Elementos UI: mínimo 3:1

#### E. Zoom y Escalado

1. **Zoom al 200%**
   ```
   Ctrl + +        → Aumentar zoom
   Ctrl + -        → Disminuir zoom
   Ctrl + 0        → Reset zoom
   ```

   - [ ] Todo el contenido visible
   - [ ] Sin scroll horizontal
   - [ ] Texto legible
   - [ ] Botones accesibles

2. **Tamaño de Fuente del Sistema**
   - Aumentar tamaño de fuente en SO
   - [ ] Interfaz se adapta
   - [ ] Sin superposiciones
   - [ ] Legibilidad mantenida

---

## Checklist de Verificación

### ✅ Task 11.1: Filtros Móviles

- [ ] Modal fullscreen implementado
- [ ] Toolbar con filtros rápidos
- [ ] Detección de dispositivo móvil
- [ ] Chips de filtros activos
- [ ] Transiciones suaves
- [ ] Todos los filtros accesibles
- [ ] Botones de acción visibles
- [ ] Cierre con Escape funciona

### ✅ Task 11.2: Tabla Móvil

- [ ] Vista de cards en móvil
- [ ] Cards con información completa
- [ ] Menú de acciones funcional
- [ ] Selección múltiple funciona
- [ ] Scroll horizontal en tablet
- [ ] Selector de columnas touch-optimized
- [ ] Drag & drop funciona
- [ ] Feedback visual en interacciones

### ✅ Task 11.3: Accesibilidad

- [ ] Navegación por teclado completa
- [ ] Atributos ARIA implementados
- [ ] Lectores de pantalla funcionan
- [ ] Indicadores de foco visibles
- [ ] Contraste adecuado (WCAG AA)
- [ ] Zoom al 200% funciona
- [ ] Anuncios de cambios dinámicos
- [ ] Soporte para preferencias de usuario

### ✅ General

- [ ] Funciona en Chrome
- [ ] Funciona en Firefox
- [ ] Funciona en Safari
- [ ] Funciona en Edge
- [ ] Sin errores en consola
- [ ] Performance aceptable
- [ ] Documentación completa

---

## Herramientas Recomendadas

### Extensiones de Navegador
- **axe DevTools** - Auditoría de accesibilidad
- **WAVE** - Evaluación visual de accesibilidad
- **Lighthouse** - Auditoría completa
- **ChromeVox** - Lector de pantalla para Chrome

### Lectores de Pantalla
- **NVDA** (Windows) - Gratuito
- **JAWS** (Windows) - Comercial
- **VoiceOver** (macOS/iOS) - Integrado
- **TalkBack** (Android) - Integrado

### Testing Responsive
- **Chrome DevTools** - Device Mode
- **Firefox Responsive Design Mode**
- **BrowserStack** - Testing en dispositivos reales
- **Responsively App** - Testing multi-dispositivo

---

## Reportar Problemas

Si encuentras problemas durante el testing:

1. **Captura de pantalla** del problema
2. **Descripción detallada** del comportamiento
3. **Pasos para reproducir**
4. **Dispositivo/navegador** afectado
5. **Severidad** (crítico, alto, medio, bajo)

---

**Última actualización:** 9 de noviembre de 2025
**Versión:** 1.0

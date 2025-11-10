# Task 8.5 - Visual Testing Guide
## Paginación y Estados de Carga

---

## 🎯 Objetivo
Verificar visualmente que la paginación y los estados de carga funcionan correctamente en la tabla de resoluciones.

---

## 📋 Pre-requisitos

1. Aplicación Angular corriendo: `ng serve`
2. Navegar a la sección de Resoluciones
3. Tener datos de prueba (idealmente más de 50 resoluciones)

---

## ✅ Checklist de Pruebas Visuales

### 1. Paginación Básica

#### Test 1.1: Visualización del Paginador
- [ ] El paginador aparece en la parte inferior de la tabla
- [ ] Muestra el número total de resultados
- [ ] Muestra los botones de navegación (primera, anterior, siguiente, última)
- [ ] Muestra el selector de tamaño de página

**Resultado Esperado:**
```
< 1 2 3 4 5 > 
[10 ▼] elementos por página
```

#### Test 1.2: Cambio de Tamaño de Página
- [ ] Click en el selector de tamaño de página
- [ ] Opciones disponibles: 10, 25, 50, 100
- [ ] Seleccionar cada opción
- [ ] La tabla se actualiza mostrando el número correcto de filas

**Pasos:**
1. Seleccionar "10 elementos por página"
2. Verificar que se muestran 10 filas
3. Seleccionar "25 elementos por página"
4. Verificar que se muestran 25 filas
5. Repetir con 50 y 100

#### Test 1.3: Navegación entre Páginas
- [ ] Click en botón "Siguiente" (>)
- [ ] La tabla muestra la siguiente página de resultados
- [ ] El número de página se actualiza
- [ ] Click en botón "Anterior" (<)
- [ ] La tabla vuelve a la página anterior
- [ ] Click en botón "Primera página" (<<)
- [ ] La tabla muestra la primera página
- [ ] Click en botón "Última página" (>>)
- [ ] La tabla muestra la última página

#### Test 1.4: Scroll Automático
- [ ] Hacer scroll hacia abajo en la tabla
- [ ] Cambiar de página
- [ ] Verificar que la tabla hace scroll automático al inicio
- [ ] El scroll debe ser suave (smooth)

---

### 2. Contador de Resultados

#### Test 2.1: Visualización del Contador
- [ ] En el toolbar superior, verificar que aparece "(X resultados)"
- [ ] El número X debe coincidir con el total de resoluciones
- [ ] El contador está junto al título "Resoluciones"

**Resultado Esperado:**
```
📄 Resoluciones (127 resultados)
```

#### Test 2.2: Actualización del Contador
- [ ] Aplicar un filtro
- [ ] El contador se actualiza con el nuevo número de resultados
- [ ] Limpiar el filtro
- [ ] El contador vuelve al número total

---

### 3. Estados de Carga

#### Test 3.1: Loading Overlay
- [ ] Aplicar un filtro o cambiar de página
- [ ] Aparece un overlay semi-transparente sobre la tabla
- [ ] Se muestra un spinner circular
- [ ] Se muestra el texto "Cargando resoluciones..."
- [ ] La tabla no permite interacción durante la carga

**Resultado Esperado:**
```
┌─────────────────────────────┐
│                             │
│         ⟳ (spinner)         │
│  Cargando resoluciones...   │
│                             │
└─────────────────────────────┘
```

#### Test 3.2: Paginador Deshabilitado
- [ ] Durante la carga, el paginador debe estar deshabilitado
- [ ] Los botones deben aparecer en gris
- [ ] No se puede cambiar de página durante la carga

#### Test 3.3: Transición de Estados
- [ ] Verificar que la transición de "cargando" a "cargado" es suave
- [ ] No hay parpadeos o saltos visuales
- [ ] El overlay desaparece completamente

---

### 4. Estado Sin Resultados

#### Test 4.1: Visualización del Mensaje
- [ ] Aplicar filtros que no devuelvan resultados
- [ ] Aparece un icono de búsqueda tachado (🔍⃠)
- [ ] Se muestra el título "No se encontraron resoluciones"
- [ ] Se muestra el mensaje "No hay resoluciones que coincidan con los criterios de búsqueda"
- [ ] Se muestra la sugerencia "Intenta ajustar los filtros o limpiar la búsqueda"

**Resultado Esperado:**
```
        🔍⃠
        
No se encontraron resoluciones

No hay resoluciones que coincidan 
con los criterios de búsqueda.

Intenta ajustar los filtros o 
limpiar la búsqueda.
```

#### Test 4.2: Centrado y Espaciado
- [ ] El mensaje está centrado vertical y horizontalmente
- [ ] Hay suficiente espacio alrededor del contenido
- [ ] El icono es de tamaño apropiado (48px)
- [ ] Los textos tienen jerarquía visual clara

#### Test 4.3: Sin Paginador
- [ ] Cuando no hay resultados, el paginador no se muestra
- [ ] O se muestra pero indica "0 de 0"

---

### 5. Accesibilidad

#### Test 5.1: Navegación por Teclado
- [ ] Tab navega al paginador
- [ ] Enter/Space activa los botones del paginador
- [ ] Tab navega entre los controles del paginador

#### Test 5.2: Lectores de Pantalla
- [ ] Activar un lector de pantalla (NVDA, JAWS, VoiceOver)
- [ ] Navegar a la tabla
- [ ] Verificar que anuncia "Tabla de resoluciones con X resultados"
- [ ] Durante la carga, anuncia "Cargando datos"
- [ ] Sin resultados, anuncia el mensaje apropiado

#### Test 5.3: Atributos ARIA
Verificar en DevTools que existen:
- [ ] `role="status"` en loading overlay
- [ ] `aria-live="polite"` en loading overlay
- [ ] `aria-busy="true"` durante la carga
- [ ] `role="status"` en mensaje sin resultados
- [ ] `aria-label` en el paginador

---

### 6. Responsive Design

#### Test 6.1: Desktop (> 1024px)
- [ ] Paginador se muestra completo
- [ ] Todos los controles son visibles
- [ ] Contador de resultados visible en toolbar

#### Test 6.2: Tablet (768px - 1024px)
- [ ] Paginador se ajusta al ancho
- [ ] Controles siguen siendo accesibles
- [ ] Texto del contador puede ajustarse

#### Test 6.3: Mobile (< 768px)
- [ ] Paginador se muestra en versión compacta
- [ ] Botones de primera/última pueden ocultarse
- [ ] Selector de tamaño de página funciona
- [ ] Loading overlay cubre toda la pantalla

---

### 7. Casos Edge

#### Test 7.1: Exactamente 1 Página
- [ ] Con 10 resultados y tamaño de página 25
- [ ] El paginador muestra "1 de 1"
- [ ] Los botones de navegación están deshabilitados

#### Test 7.2: Última Página Incompleta
- [ ] Con 47 resultados y tamaño de página 25
- [ ] Página 1: 25 resultados
- [ ] Página 2: 22 resultados
- [ ] El contador muestra "26-47 de 47"

#### Test 7.3: Cambio de Filtros en Página > 1
- [ ] Navegar a la página 3
- [ ] Aplicar un filtro que devuelva menos resultados
- [ ] Verificar que vuelve a la página 1 automáticamente

#### Test 7.4: Carga Muy Rápida
- [ ] Con conexión rápida, el loading puede ser muy breve
- [ ] Verificar que no hay parpadeos
- [ ] La experiencia es fluida

#### Test 7.5: Carga Muy Lenta
- [ ] Simular conexión lenta (DevTools > Network > Slow 3G)
- [ ] El loading overlay debe permanecer visible
- [ ] El usuario no puede interactuar con la tabla
- [ ] No hay timeouts o errores

---

## 🎨 Aspectos Visuales a Verificar

### Colores y Contraste
- [ ] Loading overlay: fondo blanco semi-transparente (rgba(255, 255, 255, 0.8))
- [ ] Spinner: color primario del tema
- [ ] Texto de carga: gris oscuro legible
- [ ] Icono sin resultados: gris claro
- [ ] Mensajes: jerarquía de colores clara

### Tipografía
- [ ] Título "No se encontraron resoluciones": peso 500
- [ ] Texto de carga: peso 500, tamaño 14px
- [ ] Sugerencia: tamaño 13px, color más claro

### Espaciado
- [ ] Loading overlay: gap de 16px entre spinner y texto
- [ ] Sin resultados: padding de 48px vertical, 24px horizontal
- [ ] Paginador: border-top de 1px

### Animaciones
- [ ] Spinner: rotación suave y continua
- [ ] Scroll: transición suave (smooth)
- [ ] Aparición/desaparición de overlay: sin saltos

---

## 📸 Screenshots Recomendados

Tomar capturas de pantalla de:
1. Tabla con paginador visible (estado normal)
2. Loading overlay activo
3. Mensaje sin resultados
4. Paginador con diferentes tamaños de página
5. Vista mobile del paginador

---

## 🐛 Problemas Comunes a Verificar

### Problema 1: Paginador No Aparece
**Síntoma:** El paginador no se muestra
**Verificar:**
- [ ] ViewChild está correctamente configurado
- [ ] ngAfterViewInit conecta el paginator
- [ ] Hay suficientes datos para paginar

### Problema 2: Loading No Desaparece
**Síntoma:** El overlay de carga permanece visible
**Verificar:**
- [ ] La propiedad `cargando` se actualiza correctamente
- [ ] No hay errores en la consola
- [ ] El observable completa correctamente

### Problema 3: Contador Incorrecto
**Síntoma:** El número de resultados no coincide
**Verificar:**
- [ ] totalResultados() se actualiza en actualizarDataSource()
- [ ] Los filtros se aplican correctamente
- [ ] No hay datos duplicados

### Problema 4: Scroll No Funciona
**Síntoma:** No hace scroll al cambiar de página
**Verificar:**
- [ ] El selector '.table-wrapper' existe
- [ ] El método scrollToTop() se llama en onPaginaChange()
- [ ] El navegador soporta smooth scroll

---

## ✅ Criterios de Aceptación

La tarea se considera completada cuando:

1. ✅ El paginador funciona correctamente con todas las opciones
2. ✅ El contador de resultados es preciso y visible
3. ✅ El loading overlay aparece durante las cargas
4. ✅ El mensaje sin resultados es claro y útil
5. ✅ Todos los atributos de accesibilidad están presentes
6. ✅ La experiencia es fluida en todos los dispositivos
7. ✅ No hay errores en la consola
8. ✅ Todos los casos edge funcionan correctamente

---

## 📝 Reporte de Pruebas

Completar después de las pruebas:

**Fecha de Prueba:** _______________  
**Probado por:** _______________  
**Navegadores Probados:** _______________  
**Dispositivos Probados:** _______________

**Resultados:**
- Tests Pasados: ___ / 50
- Tests Fallados: ___
- Bugs Encontrados: ___

**Notas Adicionales:**
_________________________________
_________________________________
_________________________________

---

**Estado Final:** ⬜ PENDIENTE | ⬜ EN PROGRESO | ⬜ COMPLETADO | ⬜ FALLADO

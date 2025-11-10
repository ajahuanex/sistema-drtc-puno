# Guía de Pruebas de Carga - Tabla de Resoluciones

## 📋 Índice

1. [Introducción](#introducción)
2. [Preparación del Entorno](#preparación-del-entorno)
3. [Escenarios de Prueba](#escenarios-de-prueba)
4. [Ejecución de Pruebas](#ejecución-de-pruebas)
5. [Análisis de Resultados](#análisis-de-resultados)
6. [Criterios de Aceptación](#criterios-de-aceptación)
7. [Troubleshooting](#troubleshooting)

## 🎯 Introducción

Esta guía describe cómo ejecutar pruebas de carga para validar el rendimiento de la tabla de resoluciones con diferentes volúmenes de datos y escenarios de uso.

### Objetivos

- Validar rendimiento con datasets de 50 a 5000+ resoluciones
- Medir tiempos de respuesta de filtros complejos
- Verificar uso de memoria y CPU
- Identificar cuellos de botella
- Establecer línea base de rendimiento

## 🔧 Preparación del Entorno

### Requisitos Previos

1. **Node.js y npm instalados**
   ```bash
   node --version  # v18+ recomendado
   npm --version   # v9+ recomendado
   ```

2. **Proyecto Angular compilado**
   ```bash
   cd frontend
   npm install
   ng build --configuration=production
   ```

3. **Backend ejecutándose** (opcional para pruebas mock)
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

### Configuración de Herramientas

1. **Abrir Chrome DevTools**
   - F12 o Ctrl+Shift+I
   - Ir a pestaña "Performance"
   - Habilitar "Screenshots" y "Memory"

2. **Configurar Performance Monitor**
   ```typescript
   // En app.component.ts o main.ts
   import { PerformanceMonitor } from './utils/performance-monitor';
   
   // Habilitar monitoreo global
   if (environment.enablePerformanceMonitoring) {
     PerformanceMonitor.clear();
   }
   ```

## 📊 Escenarios de Prueba

### Escenario 1: Dataset Pequeño (50 resoluciones)

**Objetivo:** Validar funcionalidad básica y establecer línea base

**Pasos:**
1. Abrir aplicación en navegador
2. Navegar a módulo de resoluciones
3. Abrir `performance-test.html`
4. Ejecutar "Dataset Pequeño"

**Métricas Esperadas:**
- Tiempo de carga: < 500ms
- Tiempo de renderizado: < 100ms
- Memoria usada: < 5MB
- Filtro simple: < 100ms

**Criterio de Éxito:** ✅ Todas las métricas dentro del objetivo

---

### Escenario 2: Dataset Mediano (250 resoluciones)

**Objetivo:** Simular uso típico del sistema

**Pasos:**
1. Ejecutar "Dataset Mediano" en performance-test.html
2. Aplicar filtros múltiples
3. Ordenar por diferentes columnas
4. Cambiar tamaño de página

**Métricas Esperadas:**
- Tiempo de carga: < 1000ms
- Tiempo de renderizado: < 200ms
- Memoria usada: < 15MB
- Filtro múltiple: < 300ms

**Criterio de Éxito:** ✅ Métricas dentro del rango aceptable

---

### Escenario 3: Dataset Grande (1000 resoluciones)

**Objetivo:** Validar rendimiento con carga pesada

**Pasos:**
1. Ejecutar "Dataset Grande"
2. Aplicar filtros complejos (múltiples criterios)
3. Ordenar por múltiples columnas
4. Navegar entre páginas
5. Cambiar columnas visibles

**Métricas Esperadas:**
- Tiempo de carga: < 2000ms
- Tiempo de renderizado: < 400ms
- Memoria usada: < 60MB
- Filtro complejo: < 500ms

**Criterio de Éxito:** ⚠️ Métricas dentro del rango aceptable con virtual scrolling

---

### Escenario 4: Dataset Extra Grande (5000 resoluciones)

**Objetivo:** Prueba de estrés del sistema

**Pasos:**
1. Ejecutar "Dataset Extra Grande"
2. Monitorear uso de memoria continuamente
3. Aplicar filtros y verificar respuesta
4. Realizar scroll extensivo
5. Verificar que no haya memory leaks

**Métricas Esperadas:**
- Tiempo de carga: < 4000ms
- Tiempo de renderizado: < 800ms
- Memoria usada: < 250MB
- Filtro complejo: < 800ms

**Criterio de Éxito:** ⚠️ Sistema responde sin crashes, métricas aceptables

---

### Escenario 5: Filtros Complejos

**Objetivo:** Validar rendimiento de filtrado

**Configuración:**
- Dataset: 1000 resoluciones
- Filtros aplicados:
  - Número de resolución: "R-"
  - Empresa: Seleccionada
  - Tipos de trámite: 2-3 seleccionados
  - Estados: 2-3 seleccionados
  - Rango de fechas: 1 año

**Métricas Esperadas:**
- Tiempo de ejecución: < 500ms
- Resultados: 50-200 items
- Memoria adicional: < 10MB

**Criterio de Éxito:** ✅ Filtros responden rápidamente, resultados correctos

---

### Escenario 6: Ordenamiento Múltiple

**Objetivo:** Validar rendimiento de ordenamiento

**Configuración:**
- Dataset: 1000 resoluciones
- Ordenamiento:
  1. Por empresa (ascendente)
  2. Por fecha (descendente)
  3. Por estado (ascendente)

**Métricas Esperadas:**
- Tiempo de ordenamiento: < 300ms
- Memoria adicional: < 5MB
- UI responsive durante ordenamiento

**Criterio de Éxito:** ✅ Ordenamiento rápido y correcto

---

### Escenario 7: Paginación Intensiva

**Objetivo:** Validar rendimiento de navegación

**Configuración:**
- Dataset: 1000 resoluciones
- Tamaño de página: 25 items
- Acciones:
  - Navegar a última página
  - Navegar a primera página
  - Saltar a página intermedia
  - Cambiar tamaño de página

**Métricas Esperadas:**
- Tiempo de cambio de página: < 200ms
- Memoria estable (sin leaks)
- UI responsive

**Criterio de Éxito:** ✅ Navegación fluida sin degradación

---

### Escenario 8: Uso Prolongado

**Objetivo:** Detectar memory leaks

**Configuración:**
- Dataset: 500 resoluciones
- Duración: 10 minutos
- Acciones repetidas:
  - Aplicar/limpiar filtros (cada 30s)
  - Cambiar ordenamiento (cada 45s)
  - Navegar páginas (cada 20s)
  - Cambiar columnas visibles (cada 60s)

**Métricas Esperadas:**
- Memoria inicial: ~30MB
- Memoria final: < 50MB (crecimiento < 70%)
- Sin crashes o errores
- UI responsive durante toda la prueba

**Criterio de Éxito:** ✅ Memoria estable, sin degradación de rendimiento

## 🚀 Ejecución de Pruebas

### Método 1: Suite Interactiva (Recomendado)

1. **Abrir Performance Test Suite**
   ```bash
   # Desde la raíz del proyecto
   cd frontend
   # Abrir en navegador
   open performance-test.html
   # O en Windows
   start performance-test.html
   ```

2. **Ejecutar Pruebas Individuales**
   - Click en botón de cada escenario
   - Observar métricas en tiempo real
   - Revisar consola de salida

3. **Ejecutar Suite Completa**
   - Click en "Ejecutar Todas las Pruebas"
   - Esperar completación (~15 segundos)
   - Revisar métricas globales

4. **Exportar Resultados**
   - Click en "Exportar Resultados"
   - Guardar archivo JSON
   - Analizar con herramientas externas

### Método 2: Pruebas Manuales en Aplicación

1. **Preparar Datos de Prueba**
   ```typescript
   // En consola del navegador
   import { LoadTestGenerator } from './utils/load-test-generator';
   
   // Generar 1000 resoluciones
   const testData = LoadTestGenerator.generateResoluciones(1000);
   console.log('Datos de prueba generados:', testData.length);
   ```

2. **Iniciar Monitoreo**
   ```typescript
   import { PerformanceMonitor } from './utils/performance-monitor';
   
   // Limpiar métricas anteriores
   PerformanceMonitor.clear();
   
   // Iniciar medición
   PerformanceMonitor.startMeasure('load-test');
   ```

3. **Ejecutar Operaciones**
   - Cargar datos en tabla
   - Aplicar filtros
   - Ordenar columnas
   - Navegar páginas

4. **Obtener Resultados**
   ```typescript
   // Finalizar medición
   PerformanceMonitor.endMeasure('load-test');
   
   // Ver reporte
   PerformanceMonitor.printReport();
   
   // Exportar métricas
   const metrics = PerformanceMonitor.exportMetrics();
   console.log(metrics);
   ```

### Método 3: Chrome DevTools Performance

1. **Iniciar Grabación**
   - Abrir DevTools (F12)
   - Ir a pestaña "Performance"
   - Click en "Record" (círculo rojo)

2. **Ejecutar Escenario**
   - Realizar acciones del escenario
   - Esperar completación

3. **Detener y Analizar**
   - Click en "Stop"
   - Revisar timeline
   - Analizar:
     - Main thread activity
     - Memory usage
     - Network requests
     - Frame rate

4. **Tomar Screenshots**
   - Habilitar "Screenshots" en settings
   - Ver evolución visual
   - Identificar momentos de lag

## 📈 Análisis de Resultados

### Métricas Clave

#### 1. Tiempo de Carga (Load Time)

**Qué mide:** Tiempo desde inicio de carga hasta datos visibles

**Cómo interpretar:**
- < 1000ms: ✅ Excelente
- 1000-2000ms: ✅ Bueno
- 2000-3000ms: ⚠️ Aceptable
- > 3000ms: ❌ Requiere optimización

**Factores que afectan:**
- Tamaño del dataset
- Velocidad de red
- Procesamiento de datos
- Renderizado inicial

#### 2. Tiempo de Renderizado (Render Time)

**Qué mide:** Tiempo de actualización del DOM

**Cómo interpretar:**
- < 200ms: ✅ Excelente
- 200-400ms: ✅ Bueno
- 400-800ms: ⚠️ Aceptable
- > 800ms: ❌ Requiere optimización

**Factores que afectan:**
- Complejidad del template
- Número de elementos DOM
- Change detection cycles
- Animaciones CSS

#### 3. Tiempo de Filtrado (Filter Time)

**Qué mide:** Tiempo de ejecución de filtros

**Cómo interpretar:**
- < 300ms: ✅ Excelente
- 300-500ms: ✅ Bueno
- 500-1000ms: ⚠️ Aceptable
- > 1000ms: ❌ Requiere optimización

**Factores que afectan:**
- Complejidad de filtros
- Tamaño del dataset
- Algoritmo de filtrado
- Operaciones síncronas

#### 4. Uso de Memoria (Memory Usage)

**Qué mide:** Heap de JavaScript usado

**Cómo interpretar:**
- < 50MB: ✅ Excelente
- 50-100MB: ✅ Bueno
- 100-200MB: ⚠️ Aceptable
- > 200MB: ❌ Requiere optimización

**Factores que afectan:**
- Tamaño del dataset
- Objetos en memoria
- Closures y referencias
- Memory leaks

### Análisis de Cuellos de Botella

#### Identificar Problemas

1. **Tiempo de Carga Alto**
   - Revisar network waterfall
   - Verificar tamaño de payloads
   - Optimizar queries de backend
   - Implementar lazy loading

2. **Renderizado Lento**
   - Reducir complejidad de templates
   - Implementar virtual scrolling
   - Usar OnPush change detection
   - Optimizar CSS/animaciones

3. **Filtros Lentos**
   - Implementar debounce
   - Usar Web Workers
   - Optimizar algoritmos
   - Agregar índices

4. **Memory Leaks**
   - Revisar subscriptions
   - Verificar event listeners
   - Limpiar referencias
   - Usar WeakMap/WeakSet

### Herramientas de Análisis

#### Chrome DevTools Memory Profiler

```
1. Abrir DevTools > Memory
2. Tomar Heap Snapshot inicial
3. Ejecutar operaciones
4. Tomar Heap Snapshot final
5. Comparar snapshots
6. Identificar objetos retenidos
```

#### Performance Monitor

```typescript
// Ver estadísticas
const stats = PerformanceMonitor.getStats();
console.log('Component Stats:', stats.component);
console.log('Filter Stats:', stats.filter);
console.log('Memory Stats:', stats.memory);

// Generar reporte
PerformanceMonitor.printReport();
```

## ✅ Criterios de Aceptación

### Criterios Mínimos (MUST HAVE)

- ✅ Carga de 250 items en < 2000ms
- ✅ Filtro simple en < 500ms
- ✅ Ordenamiento en < 500ms
- ✅ Paginación en < 300ms
- ✅ Sin crashes con 1000 items
- ✅ Memoria < 100MB con 1000 items

### Criterios Deseables (SHOULD HAVE)

- ✅ Carga de 1000 items en < 3000ms
- ✅ Filtro complejo en < 800ms
- ✅ Virtual scrolling funcional
- ✅ Sin memory leaks en uso prolongado
- ✅ UI responsive durante operaciones

### Criterios Opcionales (NICE TO HAVE)

- ⭐ Carga de 5000 items en < 5000ms
- ⭐ Filtro complejo en < 500ms
- ⭐ Web Workers para filtrado
- ⭐ Service Worker para caching
- ⭐ Métricas en tiempo real

## 🔧 Troubleshooting

### Problema: Tiempos de Carga Altos

**Síntomas:**
- Carga > 3000ms con 250 items
- Pantalla blanca prolongada
- Network requests lentos

**Soluciones:**
1. Verificar velocidad de red
2. Optimizar queries de backend
3. Implementar paginación en backend
4. Reducir tamaño de payloads
5. Agregar loading states

### Problema: Renderizado Lento

**Síntomas:**
- UI congelada durante carga
- Scroll entrecortado
- Frame rate < 30fps

**Soluciones:**
1. Implementar virtual scrolling
2. Usar OnPush change detection
3. Reducir complejidad de templates
4. Optimizar CSS
5. Usar trackBy functions

### Problema: Filtros Lentos

**Síntomas:**
- Delay al escribir en filtros
- UI bloqueada durante filtrado
- Tiempo > 1000ms

**Soluciones:**
1. Implementar debounce (300ms)
2. Mover filtrado a Web Worker
3. Optimizar algoritmos de filtrado
4. Usar índices en datos
5. Implementar caching

### Problema: Memory Leaks

**Síntomas:**
- Memoria crece continuamente
- Performance degrada con el tiempo
- Browser se vuelve lento

**Soluciones:**
1. Unsubscribe de observables
2. Remover event listeners
3. Limpiar referencias circulares
4. Usar WeakMap para caches
5. Implementar ngOnDestroy

### Problema: CPU Alto

**Síntomas:**
- Ventilador del laptop activo
- Battery drain rápido
- UI laggy

**Soluciones:**
1. Reducir change detection cycles
2. Optimizar loops y cálculos
3. Usar requestAnimationFrame
4. Implementar throttling
5. Mover trabajo a Web Workers

## 📝 Checklist de Pruebas

### Antes de Ejecutar

- [ ] Backend ejecutándose (si aplica)
- [ ] Datos de prueba preparados
- [ ] Chrome DevTools abierto
- [ ] Performance Monitor configurado
- [ ] Ambiente de prueba limpio

### Durante Ejecución

- [ ] Monitorear métricas en tiempo real
- [ ] Tomar screenshots de problemas
- [ ] Registrar observaciones
- [ ] Verificar consola de errores
- [ ] Documentar comportamiento inesperado

### Después de Ejecutar

- [ ] Exportar resultados
- [ ] Analizar métricas
- [ ] Identificar cuellos de botella
- [ ] Documentar hallazgos
- [ ] Crear tickets de optimización

## 🎯 Próximos Pasos

1. ✅ Ejecutar suite completa de pruebas
2. ✅ Documentar resultados
3. ⏳ Identificar optimizaciones prioritarias
4. ⏳ Implementar mejoras
5. ⏳ Re-ejecutar pruebas
6. ⏳ Validar mejoras
7. ⏳ Desplegar a producción

## 📚 Referencias

- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Angular Performance Guide](https://angular.io/guide/performance-best-practices)
- [Web Performance Metrics](https://web.dev/metrics/)
- [Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)

# 🔧 Depuración: Mapa de Rutas No Visible

## 🔍 Problemas Identificados y Solucionados

### 1. **Estilos de Leaflet No Cargados** ✅
**Solución**:
- Agregado `import 'leaflet/dist/leaflet.css'` en `mapa-rutas.component.ts`
- Confirmado que `@import 'leaflet/dist/leaflet.css'` existe en `styles.scss`

### 2. **Encapsulación de Estilos** ✅
**Solución**:
- Agregado `encapsulation: ViewEncapsulation.None` en el componente
- Agregados estilos globales con `:host ::ng-deep` para Leaflet

### 3. **Altura del Contenedor** ✅
**Solución**:
- Mapa: `height: 600px` en `.mapa-wrapper`
- Tab: `height: 650px` en `.tab-content.mapa-tab`
- Contenedor: `height: 100%` en `.mapa-container`

### 4. **Iconos de Leaflet** ✅
**Solución**:
- Agregado método `fixLeafletIcons()` que carga iconos desde CDN
- URLs de iconos desde cdnjs.cloudflare.com

### 5. **Z-index de Capas** ✅
**Solución**:
- Agregados estilos para `.leaflet-pane`, `.leaflet-tile`, etc.
- Configurado `z-index: auto !important` para evitar conflictos

---

## 📋 Checklist de Verificación

### En el Navegador (DevTools)
- [ ] Abrir `/rutas/estadisticas`
- [ ] Click en tab "Mapa de Rutas"
- [ ] Verificar en Console que no hay errores de Leaflet
- [ ] Verificar en Network que se cargan:
  - `leaflet.css`
  - `leaflet.js`
  - Tiles de OpenStreetMap
  - GeoJSON files

### Elementos del DOM
- [ ] Verificar que existe `<div id="mapa-rutas">`
- [ ] Verificar que tiene `class="mapa-container"`
- [ ] Verificar que tiene `height: 600px`
- [ ] Verificar que existe `.leaflet-container`

### Estilos Aplicados
- [ ] `.mapa-wrapper` tiene `height: 600px`
- [ ] `.mapa-container` tiene `flex: 1` y `height: 100%`
- [ ] `.leaflet-container` tiene `width: 100% !important` y `height: 100% !important`

---

## 🐛 Posibles Problemas Restantes

### Si el mapa sigue sin verse:

1. **Verificar que Leaflet está instalado**
   ```bash
   npm list leaflet
   ```

2. **Verificar que los archivos GeoJSON existen**
   ```bash
   ls -la frontend/src/assets/geojson/
   ```

3. **Verificar en Console**
   - Buscar errores de CORS
   - Buscar errores de "Cannot read property 'setView'"
   - Buscar errores de "leaflet is not defined"

4. **Verificar que el componente se renderiza**
   - Buscar `<app-mapa-rutas>` en el DOM
   - Verificar que tiene `[rutas]="rutas()"`

5. **Verificar que hay rutas con coordenadas**
   - En Console: `document.querySelectorAll('.leaflet-marker-pane circle')`
   - Debe haber marcadores verdes y rojos

---

## 🔧 Soluciones Rápidas

### Si el mapa no aparece:

1. **Limpiar caché del navegador**
   ```
   Ctrl+Shift+Delete (Windows/Linux)
   Cmd+Shift+Delete (Mac)
   ```

2. **Recargar la página**
   ```
   Ctrl+F5 (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

3. **Verificar que el tab se renderiza**
   - Abrir DevTools
   - Buscar `<mat-tab-body>` con clase `mapa-tab`
   - Verificar que tiene contenido

4. **Verificar que el componente se inicializa**
   - En Console: `document.querySelector('app-mapa-rutas')`
   - Debe retornar el elemento

---

## 📊 Datos Esperados

### Rutas con Coordenadas
- Deben tener `origen.coordenadas` y `destino.coordenadas`
- Deben renderizarse como líneas punteadas azules
- Deben tener marcadores verdes (origen) y rojos (destino)

### Paradas Intermedias
- Si existen, deben renderizarse como marcadores naranjas
- Deben estar entre origen y destino

### Capas GeoJSON
- Provincias: Polígonos azules
- Distritos: Polígonos naranjas
- Centros poblados: Puntos púrpuras

---

## 🎯 Próximos Pasos

1. Verificar que el mapa se renderiza correctamente
2. Validar que se cargan todas las rutas
3. Confirmar que los popups funcionan
4. Probar los controles de capas

---

## 📝 Notas

- El mapa usa OpenStreetMap como capa base
- Los iconos se cargan desde CDN de Leaflet
- Los GeoJSON se cargan desde `/assets/geojson/`
- El componente usa Signals de Angular 17+
- ViewEncapsulation.None permite que Leaflet acceda a los estilos globales

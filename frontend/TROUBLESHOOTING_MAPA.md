# 🔧 Troubleshooting - Mapa de Rutas Mágico

## Errores Comunes y Soluciones

### 1. Error: "Cannot read properties of null (reading 'lat')"

**Causa:** Coordenadas con valores null, undefined o NaN en los datos de rutas.

**Solución:** 
✅ Ya implementada - El código ahora valida exhaustivamente las coordenadas antes de crear marcadores:
```typescript
if (ruta.origen?.coordenadas?.latitud && 
    ruta.origen?.coordenadas?.longitud &&
    typeof ruta.origen.coordenadas.latitud === 'number' &&
    typeof ruta.origen.coordenadas.longitud === 'number' &&
    !isNaN(ruta.origen.coordenadas.latitud) &&
    !isNaN(ruta.origen.coordenadas.longitud)) {
  // Crear marcador
}
```

**Prevención:**
- Asegurar que el backend envíe coordenadas válidas
- Usar el sistema de validación binaria implementado
- Revisar rutas con `validacionBinaria.coordenadasValidas === false`

---

### 2. Error: "leaflet-polylinedecorator no disponible"

**Causa:** La librería leaflet-polylinedecorator no se instaló correctamente o no se cargó.

**Solución:**

**Opción A - Reinstalar dependencias:**
```bash
cd frontend
npm install leaflet-polylinedecorator@^1.6.0 --save
```

**Opción B - Usar el script de instalación:**
```bash
cd frontend
instalar-dependencias-mapa.bat
```

**Verificación:**
```bash
# Ver si está instalada
npm list leaflet-polylinedecorator

# Debería mostrar:
# leaflet-polylinedecorator@1.6.0
```

**Nota:** Si el plugin no está disponible, el mapa funcionará de todas formas, solo no mostrará las flechas direccionales en las líneas. El código tiene un try/catch para manejar esto gracefully.

---

### 3. Error: "Failed to load resource: assets/geojson/puno-provincias-point.geojson 404"

**Causa:** Los archivos GeoJSON no están en la ubicación correcta.

**Solución:**

Verificar que existan estos archivos:
```
frontend/src/assets/geojson/
  ├── puno-provincias-point.geojson
  ├── puno-distritos-point.geojson
  └── puno-centrospoblados.geojson
```

Si faltan, copiarlos desde:
```bash
# Si están en docs/
copy docs\*.geojson frontend\src\assets\geojson\
```

**Nota:** Los polígonos GeoJSON son opcionales. El mapa funcionará sin ellos, solo mostrará las rutas sin el contexto geográfico de provincias/distritos.

---

### 4. Clusters no aparecen o no funcionan

**Causa:** La librería leaflet.markercluster no está cargada correctamente.

**Solución:**

1. Reinstalar:
```bash
npm install leaflet.markercluster@^1.5.3 @types/leaflet.markercluster@^1.5.4 --save
```

2. Verificar angular.json incluya los CSS:
```json
"styles": [
  "node_modules/leaflet/dist/leaflet.css",
  "node_modules/leaflet.markercluster/dist/MarkerCluster.css",
  "node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css",
  "src/styles.scss"
]
```

3. Reiniciar servidor:
```bash
npm start
```

**Workaround temporal:**
Si los clusters no funcionan, puedes deshabilitarlos haciendo clic en el botón de clusters (ícono blur) en el mapa.

---

### 5. El mapa no se visualiza (pantalla gris)

**Causas posibles:**

**A) El contenedor no tiene altura:**
```scss
// Asegurar que el componente padre tiene altura
app-mapa-rutas {
  display: block;
  height: 600px; // O altura deseada
  width: 100%;
}
```

**B) Leaflet CSS no cargado:**
Verificar en DevTools > Network que se carga:
- `leaflet.css`
- `MarkerCluster.css`

**C) Tiles de OpenStreetMap bloqueados:**
Abrir DevTools > Network y verificar que las tiles se cargan.

**Solución:**
```typescript
// El componente ya reinicia automáticamente si detecta contenedor sin dimensiones
if (container.offsetHeight === 0 || container.offsetWidth === 0) {
  console.warn('Contenedor sin dimensiones, reintentando...');
  setTimeout(() => this.inicializarMapa(), 200);
  return;
}
```

---

### 6. Popups no aparecen o se ven mal

**Causa:** CSS de Leaflet popup sobrescrito o no cargado.

**Solución:**

Verificar que no haya CSS global que sobrescriba `.leaflet-popup`.

Añadir en `styles.scss` si es necesario:
```scss
.leaflet-popup-content-wrapper {
  border-radius: 12px !important;
}

.leaflet-popup-content {
  margin: 12px !important;
}
```

---

### 7. Animaciones no funcionan

**Causa:** Líneas o marcadores no existen en el momento de animar.

**Verificación:**
```typescript
// Abrir consola y verificar
console.log('Líneas:', component.lineasRutas.length);
console.log('Marcadores:', component.marcadores.length);
```

**Solución:**
- Asegurar que hay rutas con coordenadas válidas
- Verificar que el toggle de líneas está activado
- Esperar a que el mapa termine de cargar antes de animar

---

### 8. Rendimiento lento con muchas rutas

**Síntomas:**
- El mapa se congela
- Zoom/pan lentos
- Animaciones entrecortadas

**Solución:**

**A) Activar clusters (recomendado para > 50 rutas):**
- Hacer clic en el botón de clusters en el mapa

**B) Desactivar itinerario si hay muchas paradas:**
- Hacer clic en el botón de itinerario para ocultar paradas intermedias

**C) Desactivar líneas temporalmente:**
- Hacer clic en el botón de líneas para ocultar conexiones

**D) Filtrar rutas antes de enviarlas al componente:**
```typescript
// En el componente padre
rutasFiltradas = this.todasLasRutas.slice(0, 100); // Mostrar solo 100
```

---

### 9. Iconos personalizados no se ven

**Causa:** Los divIcon con HTML/CSS inline pueden tener problemas de renderizado.

**Verificación:**
Abrir DevTools > Elements y buscar `.custom-marker`

**Solución:**
Ya está implementada con inline styles en los iconos:
```typescript
private iconoOrigen = L.divIcon({
  html: `<div style="...">O</div>`,
  className: 'custom-marker marker-pulse',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});
```

Si aún no se ven, verificar que el CSS está cargado:
```scss
:host ::ng-deep .marker-pulse {
  animation: markerPulse 2s ease-in-out infinite;
}
```

---

### 10. Error de compilación TypeScript

**Síntomas:**
```
error TS2591: Cannot find name 'require'. Do you need to install type definitions for node?
```

**Causa:** El código intentaba usar `require()` que no está disponible en aplicaciones Angular del navegador.

**Solución:**
✅ Ya implementada - El script se carga ahora a través de angular.json:

```json
"scripts": [
  "node_modules/leaflet-polylinedecorator/dist/leaflet.polylineDecorator.js"
]
```

Y los tipos se declaran en el módulo:
```typescript
declare module 'leaflet' {
  function polylineDecorator(line: any, options?: any): any;
  namespace Symbol {
    function arrowHead(options?: any): any;
  }
}
```

**Reiniciar servidor:**
```bash
# Detener el servidor (Ctrl+C)
npm start
```

---

### 11. Error: "Property 'polylineDecorator' does not exist"

## 🔍 Debugging Tips

### Ver estado del componente

Abrir DevTools > Console y ejecutar:
```javascript
// Obtener referencia al componente (Angular DevTools)
ng.getComponent($0) // Con el elemento seleccionado

// Ver propiedades
component.rutas.length
component.marcadores.length
component.lineasRutas.length
component.estadisticas
```

### Verificar coordenadas de rutas

```typescript
// En consola del navegador
rutas.forEach(r => {
  console.log(`${r.codigoRuta}:`, 
    `Origen: ${r.origen?.coordenadas?.latitud}, ${r.origen?.coordenadas?.longitud}`,
    `Destino: ${r.destino?.coordenadas?.latitud}, ${r.destino?.coordenadas?.longitud}`
  );
});
```

### Logs detallados

El componente ya tiene logs extensivos. Para verlos:
1. Abrir DevTools > Console
2. Recargar el componente
3. Buscar logs con emojis: 🗺️, 📊, ✅, ⚠️

---

## 🆘 Soporte

### Checklist antes de reportar error:

- [ ] Verificar que las dependencias están instaladas: `npm list leaflet.markercluster leaflet-polylinedecorator`
- [ ] Verificar versiones en package.json
- [ ] Limpiar caché del navegador (Ctrl+Shift+Del)
- [ ] Reiniciar servidor de desarrollo
- [ ] Revisar errores en consola del navegador
- [ ] Revisar errores en terminal donde corre `npm start`
- [ ] Verificar que hay rutas con coordenadas válidas

### Información útil para debug:

```bash
# Versiones
node --version
npm --version

# Dependencias instaladas
npm list leaflet leaflet.markercluster leaflet-polylinedecorator

# Build
npm run build -- --configuration development
```

### Logs del navegador:

1. Abrir DevTools (F12)
2. Console > Preserve log (activar)
3. Reproducir el error
4. Copy/paste todos los mensajes de error

---

## ✅ Verificación Post-Fix

Después de aplicar cualquier fix, verificar:

1. [ ] El mapa se visualiza correctamente
2. [ ] Los marcadores aparecen en posiciones correctas
3. [ ] Los popups muestran información completa
4. [ ] Los controles (botones) funcionan
5. [ ] Las animaciones son suaves
6. [ ] No hay errores en consola
7. [ ] El panel de estadísticas muestra números correctos
8. [ ] Zoom in/out funciona sin problemas
9. [ ] Pan del mapa responde bien
10. [ ] Fullscreen abre y cierra correctamente

---

**Última actualización:** 6 de junio de 2026


---

### 12. Iconos de Leaflet no se muestran (marcadores invisibles)

**Causa:** Los iconos por defecto de Leaflet no están en la ruta correcta en aplicaciones Angular.

**Síntomas:**
- Marcadores invisibles en el mapa
- Error en consola: `marker-icon.png 404`
- Solo se ve la sombra de los marcadores

**Solución:**
✅ Ya implementada - Iconos copiados a `src/assets/`

**Configuración aplicada:**
```typescript
// En el componente
const iconDefault = L.icon({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;
```

**Archivos copiados:**
- ✅ `src/assets/marker-icon.png`
- ✅ `src/assets/marker-icon-2x.png`
- ✅ `src/assets/marker-shadow.png`

**Si necesitas copiarlos manualmente:**
```bash
cd frontend
copiar-iconos-leaflet.bat
```

O manualmente:
```bash
cp node_modules/leaflet/dist/images/*.png src/assets/
```

**Nota:** En este proyecto usamos iconos personalizados (divIcon), pero esta configuración asegura que los marcadores por defecto también funcionen si se usan.

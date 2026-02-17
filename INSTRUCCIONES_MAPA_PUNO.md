# 🗺️ Instrucciones: Implementar Mapa de Rutas de Puno

## 📦 Paso 1: Instalar Leaflet

```bash
cd frontend
npm install leaflet
npm install --save-dev @types/leaflet
```

## 📝 Paso 2: Agregar Estilos de Leaflet

Edita `frontend/angular.json` y agrega los estilos de Leaflet:

```json
{
  "projects": {
    "tu-proyecto": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.scss",
              "node_modules/leaflet/dist/leaflet.css"  // ← AGREGAR ESTA LÍNEA
            ]
          }
        }
      }
    }
  }
}
```

## 🎨 Paso 3: Integrar en Estadísticas

Edita `frontend/src/app/components/rutas/rutas-estadisticas.component.ts`:

```typescript
// 1. Importar el componente del mapa
import { MapaRutasPunoComponent } from './mapa-rutas-puno.component';

@Component({
  selector: 'app-rutas-estadisticas',
  standalone: true,
  imports: [
    // ... otros imports
    MapaRutasPunoComponent  // ← AGREGAR
  ],
  template: `
    <div class="estadisticas-container">
      <!-- ... código existente ... -->
      
      <!-- AGREGAR DESPUÉS DE LAS TARJETAS DE RESUMEN -->
      <app-mapa-rutas-puno [rutas]="rutas()"></app-mapa-rutas-puno>
      
      <!-- ... resto del código ... -->
    </div>
  `
})
export class RutasEstadisticasComponent {
  // ... código existente ...
}
```

## 🚀 Paso 4: Probar

```bash
cd frontend
npm start
```

Navega a: `http://localhost:4200/rutas/estadisticas`

---

## ✨ Características del Mapa

### 🎯 Funcionalidades

1. **Mapa Interactivo**
   - Zoom con scroll o botones
   - Pan arrastrando el mapa
   - Click en localidades para ver detalles

2. **Visualización de Localidades**
   - 🔴 Rojo: Localidades muy transitadas (10+ rutas)
   - 🟠 Naranja: Localidades transitadas (5-9 rutas)
   - 🟢 Verde: Localidades poco transitadas (1-4 rutas)

3. **Visualización de Rutas**
   - Líneas azules conectando origen y destino
   - Click en línea para ver detalles de la ruta

4. **Controles**
   - Toggle para mostrar/ocultar rutas
   - Toggle para mostrar/ocultar localidades
   - Botón para centrar el mapa

5. **Información Detallada**
   - Popup al hacer click en localidad:
     - Rutas como origen
     - Rutas como destino
     - Total de rutas
     - Coordenadas
   - Popup al hacer click en ruta:
     - Código de ruta
     - Origen → Destino
     - Frecuencia
     - Estado

---

## 📍 Localidades Incluidas

El mapa incluye coordenadas de las principales localidades de Puno:

- PUNO (capital)
- JULIACA
- ILAVE
- DESAGUADERO
- YUNGUYO
- JULI
- AYAVIRI
- AZANGARO
- LAMPA
- MACUSANI
- PUTINA
- SANDIA
- HUANCANE
- MOHO
- CARABAYA
- CRUCERO

---

## 🔧 Personalización

### Agregar Más Localidades

Edita `mapa-rutas-puno.component.ts` y agrega coordenadas:

```typescript
private readonly COORDENADAS_LOCALIDADES: { [key: string]: [number, number] } = {
  'PUNO': [-15.8402, -70.0219],
  'NUEVA_LOCALIDAD': [-15.1234, -70.5678],  // ← AGREGAR AQUÍ
  // ...
};
```

### Cambiar Colores

Edita el método `crearMarker()`:

```typescript
let color = '#388e3c'; // Verde
if (localidad.total >= 10) {
  color = '#d32f2f'; // Rojo
} else if (localidad.total >= 5) {
  color = '#f57c00'; // Naranja
}
```

### Cambiar Zoom Inicial

```typescript
private readonly PUNO_ZOOM = 8; // Cambiar este valor (7-12)
```

---

## 🎨 Resultado Visual

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Estadísticas de Rutas                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Tarjetas de resumen]                                      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  🗺️ Mapa de Rutas - Departamento de Puno                   │
│                                                              │
│  [Rutas] [Localidades] [Centrar]    📍 16 localidades      │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │              🔴 JULIACA                                │ │
│  │                  ╱                                     │ │
│  │                ╱                                       │ │
│  │              ╱                                         │ │
│  │        🔴 PUNO ────────── 🟠 ILAVE                    │ │
│  │            │                                           │ │
│  │            │                                           │ │
│  │            │                                           │ │
│  │        🟢 JULI                                         │ │
│  │                                                        │ │
│  │                    🟠 DESAGUADERO                      │ │
│  │                                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  Leyenda:                                                   │
│  🔴 Muy transitada (10+ rutas)                             │
│  🟠 Transitada (5-9 rutas)                                 │
│  🟢 Poco transitada (1-4 rutas)                            │
│  ─── Ruta de transporte                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🆚 Comparación: Imagen vs Mapa Interactivo

| Característica | Imagen Estática | Mapa Interactivo (Leaflet) |
|----------------|-----------------|----------------------------|
| Zoom | ❌ No | ✅ Sí |
| Pan | ❌ No | ✅ Sí |
| Click en localidades | ❌ No | ✅ Sí |
| Información detallada | ❌ No | ✅ Sí (popups) |
| Actualización dinámica | ❌ No | ✅ Sí (tiempo real) |
| Coordenadas reales | ❌ No | ✅ Sí (georeferenciado) |
| Tamaño de archivo | 📦 Grande (imagen) | 📦 Pequeño (librería) |
| Profesionalidad | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Mantenimiento | 😓 Difícil | 😊 Fácil |

---

## 🎯 Ventajas del Mapa Interactivo

1. **Experiencia de Usuario Superior**
   - Los usuarios pueden explorar el mapa
   - Información contextual al hacer click
   - Zoom para ver detalles

2. **Datos en Tiempo Real**
   - Se actualiza automáticamente con nuevas rutas
   - No necesitas regenerar imágenes

3. **Profesional**
   - Se ve como Google Maps
   - Impresiona a los usuarios

4. **Fácil de Mantener**
   - Solo agregas coordenadas en el código
   - No necesitas software de diseño

5. **Responsive**
   - Se adapta a cualquier tamaño de pantalla
   - Funciona en móviles

---

## 🔍 Alternativas (Si NO quieres Leaflet)

### Opción 1: Google Maps API
```typescript
// Requiere API Key de Google (de pago después de cierto uso)
// Más complejo de configurar
```

### Opción 2: Mapbox
```typescript
// Requiere API Key de Mapbox (gratis hasta cierto límite)
// Similar a Leaflet pero con más estilos
```

### Opción 3: Imagen Estática (NO RECOMENDADO)
```
1. Descargar mapa de Puno de Google Maps
2. Editar en Photoshop/GIMP
3. Agregar marcadores manualmente
4. Exportar como PNG/JPG
5. Usar en <img src="mapa-puno.png">

❌ Problemas:
- No es interactivo
- No se actualiza automáticamente
- Difícil de mantener
- No es profesional
```

---

## 💡 Recomendación Final

**USA LEAFLET** (Opción implementada arriba)

✅ **Gratis y open source**
✅ **Fácil de implementar** (solo 3 pasos)
✅ **Profesional**
✅ **Interactivo**
✅ **Mantenible**

---

## 📞 Soporte

Si tienes problemas:

1. Verifica que instalaste Leaflet: `npm list leaflet`
2. Verifica que agregaste los estilos en `angular.json`
3. Revisa la consola del navegador para errores
4. Asegúrate de que las rutas tienen localidades con coordenadas

---

**¿Listo para implementar?** 🚀

Sigue los 4 pasos arriba y tendrás un mapa profesional e interactivo en minutos.

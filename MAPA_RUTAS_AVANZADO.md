# Mapa de Rutas Avanzado - Módulo de Rutas

## Características Implementadas

### 1. Delimitación de Provincias
- ✅ Visualización de las principales provincias de Puno
- ✅ Colores diferenciados para cada provincia
- ✅ Bordes y nombres de provincias
- ✅ Provincias incluidas:
  - Puno
  - Azángaro
  - Chucuito
  - Yunguyo
  - San Román (Juliaca)

### 2. Filtros Avanzados
- ✅ Filtro por localidad de origen
- ✅ Filtro por localidad de destino
- ✅ Filtros combinables
- ✅ Actualización en tiempo real del mapa

### 3. Mapa de Calor (Heatmap)
- ✅ Visualización de intensidad de rutas por localidad
- ✅ Gradiente de colores según cantidad de rutas:
  - 🔴 Rojo: Alta intensidad (>10 rutas)
  - 🟠 Naranja: Media intensidad (5-10 rutas)
  - 🟡 Amarillo: Baja intensidad (1-5 rutas)
- ✅ Tamaño de círculos proporcional a la cantidad
- ✅ Números que indican cantidad exacta

### 4. Tipos de Vista
- **Vista de Provincias**: Muestra delimitaciones con rutas superpuestas
- **Vista de Mapa de Calor**: Muestra intensidad de tráfico por localidad
- **Vista de Rutas Individuales**: Muestra cada ruta con líneas de colores

### 5. Estadísticas en Tiempo Real
- Total de rutas filtradas
- Número de provincias activas
- Ruta más transitada

## Uso del Componente

### Integración en el Módulo de Rutas

```typescript
// En rutas.component.ts o donde quieras usar el mapa
import { MapaRutasAvanzadoComponent } from './mapa-rutas-avanzado.component';

@Component({
  // ...
  imports: [
    // ... otros imports
    MapaRutasAvanzadoComponent
  ],
  template: `
    <!-- Agregar el componente donde desees -->
    <app-mapa-rutas-avanzado></app-mapa-rutas-avanzado>
  `
})
```

### Agregar como Pestaña en el Módulo de Rutas

```typescript
// En rutas.component.ts
template: `
  <mat-tab-group>
    <mat-tab label="Lista de Rutas">
      <!-- Contenido actual -->
    </mat-tab>
    
    <mat-tab label="Mapa de Rutas">
      <app-mapa-rutas-avanzado></app-mapa-rutas-avanzado>
    </mat-tab>
  </mat-tab-group>
`
```

## Coordenadas de Localidades

El componente incluye coordenadas aproximadas de las principales localidades:
- Puno
- Juliaca
- Yunguyo
- Desaguadero
- Ilave
- Juli
- Azángaro
- Ayaviri
- Lampa
- Huancané

### Agregar Más Localidades

Para agregar más localidades, edita el método `obtenerCoordenadas()`:

```typescript
private obtenerCoordenadas(localidad: string): [number, number] | null {
  const coordenadas: { [key: string]: [number, number] } = {
    'PUNO': [-15.8402, -70.0219],
    'NUEVA_LOCALIDAD': [latitud, longitud],
    // ... más localidades
  };
  // ...
}
```

## Personalización

### Cambiar Colores de Provincias

Edita el array `provincias` en el componente:

```typescript
provincias: ProvinciaDelimitacion[] = [
  {
    nombre: 'Puno',
    color: 'rgba(33, 150, 243, 0.3)', // Cambia este color
    // ...
  }
];
```

### Ajustar Intensidad del Heatmap

En el método `dibujarHeatmap()`, ajusta los umbrales:

```typescript
if (cantidad > 10) {  // Cambia estos valores
  // Alta intensidad
} else if (cantidad > 5) {
  // Media intensidad
}
```

## Mejoras Futuras Sugeridas

1. **Tooltips Interactivos**: Mostrar información al pasar el mouse
2. **Zoom y Pan**: Permitir acercar/alejar el mapa
3. **Exportar Imagen**: Descargar el mapa como PNG
4. **Animaciones**: Animar las rutas para mostrar flujo
5. **Integración con Leaflet/OpenStreetMap**: Para mapas más precisos
6. **Datos en Tiempo Real**: Actualización automática de estadísticas

## Dependencias

El componente usa solo Angular Material y Canvas nativo, sin dependencias externas adicionales.

## Notas Técnicas

- El mapa usa coordenadas geográficas (latitud, longitud)
- La conversión a píxeles se hace con el método `geoToPixel()`
- El canvas tiene tamaño fijo de 1200x800px (responsive con CSS)
- Las coordenadas son aproximadas y pueden ajustarse para mayor precisión

## Ejemplo de Uso Completo

```typescript
// 1. Importar el componente
import { MapaRutasAvanzadoComponent } from './mapa-rutas-avanzado.component';

// 2. Agregarlo a los imports
@Component({
  imports: [MapaRutasAvanzadoComponent]
})

// 3. Usarlo en el template
<app-mapa-rutas-avanzado></app-mapa-rutas-avanzado>
```

## Resultado

El componente mostrará:
- ✅ Mapa interactivo de Puno con provincias delimitadas
- ✅ Filtros para origen y destino
- ✅ Selector de tipo de vista
- ✅ Estadísticas en tiempo real
- ✅ Mapa de calor con intensidad de rutas
- ✅ Leyenda explicativa
- ✅ Diseño responsive y profesional

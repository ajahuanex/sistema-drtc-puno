# 🎨 Instalación de Dependencias para Mapa Mágico de Rutas

## Dependencias Necesarias

Se han agregado las siguientes librerías para mejorar la visualización de rutas:

1. **leaflet.markercluster** - Agrupa marcadores cercanos en clusters interactivos
2. **leaflet-polylinedecorator** - Agrega flechas y decoradores a las líneas de rutas
3. **@types/leaflet.markercluster** - Tipos de TypeScript para markercluster

## Instalación

Ejecuta el siguiente comando en la carpeta `frontend`:

```bash
npm install leaflet.markercluster@^1.5.3 leaflet-polylinedecorator@^1.6.0 @types/leaflet.markercluster@^1.5.4 --save
```

O simplemente:

```bash
npm install
```

## Características Implementadas ✨

### 1. 🎯 Marcadores Personalizados
- **Origen**: Marcador verde con icono "O" y efecto pulsante
- **Destino**: Marcador rojo con icono "D" y efecto pulsante
- **Paradas**: Marcadores naranjas numerados secuencialmente

### 2. 🌈 Líneas de Ruta Animadas
- Líneas con colores únicos basados en algoritmo de distribución uniforme
- Flechas direccionales para indicar sentido de la ruta
- Animación de trazado con efecto dash
- Popups informativos en cada línea

### 3. 🎭 Clusters Inteligentes
- Agrupa automáticamente marcadores cercanos
- Clusters con gradiente de color
- Expansión suave (spiderfy) al hacer clic
- Tamaños adaptativos según cantidad de marcadores

### 4. 📊 Panel de Estadísticas Flotante
- Rutas visibles en el mapa
- Conexiones dibujadas
- Paradas totales
- Actualización en tiempo real

### 5. ⚡ Controles Interactivos
- Toggle para mostrar/ocultar líneas de rutas
- Toggle para agrupar marcadores en clusters
- Toggle para mostrar itinerario completo
- Botón de animación de rutas

### 6. 🎬 Animaciones Suaves
- Efecto de entrada con slide-in
- Animación pulsante en marcadores activos
- Efecto de bounce en líneas al animar
- Transiciones suaves en todos los elementos

## Estilos CSS Aplicados

El componente incluye estilos personalizados para:
- Clusters con gradiente morado
- Popups con diseño moderno y gradientes
- Panel de información con backdrop blur
- Controles flotantes con hover effects
- Animaciones CSS para todos los elementos interactivos

## Uso

Una vez instaladas las dependencias, el componente estará listo para usar:

```typescript
<app-mapa-rutas [rutas]="listaDeRutas"></app-mapa-rutas>
```

## Controles del Usuario

Los usuarios pueden:
1. Hacer clic en cualquier marcador para ver detalles
2. Hacer clic en las líneas para ver información de la ruta
3. Alternar la visualización de elementos usando los botones flotantes
4. Animar todas las rutas con el botón de animación
5. Abrir vista de pantalla completa

## Rendimiento

El componente está optimizado para:
- Manejar miles de rutas simultáneamente
- Clustering automático para reducir carga visual
- Limpieza de capas al destruir el componente
- Actualización eficiente de estadísticas

## Próximas Mejoras Potenciales

- Filtros por empresa, tipo de ruta, estado
- Heatmap de densidad de rutas
- Búsqueda de rutas por código
- Exportar mapa como imagen
- Modo oscuro
- Tooltips con información adicional al hover

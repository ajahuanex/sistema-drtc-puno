# Capas del Mapa de Localidades

## Resumen
Se corrigió y completó la funcionalidad de capas en el modal del mapa de localidades para incluir todas las capas necesarias: polígonos, puntos de referencia y centros poblados.

## Cambios Realizados

### 1. Backend - Router de Geometrías (`backend/app/routers/geometrias.py`)

Se actualizó el endpoint `/geometrias/geojson` para soportar tipos especiales de geometrías:

**Tipos soportados:**
- `PROVINCIA`: Polígonos de provincias (desde colección `geometrias`)
- `DISTRITO`: Polígonos de distritos (desde colección `geometrias`)
- `PROVINCIA_POINT`: Puntos de referencia de provincias (desde colección `localidades`)
- `DISTRITO_POINT`: Puntos de referencia de distritos (desde colección `localidades`)
- `CENTRO_POBLADO`: Puntos de centros poblados (desde colección `localidades`)

**Lógica implementada:**
- Los tipos `PROVINCIA_POINT`, `DISTRITO_POINT` y `CENTRO_POBLADO` se obtienen de la colección `localidades` usando las coordenadas de cada localidad
- Los tipos `PROVINCIA` y `DISTRITO` se obtienen de la colección `geometrias` (polígonos)
- Todos los tipos soportan filtros por departamento, provincia y distrito

### 2. Frontend - Componente del Modal (`frontend/src/app/components/localidades/mapa-localidad-modal.component.ts`)

Se corrigió la lógica de control de capas:

**Cambios principales:**
1. Se eliminó el método `actualizarPuntosReferencia()` que causaba comportamiento automático no deseado
2. Cada capa ahora se controla independientemente con su checkbox
3. Se removieron las llamadas automáticas que mostraban/ocultaban capas sin intervención del usuario

**Capas disponibles:**
- ✅ Provincia (polígono) - Activada por defecto
- ✅ Distrito Actual (polígono) - Activada por defecto
- ✅ Todos los Distritos (polígonos) - Desactivada por defecto
- ✅ Puntos de Referencia - Desactivada por defecto
- ✅ Centros Poblados - Desactivada por defecto
- ✅ Mostrar Nombres (etiquetas) - Desactivada por defecto

## Endpoints del API

### Obtener Polígonos de Provincias
```
GET /api/v1/geometrias/geojson?tipo=PROVINCIA&departamento=PUNO
```

### Obtener Polígonos de Distritos
```
GET /api/v1/geometrias/geojson?tipo=DISTRITO&departamento=PUNO&provincia=PUNO
```

### Obtener Puntos de Referencia de Provincias
```
GET /api/v1/geometrias/geojson?tipo=PROVINCIA_POINT&departamento=PUNO
```

### Obtener Puntos de Referencia de Distritos
```
GET /api/v1/geometrias/geojson?tipo=DISTRITO_POINT&departamento=PUNO&provincia=PUNO
```

### Obtener Centros Poblados
```
GET /api/v1/geometrias/geojson?tipo=CENTRO_POBLADO&departamento=PUNO&provincia=PUNO&distrito=PUNO
```

## Pruebas

Se creó el script `backend/test_capas_mapa.py` para verificar todos los endpoints.

**Resultados de las pruebas:**
- ✅ Polígonos de Provincias: 13 features
- ✅ Polígonos de Distritos: 15 features (provincia PUNO)
- ✅ Puntos de Referencia - Provincias: 13 features
- ✅ Puntos de Referencia - Distritos: 15 features (provincia PUNO)
- ✅ Centros Poblados: 210 features (distrito PUNO)

## Estilos de las Capas

### Polígonos
- **Provincia**: Verde (#667eea / #764ba2) - Borde grueso, relleno transparente
- **Distrito Actual**: Verde (#4caf50 / #2e7d32) - Borde grueso, relleno semi-transparente
- **Otros Distritos**: Azul (#64b5f6 / #1976d2) - Borde fino, relleno muy transparente

### Puntos
- **Puntos de Provincia**: Marcador estándar (20x33px)
- **Puntos de Distrito**: Círculo morado (#9c27b0) - Radio 5px
- **Centros Poblados**: Círculo naranja (#ff9800) - Radio 3px

## Uso

1. Abrir el módulo de Localidades
2. Hacer clic en el botón de mapa de cualquier localidad
3. En modo pantalla completa, usar el panel de controles a la derecha
4. Activar/desactivar las capas según necesidad
5. Activar "Mostrar Nombres" para ver etiquetas permanentes

## Notas Técnicas

- Las capas se cargan bajo demanda (lazy loading)
- Los datos se cachean para evitar llamadas repetidas al API
- Los centros poblados filtran automáticamente la localidad actual para evitar marcadores duplicados
- Las etiquetas se pueden activar/desactivar dinámicamente sin recargar las capas

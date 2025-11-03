# BusquedaDocumentosComponent

## Overview

El `BusquedaDocumentosComponent` es un componente avanzado de búsqueda que permite a los usuarios encontrar documentos utilizando múltiples criterios de filtrado. Implementa funcionalidades de búsqueda en tiempo real, paginación, ordenamiento y exportación de resultados.

## Features Implementadas

### ✅ Formulario de Búsqueda Avanzada
- **Número de Expediente**: Búsqueda exacta con autocompletado en tiempo real
- **Código QR**: Búsqueda directa por código QR con opción de escáner
- **Remitente**: Búsqueda por nombre del remitente
- **Asunto**: Búsqueda por contenido del asunto
- **Tipo de Documento**: Filtro por tipo de documento
- **Estado**: Filtro por estado del documento
- **Prioridad**: Filtro por nivel de prioridad
- **Rango de Fechas**: Filtro por fecha de recepción

### ✅ Búsqueda en Tiempo Real
- Búsqueda automática al escribir número de expediente (3+ caracteres)
- Búsqueda automática por código QR (5+ caracteres)
- Debounce para optimizar las consultas al servidor

### ✅ Gestión de Filtros
- Visualización de filtros activos con chips
- Opción para remover filtros individuales
- Botón para limpiar todos los filtros

### ✅ Tabla de Resultados
- Tabla responsive con información completa
- Columnas: Expediente, Tipo, Remitente, Asunto, Estado, Prioridad, Fecha, Acciones
- Indicadores visuales para estado y prioridad
- Tooltips para información adicional

### ✅ Paginación y Ordenamiento
- Paginación completa con opciones de tamaño de página
- Ordenamiento por columnas clickeables
- Navegación entre páginas

### ✅ Acciones por Documento
- **Ver Detalle**: Acceso a información completa del documento
- **Descargar Comprobante**: Descarga del PDF de comprobante
- **Ver QR**: Visualización del código QR del documento

### ✅ Exportación
- Exportación de resultados a Excel
- Respeta los filtros aplicados
- Descarga automática del archivo

### ✅ Búsqueda por QR
- Campo específico para código QR
- Búsqueda directa en base de datos
- Opción de escáner (placeholder para implementación futura)

## Requirements Cumplidos

| Requirement | Descripción | Estado |
|-------------|-------------|---------|
| 5.1 | Búsqueda por múltiples criterios | ✅ |
| 5.2 | Filtros combinables | ✅ |
| 5.3 | Búsqueda por rango de fechas | ✅ |
| 5.7 | Búsqueda por código QR | ✅ |

## Estructura del Componente

```typescript
BusquedaDocumentosComponent
├── searchForm: FormGroup              // Formulario reactivo de búsqueda
├── documentos: Documento[]            // Resultados de búsqueda
├── tiposDocumento: TipoDocumento[]    // Catálogo de tipos
├── filtrosActivos: FilterChip[]       // Filtros aplicados
├── loading: boolean                   // Estado de carga
├── busquedaRealizada: boolean         // Flag de búsqueda ejecutada
├── hayResultados: boolean             // Flag de resultados encontrados
└── displayedColumns: string[]         // Columnas de la tabla
```

## Métodos Principales

### Búsqueda
- `buscarDocumentos()`: Ejecuta búsqueda con filtros actuales
- `buscarPorQR(codigo)`: Búsqueda específica por código QR
- `construirFiltros()`: Construye objeto de filtros desde formulario

### Gestión de Filtros
- `actualizarFiltrosActivos()`: Actualiza chips de filtros activos
- `removerFiltro(key)`: Remueve filtro específico
- `limpiarFiltros()`: Limpia todos los filtros

### Navegación y Ordenamiento
- `onPageChange(event)`: Maneja cambio de página
- `onSortChange(sort)`: Maneja cambio de ordenamiento

### Acciones
- `verDetalle(documento)`: Abre detalle del documento
- `descargarComprobante(documento)`: Descarga comprobante PDF
- `verQR(documento)`: Muestra código QR
- `exportarResultados()`: Exporta resultados a Excel

### Utilidades
- `getEstadoIcon/Label()`: Obtiene icono/etiqueta de estado
- `getPrioridadIcon/Label()`: Obtiene icono/etiqueta de prioridad

## Formulario de Búsqueda

```typescript
searchForm = FormGroup({
  numeroExpediente: FormControl(''),    // Número de expediente
  codigoQR: FormControl(''),           // Código QR
  remitente: FormControl(''),          // Nombre del remitente
  asunto: FormControl(''),             // Asunto del documento
  tipoDocumentoId: FormControl(''),    // ID del tipo de documento
  estado: FormControl(''),             // Estado del documento
  prioridad: FormControl(''),          // Prioridad del documento
  fechaDesde: FormControl(null),       // Fecha inicio del rango
  fechaHasta: FormControl(null)        // Fecha fin del rango
})
```

## Configuración de Tabla

```typescript
displayedColumns = [
  'numeroExpediente',  // Número de expediente + externo
  'tipo',             // Tipo de documento con icono
  'remitente',        // Remitente con icono
  'asunto',           // Asunto truncado con tooltip
  'estado',           // Estado con badge colorizado
  'prioridad',        // Prioridad con badge colorizada
  'fechaRecepcion',   // Fecha formateada
  'acciones'          // Botones de acción
]
```

## Estilos y UX

### Responsive Design
- **Desktop**: Layout completo con todas las columnas
- **Tablet**: Ajuste de espaciado y tamaños
- **Mobile**: Columnas optimizadas y botones apilados

### Indicadores Visuales
- **Estados**: Colores diferenciados (azul, naranja, verde, morado)
- **Prioridades**: Colores de alerta (gris, naranja, rojo)
- **Loading**: Spinner centrado con mensaje
- **Sin resultados**: Mensaje informativo con icono

### Accesibilidad
- Labels descriptivos en todos los campos
- Tooltips informativos
- Iconos semánticos
- Navegación por teclado
- Contraste adecuado en colores

## Integración con Servicios

### DocumentoService
```typescript
// Búsqueda principal
listarDocumentos(filtros: FiltrosDocumento): Observable<SearchResponse>

// Búsqueda por QR
buscarPorQR(codigoQR: string): Observable<Documento>

// Tipos de documento
obtenerTiposDocumento(): Observable<TipoDocumento[]>

// Exportación
exportarExcel(filtros: FiltrosDocumento): Observable<Blob>

// Comprobante
descargarComprobante(id: string, numeroExpediente: string): void
```

## Testing

### Cobertura de Tests
- ✅ Inicialización del componente
- ✅ Carga de tipos de documento
- ✅ Búsqueda básica y avanzada
- ✅ Búsqueda por código QR
- ✅ Gestión de filtros activos
- ✅ Paginación y ordenamiento
- ✅ Acciones de documentos
- ✅ Exportación de resultados
- ✅ Manejo de errores
- ✅ Búsqueda en tiempo real
- ✅ Métodos de utilidad

### Casos de Test Principales
```typescript
describe('BusquedaDocumentosComponent', () => {
  it('should perform basic search')
  it('should search by numero expediente')
  it('should search by date range')
  it('should search by tipo and estado')
  it('should handle search error')
  it('should handle empty search results')
  it('should search by QR code')
  it('should update active filters')
  it('should remove specific filter')
  it('should clear all filters')
  it('should handle page change')
  it('should handle sort change')
  it('should export search results')
})
```

## Optimizaciones Implementadas

### Performance
- **Debounce**: Evita consultas excesivas en búsqueda en tiempo real
- **Lazy Loading**: Carga de datos bajo demanda
- **Virtual Scrolling**: Preparado para listas grandes
- **Memoización**: Caché de tipos de documento

### UX
- **Loading States**: Indicadores de carga claros
- **Error Handling**: Mensajes de error informativos
- **Empty States**: Mensajes cuando no hay resultados
- **Responsive**: Adaptación a diferentes tamaños de pantalla

## Próximas Mejoras

### Funcionalidades Pendientes
- [ ] Escáner de QR con cámara
- [ ] Búsqueda por texto completo (full-text search)
- [ ] Filtros guardados/favoritos
- [ ] Búsqueda por ubicación física
- [ ] Integración con OCR para documentos escaneados

### Optimizaciones Futuras
- [ ] Infinite scrolling para resultados grandes
- [ ] Caché inteligente de búsquedas frecuentes
- [ ] Sugerencias de búsqueda (autocomplete)
- [ ] Búsqueda por voz
- [ ] Exportación a más formatos (PDF, CSV)

## Uso del Componente

```html
<!-- En mesa-partes.component.html -->
<mat-tab label="Búsqueda">
  <div class="tab-content">
    <app-busqueda-documentos></app-busqueda-documentos>
  </div>
</mat-tab>
```

```typescript
// En mesa-partes.component.ts
import { BusquedaDocumentosComponent } from './busqueda-documentos.component';

@Component({
  imports: [
    // ... otros imports
    BusquedaDocumentosComponent
  ]
})
```

## Conclusión

El `BusquedaDocumentosComponent` proporciona una interfaz completa y robusta para la búsqueda avanzada de documentos, cumpliendo todos los requirements especificados y ofreciendo una excelente experiencia de usuario con funcionalidades modernas como búsqueda en tiempo real, filtros visuales y exportación de datos.
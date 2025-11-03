# ListaDocumentosComponent - Documentación

## Descripción General

El componente `ListaDocumentosComponent` proporciona una interfaz completa para listar, filtrar, ordenar y exportar documentos del sistema de Mesa de Partes. Implementa las funcionalidades especificadas en los requirements 5.1, 5.2, 5.3, 5.4 y 5.6.

## Características Implementadas

### 1. Tabla de Documentos (Task 6.1)
- ✅ Tabla implementada con Angular Material Table
- ✅ Columnas: Expediente, Tipo, Remitente, Asunto, Estado, Prioridad, Fecha, Acciones
- ✅ Paginación con opciones de 10, 25, 50, 100 registros por página
- ✅ Ordenamiento por columnas (simple y múltiple)
- ✅ Indicadores visuales de estado y prioridad
- ✅ Resaltado de documentos urgentes

### 2. Filtros y Búsqueda (Task 6.2)
- ✅ Búsqueda rápida por expediente, remitente o asunto
- ✅ Filtros avanzados por:
  - Estado (múltiple selección)
  - Tipo de documento
  - Prioridad (múltiple selección)
  - Remitente
  - Asunto
  - Número de expediente
  - Rango de fechas
- ✅ Panel expandible de filtros avanzados
- ✅ Chips de filtros activos con opción de remover
- ✅ Contador de filtros aplicados

### 3. Acciones y Exportación (Task 6.3)
- ✅ Botones de acción por fila:
  - Ver detalle
  - Derivar documento
  - Archivar documento
- ✅ Exportación a Excel
- ✅ Exportación a PDF
- ✅ Botón de refrescar lista
- ✅ Contador de resultados

## Componentes Relacionados

### DocumentosFiltrosComponent
Componente separado que maneja todos los filtros de búsqueda:
- Búsqueda rápida con debounce
- Filtros avanzados en panel expandible
- Gestión de filtros activos
- Integración con DateRangePickerComponent

## Uso del Componente

```typescript
<app-lista-documentos
  [filtros]="filtrosIniciales"
  [soloMiArea]="false"
  (documentoSeleccionado)="onDocumentoSeleccionado($event)"
  (derivarDocumento)="onDerivarDocumento($event)"
  (archivarDocumento)="onArchivarDocumento($event)">
</app-lista-documentos>
```

### Inputs

- `filtros?: FiltrosDocumento` - Filtros iniciales a aplicar
- `soloMiArea?: boolean` - Si debe mostrar solo documentos del área del usuario (default: false)

### Outputs

- `documentoSeleccionado: EventEmitter<Documento>` - Se emite cuando se selecciona un documento
- `derivarDocumento: EventEmitter<Documento>` - Se emite cuando se solicita derivar un documento
- `archivarDocumento: EventEmitter<Documento>` - Se emite cuando se solicita archivar un documento

## Características Técnicas

### Ordenamiento
- Implementa ordenamiento simple (click) y múltiple (Ctrl+click)
- Utiliza el componente reutilizable `SortableHeaderComponent`
- Mantiene el estado de ordenamiento con signals
- Aplica ordenamiento local en los datos cargados

### Paginación
- Paginación del lado del servidor
- Opciones configurables de registros por página
- Navegación con botones de primera/última página
- Reseteo automático a página 1 al cambiar filtros

### Filtros
- Componente separado para mejor organización
- Búsqueda rápida con debounce de 300ms
- Filtros avanzados en panel expandible
- Chips visuales de filtros activos
- Contador de filtros aplicados

### Exportación
- Exportación a Excel (.xlsx)
- Exportación a PDF
- Respeta los filtros aplicados
- Indicador de estado durante exportación
- Descarga automática del archivo

### Estados Visuales
- Loading spinner durante carga
- Mensaje de error con opción de reintentar
- Estado vacío cuando no hay resultados
- Indicadores de prioridad con colores
- Badges de estado con colores semánticos
- Resaltado de documentos urgentes
- Indicador de documentos vencidos

## Estilos y Diseño

### Responsive
- Diseño adaptable a diferentes tamaños de pantalla
- Ajuste de columnas en tablets y móviles
- Reorganización de controles en pantallas pequeñas

### Accesibilidad
- Tooltips informativos en botones
- Aria labels en elementos interactivos
- Navegación por teclado
- Contraste adecuado de colores

### Colores de Estado
- **Registrado**: Azul (#1976d2)
- **En Proceso**: Naranja (#f57c00)
- **Atendido**: Verde (#388e3c)
- **Archivado**: Gris (#757575)

### Colores de Prioridad
- **Normal**: Gris (#757575)
- **Alta**: Naranja (#ff9800)
- **Urgente**: Rojo (#f44336)

## Integración con Servicios

### DocumentoService
- `listarDocumentos()` - Obtiene lista paginada con filtros
- `exportarExcel()` - Genera archivo Excel
- `exportarPDF()` - Genera archivo PDF
- `obtenerTiposDocumento()` - Obtiene catálogo de tipos

## Mejoras Futuras

1. **Selección múltiple**: Permitir seleccionar varios documentos para acciones en lote
2. **Columnas configurables**: Permitir al usuario elegir qué columnas mostrar
3. **Guardado de filtros**: Guardar configuraciones de filtros favoritas
4. **Vista de tarjetas**: Opción alternativa de visualización en tarjetas
5. **Búsqueda por QR**: Integrar escáner de códigos QR
6. **Notificaciones**: Mostrar notificaciones toast al exportar o realizar acciones

## Dependencias

- Angular Material (Table, Paginator, Menu, etc.)
- RxJS para manejo de observables
- Componentes compartidos:
  - `SortableHeaderComponent`
  - `DateRangePickerComponent`
  - `DocumentosFiltrosComponent`

## Testing

Para probar el componente:

1. Verificar carga inicial de documentos
2. Probar ordenamiento por diferentes columnas
3. Aplicar diferentes combinaciones de filtros
4. Verificar paginación
5. Probar exportación a Excel y PDF
6. Verificar acciones de ver, derivar y archivar
7. Probar responsive en diferentes tamaños de pantalla

## Notas de Implementación

- El componente utiliza signals de Angular para manejo de estado reactivo
- La búsqueda rápida tiene un debounce de 300ms para optimizar peticiones
- El ordenamiento se aplica localmente sobre los datos cargados
- Los filtros se combinan con los filtros iniciales pasados como Input
- La exportación respeta todos los filtros aplicados, no solo la página actual

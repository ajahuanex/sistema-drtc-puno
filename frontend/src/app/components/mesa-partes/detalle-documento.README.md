# DetalleDocumentoComponent

## Overview

Componente standalone de Angular que muestra el detalle completo de un documento de mesa de partes, incluyendo toda su información, archivos adjuntos, historial de derivaciones y notas.

## Requirements Implemented

- **5.4**: Vista detallada de documentos con toda su información
- **5.5**: Visualización de archivos adjuntos con opciones de descarga
- **3.5**: Historial completo de derivaciones
- **3.6**: Timeline visual de movimientos del documento

## Features

### 1. Información Completa del Documento
- Número de expediente con badges de estado y prioridad
- Tipo de documento y número externo
- Remitente y asunto
- Fechas de recepción y límite (con indicador de vencimiento)
- Número de folios y anexos
- Usuario que registró el documento
- Ubicación actual (área)
- Etiquetas asociadas

### 2. Archivos Adjuntos
- Lista de todos los archivos adjuntos
- Iconos diferenciados por tipo de archivo (PDF, imagen, Word, Excel, etc.)
- Tamaño de archivo formateado
- Fecha de subida
- Botones de descarga
- Vista previa para imágenes

### 3. Historial de Derivaciones (Timeline)
- Timeline visual con marcadores de estado
- Información de cada derivación:
  - Área origen y destino
  - Usuario que derivó
  - Instrucciones
  - Fechas de derivación, recepción y atención
  - Estado actual
  - Indicador de urgencia
  - Observaciones

### 4. Notas y Observaciones
- Lista de notas registradas
- Autor y fecha de cada nota
- Formulario para agregar nuevas notas
- Validación de contenido

### 5. Acciones Según Permisos
- Botón de derivar (configurable)
- Botón de archivar (configurable)
- Descarga de comprobante de recepción
- Botón de cerrar

## Usage

### Basic Usage

```typescript
<app-detalle-documento
  [documentoId]="selectedDocumentoId"
  (accionRealizada)="onAccionRealizada($event)"
  (cerrar)="onCerrarDetalle()">
</app-detalle-documento>
```

### With Custom Permissions

```typescript
<app-detalle-documento
  [documentoId]="selectedDocumentoId"
  [puedeDerivار]="userCanDerive"
  [puedeArchivar]="userCanArchive"
  [puedeAgregarNota]="userCanAddNotes"
  (accionRealizada)="onAccionRealizada($event)"
  (cerrar)="onCerrarDetalle()">
</app-detalle-documento>
```

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `documentoId` | `string` | - | ID del documento a mostrar (requerido) |
| `puedeDerivار` | `boolean` | `true` | Permiso para derivar el documento |
| `puedeArchivar` | `boolean` | `true` | Permiso para archivar el documento |
| `puedeAgregarNota` | `boolean` | `true` | Permiso para agregar notas |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `accionRealizada` | `EventEmitter<string>` | Emite cuando se realiza una acción ('derivar', 'archivar', 'nota-agregada') |
| `cerrar` | `EventEmitter<void>` | Emite cuando se cierra el detalle |

## Component Structure

```
DetalleDocumentoComponent
├── Header
│   ├── Expediente Info (número, badges)
│   └── Action Buttons (derivar, archivar, comprobante, cerrar)
├── Content
│   ├── Información del Documento
│   │   └── Grid con todos los campos
│   ├── Archivos Adjuntos
│   │   └── Lista de archivos con acciones
│   ├── Historial de Derivaciones
│   │   └── Timeline con derivaciones
│   └── Notas y Observaciones
│       ├── Lista de notas
│       └── Formulario para nueva nota
└── States
    ├── Loading State
    └── Error State
```

## Styling

El componente incluye estilos completos con:
- Diseño responsive (mobile-first)
- Sistema de colores consistente para estados y prioridades
- Timeline visual con marcadores de estado
- Badges y etiquetas con colores semánticos
- Hover effects y transiciones suaves
- Estados de carga y error

### Color Scheme

**Estados:**
- Registrado: Azul (#1976d2)
- En Proceso: Naranja (#f57c00)
- Atendido: Verde (#388e3c)
- Archivado: Gris (#757575)

**Prioridades:**
- Normal: Gris (#616161)
- Alta: Naranja (#f57c00)
- Urgente: Rojo (#c62828)

## Methods

### Public Methods

- `cargarDocumento()`: Carga el documento desde el servicio
- `cargarHistorial()`: Carga el historial de derivaciones
- `onDerivar()`: Emite evento para derivar documento
- `onArchivar()`: Emite evento para archivar documento (con confirmación)
- `onDescargarComprobante()`: Descarga el comprobante de recepción
- `onDescargarArchivo(archivo)`: Descarga un archivo adjunto
- `onVerArchivo(archivo)`: Abre un archivo en nueva ventana
- `onAgregarNota()`: Agrega una nueva nota
- `onCerrar()`: Emite evento de cierre

### Utility Methods

- `getEstadoClass(estado)`: Retorna clase CSS para el estado
- `getEstadoLabel(estado)`: Retorna etiqueta legible del estado
- `getPrioridadClass(prioridad)`: Retorna clase CSS para la prioridad
- `getPrioridadLabel(prioridad)`: Retorna etiqueta legible de la prioridad
- `estaVencido()`: Verifica si el documento está vencido
- `getArchivoIcon(tipoMime)`: Retorna icono según tipo de archivo
- `esImagen(tipoMime)`: Verifica si el archivo es una imagen
- `formatFileSize(bytes)`: Formatea el tamaño del archivo
- `getDerivacionEstadoClass(estado)`: Retorna clase CSS para estado de derivación
- `getDerivacionIcon(estado)`: Retorna icono para estado de derivación

## Dependencies

- `@angular/common`: CommonModule
- `@angular/forms`: FormsModule
- `DocumentoService`: Servicio para operaciones de documentos
- `DerivacionService`: Servicio para operaciones de derivaciones
- Font Awesome: Para iconos

## Testing

El componente incluye tests completos que cubren:
- Inicialización y carga de datos
- Manejo de errores
- Etiquetas y clases de estado/prioridad
- Manejo de archivos
- Detección de documentos vencidos
- Acciones del usuario
- Sistema de notas
- Permisos y configuración

Para ejecutar los tests:

```bash
npm test -- detalle-documento.component.spec.ts
```

## Responsive Design

El componente es completamente responsive:
- Desktop: Layout de dos columnas en grid
- Tablet: Layout adaptativo
- Mobile: Layout de una columna con botones apilados

## Accessibility

- Uso semántico de HTML
- Labels descriptivos
- Títulos en botones (tooltips)
- Indicadores visuales claros
- Contraste de colores adecuado

## Future Enhancements

- [ ] Integración con sistema de autenticación para notas
- [ ] Persistencia de notas en backend
- [ ] Vista previa de archivos en modal
- [ ] Edición inline de información del documento
- [ ] Impresión del detalle completo
- [ ] Exportación a PDF del historial
- [ ] Notificaciones en tiempo real de cambios

## Related Components

- `RegistroDocumentoComponent`: Para crear documentos
- `ListaDocumentosComponent`: Para listar documentos
- `DerivarDocumentoComponent`: Para derivar documentos

## Related Services

- `DocumentoService`: CRUD de documentos
- `DerivacionService`: Gestión de derivaciones

## Notes

- El componente es standalone y puede ser usado independientemente
- Requiere que se proporcione un `documentoId` válido
- Los permisos son configurables mediante inputs
- Las acciones se comunican mediante eventos para máxima flexibilidad
- El sistema de notas está preparado para integración con backend

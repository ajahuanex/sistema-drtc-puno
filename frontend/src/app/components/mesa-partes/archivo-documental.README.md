# Archivo Documental - Sistema de Mesa de Partes

## Overview

El módulo de Archivo Documental permite gestionar el archivado de documentos finalizados, implementando políticas de retención y facilitando la búsqueda y restauración de documentos archivados.

**Requirements:** 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7

## Components

### ArchivoDocumentalComponent

Componente principal que muestra la lista de documentos archivados con capacidades de búsqueda y filtrado.

**Features:**
- Lista paginada de documentos archivados
- Filtros por clasificación, política de retención, fechas, estado
- Búsqueda por expediente, remitente, asunto
- Indicadores visuales de documentos próximos a expirar
- Acciones: ver detalle, editar ubicación, restaurar documento

**Usage:**
```typescript
<app-archivo-documental></app-archivo-documental>
```

### ArchivarDocumentoModalComponent

Modal para archivar un documento atendido.

**Features:**
- Selección de clasificación de archivo
- Selección de política de retención
- Especificación de ubicación física
- Motivo y observaciones del archivado
- Generación automática de código de ubicación

**Usage:**
```typescript
const dialogRef = this.dialog.open(ArchivarDocumentoModalComponent, {
  width: '600px',
  data: { documentoId: 'doc-123' }
});

dialogRef.afterClosed().subscribe(result => {
  if (result) {
    // Documento archivado exitosamente
  }
});
```

### RestaurarDocumentoModalComponent

Modal para restaurar un documento archivado.

**Features:**
- Visualización de información del archivo
- Campo obligatorio de motivo de restauración
- Advertencia sobre el cambio de estado
- Registro de la acción en el historial

**Usage:**
```typescript
const dialogRef = this.dialog.open(RestaurarDocumentoModalComponent, {
  width: '500px',
  data: { archivo: archivoObject }
});

dialogRef.afterClosed().subscribe(result => {
  if (result) {
    // Documento restaurado exitosamente
  }
});
```

## Services

### ArchivoService

Servicio para operaciones de archivo.

**Methods:**

#### archivarDocumento(archivoData: ArchivoCreate): Observable<Archivo>
Archiva un documento atendido.

**Requirements:** 9.1, 9.2, 9.3

```typescript
const archivoData: ArchivoCreate = {
  documento_id: 'doc-123',
  clasificacion: ClasificacionArchivoEnum.TRAMITE_DOCUMENTARIO,
  politica_retencion: PoliticaRetencionEnum.CINCO_ANOS,
  ubicacion_fisica: 'Estante A, Caja 15',
  observaciones: 'Documento archivado correctamente',
  motivo_archivo: 'Trámite finalizado'
};

this.archivoService.archivarDocumento(archivoData).subscribe({
  next: (archivo) => {
    console.log('Documento archivado:', archivo.codigo_ubicacion);
  },
  error: (error) => {
    console.error('Error:', error);
  }
});
```

#### listarArchivos(filtros: FiltrosArchivo): Observable<ArchivoListResponse>
Lista documentos archivados con filtros.

**Requirements:** 9.3, 9.4, 9.5

```typescript
const filtros: FiltrosArchivo = {
  clasificacion: ClasificacionArchivoEnum.LEGAL,
  activo: 'ARCHIVADO',
  page: 1,
  size: 20
};

this.archivoService.listarArchivos(filtros).subscribe({
  next: (response) => {
    console.log('Archivos:', response.items);
    console.log('Total:', response.total);
  }
});
```

#### restaurarDocumento(archivoId: string, restaurarData: ArchivoRestaurar): Observable<Archivo>
Restaura un documento archivado.

**Requirements:** 9.5

```typescript
const restaurarData: ArchivoRestaurar = {
  motivo_restauracion: 'Se requiere revisar el documento nuevamente'
};

this.archivoService.restaurarDocumento('archivo-123', restaurarData).subscribe({
  next: (archivo) => {
    console.log('Documento restaurado:', archivo);
  }
});
```

#### obtenerProximosAExpirar(dias: number): Observable<Archivo[]>
Obtiene documentos próximos a expirar su retención.

**Requirements:** 9.6

```typescript
this.archivoService.obtenerProximosAExpirar(30).subscribe({
  next: (archivos) => {
    console.log('Documentos próximos a expirar:', archivos.length);
  }
});
```

## Models

### Archivo
```typescript
interface Archivo {
  id: string;
  documento_id: string;
  clasificacion: ClasificacionArchivoEnum;
  politica_retencion: PoliticaRetencionEnum;
  codigo_ubicacion: string;  // Ej: EST-TD-2025-0001
  ubicacion_fisica?: string;
  fecha_archivado: Date;
  fecha_expiracion_retencion?: Date;
  usuario_archivo_id: string;
  observaciones?: string;
  motivo_archivo?: string;
  activo: string;  // ARCHIVADO, RESTAURADO
  fecha_restauracion?: Date;
  usuario_restauracion_id?: string;
  motivo_restauracion?: string;
}
```

### ClasificacionArchivoEnum
```typescript
enum ClasificacionArchivoEnum {
  TRAMITE_DOCUMENTARIO = 'TRAMITE_DOCUMENTARIO',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  LEGAL = 'LEGAL',
  CONTABLE = 'CONTABLE',
  RECURSOS_HUMANOS = 'RECURSOS_HUMANOS',
  TECNICO = 'TECNICO',
  OTROS = 'OTROS'
}
```

### PoliticaRetencionEnum
```typescript
enum PoliticaRetencionEnum {
  PERMANENTE = 'PERMANENTE',    // Sin fecha de expiración
  DIEZ_ANOS = 'DIEZ_ANOS',      // 10 años
  CINCO_ANOS = 'CINCO_ANOS',    // 5 años
  TRES_ANOS = 'TRES_ANOS',      // 3 años
  UN_ANO = 'UN_ANO'             // 1 año
}
```

## Código de Ubicación

El sistema genera automáticamente códigos de ubicación únicos con el formato:

```
EST-{CLASIFICACION}-{AÑO}-{SECUENCIA}
```

**Ejemplos:**
- `EST-TD-2025-0001` - Trámite Documentario
- `EST-LG-2025-0042` - Legal
- `EST-AD-2025-0123` - Administrativo

**Códigos de Clasificación:**
- TD: Trámite Documentario
- AD: Administrativo
- LG: Legal
- CT: Contable
- RH: Recursos Humanos
- TC: Técnico
- OT: Otros

## Políticas de Retención

Las políticas de retención determinan cuánto tiempo se conserva un documento:

| Política | Duración | Fecha Expiración |
|----------|----------|------------------|
| PERMANENTE | Indefinida | Ninguna |
| DIEZ_ANOS | 10 años | Fecha archivado + 10 años |
| CINCO_ANOS | 5 años | Fecha archivado + 5 años |
| TRES_ANOS | 3 años | Fecha archivado + 3 años |
| UN_ANO | 1 año | Fecha archivado + 1 año |

## Workflow

### Archivar un Documento

1. El documento debe estar en estado `ATENDIDO`
2. Abrir modal de archivado desde el detalle del documento
3. Seleccionar clasificación y política de retención
4. Especificar ubicación física (opcional)
5. Agregar motivo y observaciones
6. Confirmar archivado
7. El sistema genera código de ubicación automáticamente
8. El documento pasa a estado `ARCHIVADO`

### Buscar Documentos Archivados

1. Acceder al módulo de Archivo Documental
2. Aplicar filtros según necesidad:
   - Clasificación
   - Política de retención
   - Rango de fechas
   - Código de ubicación
   - Búsqueda por expediente/remitente/asunto
3. Ver resultados paginados
4. Acceder a detalles o realizar acciones

### Restaurar un Documento

1. Buscar el documento archivado
2. Hacer clic en el botón "Restaurar"
3. Ingresar motivo de restauración (mínimo 10 caracteres)
4. Confirmar restauración
5. El documento vuelve a estado `EN_PROCESO`
6. El registro de archivo se marca como `RESTAURADO`

## Alertas y Notificaciones

### Documentos Próximos a Expirar

El sistema identifica documentos cuya política de retención expirará en los próximos 30 días:

```typescript
this.archivoService.obtenerProximosAExpirar(30).subscribe({
  next: (archivos) => {
    // Mostrar alertas
  }
});
```

### Documentos Expirados

Documentos cuya política de retención ya expiró:

```typescript
this.archivoService.obtenerExpirados().subscribe({
  next: (archivos) => {
    // Procesar documentos expirados
  }
});
```

## Integration with Mesa de Partes

El módulo de archivo se integra con el sistema de Mesa de Partes:

1. **Desde Detalle de Documento:**
   - Botón "Archivar" disponible para documentos ATENDIDOS
   - Abre modal de archivado

2. **Desde Lista de Documentos:**
   - Filtro para ver solo documentos archivados
   - Acción rápida de archivado

3. **Dashboard:**
   - Estadísticas de documentos archivados
   - Alertas de documentos próximos a expirar

## Backend API Endpoints

### POST /api/v1/mesa-partes/archivo/
Archivar un documento

### GET /api/v1/mesa-partes/archivo/
Listar archivos con filtros

### GET /api/v1/mesa-partes/archivo/{archivo_id}
Obtener archivo por ID

### GET /api/v1/mesa-partes/archivo/documento/{documento_id}
Obtener archivo por documento ID

### GET /api/v1/mesa-partes/archivo/codigo/{codigo_ubicacion}
Obtener archivo por código de ubicación

### PUT /api/v1/mesa-partes/archivo/{archivo_id}
Actualizar información de archivo

### POST /api/v1/mesa-partes/archivo/{archivo_id}/restaurar
Restaurar documento archivado

### GET /api/v1/mesa-partes/archivo/estadisticas/general
Obtener estadísticas de archivo

### GET /api/v1/mesa-partes/archivo/alertas/proximos-a-expirar
Obtener documentos próximos a expirar

### GET /api/v1/mesa-partes/archivo/alertas/expirados
Obtener documentos expirados

## Testing

### Unit Tests

```bash
# Run component tests
ng test --include='**/archivo-documental.component.spec.ts'

# Run service tests
ng test --include='**/archivo.service.spec.ts'
```

### Backend Tests

```bash
# Run archivo router tests
pytest backend/app/routers/mesa_partes/test_archivo_router.py -v
```

## Best Practices

1. **Archivar solo documentos ATENDIDOS:** Asegurarse de que el trámite esté completamente finalizado
2. **Especificar ubicación física:** Facilita la localización de documentos físicos
3. **Usar clasificaciones apropiadas:** Ayuda en la organización y búsqueda
4. **Documentar motivos:** Tanto para archivado como para restauración
5. **Revisar políticas de retención:** Asegurarse de cumplir con normativas legales
6. **Monitorear expiraciones:** Revisar regularmente documentos próximos a expirar
7. **Mantener códigos de ubicación:** No modificar manualmente los códigos generados

## Future Enhancements

- Exportación de inventario de archivo
- Generación de etiquetas con códigos de barras
- Integración con sistema de gestión de espacios físicos
- Notificaciones automáticas de expiraciones
- Workflow de aprobación para restauraciones
- Auditoría detallada de movimientos de archivo
- Reportes de ocupación de espacios físicos

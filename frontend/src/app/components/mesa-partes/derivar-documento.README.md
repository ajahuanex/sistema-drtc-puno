# DerivarDocumentoComponent

## Descripción

Componente modal para derivar documentos a una o múltiples áreas. Permite configurar opciones de derivación como urgencia, fecha límite y notificaciones por email.

## Características Implementadas

### Subtask 8.1: Modal de Derivación
- ✅ Componente modal con MatDialog
- ✅ Formulario reactivo de derivación
- ✅ Selector de área destino con opción múltiple
- ✅ Campo de instrucciones/notas con validación

### Subtask 8.2: Opciones de Derivación
- ✅ Checkbox para marcar como urgente
- ✅ Selector de fecha límite de atención
- ✅ Opción de notificar por email
- ✅ Confirmación antes de derivar
- ✅ Mensaje de éxito con número de derivación

## Uso

### Abrir el Modal

```typescript
import { MatDialog } from '@angular/material/dialog';
import { DerivarDocumentoComponent, DerivarDocumentoDialogData } from './derivar-documento.component';

constructor(private dialog: MatDialog) {}

derivarDocumento(documento: Documento, areas: Area[]): void {
  const dialogData: DerivarDocumentoDialogData = {
    documento: documento,
    areasDisponibles: areas
  };

  const dialogRef = this.dialog.open(DerivarDocumentoComponent, {
    width: '800px',
    maxHeight: '90vh',
    data: dialogData,
    disableClose: false
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('Derivación exitosa:', result);
      // Actualizar la lista de documentos o realizar otras acciones
    }
  });
}
```

### Datos de Entrada

```typescript
export interface DerivarDocumentoDialogData {
  documento: Documento;           // Documento a derivar
  areasDisponibles: Area[];       // Lista de áreas disponibles
}
```

### Datos de Salida

El modal retorna:
- Un objeto `Derivacion` si se deriva a una sola área
- Un array de objetos `Derivacion[]` si se deriva a múltiples áreas
- `undefined` si se cancela la operación

## Estructura del Formulario

```typescript
{
  areasDestinoIds: string[];      // IDs de las áreas destino (requerido)
  instrucciones: string;          // Instrucciones para el área (requerido, min 10 caracteres)
  esUrgente: boolean;             // Marcar como urgente (opcional)
  fechaLimite: Date;              // Fecha límite de atención (opcional)
  notificarEmail: boolean;        // Notificar por email (opcional, default: true)
}
```

## Validaciones

1. **Áreas Destino**: Al menos un área debe ser seleccionada
2. **Instrucciones**: Campo obligatorio con mínimo 10 caracteres
3. **Fecha Límite**: Debe ser posterior a la fecha actual (si se especifica)

## Flujo de Derivación

1. Usuario selecciona una o más áreas destino
2. Usuario ingresa instrucciones
3. Usuario configura opciones adicionales (urgente, fecha límite, email)
4. Usuario hace clic en "Derivar Documento"
5. Sistema muestra confirmación con resumen
6. Usuario confirma la derivación
7. Sistema procesa la derivación:
   - Si es una sola área: crea una derivación
   - Si son múltiples áreas: crea una derivación por cada área
8. Sistema muestra mensaje de éxito con ID de derivación
9. Modal se cierra y retorna el resultado

## Características Especiales

### Derivación Múltiple

El componente soporta derivar a múltiples áreas simultáneamente:
- Crea una derivación independiente para cada área
- Muestra progreso durante el proceso
- Maneja errores parciales (algunas exitosas, otras con error)
- Retorna array con todas las derivaciones creadas

### Confirmación

Antes de ejecutar la derivación, el sistema muestra:
- Número de expediente del documento
- Cantidad de áreas a las que se derivará
- Indicador si es urgente
- Opción de volver atrás o confirmar

### Notificaciones

El componente muestra diferentes tipos de mensajes:
- ✓ Éxito: Derivación exitosa a una área
- ✓ Éxito múltiple: Derivaciones exitosas a N áreas
- ⚠ Advertencia: Algunas derivaciones exitosas, otras con error
- ✗ Error: Fallo en la derivación

## Estilos y UI

### Información del Documento

Muestra un card con:
- Número de expediente
- Tipo de documento
- Remitente
- Asunto
- Estado actual
- Prioridad

### Áreas Seleccionadas

Muestra chips visuales con:
- Icono de área
- Nombre del área
- Código del área (si existe)

### Indicadores Visuales

- **Urgente**: Fondo naranja con icono de advertencia
- **Email**: Fondo verde con icono de email
- **Confirmación**: Fondo naranja con icono de pregunta

## Testing

El componente incluye tests unitarios completos que cubren:
- Inicialización del componente
- Validaciones del formulario
- Selección de áreas
- Derivación a una área
- Derivación a múltiples áreas
- Manejo de errores
- Confirmación y cancelación
- Estados de carga

### Ejecutar Tests

```bash
ng test --include='**/derivar-documento.component.spec.ts'
```

## Dependencias

- `@angular/material/dialog` - Modal
- `@angular/material/form-field` - Campos de formulario
- `@angular/material/select` - Selector de áreas
- `@angular/material/checkbox` - Checkboxes
- `@angular/material/datepicker` - Selector de fecha
- `@angular/material/snack-bar` - Notificaciones
- `@angular/forms` - Formularios reactivos

## Servicios Utilizados

- `DerivacionService` - Servicio para crear derivaciones
- `MatSnackBar` - Servicio para mostrar notificaciones

## Modelos Utilizados

- `Documento` - Modelo del documento
- `Area` - Modelo del área
- `Derivacion` - Modelo de la derivación
- `DerivacionCreate` - DTO para crear derivación

## Mejoras Futuras

1. Agregar vista previa de archivos adjuntos del documento
2. Permitir agregar archivos adicionales en la derivación
3. Implementar plantillas de instrucciones predefinidas
4. Agregar historial de derivaciones previas del documento
5. Permitir derivar con copia a otras áreas
6. Implementar recordatorios automáticos
7. Agregar opción de derivación programada

## Notas de Implementación

- El componente usa signals de Angular para manejo de estado reactivo
- Implementa standalone component pattern
- Usa Material Design para UI consistente
- Maneja múltiples derivaciones de forma asíncrona
- Incluye manejo robusto de errores
- Soporta validaciones en tiempo real

## Requisitos Cumplidos

### Requirement 3.1
✅ WHEN un documento está registrado THEN el sistema SHALL permitir derivarlo a una o múltiples áreas/oficinas

### Requirement 3.2
✅ WHEN se deriva un documento THEN el sistema SHALL requerir una nota o instrucción de derivación

### Requirement 3.3
✅ WHEN se deriva un documento THEN el sistema SHALL notificar automáticamente al área receptora por email y en el sistema

### Requirement 3.7
✅ IF un documento excede su fecha límite THEN el sistema SHALL generar alertas automáticas

## Autor

Implementado como parte del Módulo de Mesa de Partes - Task 8

# Ejemplo de Uso del Modal de Vehículo

## Importar el Servicio

```typescript
import { VehiculoModalService } from '../../services/vehiculo-modal.service';

export class MiComponente {
  private vehiculoModalService = inject(VehiculoModalService);
  
  // ... resto del código
}
```

## Crear un Nuevo Vehículo

### Vehículo Genérico
```typescript
nuevoVehiculo() {
  this.vehiculoModalService.openCreateModal().subscribe({
    next: (vehiculo) => {
      console.log('Vehículo creado:', vehiculo);
      // Recargar datos o mostrar mensaje de éxito
    },
    error: (error) => {
      console.error('Error al crear vehículo:', error);
    }
  });
}
```

### Vehículo para una Empresa Específica
```typescript
nuevoVehiculoParaEmpresa(empresaId: string) {
  this.vehiculoModalService.openCreateForEmpresa(empresaId).subscribe({
    next: (vehiculo) => {
      console.log('Vehículo creado para empresa:', vehiculo);
      // El modal se abrirá con la empresa pre-seleccionada
    }
  });
}
```

### Vehículo para una Resolución Específica
```typescript
nuevoVehiculoParaResolucion(empresaId: string, resolucionId: string) {
  this.vehiculoModalService.openCreateForResolucion(empresaId, resolucionId).subscribe({
    next: (vehiculo) => {
      console.log('Vehículo creado para resolución:', vehiculo);
      // El modal se abrirá con empresa y resolución pre-seleccionadas
    }
  });
}
```

## Editar un Vehículo Existente

```typescript
editarVehiculo(vehiculo: Vehiculo) {
  this.vehiculoModalService.openEditModal(vehiculo).subscribe({
    next: (vehiculoActualizado) => {
      console.log('Vehículo actualizado:', vehiculoActualizado);
      // Recargar datos o mostrar mensaje de éxito
    },
    error: (error) => {
      console.error('Error al actualizar vehículo:', error);
    }
  });
}
```

## Ejemplo Completo en un Componente

```typescript
import { Component, inject } from '@angular/core';
import { VehiculoModalService } from '../../services/vehiculo-modal.service';
import { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../../models/vehiculo.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-mi-componente',
  template: `
    <div class="actions">
      <button mat-raised-button color="primary" (click)="nuevoVehiculo()">
        <mat-icon>add</mat-icon>
        Nuevo Vehículo
      </button>
      
      <button mat-raised-button color="accent" (click)="nuevoVehiculoParaEmpresa('empresa-123')">
        <mat-icon>business</mat-icon>
        Vehículo para Empresa
      </button>
      
      <button mat-raised-button color="warn" (click)="editarVehiculo(vehiculoSeleccionado)">
        <mat-icon>edit</mat-icon>
        Editar Vehículo
      </button>
    </div>
  `
})
export class MiComponente {
  private vehiculoModalService = inject(VehiculoModalService);
  private snackBar = inject(MatSnackBar);
  
  vehiculoSeleccionado: Vehiculo | null = null;

  nuevoVehiculo() {
    this.vehiculoModalService.openCreateModal().subscribe({
      next: (vehiculo: VehiculoCreate) => {
        this.snackBar.open('Vehículo creado correctamente', 'Cerrar', { duration: 3000 });
        // Recargar datos o actualizar la vista
        this.recargarDatos();
      },
      error: (error) => {
        this.snackBar.open('Error al crear vehículo', 'Cerrar', { duration: 3000 });
        console.error('Error:', error);
      }
    });
  }

  nuevoVehiculoParaEmpresa(empresaId: string) {
    this.vehiculoModalService.openCreateForEmpresa(empresaId).subscribe({
      next: (vehiculo: VehiculoCreate) => {
        this.snackBar.open(`Vehículo creado para la empresa ${empresaId}`, 'Cerrar', { duration: 3000 });
        this.recargarDatos();
      }
    });
  }

  editarVehiculo(vehiculo: Vehiculo) {
    if (!vehiculo) {
      this.snackBar.open('Selecciona un vehículo para editar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.vehiculoModalService.openEditModal(vehiculo).subscribe({
      next: (vehiculoActualizado: VehiculoUpdate) => {
        this.snackBar.open('Vehículo actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.recargarDatos();
      },
      error: (error) => {
        this.snackBar.open('Error al actualizar vehículo', 'Cerrar', { duration: 3000 });
        console.error('Error:', error);
      }
    });
  }

  private recargarDatos() {
    // Implementar lógica para recargar datos
    console.log('Recargando datos...');
  }
}
```

## Ventajas del Modal

1. **Reutilizable**: Se puede usar desde cualquier componente
2. **Contextual**: Puede pre-seleccionar empresa y/o resolución
3. **No bloquea navegación**: El usuario permanece en la misma página
4. **Mejor UX**: Flujo más fluido y rápido
5. **Consistente**: Misma interfaz en toda la aplicación
6. **Responsivo**: Se adapta a diferentes tamaños de pantalla

## Configuración del Modal

El modal se configura automáticamente según el contexto:

- **Modo creación**: Formulario vacío, opcionalmente pre-configurado
- **Modo edición**: Formulario pre-llenado con datos del vehículo
- **Empresa pre-seleccionada**: Campo de empresa bloqueado
- **Resolución pre-seleccionada**: Campo de resolución bloqueado
- **Validaciones**: Se aplican automáticamente según el contexto 
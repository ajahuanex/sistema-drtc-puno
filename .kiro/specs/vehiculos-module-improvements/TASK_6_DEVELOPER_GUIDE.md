# Task 6: Developer Guide - Improved Vehicles Table

## Quick Reference

### New Component Features
- ✅ Multiple selection with SelectionModel
- ✅ Enhanced visual columns with secondary info
- ✅ Batch operations (transfer, delete)
- ✅ CSV export functionality
- ✅ Column visibility management

---

## Code Examples

### 1. Using SelectionModel

```typescript
import { SelectionModel } from '@angular/cdk/collections';

// Initialize
selection = new SelectionModel<Vehiculo>(true, []);

// Check if all selected
isAllSelected(): boolean {
  const numSelected = this.selection.selected.length;
  const numRows = this.getPaginatedVehiculos().length;
  return numSelected === numRows && numRows > 0;
}

// Toggle all
masterToggle(): void {
  if (this.isAllSelected()) {
    this.getPaginatedVehiculos().forEach(row => this.selection.deselect(row));
  } else {
    this.getPaginatedVehiculos().forEach(row => this.selection.select(row));
  }
}

// Clear selection
clearSelection(): void {
  this.selection.clear();
}

// Get selected items
const selected = this.selection.selected;
```

---

### 2. Enhanced Column Template

```html
<!-- Placa column with secondary info -->
<ng-container matColumnDef="placa">
  <th mat-header-cell *matHeaderCellDef mat-sort-header>
    <div class="header-with-icon">
      <app-smart-icon [iconName]="'directions_car'" [size]="20"></app-smart-icon>
      <span>PLACA</span>
    </div>
  </th>
  <td mat-cell *matCellDef="let vehiculo">
    <div class="placa-cell">
      <strong class="placa-text">{{ vehiculo.placa }}</strong>
      <small class="vehicle-info">{{ vehiculo.marca }} {{ vehiculo.modelo || '' }}</small>
    </div>
  </td>
</ng-container>
```

---

### 3. Estado Chip with Icon

```html
<!-- Estado column with colored chips -->
<ng-container matColumnDef="estado">
  <th mat-header-cell *matHeaderCellDef mat-sort-header>
    <div class="header-with-icon">
      <app-smart-icon [iconName]="'info'" [size]="20"></app-smart-icon>
      <span>ESTADO</span>
    </div>
  </th>
  <td mat-cell *matCellDef="let vehiculo">
    <mat-chip [class]="'estado-chip ' + getEstadoClass(vehiculo.estado)">
      <app-smart-icon 
        [iconName]="getEstadoIcon(vehiculo.estado)" 
        [size]="16">
      </app-smart-icon>
      <span class="estado-text">{{ vehiculo.estado }}</span>
    </mat-chip>
  </td>
</ng-container>
```

```typescript
// Helper methods
getEstadoIcon(estado: string): string {
  const iconMap: { [key: string]: string } = {
    'ACTIVO': 'check_circle',
    'INACTIVO': 'cancel',
    'SUSPENDIDO': 'warning',
    'EN_REVISION': 'schedule'
  };
  return iconMap[estado] || 'info';
}

getEstadoClass(estado: string): string {
  const classMap: { [key: string]: string } = {
    'ACTIVO': 'estado-activo',
    'INACTIVO': 'estado-inactivo',
    'SUSPENDIDO': 'estado-suspendido',
    'EN_REVISION': 'estado-revision'
  };
  return classMap[estado] || 'estado-default';
}
```

---

### 4. Batch Actions Card

```html
<!-- Batch actions card -->
@if (selection.hasValue()) {
  <mat-card class="batch-actions-card">
    <mat-card-content>
      <div class="batch-actions-container">
        <div class="batch-info">
          <app-smart-icon [iconName]="'check_circle'" [size]="24"></app-smart-icon>
          <span class="selection-count">
            <strong>{{ selection.selected.length }}</strong> vehículo(s) seleccionado(s)
          </span>
        </div>
        <div class="batch-buttons">
          <button mat-raised-button 
                  color="accent" 
                  (click)="transferirLote()">
            <app-smart-icon [iconName]="'swap_horiz'" [size]="20"></app-smart-icon>
            Transferir Seleccionados
          </button>
          <button mat-raised-button 
                  color="warn" 
                  (click)="solicitarBajaLote()">
            <app-smart-icon [iconName]="'remove_circle'" [size]="20"></app-smart-icon>
            Solicitar Baja Seleccionados
          </button>
          <button mat-stroked-button 
                  (click)="clearSelection()">
            <app-smart-icon [iconName]="'clear'" [size]="20"></app-smart-icon>
            Limpiar Selección
          </button>
        </div>
      </div>
    </mat-card-content>
  </mat-card>
}
```

```typescript
// Batch transfer
transferirLote(): void {
  const vehiculosSeleccionados = this.selection.selected;
  
  if (vehiculosSeleccionados.length === 0) {
    this.snackBar.open('No hay vehículos seleccionados', 'Cerrar', { duration: 3000 });
    return;
  }

  const confirmacion = confirm(
    `¿Está seguro de que desea transferir ${vehiculosSeleccionados.length} vehículo(s)?\n\n` +
    `Vehículos seleccionados:\n${vehiculosSeleccionados.map(v => v.placa).join(', ')}`
  );

  if (!confirmacion) return;

  // Process batch transfer
  // ... implementation
}
```

---

### 5. CSV Export

```typescript
// Export to CSV
exportarVehiculos(): void {
  const vehiculos = this.vehiculosFiltrados();
  
  if (vehiculos.length === 0) {
    this.snackBar.open('No hay vehículos para exportar', 'Cerrar', { duration: 3000 });
    return;
  }

  try {
    const csv = this.generarCSV(vehiculos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `vehiculos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.snackBar.open(`${vehiculos.length} vehículo(s) exportados correctamente`, 'Cerrar', { duration: 3000 });
  } catch (error) {
    console.error('Error al exportar vehículos:', error);
    this.snackBar.open('Error al exportar vehículos', 'Cerrar', { duration: 3000 });
  }
}

// Generate CSV content
private generarCSV(vehiculos: Vehiculo[]): string {
  const headers = ['Placa', 'Empresa', 'RUC', 'Resolución', 'Categoría', 'Marca', 'Modelo', 'Año', 'Estado'];
  const rows = vehiculos.map(v => [
    v.placa,
    this.getEmpresaNombre(v.empresaActualId),
    this.getEmpresaRuc(v.empresaActualId),
    this.getResolucionNumero(v.resolucionId),
    v.categoria,
    v.marca,
    v.modelo || '',
    v.anioFabricacion || '',
    v.estado
  ]);
  
  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}
```

---

### 6. Column Management

```typescript
// Toggle column visibility
toggleColumn(column: string): void {
  // Protect essential columns
  if (column === 'select' || column === 'acciones') {
    return;
  }

  const index = this.displayedColumns.indexOf(column);
  if (index > -1) {
    // Remove column
    this.displayedColumns = this.displayedColumns.filter(col => col !== column);
  } else {
    // Add column in correct position
    const allIndex = this.allColumns.indexOf(column);
    let insertIndex = 0;
    
    for (let i = 0; i < allIndex; i++) {
      if (this.displayedColumns.includes(this.allColumns[i])) {
        insertIndex++;
      }
    }
    
    this.displayedColumns.splice(insertIndex, 0, column);
  }
}

// Check if column is visible
isColumnVisible(column: string): boolean {
  return this.displayedColumns.includes(column);
}

// Get display name
getColumnDisplayName(column: string): string {
  const columnNames: { [key: string]: string } = {
    'select': 'Selección',
    'placa': 'Placa',
    'empresa': 'Empresa',
    'resolucion': 'Resolución',
    'categoria': 'Categoría',
    'marca': 'Marca',
    'modelo': 'Modelo',
    'anioFabricacion': 'Año',
    'estado': 'Estado',
    'acciones': 'Acciones'
  };
  return columnNames[column] || column;
}
```

---

## SCSS Styling Guide

### Batch Actions Card

```scss
.batch-actions-card {
  margin-bottom: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  animation: slideInUp 0.3s ease-out;

  .batch-actions-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    gap: 24px;

    .batch-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .batch-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }
}
```

### Enhanced Columns

```scss
// Header with icon
.header-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

// Placa cell
.placa-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .placa-text {
    font-size: 1rem;
    font-weight: 600;
    color: #1976d2;
    letter-spacing: 0.5px;
  }

  .vehicle-info {
    font-size: 0.85rem;
    color: #666;
  }
}

// Empresa cell
.empresa-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .empresa-nombre {
    font-size: 0.95rem;
    font-weight: 500;
    color: #333;
  }

  .empresa-ruc {
    font-size: 0.8rem;
    color: #666;
  }
}

// Estado chips
.estado-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  min-width: 100px;
  justify-content: center;

  &.estado-activo {
    background-color: #e8f5e8;
    color: #2e7d32;
    border: 1px solid #a5d6a7;
  }

  &.estado-inactivo {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ef9a9a;
  }

  &.estado-suspendido {
    background-color: #fff3e0;
    color: #ef6c00;
    border: 1px solid #ffcc80;
  }

  &.estado-revision {
    background-color: #e3f2fd;
    color: #1976d2;
    border: 1px solid #90caf9;
  }
}
```

### Responsive Design

```scss
@media (max-width: 768px) {
  .batch-actions-container {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;

    .batch-info {
      justify-content: center;
    }

    .batch-buttons {
      flex-direction: column;
      
      button {
        width: 100%;
      }
    }
  }
}
```

---

## Integration Points

### Required Imports

```typescript
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatChipsModule } from '@angular/material/chips';
```

### Module Imports Array

```typescript
imports: [
  CommonModule,
  MatCardModule,
  MatButtonModule,
  MatTableModule,
  MatCheckboxModule,  // NEW
  MatChipsModule,     // NEW
  MatMenuModule,
  SmartIconComponent,
  // ... other imports
]
```

---

## API Integration

### Batch Transfer Endpoint (Future)

```typescript
// Future implementation
interface BatchTransferRequest {
  vehiculoIds: string[];
  empresaDestinoId: string;
  motivo: string;
}

async transferirLoteBatch(request: BatchTransferRequest): Promise<BatchTransferResponse> {
  return this.http.post<BatchTransferResponse>(
    `${this.apiUrl}/vehiculos/batch/transfer`,
    request
  ).toPromise();
}
```

### Batch Delete Endpoint (Future)

```typescript
// Future implementation
interface BatchDeleteRequest {
  vehiculoIds: string[];
  motivo: string;
}

async solicitarBajaLoteBatch(request: BatchDeleteRequest): Promise<BatchDeleteResponse> {
  return this.http.post<BatchDeleteResponse>(
    `${this.apiUrl}/vehiculos/batch/solicitar-baja`,
    request
  ).toPromise();
}
```

---

## Testing

### Unit Test Examples

```typescript
describe('VehiculosComponent - Selection', () => {
  it('should select all vehicles on master toggle', () => {
    component.vehiculos.set(mockVehiculos);
    component.masterToggle();
    expect(component.selection.selected.length).toBe(mockVehiculos.length);
  });

  it('should deselect all vehicles on second master toggle', () => {
    component.vehiculos.set(mockVehiculos);
    component.masterToggle();
    component.masterToggle();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should show indeterminate state when partially selected', () => {
    component.vehiculos.set(mockVehiculos);
    component.selection.select(mockVehiculos[0]);
    expect(component.isAllSelected()).toBe(false);
    expect(component.selection.hasValue()).toBe(true);
  });
});

describe('VehiculosComponent - Export', () => {
  it('should generate CSV with correct headers', () => {
    const csv = component['generarCSV'](mockVehiculos);
    expect(csv).toContain('Placa,Empresa,RUC');
  });

  it('should show error when no vehicles to export', () => {
    component.vehiculos.set([]);
    component.exportarVehiculos();
    expect(snackBarSpy).toHaveBeenCalledWith(
      'No hay vehículos para exportar',
      'Cerrar',
      { duration: 3000 }
    );
  });
});
```

---

## Performance Tips

### 1. Selection Performance
- Use `SelectionModel` instead of manual array management
- Only track selected items, not all items
- Clear selection when changing pages if needed

### 2. Rendering Performance
- Use `trackBy` in `*ngFor` loops
- Avoid complex calculations in templates
- Use computed signals for derived data

### 3. Export Performance
- Use Blob API for large datasets
- Consider streaming for very large exports
- Show loading indicator for exports > 1000 rows

---

## Common Pitfalls

### 1. Selection State
❌ **Wrong:**
```typescript
// Manually managing selection array
selectedVehiculos: Vehiculo[] = [];
```

✅ **Correct:**
```typescript
// Use SelectionModel
selection = new SelectionModel<Vehiculo>(true, []);
```

### 2. Column Visibility
❌ **Wrong:**
```typescript
// Directly modifying displayedColumns
this.displayedColumns.push(column);
```

✅ **Correct:**
```typescript
// Create new array to trigger change detection
this.displayedColumns = [...this.displayedColumns, column];
```

### 3. CSV Export
❌ **Wrong:**
```typescript
// Not escaping CSV values
const csv = rows.map(row => row.join(',')).join('\n');
```

✅ **Correct:**
```typescript
// Properly escape and quote values
const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
```

---

## Debugging Tips

### 1. Selection Issues
```typescript
// Log selection state
console.log('Selected:', this.selection.selected);
console.log('Has value:', this.selection.hasValue());
console.log('Is all selected:', this.isAllSelected());
```

### 2. Column Visibility Issues
```typescript
// Log column arrays
console.log('All columns:', this.allColumns);
console.log('Displayed columns:', this.displayedColumns);
```

### 3. Export Issues
```typescript
// Log CSV content before download
const csv = this.generarCSV(vehiculos);
console.log('CSV content:', csv);
```

---

## Migration Guide

### From Old Table to New Table

**Step 1:** Add imports
```typescript
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
```

**Step 2:** Add selection model
```typescript
selection = new SelectionModel<Vehiculo>(true, []);
```

**Step 3:** Update columns array
```typescript
displayedColumns = ['select', ...existingColumns];
```

**Step 4:** Add selection column to template
```html
<ng-container matColumnDef="select">
  <!-- checkbox template -->
</ng-container>
```

**Step 5:** Add batch actions card
```html
@if (selection.hasValue()) {
  <!-- batch actions template -->
}
```

---

## Best Practices

### 1. Always Clear Selection After Batch Operations
```typescript
transferirLote(): void {
  // ... perform transfer
  this.clearSelection();  // Clear after success
  this.cargarDatos();     // Reload data
}
```

### 2. Confirm Destructive Actions
```typescript
const confirmacion = confirm('¿Está seguro?');
if (!confirmacion) return;
```

### 3. Provide User Feedback
```typescript
this.snackBar.open('Operación exitosa', 'Cerrar', { duration: 3000 });
```

### 4. Handle Errors Gracefully
```typescript
try {
  // ... operation
} catch (error) {
  console.error('Error:', error);
  this.snackBar.open('Error en la operación', 'Cerrar', { duration: 3000 });
}
```

---

## Resources

### Documentation
- [Angular Material Table](https://material.angular.io/components/table/overview)
- [Angular CDK Collections](https://material.angular.io/cdk/collections/overview)
- [Angular Material Chips](https://material.angular.io/components/chips/overview)

### Related Files
- `frontend/src/app/components/vehiculos/vehiculos.component.ts`
- `frontend/src/app/components/vehiculos/vehiculos.component.scss`
- `frontend/src/app/shared/smart-icon.component.ts`

### Related Tasks
- Task 1: SmartIconComponent integration
- Task 2: ResolucionSelectorComponent
- Task 3: Advanced filters
- Task 4: Statistics dashboard
- Task 5: Global search

---

## Support

### Questions?
- Check the completion summary: `TASK_6_COMPLETION_SUMMARY.md`
- Review verification guide: `TASK_6_VERIFICATION_GUIDE.md`
- Contact development team

### Found a Bug?
1. Check console for errors
2. Verify all imports are correct
3. Check if data is loading properly
4. Create issue with reproduction steps

---

## Changelog

### Version 1.0.0 (2025-11-12)
- ✅ Initial implementation
- ✅ Multiple selection
- ✅ Enhanced visual columns
- ✅ Batch operations
- ✅ CSV export
- ✅ Column management

### Future Enhancements
- [ ] Dedicated batch transfer modal
- [ ] Dedicated batch delete modal
- [ ] Selection across all pages
- [ ] Column reordering
- [ ] Excel export with formatting

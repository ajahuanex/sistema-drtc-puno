# Task 3 Developer Guide: Advanced Filters Implementation

## Architecture Overview

The advanced filters system in VehiculosComponent uses Angular signals, reactive forms, and smart selector components to provide a robust filtering experience with URL persistence.

## Key Components

### 1. Smart Selector Components

#### EmpresaSelectorComponent
- **Location:** `frontend/src/app/shared/empresa-selector.component.ts`
- **Purpose:** Autocomplete selector for empresas with search by RUC, razón social, and código
- **Inputs:**
  - `label: string` - Field label
  - `placeholder: string` - Placeholder text
  - `hint: string` - Helper text
  - `empresaId: string` - Pre-selected empresa ID
  - `required: boolean` - Whether field is required
- **Outputs:**
  - `empresaSeleccionada: EventEmitter<Empresa | null>` - Emits selected empresa
  - `empresaIdChange: EventEmitter<string>` - Emits empresa ID changes

#### ResolucionSelectorComponent
- **Location:** `frontend/src/app/shared/resolucion-selector.component.ts`
- **Purpose:** Autocomplete selector for resoluciones with empresa-based filtering
- **Inputs:**
  - `label: string` - Field label
  - `placeholder: string` - Placeholder text
  - `hint: string` - Helper text
  - `empresaId: string` - Filter resoluciones by empresa
  - `resolucionId: string` - Pre-selected resolución ID
  - `required: boolean` - Whether field is required
- **Outputs:**
  - `resolucionSeleccionada: EventEmitter<Resolucion | null>` - Emits selected resolución
  - `resolucionIdChange: EventEmitter<string>` - Emits resolución ID changes

### 2. State Management

#### Signals
```typescript
// Component state using Angular signals
empresaSeleccionada = signal<Empresa | null>(null);
resolucionSeleccionada = signal<Resolucion | null>(null);
vehiculos = signal<Vehiculo[]>([]);
empresas = signal<Empresa[]>([]);
resoluciones = signal<Resolucion[]>([]);
cargando = signal(false);
```

#### Form Controls
```typescript
// Reactive form for filters
filtrosForm: FormGroup = this.fb.group({
  placa: [''],
  empresa: [''],
  resolucion: [{ value: '', disabled: true }],
  estado: ['']
});

// Quick search control
busquedaRapidaControl = new FormControl('');
```

### 3. Filter Logic

#### Main Filter Method
```typescript
vehiculosFiltrados(): Vehiculo[] {
  let vehiculos = this.vehiculos();

  // 1. Quick search (multi-field)
  if (this.busquedaRapidaControl.value) {
    const busqueda = this.busquedaRapidaControl.value.toLowerCase();
    vehiculos = vehiculos.filter(v => 
      v.placa.toLowerCase().includes(busqueda) ||
      v.marca.toLowerCase().includes(busqueda) ||
      v.categoria.toLowerCase().includes(busqueda) ||
      this.getEmpresaNombre(v.empresaActualId).toLowerCase().includes(busqueda) ||
      this.getResolucionNumero(v.resolucionId).toLowerCase().includes(busqueda)
    );
  }

  // 2. Placa filter
  if (this.placaControl.value) {
    vehiculos = vehiculos.filter(v => 
      v.placa.toLowerCase().includes(this.placaControl.value.toLowerCase())
    );
  }

  // 3. Empresa filter
  if (this.empresaSeleccionada()) {
    vehiculos = vehiculos.filter(v => 
      v.empresaActualId === this.empresaSeleccionada()?.id
    );
  }

  // 4. Resolución filter
  if (this.resolucionSeleccionada()) {
    vehiculos = vehiculos.filter(v => 
      v.resolucionId === this.resolucionSeleccionada()?.id
    );
  }

  // 5. Estado filter
  if (this.estadoControl.value) {
    vehiculos = vehiculos.filter(v => 
      v.estado === this.estadoControl.value
    );
  }

  // 6. Apply sorting
  if (this.sort && this.sort.active) {
    vehiculos = this.ordenarVehiculos(vehiculos, this.sort.active, this.sort.direction);
  }

  return vehiculos;
}
```

### 4. URL Persistence

#### Serialization (Filters → URL)
```typescript
private actualizarURLConFiltros(): void {
  const queryParams: any = {};

  if (this.busquedaRapidaControl.value) {
    queryParams['busqueda'] = this.busquedaRapidaControl.value;
  }

  if (this.placaControl.value) {
    queryParams['placa'] = this.placaControl.value;
  }

  if (this.empresaSeleccionada()) {
    queryParams['empresaId'] = this.empresaSeleccionada()!.id;
  }

  if (this.resolucionSeleccionada()) {
    queryParams['resolucionId'] = this.resolucionSeleccionada()!.id;
  }

  if (this.estadoControl.value) {
    queryParams['estado'] = this.estadoControl.value;
  }

  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: queryParams,
    queryParamsHandling: 'merge'
  });
}
```

#### Deserialization (URL → Filters)
```typescript
private cargarFiltrosDesdeURL(): void {
  this.route.queryParams.subscribe(params => {
    // Load quick search
    if (params['busqueda']) {
      this.busquedaRapidaControl.setValue(params['busqueda']);
    }

    // Load placa
    if (params['placa']) {
      this.placaControl.setValue(params['placa']);
    }

    // Load estado
    if (params['estado']) {
      this.estadoControl.setValue(params['estado']);
    }

    // Load empresa (wait for data)
    if (params['empresaId']) {
      const empresaId = params['empresaId'];
      const checkEmpresas = setInterval(() => {
        if (this.empresas().length > 0) {
          const empresa = this.empresas().find(e => e.id === empresaId);
          if (empresa) {
            this.empresaSeleccionada.set(empresa);
            this.empresaControl.setValue(empresa);
            this.resolucionControl.enable();
          }
          clearInterval(checkEmpresas);
        }
      }, 100);
    }

    // Load resolución (wait for data)
    if (params['resolucionId']) {
      const resolucionId = params['resolucionId'];
      const checkResoluciones = setInterval(() => {
        if (this.resoluciones().length > 0) {
          const resolucion = this.resoluciones().find(r => r.id === resolucionId);
          if (resolucion) {
            this.resolucionSeleccionada.set(resolucion);
            this.resolucionControl.setValue(resolucion);
          }
          clearInterval(checkResoluciones);
        }
      }, 100);
    }
  });
}
```

### 5. Event Handlers

#### Empresa Selection
```typescript
onEmpresaFiltroSeleccionada(empresa: Empresa | null): void {
  this.empresaSeleccionada.set(empresa);
  this.currentPage = 0;
  if (this.paginator) {
    this.paginator.firstPage();
  }
}
```

#### Resolución Selection
```typescript
onResolucionFiltroSeleccionada(resolucion: Resolucion | null): void {
  this.resolucionSeleccionada.set(resolucion);
  this.currentPage = 0;
  if (this.paginator) {
    this.paginator.firstPage();
  }
}
```

#### Filter Application
```typescript
aplicarFiltros() {
  this.currentPage = 0;
  if (this.paginator) {
    this.paginator.firstPage();
  }
  
  this.actualizarURLConFiltros();
  
  const vehiculosFiltrados = this.vehiculosFiltrados();
  this.snackBar.open(
    `Se encontraron ${vehiculosFiltrados.length} vehículo(s)`, 
    'Cerrar', 
    { duration: 2000 }
  );
}
```

### 6. Chip Management

#### Individual Clear Methods
```typescript
limpiarBusquedaRapida(): void {
  this.busquedaRapidaControl.setValue('');
  this.currentPage = 0;
}

limpiarPlaca(): void {
  this.placaControl.setValue('');
}

limpiarEmpresa(): void {
  this.empresaControl.setValue('');
  this.empresaSeleccionada.set(null);
  this.resolucionControl.disable();
  this.resolucionSeleccionada.set(null);
}

limpiarResolucion(): void {
  this.resolucionControl.setValue('');
  this.resolucionSeleccionada.set(null);
}

limpiarEstado(): void {
  this.estadoControl.setValue('');
}
```

#### Clear All Filters
```typescript
limpiarFiltros() {
  this.filtrosForm.reset();
  this.busquedaRapidaControl.setValue('');
  this.empresaSeleccionada.set(null);
  this.resolucionSeleccionada.set(null);
  this.resolucionControl.disable();
  this.currentPage = 0;
  
  // Clear URL
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: {}
  });
  
  this.cargarDatos();
}
```

## Best Practices

### 1. Signal Usage
- Use signals for reactive state that needs to trigger template updates
- Prefer signals over BehaviorSubjects for simple state management
- Use computed signals for derived state

### 2. Form Controls
- Use reactive forms for complex form logic
- Separate quick search from advanced filters
- Disable dependent fields until prerequisites are met

### 3. URL Persistence
- Always update URL when filters change
- Use query parameter merging to preserve other params
- Handle missing data gracefully with interval checks

### 4. Performance
- Reset pagination when filters change
- Use debouncing for search inputs
- Filter in memory for small datasets
- Consider server-side filtering for large datasets

### 5. User Experience
- Provide visual feedback (chips, snackbars)
- Reset pagination to page 1 on filter changes
- Show result counts after filtering
- Enable/disable fields based on dependencies

## Common Patterns

### Adding a New Filter

1. **Add form control:**
```typescript
filtrosForm = this.fb.group({
  // ... existing controls
  nuevoFiltro: ['']
});
```

2. **Add to template:**
```html
<mat-form-field appearance="outline" class="filter-field">
  <mat-label>Nuevo Filtro</mat-label>
  <input matInput [formControl]="nuevoFiltroControl">
  <app-smart-icon [iconName]="'icon_name'" [size]="20" matSuffix></app-smart-icon>
</mat-form-field>
```

3. **Add to filter logic:**
```typescript
if (this.nuevoFiltroControl.value) {
  vehiculos = vehiculos.filter(v => 
    // filter logic
  );
}
```

4. **Add chip:**
```html
@if (nuevoFiltroControl.value) {
  <mat-chip color="accent" (removed)="limpiarNuevoFiltro()">
    Nuevo Filtro: {{ nuevoFiltroControl.value }}
    <app-smart-icon [iconName]="'cancel'" [size]="18" matChipRemove></app-smart-icon>
  </mat-chip>
}
```

5. **Add URL persistence:**
```typescript
// In actualizarURLConFiltros()
if (this.nuevoFiltroControl.value) {
  queryParams['nuevoFiltro'] = this.nuevoFiltroControl.value;
}

// In cargarFiltrosDesdeURL()
if (params['nuevoFiltro']) {
  this.nuevoFiltroControl.setValue(params['nuevoFiltro']);
}
```

## Testing Checklist

- [ ] Filter application works correctly
- [ ] Chips display for all active filters
- [ ] Individual chip removal works
- [ ] Clear all filters works
- [ ] URL updates when filters change
- [ ] Filters restore from URL
- [ ] Pagination resets on filter changes
- [ ] Dependent fields enable/disable correctly
- [ ] No console errors
- [ ] Performance is acceptable

## Troubleshooting

### Issue: Filters not applying
**Solution:** Check that `vehiculosFiltrados()` is called in the template and returns filtered data.

### Issue: URL not updating
**Solution:** Verify `actualizarURLConFiltros()` is called in `aplicarFiltros()`.

### Issue: Filters not restoring from URL
**Solution:** Check that data is loaded before attempting to restore filters. Use interval checks if needed.

### Issue: Chips not displaying
**Solution:** Verify `tieneFiltrosActivos()` returns true and chip template conditions are correct.

### Issue: Resolución selector not enabling
**Solution:** Check that empresa selection properly enables the resolución control.

## Future Enhancements

1. **Server-side filtering** - For large datasets
2. **Filter presets** - Save and load common filter combinations
3. **Advanced search operators** - AND/OR logic, wildcards
4. **Filter history** - Recent filter combinations
5. **Export filtered results** - CSV/Excel export of filtered data

---

**Last Updated:** 2025-11-09
**Maintainer:** Development Team
**Related Tasks:** Task 3 - Mejorar filtros avanzados en VehiculosComponent

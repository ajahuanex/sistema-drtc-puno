# Task 8 Developer Guide: Vehicle Form Validations

## Quick Reference

This guide provides quick reference for developers working with the vehicle form validations.

## Custom Validators

### Import Statement
```typescript
import { 
  placaPeruanaValidator, 
  placaDuplicadaValidator,
  anioFabricacionValidator,
  capacidadPasajerosValidator,
  numeroMotorValidator,
  numeroChasisValidator,
  numeroTucValidator
} from '../../validators/vehiculo.validators';
```

### Usage in FormBuilder

```typescript
this.vehiculoForm = this.fb.group({
  // Placa with sync and async validators
  placa: [
    '', 
    [Validators.required, placaPeruanaValidator()],
    [placaDuplicadaValidator(this.vehiculoService, vehiculoId)]
  ],
  
  // Year validation
  anioFabricacion: ['', [Validators.required, anioFabricacionValidator()]],
  
  // Passenger capacity
  asientos: ['', [capacidadPasajerosValidator()]],
  
  // TUC number
  numeroTuc: ['', [numeroTucValidator()]],
  
  // Technical data
  datosTecnicos: this.fb.group({
    motor: ['', [numeroMotorValidator()]],
    chasis: ['', [numeroChasisValidator()]],
    cilindros: ['', [Validators.min(1), Validators.max(16)]],
    ejes: ['', [Validators.min(2), Validators.max(6)]],
    ruedas: ['', [Validators.min(4), Validators.max(24)]],
    pesoNeto: ['', [Validators.min(0), Validators.max(50000)]],
    pesoBruto: ['', [Validators.min(0), Validators.max(100000)]]
  })
});
```

## Validator Details

### placaPeruanaValidator()
**Type:** Synchronous
**Purpose:** Validates Peruvian license plate format

**Valid Formats:**
- `ABC-123` (3 letters, hyphen, 3 numbers)
- `AB-1234` (2 letters, hyphen, 4 numbers)
- `A1B-234` (letter, number, letter, hyphen, 3 numbers)

**Error Object:**
```typescript
{
  placaInvalida: {
    value: string,
    message: 'Formato de placa inválido. Use ABC-123, AB-1234 o A1B-234'
  }
}
```

**Template Usage:**
```html
<mat-error *ngIf="form.get('placa')?.hasError('placaInvalida')">
  {{ form.get('placa')?.errors?.['placaInvalida']?.message }}
</mat-error>
```

### placaDuplicadaValidator(service, vehiculoId?)
**Type:** Asynchronous
**Purpose:** Checks if plate already exists in database

**Parameters:**
- `service: VehiculoService` - Service to check duplicates
- `vehiculoId?: string` - Current vehicle ID (for edit mode)

**Debounce:** 500ms

**Error Object:**
```typescript
{
  placaDuplicada: {
    value: string,
    message: 'Esta placa ya está registrada en el sistema'
  }
}
```

**Template Usage:**
```html
<mat-error *ngIf="form.get('placa')?.hasError('placaDuplicada')">
  {{ form.get('placa')?.errors?.['placaDuplicada']?.message }}
</mat-error>
```

**Dynamic Update (Edit Mode):**
```typescript
editarVehiculo(vehiculo: Vehiculo): void {
  const placaControl = this.form.get('placa');
  if (placaControl) {
    placaControl.clearAsyncValidators();
    placaControl.setAsyncValidators([
      placaDuplicadaValidator(this.vehiculoService, vehiculo.id)
    ]);
    placaControl.updateValueAndValidity();
  }
}
```

### anioFabricacionValidator()
**Type:** Synchronous
**Purpose:** Validates manufacturing year

**Valid Range:** 1990 to (current year + 1)

**Error Objects:**
```typescript
{
  anioInvalido: {
    value: any,
    message: 'El año debe ser un número válido'
  }
}

{
  anioMinimo: {
    value: number,
    minimo: 1990,
    message: 'El año mínimo permitido es 1990'
  }
}

{
  anioMaximo: {
    value: number,
    maximo: number,
    message: 'El año máximo permitido es [year]'
  }
}
```

### capacidadPasajerosValidator()
**Type:** Synchronous
**Purpose:** Validates passenger capacity

**Valid Range:** 1 to 100

**Error Objects:**
```typescript
{
  capacidadInvalida: {
    value: any,
    message: 'La capacidad debe ser un número válido'
  }
}

{
  capacidadMinima: {
    value: number,
    minimo: 1,
    message: 'La capacidad mínima es 1 pasajero'
  }
}

{
  capacidadMaxima: {
    value: number,
    maximo: 100,
    message: 'La capacidad máxima es 100 pasajeros'
  }
}
```

### numeroMotorValidator()
**Type:** Synchronous
**Purpose:** Validates engine number format

**Requirements:**
- Minimum 6 characters
- Only alphanumeric and hyphens

**Error Objects:**
```typescript
{
  numeroMotorCorto: {
    value: string,
    message: 'El número de motor debe tener al menos 6 caracteres'
  }
}

{
  numeroMotorInvalido: {
    value: string,
    message: 'El número de motor solo puede contener letras, números y guiones'
  }
}
```

### numeroChasisValidator()
**Type:** Synchronous
**Purpose:** Validates chassis number format

**Requirements:**
- Minimum 6 characters
- Only alphanumeric and hyphens

**Error Objects:**
```typescript
{
  numeroChasisCorto: {
    value: string,
    message: 'El número de chasis debe tener al menos 6 caracteres'
  }
}

{
  numeroChasisInvalido: {
    value: string,
    message: 'El número de chasis solo puede contener letras, números y guiones'
  }
}
```

### numeroTucValidator()
**Type:** Synchronous
**Purpose:** Validates TUC number format

**Format:** `T-123456-2025` (Letter-6digits-4digits)

**Error Object:**
```typescript
{
  numeroTucInvalido: {
    value: string,
    message: 'Formato de TUC inválido. Use T-123456-2025'
  }
}
```

## Template Patterns

### Basic Field with Validation
```html
<mat-form-field appearance="outline">
  <mat-label>Placa *</mat-label>
  <input matInput 
         formControlName="placa" 
         placeholder="ABC-123"
         (input)="convertirPlacaMayusculas($event)">
  <mat-icon matSuffix>directions_car</mat-icon>
  <mat-hint>Formato: ABC-123, AB-1234 o A1B-234</mat-hint>
  
  <!-- Error messages -->
  <mat-error *ngIf="form.get('placa')?.hasError('required')">
    La placa es obligatoria
  </mat-error>
  <mat-error *ngIf="form.get('placa')?.hasError('placaInvalida')">
    {{ form.get('placa')?.errors?.['placaInvalida']?.message }}
  </mat-error>
  <mat-error *ngIf="form.get('placa')?.hasError('placaDuplicada')">
    {{ form.get('placa')?.errors?.['placaDuplicada']?.message }}
  </mat-error>
</mat-form-field>
```

### Field with Visual Validation Indicator
```html
<mat-form-field appearance="outline">
  <mat-label>Placa *</mat-label>
  <input matInput formControlName="placa">
  <mat-icon matSuffix 
           [class.valid-icon]="form.get('placa')?.valid && form.get('placa')?.value"
           [class.invalid-icon]="form.get('placa')?.invalid && form.get('placa')?.touched">
    {{ getPlacaIcon() }}
  </mat-icon>
  <!-- ... error messages ... -->
</mat-form-field>
```

### Autocomplete Field
```html
<mat-form-field appearance="outline">
  <mat-label>Marca *</mat-label>
  <input matInput 
         formControlName="marca"
         [matAutocomplete]="autoMarca">
  <mat-autocomplete #autoMarca="matAutocomplete">
    <mat-option *ngFor="let marca of marcasPopulares" [value]="marca">
      {{ marca }}
    </mat-option>
  </mat-autocomplete>
  <mat-icon matSuffix>branding_watermark</mat-icon>
  <mat-hint>Selecciona o escribe una marca</mat-hint>
  <mat-error *ngIf="form.get('marca')?.hasError('required')">
    La marca es obligatoria
  </mat-error>
</mat-form-field>
```

## Helper Methods

### Uppercase Conversion
```typescript
convertirPlacaMayusculas(event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = input.value.toUpperCase();
  this.form.get('placa')?.setValue(value, { emitEvent: false });
  input.value = value;
}
```

### Validation Icon
```typescript
getPlacaIcon(): string {
  const placaControl = this.form.get('placa');
  
  if (!placaControl?.value) {
    return 'directions_car';
  }
  
  if (placaControl.pending) {
    return 'hourglass_empty'; // Async validation in progress
  }
  
  if (placaControl.valid) {
    return 'check_circle'; // Valid
  }
  
  if (placaControl.invalid && placaControl.touched) {
    return 'error'; // Invalid
  }
  
  return 'directions_car';
}
```

### Get Current Year
```typescript
getCurrentYear(): number {
  return new Date().getFullYear();
}
```

## CSS Styles

### Validation Icon Colors
```scss
.valid-icon {
  color: #4caf50 !important;
}

.invalid-icon {
  color: #f44336 !important;
}

mat-icon.mat-icon[matsuffix] {
  transition: color 0.3s ease;
}
```

### Error Message Animation
```scss
mat-error {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Service Integration

### VehiculoService Method
```typescript
verificarPlacaDisponible(placa: string, vehiculoIdActual?: string): Observable<boolean> {
  if (environment.useDataManager) {
    return this.getVehiculosPersistentes().pipe(
      map(vehiculos => {
        const placaUpper = placa.toUpperCase().trim();
        const vehiculoExistente = vehiculos.find(v => 
          v.placa.toUpperCase() === placaUpper && v.id !== vehiculoIdActual
        );
        return !vehiculoExistente; // true if available
      }),
      catchError(() => of(true)) // Allow on error
    );
  } else {
    // Mock implementation
    const placaUpper = placa.toUpperCase().trim();
    const vehiculoExistente = this.mockVehiculos.find(v => 
      v.placa.toUpperCase() === placaUpper && v.id !== vehiculoIdActual
    );
    return of(!vehiculoExistente);
  }
}
```

## Success/Error Messages

### Enhanced Success Messages
```typescript
// Create success
this.snackBar.open(
  `✓ Vehículo ${formData.placa} (${formData.marca}) creado exitosamente`, 
  'Cerrar', 
  { duration: 4000 }
);

// Update success
this.snackBar.open(
  `✓ Vehículo ${formData.placa} actualizado exitosamente`, 
  'Cerrar', 
  { duration: 4000 }
);
```

### Enhanced Error Messages
```typescript
// Error with details
const errorMsg = error.error?.message || 'Error al crear vehículo';
this.snackBar.open(`✗ ${errorMsg}`, 'Cerrar', { duration: 5000 });
```

## Common Patterns

### Form Initialization
```typescript
private initializeForm(): void {
  this.vehiculoForm = this.fb.group({
    placa: [
      '', 
      [Validators.required, placaPeruanaValidator()],
      [placaDuplicadaValidator(this.vehiculoService)]
    ],
    marca: ['', Validators.required],
    anioFabricacion: ['', [Validators.required, anioFabricacionValidator()]],
    // ... other fields
  });
}
```

### Handling Edit Mode
```typescript
editarVehiculo(vehiculo: Vehiculo): void {
  // Update async validator with vehicle ID
  const placaControl = this.vehiculoForm.get('placa');
  if (placaControl) {
    placaControl.clearAsyncValidators();
    placaControl.setAsyncValidators([
      placaDuplicadaValidator(this.vehiculoService, vehiculo.id)
    ]);
    placaControl.updateValueAndValidity();
  }
  
  // Patch form values
  this.vehiculoForm.patchValue({
    placa: vehiculo.placa,
    marca: vehiculo.marca,
    // ... other fields
  });
}
```

### Resetting Form
```typescript
resetForm(): void {
  // Reset async validator for new vehicle
  const placaControl = this.vehiculoForm.get('placa');
  if (placaControl) {
    placaControl.clearAsyncValidators();
    placaControl.setAsyncValidators([
      placaDuplicadaValidator(this.vehiculoService)
    ]);
    placaControl.updateValueAndValidity();
  }
  
  // Reset form
  this.vehiculoForm.reset({
    estado: 'ACTIVO' // Default values
  });
}
```

## Testing

### Unit Test Example
```typescript
describe('placaPeruanaValidator', () => {
  it('should accept valid format ABC-123', () => {
    const control = new FormControl('ABC-123');
    const result = placaPeruanaValidator()(control);
    expect(result).toBeNull();
  });
  
  it('should reject invalid format ABC123', () => {
    const control = new FormControl('ABC123');
    const result = placaPeruanaValidator()(control);
    expect(result).toEqual({
      placaInvalida: {
        value: 'ABC123',
        message: jasmine.any(String)
      }
    });
  });
});
```

### Integration Test Example
```typescript
describe('VehiculoFormComponent', () => {
  it('should show duplicate error for existing plate', fakeAsync(() => {
    // Setup
    component.vehiculoForm.patchValue({ placa: 'ABC-123' });
    
    // Trigger async validation
    tick(500); // Wait for debounce
    
    // Assert
    expect(component.vehiculoForm.get('placa')?.hasError('placaDuplicada')).toBe(true);
  }));
});
```

## Troubleshooting

### Issue: Async validator not triggering
**Check:**
1. Validator is in async validators array (3rd parameter)
2. Service method returns Observable<boolean>
3. Debounce time is appropriate (500ms)

### Issue: Validation not updating in edit mode
**Solution:**
```typescript
// Clear and reset validators when switching modes
placaControl.clearAsyncValidators();
placaControl.setAsyncValidators([...]);
placaControl.updateValueAndValidity();
```

### Issue: Error messages not showing
**Check:**
1. mat-error is inside mat-form-field
2. Error key matches validator error key
3. Form control is touched or dirty

### Issue: Uppercase conversion not working
**Solution:**
```typescript
// Use both setValue and direct input manipulation
this.form.get('placa')?.setValue(value, { emitEvent: false });
input.value = value;
```

## Best Practices

1. **Always provide specific error messages**
   - Use validator error objects with message property
   - Display messages in template

2. **Use visual indicators**
   - Icons that change based on validation state
   - Color coding (green for valid, red for invalid)

3. **Provide helpful hints**
   - Show valid formats and ranges
   - Use mat-hint for guidance

4. **Handle async validation properly**
   - Use appropriate debounce time
   - Show loading indicator during validation
   - Handle errors gracefully

5. **Update validators dynamically**
   - Clear and reset when switching modes
   - Pass correct parameters (e.g., vehicle ID in edit mode)

6. **Test thoroughly**
   - Unit test each validator
   - Integration test form behavior
   - Test edge cases

---

**Last Updated:** 2025-11-12
**Version:** 1.0

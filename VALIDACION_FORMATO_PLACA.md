# ✅ VALIDACIÓN Y FORMATO DE PLACAS

## 🎯 Objetivo

Validar y formatear automáticamente las placas vehiculares al formato estándar **XXX-123**

## 📋 Reglas de Validación

### Formato Válido
```
XXX-123
│││ │││
│││ └┴┴─ 3 dígitos numéricos (obligatorio)
││└───── Guión separador (se agrega automáticamente)
└┴────── 3-5 caracteres alfanuméricos (obligatorio)
```

### Requisitos
1. ✅ Mínimo 3 caracteres alfanuméricos al inicio
2. ✅ Mínimo 3 dígitos al final
3. ✅ Longitud total: 6-8 caracteres (sin guión)
4. ✅ Solo letras, números y guión
5. ✅ Automáticamente en mayúsculas

## 🔧 Implementación

### Validador Personalizado
**Archivo:** `frontend/src/app/validators/placa.validator.ts`

```typescript
export function placaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Validaciones:
    // 1. Longitud mínima (6 caracteres)
    // 2. Longitud máxima (8 caracteres)
    // 3. Al menos 3 caracteres alfanuméricos al inicio
    // 4. Al menos 3 dígitos al final
    // 5. Formato: [A-Z0-9]{3,5}\d{3}
  };
}
```

### Función de Formateo
```typescript
export function formatearPlaca(placa: string): string {
  // "abc123" → "ABC-123"
  // "a2b456" → "A2B-456"
  // "ABCD123" → "ABCD-123"
}
```

## ✅ Ejemplos Válidos

| Entrada | Salida Formateada | Estado |
|---------|-------------------|--------|
| abc123 | ABC-123 | ✅ Válido |
| ABC123 | ABC-123 | ✅ Válido |
| a2b456 | A2B-456 | ✅ Válido |
| xyz789 | XYZ-789 | ✅ Válido |
| abcd123 | ABCD-123 | ✅ Válido (4 caracteres) |
| abcde123 | ABCDE-123 | ✅ Válido (5 caracteres) |
| ABC-123 | ABC-123 | ✅ Ya formateada |
| a2b-456 | A2B-456 | ✅ Ya formateada |

## ❌ Ejemplos Inválidos

| Entrada | Error | Razón |
|---------|-------|-------|
| as123 | ❌ Inválido | Solo 2 caracteres alfanuméricos (mínimo 3) |
| abc12 | ❌ Inválido | Solo 2 dígitos (mínimo 3) |
| ab12 | ❌ Inválido | Muy corto (mínimo 6 caracteres) |
| 123abc | ❌ Inválido | Empieza con números |
| abc | ❌ Inválido | Sin parte numérica |
| 123 | ❌ Inválido | Sin parte alfanumérica |
| abcdefgh123 | ❌ Inválido | Más de 5 caracteres alfanuméricos |

## 🎨 Interfaz de Usuario

### Campo de Placa
```html
<mat-form-field appearance="outline">
  <mat-label>Placa *</mat-label>
  <input matInput 
         formControlName="placaActual" 
         placeholder="ABC-123"
         (blur)="formatearPlacaInput()"
         maxlength="9">
  <mat-icon matPrefix>badge</mat-icon>
  <mat-hint>Formato: ABC-123 o A2B-123</mat-hint>
  
  <!-- Errores -->
  <mat-error *ngIf="hasError('required')">
    La placa es requerida
  </mat-error>
  <mat-error *ngIf="hasError('placaInvalida')">
    {{ getErrorMessage() }}
  </mat-error>
</mat-form-field>
```

### Mensajes de Error
- "La placa debe tener al menos 6 caracteres (ej: ABC-123)"
- "La placa no puede tener más de 8 caracteres"
- "La placa debe empezar con al menos 3 caracteres alfanuméricos"
- "La placa debe terminar con al menos 3 dígitos"
- "Formato inválido. Use: ABC-123 o A2B-123"

## 🔄 Flujo de Validación

### 1. Usuario Escribe
```
Usuario escribe: "abc123"
```

### 2. Validación en Tiempo Real
```typescript
// Mientras escribe, el validador verifica:
- Longitud ✓
- Caracteres permitidos ✓
- Formato general ✓
```

### 3. Al Perder el Foco (blur)
```typescript
formatearPlacaInput() {
  // "abc123" → "ABC-123"
  placaControl.setValue("ABC-123");
}
```

### 4. Al Guardar
```typescript
// Backend recibe: "ABC-123"
// Backend normaliza: "ABC-123" (ya está correcta)
// Backend valida unicidad
// Backend guarda
```

## 💡 Casos de Uso

### Caso 1: Entrada Correcta
```
Usuario: "abc123"
Sistema: Formatea a "ABC-123" ✅
Backend: Acepta y guarda
```

### Caso 2: Entrada con Guión
```
Usuario: "abc-123"
Sistema: Formatea a "ABC-123" ✅
Backend: Acepta y guarda
```

### Caso 3: Entrada Inválida (muy corta)
```
Usuario: "as123"
Sistema: Muestra error ❌
Error: "La placa debe empezar con al menos 3 caracteres alfanuméricos"
Backend: No se envía
```

### Caso 4: Entrada Inválida (formato incorrecto)
```
Usuario: "123abc"
Sistema: Muestra error ❌
Error: "Formato inválido. Use: ABC-123 o A2B-123"
Backend: No se envía
```

### Caso 5: Placa Duplicada
```
Usuario: "ABC-123"
Sistema: Formatea correctamente ✅
Backend: Valida unicidad ❌
Error: "Ya existe un vehículo con la placa ABC-123"
```

## 🎯 Ventajas

### Para el Usuario
- ✅ Formateo automático (no necesita escribir el guión)
- ✅ Validación en tiempo real
- ✅ Mensajes de error claros
- ✅ Prevención de errores antes de guardar

### Para el Sistema
- ✅ Datos consistentes en la BD
- ✅ Búsquedas más eficientes
- ✅ Menos errores de duplicados
- ✅ Formato estandarizado

### Para el Negocio
- ✅ Calidad de datos garantizada
- ✅ Menos correcciones manuales
- ✅ Reportes más confiables
- ✅ Cumplimiento de estándares

## 📊 Expresiones Regulares Usadas

### Validación Completa
```regex
^[A-Z0-9]{3,5}\d{3}$
```
- `^` - Inicio de cadena
- `[A-Z0-9]{3,5}` - 3 a 5 caracteres alfanuméricos
- `\d{3}` - Exactamente 3 dígitos
- `$` - Fin de cadena

### Extracción de Partes
```regex
^([A-Z0-9]+?)(\d{3})$
```
- `([A-Z0-9]+?)` - Captura parte alfanumérica (no greedy)
- `(\d{3})` - Captura últimos 3 dígitos

### Validación de Formato Ya Formateado
```regex
^[A-Z0-9]{3,5}-\d{3}$
```
- Incluye el guión en la validación

## 🧪 Tests Recomendados

### Tests Unitarios
```typescript
describe('placaValidator', () => {
  it('debe aceptar ABC123', () => {
    expect(placaValidator()({ value: 'ABC123' })).toBeNull();
  });
  
  it('debe rechazar AS123', () => {
    expect(placaValidator()({ value: 'AS123' })).not.toBeNull();
  });
  
  it('debe aceptar A2B456', () => {
    expect(placaValidator()({ value: 'A2B456' })).toBeNull();
  });
});

describe('formatearPlaca', () => {
  it('debe formatear abc123 a ABC-123', () => {
    expect(formatearPlaca('abc123')).toBe('ABC-123');
  });
  
  it('debe mantener ABC-123', () => {
    expect(formatearPlaca('ABC-123')).toBe('ABC-123');
  });
});
```

## ✅ Conclusión

El sistema ahora:
- ✅ **Valida** el formato de placa correctamente
- ✅ **Formatea** automáticamente al estándar
- ✅ **Previene** errores antes de guardar
- ✅ **Normaliza** a mayúsculas
- ✅ **Rechaza** formatos inválidos con mensajes claros

**Formato de placa estandarizado y validado en toda la aplicación!** 🎯

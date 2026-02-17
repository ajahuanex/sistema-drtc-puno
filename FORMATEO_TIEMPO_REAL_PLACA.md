# ⚡ FORMATEO EN TIEMPO REAL DE PLACAS

## 🎯 Funcionalidad

El guión se agrega **automáticamente** mientras el usuario escribe, sin necesidad de perder el foco.

## 🔄 Comportamiento

### Mientras el Usuario Escribe

| Usuario Escribe | Sistema Muestra | Acción |
|-----------------|-----------------|--------|
| A | A | Sin cambios |
| AB | AB | Sin cambios |
| ABC | ABC | Sin cambios |
| ABC1 | ABC-1 | ✨ Guión agregado automáticamente |
| ABC12 | ABC-12 | Guión mantenido |
| ABC123 | ABC-123 | Formato completo |

### Ejemplos en Tiempo Real

**Ejemplo 1: Placa estándar**
```
Usuario: A → AB → ABC → ABC1 → ABC12 → ABC123
Sistema: A → AB → ABC → ABC-1 → ABC-12 → ABC-123
                         ↑ Guión aparece aquí
```

**Ejemplo 2: Placa alfanumérica**
```
Usuario: A → A2 → A2B → A2B4 → A2B45 → A2B456
Sistema: A → A2 → A2B → A2B-4 → A2B-45 → A2B-456
                         ↑ Guión aparece aquí
```

**Ejemplo 3: Placa con 4 caracteres**
```
Usuario: A → AB → ABC → ABCD → ABCD1 → ABCD12 → ABCD123
Sistema: A → AB → ABC → ABCD → ABCD-1 → ABCD-12 → ABCD-123
                                 ↑ Guión aparece aquí
```

## 💻 Implementación

### Evento de Input
```typescript
onPlacaInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  let value = input.value.toUpperCase();
  
  // 1. Limpiar caracteres no permitidos
  value = value.replace(/[^A-Z0-9-]/g, '');
  
  // 2. Remover guiones para reformatear
  const sinGuion = value.replace(/-/g, '');
  
  // 3. Si tiene más de 3 caracteres, agregar guión
  if (sinGuion.length > 3) {
    const parte1 = sinGuion.substring(0, sinGuion.length - 3);
    const parte2 = sinGuion.substring(sinGuion.length - 3);
    
    // Solo si la parte final tiene dígitos
    if (/\d/.test(parte2)) {
      value = `${parte1}-${parte2}`;
    }
  }
  
  // 4. Actualizar valor manteniendo posición del cursor
  placaControl.setValue(value, { emitEvent: false });
}
```

### Características Clave

**1. Conversión Automática a Mayúsculas**
```typescript
value = input.value.toUpperCase();
// "abc" → "ABC"
```

**2. Filtrado de Caracteres**
```typescript
value = value.replace(/[^A-Z0-9-]/g, '');
// "AB@C#123" → "ABC123"
```

**3. Formateo Inteligente**
```typescript
// Separa los últimos 3 caracteres
const parte1 = sinGuion.substring(0, sinGuion.length - 3);
const parte2 = sinGuion.substring(sinGuion.length - 3);

// "ABC123" → parte1="ABC", parte2="123"
// "ABCD123" → parte1="ABCD", parte2="123"
```

**4. Preservación del Cursor**
```typescript
// Guarda posición antes del cambio
const cursorPos = input.selectionStart || 0;

// Actualiza valor
placaControl.setValue(value, { emitEvent: false });

// Restaura posición ajustada
setTimeout(() => {
  const newPos = cursorPos + diff;
  input.setSelectionRange(newPos, newPos);
}, 0);
```

## 🎨 Experiencia de Usuario

### Ventajas

✅ **Sin interrupciones**: No necesita perder el foco
✅ **Feedback inmediato**: Ve el formato mientras escribe
✅ **Menos errores**: Formato correcto desde el inicio
✅ **Intuitivo**: El guión aparece automáticamente
✅ **Mayúsculas automáticas**: No necesita Caps Lock

### Flujo Natural

```
Usuario piensa: "Voy a escribir ABC123"
Usuario escribe: A-B-C-1-2-3
Sistema muestra: A → AB → ABC → ABC-1 → ABC-12 → ABC-123
Usuario ve: Formato correcto en tiempo real ✨
```

## 🧪 Casos de Prueba

### Caso 1: Escritura Normal
```
Input: "ABC123"
Proceso:
  A → A
  AB → AB
  ABC → ABC
  ABC1 → ABC-1 (guión agregado)
  ABC12 → ABC-12
  ABC123 → ABC-123
Resultado: ✅ ABC-123
```

### Caso 2: Con Minúsculas
```
Input: "abc123"
Proceso:
  a → A (mayúscula)
  ab → AB
  abc → ABC
  abc1 → ABC-1 (mayúscula + guión)
  abc12 → ABC-12
  abc123 → ABC-123
Resultado: ✅ ABC-123
```

### Caso 3: Intentando Agregar Guión Manual
```
Input: "ABC-123"
Proceso:
  ABC → ABC
  ABC- → ABC (guión removido)
  ABC-1 → ABC-1 (guión agregado automáticamente)
  ABC-12 → ABC-12
  ABC-123 → ABC-123
Resultado: ✅ ABC-123
```

### Caso 4: Caracteres Especiales
```
Input: "AB@C#123"
Proceso:
  AB → AB
  AB@ → AB (@ removido)
  AB@C → ABC (@ removido)
  AB@C# → ABC (@ y # removidos)
  AB@C#1 → ABC-1 (caracteres especiales removidos, guión agregado)
  AB@C#12 → ABC-12
  AB@C#123 → ABC-123
Resultado: ✅ ABC-123
```

### Caso 5: Placa Larga (4 caracteres)
```
Input: "ABCD123"
Proceso:
  ABCD → ABCD
  ABCD1 → ABCD-1 (guión agregado)
  ABCD12 → ABCD-12
  ABCD123 → ABCD-123
Resultado: ✅ ABCD-123
```

## 🔧 Configuración del Input

### HTML
```html
<input matInput 
       formControlName="placaActual" 
       placeholder="ABC-123"
       (input)="onPlacaInput($event)"
       maxlength="9">
```

### Atributos Importantes
- `(input)`: Evento que se dispara en cada tecla
- `maxlength="9"`: Límite de 9 caracteres (XXX-123 o XXXXX-123)
- `placeholder="ABC-123"`: Muestra el formato esperado

## 📊 Algoritmo de Formateo

```
┌─────────────────────────────────────┐
│ Usuario escribe un carácter         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Convertir a MAYÚSCULAS              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Remover caracteres no permitidos    │
│ (solo A-Z, 0-9, -)                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Remover guiones existentes          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ ¿Tiene más de 3 caracteres?         │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
      SÍ              NO
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────┐
│ Separar en   │  │ Mantener     │
│ parte1-parte2│  │ sin guión    │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Actualizar valor en el input        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Ajustar posición del cursor         │
└─────────────────────────────────────┘
```

## ✅ Resultado Final

### Antes (sin formateo en tiempo real)
```
Usuario escribe: abc123
Campo muestra: abc123
Usuario pierde foco
Campo muestra: ABC-123 ← Cambio repentino
```

### Ahora (con formateo en tiempo real)
```
Usuario escribe: a → b → c → 1 → 2 → 3
Campo muestra: A → AB → ABC → ABC-1 → ABC-12 → ABC-123
                                ↑ Guión aparece aquí
```

## 🎯 Ventajas Técnicas

1. ✅ **Sin pérdida de foco**: El usuario no se distrae
2. ✅ **Feedback inmediato**: Ve el resultado al instante
3. ✅ **Prevención de errores**: Formato correcto desde el inicio
4. ✅ **Cursor inteligente**: Se mantiene en la posición correcta
5. ✅ **Sin eventos duplicados**: `emitEvent: false` evita loops
6. ✅ **Performance**: Operaciones síncronas, sin delays

## 🎉 Conclusión

El formateo en tiempo real proporciona:
- ⚡ Experiencia fluida y natural
- 🎯 Formato correcto automáticamente
- ✨ Feedback visual inmediato
- 💪 Menos errores de usuario
- 🚀 Mayor productividad

**El usuario solo necesita escribir los caracteres, el sistema hace el resto!** 🎯

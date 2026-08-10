# Sistema de Validación Binaria para Rutas

## Descripción General

El sistema de validación binaria permite rastrear qué componentes de una ruta han sido sincronizados/validados correctamente en el sistema.

## Estructura

El campo `validacionBinaria` es una cadena de texto de **3 bits** que representa el estado de validación de diferentes sincronizaciones:

```
validacionBinaria = "XYZ"
```

Donde cada posición representa:
- **Bit 0 (posición X derecha, valor 001)**: RUC validado
- **Bit 1 (posición Y central, valor 010)**: Resolución validada  
- **Bit 2 (posición Z izquierda, valor 100)**: Localidades validadas

## Ejemplos de Valores

| Binario | Decimal | Descripción | Qué significa |
|---------|---------|-------------|---------------|
| `000` | 0 | Ninguna validación | Ruta sin validar |
| `001` | 1 | Solo RUC | Solo el RUC fue sincronizado |
| `010` | 2 | Solo Resolución | Solo la resolución fue validada |
| `011` | 3 | RUC + Resolución | RUC y resolución validados |
| `100` | 4 | Solo Localidades | Solo localidades fueron validadas |
| `101` | 5 | RUC + Localidades | RUC y localidades validados |
| `110` | 6 | Resolución + Localidades | Resolución y localidades validadas |
| `111` | 7 | **Todas validadas** | ✅ Ruta completamente sincronizada |

## Uso en Python (Backend)

### Crear validación binaria

```python
from app.utils.validacion_binaria import ValidacionBinaria

# Crear desde estados individuales
validacion = ValidacionBinaria.crear_binaria(
    ruc_validado=True,
    resolucion_validada=True,
    localidades_validadas=False
)
# Resultado: "011"

# Crear todas validadas (para carga desde Excel)
validacion = ValidacionBinaria.crear_binaria(True, True, True)
# Resultado: "111"
```

### Verificar estados individuales

```python
validacion = "011"

if ValidacionBinaria.validar_ruc(validacion):
    print("✅ RUC validado")

if ValidacionBinaria.validar_resolucion(validacion):
    print("✅ Resolución validada")

if ValidacionBinaria.validar_localidades(validacion):
    print("✅ Localidades validadas")

# Verificar si todas están validadas
if ValidacionBinaria.todas_validadas(validacion):
    print("✅ Ruta completamente validada")
```

### Modificar estados

```python
# Comenzar sin validaciones
validacion = "000"

# Agregar validación de RUC
validacion = ValidacionBinaria.establecer_ruc(validacion, True)
# Resultado: "001"

# Agregar validación de Resolución
validacion = ValidacionBinaria.establecer_resolucion(validacion, True)
# Resultado: "011"

# Agregar validación de Localidades
validacion = ValidacionBinaria.establecer_localidades(validacion, True)
# Resultado: "111"

# Remover una validación
validacion = ValidacionBinaria.establecer_ruc("111", False)
# Resultado: "110"
```

### Obtener descripción completa

```python
descripcion = ValidacionBinaria.obtener_descripcion("011")

print(descripcion)
# Salida:
# {
#     "binario": "011",
#     "decimal": 3,
#     "ruc_validado": True,
#     "resolucion_validada": True,
#     "localidades_validadas": False,
#     "todas_validadas": False,
#     "descripcion": "Validadas: RUC, Resolución"
# }
```

## Uso en TypeScript (Frontend)

### Crear validación binaria

```typescript
import { ValidacionBinaria } from '@app/utils/validacion-binaria';

// Crear desde estados individuales
const validacion = ValidacionBinaria.crearBinaria(true, true, false);
// Resultado: "011"

// Crear todas validadas
const todasValidadas = ValidacionBinaria.crearBinaria(true, true, true);
// Resultado: "111"
```

### Verificar estados

```typescript
const validacion = "011";

if (ValidacionBinaria.validarRuc(validacion)) {
  console.log("✅ RUC validado");
}

if (ValidacionBinaria.todasValidadas(validacion)) {
  console.log("✅ Todas validadas");
}
```

### Obtener descripción

```typescript
const desc = ValidacionBinaria.obtenerDescripcion("011");
console.log(desc.descripcion); // "Validadas: RUC, Resolución"
```

### Obtener estilo para UI

```typescript
const estilo = ValidacionBinaria.obtenerEstilo("111");
// {
//   clase: "validacion-completa",
//   color: "success",
//   icono: "check_circle",
//   texto: "Validada"
// }
```

## Casos de Uso

### 1. Carga Masiva desde Excel
Cuando se importan rutas desde Excel, se marcan todas las validaciones como completadas:
```
validacionBinaria = "111"
```

### 2. Creación Manual
Cuando se crea una ruta manualmente desde la UI, se pueden validar parcialmente:
```
validacionBinaria = "011"  // RUC + Resolución validados, falta localidades
```

### 3. Sincronización Incremental
Si se necesita sincronizar datos en pasos:
1. Importar RUC: `"001"`
2. Validar Resolución: `"011"`
3. Validar Localidades: `"111"`

### 4. Auditoría
Saber qué fue validado y qué no:
```typescript
const ruta = obtenerRuta(id);
if (!ValidacionBinaria.todasValidadas(ruta.validacionBinaria)) {
  console.warn("⚠️ Ruta no completamente validada");
  const desc = ValidacionBinaria.obtenerDescripcion(ruta.validacionBinaria);
  console.log(`Estado: ${desc.descripcion}`);
}
```

## Operaciones Bitwise (Referencia)

El sistema usa operaciones bitwise para manipular los bits:

- `|` (OR): Establecer un bit en 1
- `&` (AND): Verificar si un bit está en 1
- `~` (NOT): Negar un bit
- `^` (XOR): Invertir un bit

Ejemplo con operaciones directas:
```python
# Valor binario 011 = 3 en decimal
valor = 0b011

# Verificar si bit 0 (RUC) está activo
if valor & (1 << 0):  # 001
    print("RUC validado")

# Verificar si bit 1 (Resolución) está activo
if valor & (1 << 1):  # 010
    print("Resolución validada")

# Establecer bit 2 (Localidades)
valor |= (1 << 2)  # Resultado: 111
```

## Notas Importantes

1. **Siempre 3 bits**: El valor siempre debe ser una cadena de 3 caracteres binarios (ej: "001", "011", "111")
2. **Por defecto "000"**: Las rutas nuevas comienzan sin validar
3. **Carga Excel = "111"**: Las rutas importadas desde Excel se marcan como completamente validadas
4. **Inmutable en la ruta**: Una vez establecido, se puede actualizar pero refleja el estado actual
5. **Para auditoría**: Útil para tracking de qué fue validado y cuándo

## Integración con API

### Crear ruta con validación

```python
ruta_data = {
    "codigoRuta": "01",
    "nombre": "PUNO - JULIACA",
    "origen": {...},
    "destino": {...},
    "empresa": {...},
    "resolucion": {...},
    "frecuencia": {...},
    # Agregar validación binaria
    "validacionBinaria": "111"  # Todas validadas
}
```

### Actualizar solo validación

```python
# PATCH /api/rutas/{id}
{
    "validacionBinaria": "101"  # Agregar validación de localidades
}
```

### Filtrar por validación

```python
# GET /api/rutas?validacionBinaria=111
# Obtiene solo rutas completamente validadas
```

## Próximas Mejoras

- [ ] Dashboard de validación (ver cuántas rutas por nivel de validación)
- [ ] Reporte de rutas incompletas
- [ ] Sincronización automática basada en validación
- [ ] Notificaciones cuando falta validación
- [ ] Historial de cambios de validación


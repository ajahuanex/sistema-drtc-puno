# 🔄 Mejora: Renovación Automática de Resoluciones Padre

## 📋 Resumen

Se implementó una funcionalidad automática que actualiza el estado de resoluciones anteriores cuando se carga una renovación mediante carga masiva. El sistema es flexible y no requiere que todas las renovaciones tengan resolución asociada (útil para resoluciones antiguas).

## 🎯 Problema Identificado

Cuando se cargaba una resolución de tipo "RENOVACION" con una resolución asociada (ejemplo: fila 83):
- **Resolución nueva**: 0692-2025 (renovación del 20/10/2025)
- **Resolución anterior**: 0551-2021 (la que se renovó)

El sistema:
- ✅ Guardaba la referencia en `resolucionAsociada`
- ❌ **NO actualizaba** el estado de la resolución anterior a "RENOVADA"
- ❌ Requería cargar 2 filas manualmente (una para actualizar la anterior, otra para crear la nueva)

## ✨ Solución Implementada

### 1. Actualización Automática del Estado (Opcional)

Cuando se procesa una resolución de tipo "RENOVACION" **con** `resolucionAsociada`, el sistema:

1. **Normaliza** el número de la resolución asociada
2. **Busca** la resolución anterior en la base de datos
3. **Actualiza** automáticamente su estado a "RENOVADA" (si existe)
4. **Registra** la referencia bidireccional (campo `renovadaPor`)

**Si NO se especifica resolución asociada**: El sistema simplemente crea la nueva resolución sin generar advertencias. Esto es normal para resoluciones antiguas donde no se tiene el dato histórico.

```python
# Código implementado en resolucion_padres_service.py
if tipo_resolucion_frontend == 'RENOVACION' and resolucion_asociada:
    # Solo procesa si hay resolución asociada especificada
    resolucion_anterior = await self.resoluciones_collection.find_one({
        "nroResolucion": resolucion_asociada_normalizada
    })
    
    if resolucion_anterior:
        # Actualizar el estado de la resolución anterior a RENOVADA
        await self.resoluciones_collection.update_one(
            {"_id": resolucion_anterior["_id"]},
            {
                "$set": {
                    "estado": "RENOVADA",
                    "fechaActualizacion": datetime.now(),
                    "renovadaPor": numero_resolucion
                }
            }
        )
```

### 2. Validación Flexible

El sistema ahora es más flexible con las validaciones:

**✅ Casos aceptados sin advertencias:**
- Renovación SIN resolución asociada (resoluciones antiguas)
- Renovación CON resolución asociada que existe
- Fecha de resolución vacía (se usará fecha actual para normalización)

**⚠️ Solo genera advertencias cuando:**
- Se especifica una resolución asociada pero NO existe en la base de datos

### 3. Nuevo Estado "RENOVADA"

Se agregó el estado "RENOVADA" al modelo de datos:

**Frontend** (`resolucion.model.ts`):
```typescript
export type EstadoResolucion = 'VIGENTE' | 'VENCIDA' | 'SUSPENDIDA' | 
                               'REVOCADA' | 'DADA_DE_BAJA' | 'RENOVADA' | 'ANULADA';
```

**Backend** (mapeo en `resolucion_padres_service.py`):
```python
mapeo_estados = {
    'ACTIVA': 'VIGENTE',
    'VENCIDA': 'VENCIDA',
    'RENOVADA': 'RENOVADA',  # Ahora se mantiene como RENOVADA
    'ANULADA': 'ANULADA'
}
```

### 4. Campo Nuevo: `renovadaPor`

Se agregó un campo que registra qué resolución renovó a la actual:

```python
{
    "nroResolucion": "R-0551-2021",
    "estado": "RENOVADA",
    "renovadaPor": "R-0692-2025"  # ← Nuevo campo
}
```

## 📝 Uso en Carga Masiva

### Escenario 1: Renovación CON resolución asociada (datos completos)

```excel
RUC_EMPRESA_ASOCIADA: 20448889719
RESOLUCION_NUMERO: 0692-2025
RESOLUCION_ASOCIADA: 0551-2021  ← Especificada
TIPO_RESOLUCION: RENOVACION
FECHA_RESOLUCION: 20/10/2025
FECHA_INICIO_VIGENCIA: 16/09/2025
ANIOS_VIGENCIA: 4
FECHA_FIN_VIGENCIA: 16/09/2029
ESTADO: ACTIVA
```

**Resultado:**
1. ✅ Crea R-0692-2025 con estado VIGENTE
2. ✅ Busca R-0551-2021
3. ✅ Actualiza R-0551-2021 a estado RENOVADA (si existe)
4. ✅ Registra relación bidireccional

### Escenario 2: Renovación SIN resolución asociada (resoluciones antiguas)

```excel
RUC_EMPRESA_ASOCIADA: 20232008261
RESOLUCION_NUMERO: 0214-2023
RESOLUCION_ASOCIADA: [vacío]  ← Sin especificar (normal en datos antiguos)
TIPO_RESOLUCION: RENOVACION
FECHA_RESOLUCION: [vacío]  ← También puede estar vacío
FECHA_INICIO_VIGENCIA: 24/07/2022
ANIOS_VIGENCIA: 4
FECHA_FIN_VIGENCIA: 24/07/2026
ESTADO: ACTIVA
```

**Resultado:**
1. ✅ Crea R-0214-2023 con estado VIGENTE
2. ✅ No busca resolución anterior (campo vacío)
3. ✅ No genera advertencias
4. ✅ Proceso completado exitosamente

## ⚠️ Advertencias (Solo cuando es necesario)

### Caso: Resolución asociada especificada pero no existe
```
⚠️ Fila 83: Resolución asociada '0551-2021' no encontrada en la base de datos.
   Se creará la resolución pero no se actualizará el estado de la anterior.
```

**Nota**: Esto NO es un error, solo una advertencia informativa. La resolución nueva se crea normalmente.

## 🧪 Pruebas

Se creó el script `test_renovacion_automatica.py` que:

1. Crea una resolución inicial (R-0551-2021) con estado VIGENTE
2. Procesa una carga masiva con una renovación (R-0692-2025)
3. Verifica que la resolución anterior cambió a estado RENOVADA
4. Verifica que se registró el campo `renovadaPor`
5. Limpia los datos de prueba

**Ejecutar prueba:**
```bash
python test_renovacion_automatica.py
```

## 📊 Archivos Modificados

### Backend
1. `backend/app/services/resolucion_padres_service.py`
   - Agregado método `validar_plantilla_padres_con_db()`
   - Agregada lógica de actualización automática en `procesar_plantilla_padres()`
   - Agregado campo `renovadaPor` en actualización
   - Validaciones flexibles (no requiere resolución asociada)
   - Solo genera advertencias cuando es necesario

2. `backend/app/routers/resoluciones_router.py`
   - Actualizado endpoint para usar validación con base de datos

### Frontend
3. `frontend/src/app/models/resolucion.model.ts`
   - Agregado estado 'RENOVADA' y 'ANULADA' al tipo `EstadoResolucion`

### Pruebas y Documentación
4. `test_renovacion_automatica.py` (nuevo)
5. `MEJORA_RENOVACION_RESOLUCIONES.md` (este archivo)
6. `EJEMPLO_USO_RENOVACION.md`

## 🎯 Beneficios

1. **Flexibilidad**: Funciona con o sin resolución asociada
2. **Simplicidad**: Solo se necesita cargar la resolución nueva
3. **Automatización**: El sistema actualiza la anterior automáticamente (si existe)
4. **Trazabilidad**: Relación bidireccional entre resoluciones
5. **Sin ruido**: No genera advertencias innecesarias para datos antiguos
6. **Integridad**: Mantiene la coherencia de estados en la base de datos

## 📌 Casos de Uso Reales

### Datos Completos (Ideal)
```
Empresa: 20448889719
Nueva: 0692-2025 → Asociada: 0551-2021 ✅
Nueva: 0365-2025 → Asociada: 0031-2021 ✅
```

### Datos Parciales (Resoluciones Antiguas)
```
Empresa: 20232008261
Nueva: 0214-2023 → Asociada: [vacío] ✅ (Sin advertencia)
Nueva: 0155-2024 → Asociada: [vacío] ✅ (Sin advertencia)
```

### Datos Mixtos
```
Empresa: 20364027410
Nueva: 0495-2022 → Asociada: [vacío] ✅
Nueva: 0290-2023 → Asociada: 0495-2022 ✅ (Actualiza la anterior)
Nueva: 0685-2023 → Asociada: 0290-2023 ✅ (Actualiza la anterior)
```

## ✅ Conclusión

La funcionalidad de renovación automática está completamente implementada con validaciones flexibles. El sistema:

- ✅ Actualiza automáticamente resoluciones anteriores cuando se especifica la asociada
- ✅ Funciona perfectamente con resoluciones antiguas sin datos históricos
- ✅ No genera advertencias innecesarias
- ✅ Mantiene la integridad de los datos
- ✅ Es fácil de usar y entender

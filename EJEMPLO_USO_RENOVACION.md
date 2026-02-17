# 📖 Ejemplo de Uso: Renovación Automática de Resoluciones

## 🎯 Caso Real: Fila 83

### Situación
Una empresa tiene una resolución que venció y necesita renovarla:

- **Resolución anterior**: 0551-2021 (vencida)
- **Resolución nueva**: 0692-2025 (renovación)
- **Fecha de renovación**: 20/10/2025
- **Nueva vigencia**: 16/09/2025 al 16/09/2029 (4 años)

### ❌ Antes (Proceso Manual)

Tenías que hacer 2 pasos:

**Paso 1**: Actualizar la resolución anterior
```excel
RUC_EMPRESA_ASOCIADA: 20448889719
RESOLUCION_NUMERO: 0551-2021
RESOLUCION_ASOCIADA: [vacío]
TIPO_RESOLUCION: NUEVA
FECHA_RESOLUCION: 15/01/2021
FECHA_INICIO_VIGENCIA: 15/01/2021
ANIOS_VIGENCIA: 4
FECHA_FIN_VIGENCIA: 15/01/2025
ESTADO: RENOVADA  ← Cambiar manualmente
```

**Paso 2**: Crear la nueva resolución
```excel
RUC_EMPRESA_ASOCIADA: 20448889719
RESOLUCION_NUMERO: 0692-2025
RESOLUCION_ASOCIADA: 0551-2021
TIPO_RESOLUCION: RENOVACION
FECHA_RESOLUCION: 20/10/2025
FECHA_INICIO_VIGENCIA: 16/09/2025
ANIOS_VIGENCIA: 4
FECHA_FIN_VIGENCIA: 16/09/2029
ESTADO: ACTIVA
```

### ✅ Ahora (Proceso Automático)

Solo necesitas **1 fila** con la resolución nueva:

```excel
RUC_EMPRESA_ASOCIADA: 20448889719
RESOLUCION_NUMERO: 0692-2025
RESOLUCION_ASOCIADA: 0551-2021  ← ¡Importante! Especificar la anterior
TIPO_RESOLUCION: RENOVACION     ← ¡Importante! Tipo RENOVACION
FECHA_RESOLUCION: 20/10/2025
FECHA_INICIO_VIGENCIA: 16/09/2025
ANIOS_VIGENCIA: 4
FECHA_FIN_VIGENCIA: 16/09/2029
ESTADO: ACTIVA
```

**El sistema automáticamente:**
1. ✅ Crea R-0692-2025 con estado VIGENTE
2. ✅ Busca R-0551-2021 en la base de datos
3. ✅ Actualiza R-0551-2021 a estado RENOVADA
4. ✅ Registra que R-0551-2021 fue renovada por R-0692-2025

## 📊 Plantilla Excel Completa

### Columnas Requeridas

| Columna | Nombre | Ejemplo | Descripción |
|---------|--------|---------|-------------|
| A | RUC_EMPRESA_ASOCIADA | 20448889719 | RUC de 11 dígitos |
| B | RESOLUCION_NUMERO | 0692-2025 | Número de la nueva resolución |
| C | RESOLUCION_ASOCIADA | 0551-2021 | **Resolución que se está renovando** |
| D | TIPO_RESOLUCION | RENOVACION | NUEVA, RENOVACION o MODIFICACION |
| E | FECHA_RESOLUCION | 20/10/2025 | Fecha de emisión (opcional) |
| F | FECHA_INICIO_VIGENCIA | 16/09/2025 | Fecha inicio de vigencia |
| G | ANIOS_VIGENCIA | 4 | Años de vigencia (4 o 10) |
| H | FECHA_FIN_VIGENCIA | 16/09/2029 | Fecha fin de vigencia |
| I | ESTADO | ACTIVA | ACTIVA, VENCIDA, RENOVADA, ANULADA |

### Ejemplo con Múltiples Renovaciones

```excel
| RUC           | NUMERO    | ASOCIADA  | TIPO       | FECHA_RESOL | INICIO     | AÑOS | FIN        | ESTADO |
|---------------|-----------|-----------|------------|-------------|------------|------|------------|--------|
| 20448889719   | 0692-2025 | 0551-2021 | RENOVACION | 20/10/2025  | 16/09/2025 | 4    | 16/09/2029 | ACTIVA |
| 20364320125   | 0076-2022 | 0001-2018 | RENOVACION | 15/03/2022  | 06/03/2022 | 4    | 06/03/2026 | ACTIVA |
| 20364320125   | 0140-2024 | 0076-2022 | RENOVACION | 30/12/2023  | 30/12/2023 | 10   | 30/12/2033 | ACTIVA |
```

**Resultado:**
- R-0692-2025 creada → R-0551-2021 actualizada a RENOVADA
- R-0076-2022 creada → R-0001-2018 actualizada a RENOVADA
- R-0140-2024 creada → R-0076-2022 actualizada a RENOVADA

## 🔍 Verificación en la Base de Datos

Después de la carga, puedes verificar:

### Resolución Nueva (R-0692-2025)
```json
{
  "nroResolucion": "R-0692-2025",
  "empresaId": "...",
  "tipoResolucion": "PADRE",
  "tipoTramite": "RENOVACION",
  "estado": "VIGENTE",
  "resolucionAsociada": "0551-2021",
  "fechaVigenciaInicio": "2025-09-16",
  "fechaVigenciaFin": "2029-09-16",
  "aniosVigencia": 4
}
```

### Resolución Anterior (R-0551-2021)
```json
{
  "nroResolucion": "R-0551-2021",
  "empresaId": "...",
  "tipoResolucion": "PADRE",
  "tipoTramite": "AUTORIZACION_NUEVA",
  "estado": "RENOVADA",  ← Actualizado automáticamente
  "renovadaPor": "R-0692-2025",  ← Nuevo campo
  "fechaVigenciaInicio": "2021-01-15",
  "fechaVigenciaFin": "2025-01-15",
  "aniosVigencia": 4,
  "fechaActualizacion": "2025-02-15T..."  ← Timestamp de actualización
}
```

## ⚠️ Casos Especiales

### Caso 1: Renovación SIN Resolución Asociada (Resoluciones Antiguas) ✅

**Excel:**
```excel
RUC: 20232008261
NUMERO: 0214-2023
ASOCIADA: [vacío]  ← Sin especificar (NORMAL para datos antiguos)
TIPO: RENOVACION
FECHA_RESOLUCION: [vacío]  ← También puede estar vacío
FECHA_INICIO_VIGENCIA: 24/07/2022
ANIOS_VIGENCIA: 4
FECHA_FIN_VIGENCIA: 24/07/2026
ESTADO: ACTIVA
```

**Resultado:**
- ✅ Se crea R-0214-2023 normalmente con estado VIGENTE
- ✅ No busca resolución anterior (campo vacío)
- ✅ No genera advertencias
- ℹ️ Esto es completamente normal para resoluciones antiguas

### Caso 2: Resolución Asociada Especificada pero No Existe

**Excel:**
```excel
RUC: 20448889719
NUMERO: 0692-2025
ASOCIADA: 9999-2020  ← Especificada pero no existe en la BD
TIPO: RENOVACION
```

**Resultado:**
- ✅ Se crea R-0692-2025 normalmente
- ⚠️ Advertencia: "Resolución asociada '9999-2020' no encontrada. No se pudo actualizar su estado."
- ℹ️ El proceso continúa sin errores

### Caso 3: Resolución Nueva (No Renovación)

**Excel:**
```excel
RUC: 20448889719
NUMERO: 0800-2025
ASOCIADA: [vacío]
TIPO: NUEVA  ← No es renovación
```

**Resultado:**
- ✅ Se crea R-0800-2025 normalmente
- ℹ️ No se busca ni actualiza ninguna resolución anterior
- ℹ️ El campo ASOCIADA se ignora

## 📝 Recomendaciones

### ✅ Buenas Prácticas

1. **Especifica la resolución asociada cuando la tengas**
   ```
   TIPO: RENOVACION
   ASOCIADA: 0551-2021  ← Llenar si tienes el dato
   ```

2. **No te preocupes si no tienes el dato histórico**
   ```
   TIPO: RENOVACION
   ASOCIADA: [vacío]  ← Está bien dejarlo vacío para datos antiguos
   ```

3. **Usa el formato correcto** para números de resolución
   - ✅ Correcto: `0551-2021`, `R-0551-2021`, `551-2021`
   - ❌ Incorrecto: `551`, `R551`, `0551/2021`

4. **La fecha de resolución es opcional**
   - Si no la tienes, déjala vacía
   - El sistema usará la fecha actual para normalización

### ❌ Errores Comunes

1. **Número de resolución asociada incorrecto**
   ```
   ASOCIADA: 0551-2020  ← Error: el año es 2021, no 2020
   ```
   Solución: Verifica el número correcto antes de cargar

2. **Tipo incorrecto para renovaciones**
   ```
   TIPO: NUEVA  ← Error: debería ser RENOVACION
   ASOCIADA: 0551-2021
   ```
   Solución: Usa TIPO: RENOVACION para renovaciones

## 🎓 Flujo Completo

```
1. Usuario prepara Excel con renovación
   ↓
2. Especifica TIPO: RENOVACION y RESOLUCION_ASOCIADA
   ↓
3. Sube archivo en "Carga Masiva Padres"
   ↓
4. Sistema valida datos
   ↓
5. Sistema busca resolución anterior (0551-2021)
   ↓
6. Sistema actualiza anterior a estado RENOVADA
   ↓
7. Sistema crea nueva resolución (0692-2025)
   ↓
8. Sistema registra relación bidireccional
   ↓
9. Usuario recibe confirmación con estadísticas
```

## 📞 Soporte

Si tienes dudas o problemas:
1. Revisa las advertencias en el resultado de la carga
2. Verifica que la resolución anterior exista en la base de datos
3. Consulta este documento para casos especiales
4. Ejecuta el script de prueba: `python test_renovacion_automatica.py`

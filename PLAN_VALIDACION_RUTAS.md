# Plan de Validación Binaria de Rutas

## Estado Actual

Se ha implementado la infraestructura del sistema de validación binaria para rutas:

### ✅ Implementado

1. **Campo `validacionBinaria` en modelo Ruta**
   - Backend: `backend/app/models/ruta.py`
   - Frontend: `frontend/src/app/models/ruta.model.ts`
   - Por defecto: `"000"` (sin validación)

2. **Utilidades de validación binaria**
   - Backend: `backend/app/utils/validacion_binaria.py` (Python)
   - Frontend: `frontend/src/app/utils/validacion-binaria.ts` (TypeScript)
   - Métodos para crear, verificar y modificar bits

3. **Integración en carga masiva de Excel**
   - Las rutas importadas desde Excel se marcan con `"111"` (todas validadas)
   - El número de fila se captura y se incluye en errores

4. **Captura de número de fila**
   - Modificada función `_convertir_fila_a_ruta()` para recibir y almacenar `fila_num`
   - Los errores de procesamiento ahora incluyen el número de fila

## 📋 Estructura Binaria

```
validacionBinaria = "XYZ"

Bit 0 (001): RUC validado
Bit 1 (010): Resolución validada
Bit 2 (100): Localidades validadas

Ejemplos:
"000" = Sin validación
"001" = Solo RUC
"011" = RUC + Resolución
"111" = Todas validadas ✅
```

## 🎯 Próximos Pasos (Evaluación)

Después de que las rutas se importan (con `validacionBinaria = "111"`), se ejecutará un proceso de evaluación que:

1. **Verificará RUC** (Bit 0)
   - Validar que el RUC de la empresa existe en la BD
   - Que está activo
   - Actualizar a `"011"` si falla (quitar bit 0)

2. **Verificará Resolución** (Bit 1)
   - Validar que la resolución existe en la BD
   - Que está activa
   - Actualizar a `"101"` si falla (quitar bit 1)

3. **Verificará Localidades** (Bit 2)
   - Validar que origen existe
   - Que destino existe
   - Que itinerario (si existe) está correcto
   - Actualizar a `"011"` si falla (quitar bit 2)

## 📊 Resultado de Evaluación

Después de la evaluación, las rutas pueden tener:

- `"111"` - ✅ Completamente validada
- `"011"` - RUC + Resolución (localidades faltante)
- `"101"` - RUC + Localidades (resolución faltante)
- `"110"` - Resolución + Localidades (RUC faltante)
- `"001"` - Solo RUC validado
- `"010"` - Solo Resolución validada
- `"100"` - Solo Localidades validadas
- `"000"` - Ninguna validación (debería ser rara)

## 🔄 Flujo Actual

1. **Importación desde Excel**
   - Usuario sube archivo Excel
   - Sistema valida estructura y campos obligatorios
   - Se crean rutas con `validacionBinaria = "111"`
   - Los números de fila se capturan y se reportan en errores

2. **Después de Importación (Próximo)**
   - Ejecutar evaluación de sincronizaciones
   - Actualizar `validacionBinaria` basado en resultado
   - Reportar cuáles faltaron validar
   - Dashboard para ver rutas incompletas

## 📝 Documentación

- `VALIDACION_BINARIA_RUTAS.md` - Guía completa de uso
- `backend/app/utils/validacion_binaria.py` - Implementación Python
- `frontend/src/app/utils/validacion-binaria.ts` - Implementación TypeScript

## 🛠️ Notas Importantes

- El campo es **inmutable en la UI** durante importación (se fija en "111")
- Se puede actualizar después durante evaluación
- El número de fila ahora se reporta correctamente en errores
- Las rutas importadas están funcionales y listos para después evaluar


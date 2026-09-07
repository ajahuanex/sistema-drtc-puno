# 🐛 Cambios DEBUG Aplicados

## Fecha: Ahora
## Objetivo: Diagnosticar errores de validación en importación

---

## ✅ Cambios Aplicados

### 1. **Agregado número de fila** en datos de ruta
```python
# En _convertir_fila_a_ruta():
return {
    'fila': fila_num,  # ✅ NUEVO
    'ruc': ruc,
    'resolucionNormalizada': resolucion_normalizada,
    # ... resto de campos
}
```

### 2. **Límite de 10 filas para prueba**
```python
# En validar_archivo_excel():
LIMITE_PRUEBA = 10  # ⚠️ Solo procesa 10 filas
filas_procesadas = 0

for index, row in df.iterrows():
    if filas_procesadas >= LIMITE_PRUEBA:
        break
    filas_procesadas += 1
    # ... procesar fila
```

### 3. **Debug detallado por fila**
```python
# En _crear_ruta_desde_datos():
print(f"{'='*80}")
print(f"🔍 DEBUG FILA {fila_num}: INICIANDO CREACIÓN DE RUTA")
print(f"🔍 DEBUG FILA {fila_num}: RUC: {ruta_data['ruc']}")
print(f"🔍 DEBUG FILA {fila_num}: Resolución: {ruta_data['resolucionNormalizada']}")
print(f"🔍 DEBUG FILA {fila_num}: Código: {ruta_data['codigoRuta']}")
print(f"🔍 DEBUG FILA {fila_num}: Origen: {ruta_data['origen']}")
print(f"🔍 DEBUG FILA {fila_num}: Destino: {ruta_data['destino']}")
print(f"{'='*80}")
```

### 4. **Debug de coordenadas**
```python
# En _extraer_coordenadas_validas():
print(f"  🔍 _extraer_coordenadas_validas: Input type: {type(coordenadas)}, value: {coordenadas}")
print(f"  🔍 latitud: {latitud} (type: {type(latitud)})")
print(f"  🔍 longitud: {longitud} (type: {type(longitud)})")
```

### 5. **Debug de LocalidadEmbebida**
```python
print(f"🔍 DEBUG FILA {fila_num}: Origen coordenadas: {origen_localidad.get('coordenadas')}")
print(f"🔍 DEBUG FILA {fila_num}: Extrayendo coordenadas válidas para origen...")
origen_coords = self._extraer_coordenadas_validas(origen_localidad.get("coordenadas"))
print(f"🔍 DEBUG FILA {fila_num}: Origen coordenadas extraídas: {origen_coords}")
print(f"🔍 DEBUG FILA {fila_num}: Creando LocalidadEmbebida para origen...")
```

### 6. **Error reporting mejorado**
```python
except Exception as e:
    fila_num = ruta_data.get('fila', 'N/A')
    print(f"❌ ERROR FILA {fila_num}: {str(e)}")
    print(f"❌ ERROR tipo: {type(e).__name__}")
    print(f"❌ Datos de la ruta:")
    print(f"   - RUC: {ruta_data.get('ruc')}")
    print(f"   - Código: {ruta_data.get('codigoRuta')}")
    print(f"   - Origen: {ruta_data.get('origen')}")
    print(f"   - Destino: {ruta_data.get('destino')}")
    traceback.print_exc()
```

---

## 🎯 Qué Buscar en la Consola

### Output Esperado (Caso Exitoso)
```
================================================================================
DEBUG: Procesando fila 2/10
================================================================================

================================================================================
🔍 DEBUG FILA 2: INICIANDO CREACIÓN DE RUTA
🔍 DEBUG FILA 2: RUC: 20448048242
🔍 DEBUG FILA 2: Resolución: R-0921-2023
🔍 DEBUG FILA 2: Código: 01
🔍 DEBUG FILA 2: Origen: PUNO
🔍 DEBUG FILA 2: Destino: JULIACA
================================================================================

🔍 DEBUG FILA 2: Buscando empresa con RUC: '20448048242'
🔍 DEBUG FILA 2: Empresa encontrada: True
🔍 DEBUG FILA 2: Buscando localidad origen: PUNO
🔍 DEBUG FILA 2: Origen localidad obtenida: 65abc123...
🔍 DEBUG FILA 2: Origen coordenadas: {'latitud': -15.84, 'longitud': -70.02}
  🔍 _extraer_coordenadas_validas: Input type: <class 'dict'>, value: {'latitud': -15.84, 'longitud': -70.02}
  🔍 latitud: -15.84 (type: <class 'float'>)
  🔍 longitud: -70.02 (type: <class 'float'>)
  ✅ Coordenadas válidas extraídas: {'latitud': -15.84, 'longitud': -70.02}
🔍 DEBUG FILA 2: Origen coordenadas extraídas: {'latitud': -15.84, 'longitud': -70.02}
🔍 DEBUG FILA 2: Creando LocalidadEmbebida para origen...
🔍 DEBUG FILA 2: LocalidadEmbebida origen creada OK
```

### Output Esperado (Caso con Error)
```
================================================================================
DEBUG: Procesando fila 3/10
================================================================================

================================================================================
🔍 DEBUG FILA 3: INICIANDO CREACIÓN DE RUTA
🔍 DEBUG FILA 3: RUC: 20999999999
🔍 DEBUG FILA 3: Resolución: R-0495-2022
🔍 DEBUG FILA 3: Código: 02
🔍 DEBUG FILA 3: Origen: LIMA
🔍 DEBUG FILA 3: Destino: CUSCO
================================================================================

🔍 DEBUG FILA 3: Buscando localidad origen: LIMA
🔍 DEBUG FILA 3: Origen localidad obtenida: 65xyz789...
🔍 DEBUG FILA 3: Origen coordenadas: None
  🔍 _extraer_coordenadas_validas: Input type: <class 'NoneType'>, value: None
  ✅ Coordenadas is None, returning None
🔍 DEBUG FILA 3: Origen coordenadas extraídas: None
🔍 DEBUG FILA 3: Creando LocalidadEmbebida para origen...

❌ ERROR FILA 3: 1 validation error for LocalidadEmbebida
coordenadas
  Input should be a valid dictionary [type=dict_type]
❌ ERROR tipo: ValidationError
❌ Datos de la ruta:
   - RUC: 20999999999
   - Código: 02
   - Origen: LIMA
   - Destino: CUSCO
```

---

## 🔍 Diagnóstico de Errores

### Si ves: "Input should be a valid dictionary"

**Posibles causas:**
1. `coordenadas` tiene un valor que no es `None` ni `dict`
2. El modelo Pydantic tiene validación adicional en `coordenadas`
3. Hay un campo extra no esperado

**Qué revisar:**
```python
# En el output, buscar:
🔍 DEBUG FILA X: Origen coordenadas: <valor aquí>
  🔍 _extraer_coordenadas_validas: Input type: <tipo>, value: <valor>
```

### Si ves: "coordenadas incompletas"

```
  ⚠️ Coordenadas incompletas, returning None
```

Significa que la localidad tiene solo latitud O solo longitud (no ambos).
Esto está bien manejado, debería retornar `None`.

### Si ves: "Error convirtiendo coordenadas a float"

```
  ❌ Error convirtiendo coordenadas a float: <error>
```

Significa que los valores de latitud/longitud no son numéricos.
Esto también está bien manejado, retorna `None`.

---

## 📋 Pasos para Diagnosticar

### 1. Reiniciar Backend
```bash
pkill -f "python.*uvicorn"
./start-backend.sh
```

### 2. Importar Archivo (primeras 10 filas)
Desde el frontend, subir el archivo Excel.

### 3. Revisar Consola del Backend
Buscar los logs detallados:
- ¿En qué fila falla?
- ¿Qué tipo de coordenadas tiene?
- ¿El error es antes o después de `_extraer_coordenadas_validas`?

### 4. Identificar el Problema

**Escenario A:** Error ANTES de crear LocalidadEmbebida
```
🔍 DEBUG FILA X: Buscando localidad origen: LIMA
❌ ERROR FILA X: ...
```
→ Problema en `_buscar_o_crear_localidad`

**Escenario B:** Error AL crear LocalidadEmbebida
```
🔍 DEBUG FILA X: Creando LocalidadEmbebida para origen...
❌ ERROR FILA X: 1 validation error for LocalidadEmbebida
```
→ Problema con el modelo Pydantic o los datos pasados

**Escenario C:** Error DESPUÉS de crear LocalidadEmbebida
```
🔍 DEBUG FILA X: LocalidadEmbebida origen creada OK
🔍 DEBUG FILA X: LocalidadEmbebida destino creada OK
❌ ERROR FILA X: ...
```
→ Problema más adelante (frecuencia, RutaCreate, etc.)

---

## ⚠️ RECORDAR

**Después de diagnosticar, REMOVER el límite de 10 filas:**

```python
# En validar_archivo_excel(), COMENTAR o REMOVER:
# LIMITE_PRUEBA = 10
# if filas_procesadas >= LIMITE_PRUEBA:
#     break
```

**Opcional: Reducir el nivel de debug** si es muy verboso:

```python
# Cambiar los print() por logging condicional
if DEBUG_MODE:
    print(f"🔍 DEBUG...")
```

---

## 🎯 Resultado Esperado

Con estos cambios, deberías ver:

1. **Número de fila exacto** en cada error
2. **Estado de coordenadas** antes y después de extraer
3. **Punto exacto** donde falla la validación de Pydantic
4. **Solo 10 filas procesadas** para diagnóstico rápido

Esto permitirá identificar si:
- El problema es con coordenadas `None`
- El problema es con otro campo de LocalidadEmbebida
- El problema es con el modelo Pydantic mismo

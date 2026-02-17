# Instrucciones para Carga Masiva de Resoluciones con Años de Vigencia

## Cambios Implementados

Se ha corregido el módulo de carga masiva de resoluciones para que tome en cuenta correctamente los años de vigencia. Ahora el sistema:

1. ✅ Lee la columna "Años Vigencia" del Excel
2. ✅ Valida que sea un número válido (típicamente 4 o 10 años)
3. ✅ Calcula automáticamente la fecha de fin de vigencia
4. ✅ Guarda los años de vigencia en la base de datos

## Cómo Usar

### 1. Descargar la Plantilla Actualizada

1. Ir a: http://localhost:4200/resoluciones/carga-masiva
2. Hacer clic en "Descargar Plantilla"
3. La plantilla ahora incluye la columna "Años Vigencia"

### 2. Llenar la Plantilla

#### Para Resoluciones PADRE:

| Campo | Obligatorio | Ejemplo | Descripción |
|-------|-------------|---------|-------------|
| Número Resolución | ✅ Sí | 1001-2024 | Sin prefijo R- |
| RUC Empresa | ✅ Sí | 20123456789 | 11 dígitos |
| Fecha Emisión | ✅ Sí | 15/01/2024 | Formato dd/mm/yyyy |
| Fecha Vigencia Inicio | ✅ Sí | 15/01/2024 | Fecha de inicio |
| **Años Vigencia** | **✅ Sí** | **4** o **10** | **Años de vigencia** |
| Fecha Vigencia Fin | ⚠️ Opcional | 14/01/2028 | Se calcula automáticamente |
| Tipo Resolución | ✅ Sí | PADRE | Debe ser PADRE |
| Tipo Trámite | ✅ Sí | PRIMIGENIA | Tipo de trámite |
| Descripción | ✅ Sí | Autorización... | Mínimo 10 caracteres |

#### Para Resoluciones HIJO:

| Campo | Obligatorio | Ejemplo | Descripción |
|-------|-------------|---------|-------------|
| Resolución Padre | ✅ Sí | R-1001-2024 | Número de resolución padre |
| Número Resolución | ✅ Sí | 1002-2024 | Sin prefijo R- |
| RUC Empresa | ✅ Sí | 20123456789 | 11 dígitos |
| Fecha Emisión | ✅ Sí | 20/01/2024 | Formato dd/mm/yyyy |
| Fecha Vigencia Inicio | ❌ No | (vacío) | Se hereda del padre |
| **Años Vigencia** | **❌ No** | **(vacío)** | **Se hereda del padre** |
| Fecha Vigencia Fin | ❌ No | (vacío) | Se hereda del padre |
| Tipo Resolución | ✅ Sí | HIJO | Debe ser HIJO |
| Tipo Trámite | ✅ Sí | RENOVACION | Tipo de trámite |
| Descripción | ✅ Sí | Renovación... | Mínimo 10 caracteres |

### 3. Ejemplos Prácticos

#### Ejemplo 1: Resolución con 4 años de vigencia

```
Fecha Inicio: 15/01/2024
Años Vigencia: 4
Fecha Fin Calculada: 14/01/2028
```

**Explicación:** 15/01/2024 + 4 años - 1 día = 14/01/2028

#### Ejemplo 2: Resolución con 10 años de vigencia

```
Fecha Inicio: 20/03/2024
Años Vigencia: 10
Fecha Fin Calculada: 19/03/2034
```

**Explicación:** 20/03/2024 + 10 años - 1 día = 19/03/2034

### 4. Validación

El sistema validará:

- ✅ Que las resoluciones PADRE tengan "Años Vigencia"
- ✅ Que el valor sea un número entero
- ✅ Que esté en un rango razonable (1-50 años)
- ⚠️ Advertencia si no es 4 o 10 años (valores típicos)
- ✅ Si se proporciona "Fecha Vigencia Fin", se valida contra el cálculo

### 5. Procesamiento

1. Seleccionar el archivo Excel
2. Hacer clic en "Validar" para verificar los datos
3. Revisar errores y advertencias
4. Si todo está correcto, cambiar a "Procesar y Crear"
5. Hacer clic en "Procesar Archivo"

## Fórmula de Cálculo

```
Fecha Fin = Fecha Inicio + Años de Vigencia - 1 día
```

**¿Por qué se resta 1 día?**

Porque la vigencia incluye el día de inicio. Si una resolución inicia el 15/01/2024 y tiene 4 años de vigencia, el último día válido es el 14/01/2028 (completando exactamente 4 años).

## Casos Especiales

### Años Bisiestos

El sistema maneja correctamente los años bisiestos:

```
Fecha Inicio: 29/02/2024 (año bisiesto)
Años Vigencia: 4
Fecha Fin: 28/02/2028 (2028 es bisiesto, pero se resta 1 día)
```

### Validación de Fecha Fin Proporcionada

Si proporciona una "Fecha Vigencia Fin" en el Excel:

- ✅ Se calcula la fecha automáticamente
- ✅ Se compara con la fecha proporcionada
- ⚠️ Si hay diferencia > 2 días, se muestra advertencia
- ✅ Se usa la fecha calculada (no la proporcionada)

## Archivos de Prueba

Se han creado varios archivos para probar:

1. **test_calculo_vigencia_resoluciones.py**
   - Prueba el cálculo de fechas
   - Valida diferentes casos

2. **crear_plantilla_resoluciones_con_vigencia.py**
   - Genera plantilla de ejemplo
   - Incluye casos con 4 y 10 años

3. **test_carga_masiva_vigencia_completo.py**
   - Verificación completa del sistema
   - Valida plantilla, modelo y cálculos

## Ejecutar Pruebas

```bash
# Probar cálculo de fechas
python test_calculo_vigencia_resoluciones.py

# Crear plantilla de ejemplo
python crear_plantilla_resoluciones_con_vigencia.py

# Verificación completa
python test_carga_masiva_vigencia_completo.py
```

## Notas Importantes

- 📌 El campo "Años Vigencia" es **obligatorio** para resoluciones PADRE
- 📌 El campo "Fecha Vigencia Fin" es **opcional** (se calcula automáticamente)
- 📌 Los valores típicos son 4 o 10 años
- 📌 Las resoluciones HIJO heredan la vigencia del padre
- 📌 El cálculo es: Fecha Inicio + Años - 1 día
- 📌 Se guarda el número de años en la base de datos

## Soporte

Si tiene problemas:

1. Verifique que la plantilla tenga la columna "Años Vigencia"
2. Asegúrese de que el valor sea un número entero
3. Revise los mensajes de error en la validación
4. Consulte los ejemplos en este documento

## Resumen Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    RESOLUCIÓN PADRE                         │
├─────────────────────────────────────────────────────────────┤
│ Fecha Inicio: 15/01/2024                                    │
│ Años Vigencia: 4                                            │
│ ↓                                                            │
│ Fecha Fin: 14/01/2028 (calculada automáticamente)          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    RESOLUCIÓN HIJO                          │
├─────────────────────────────────────────────────────────────┤
│ Resolución Padre: R-1001-2024                               │
│ ↓                                                            │
│ Hereda vigencia del padre (15/01/2024 - 14/01/2028)        │
└─────────────────────────────────────────────────────────────┘
```

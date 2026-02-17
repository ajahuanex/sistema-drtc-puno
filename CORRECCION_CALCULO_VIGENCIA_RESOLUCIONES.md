# Corrección del Cálculo de Vigencia en Resoluciones

## Problema Identificado

En el módulo de carga masiva de resoluciones, no se estaba tomando en cuenta correctamente los años de vigencia. Algunas resoluciones tienen 4 años de vigencia y otras 10 años, y la fecha de fin de vigencia debe calcularse como:

```
Fecha Fin = Fecha Inicio + Años de Vigencia - 1 día
```

## Cambios Realizados

### 1. Plantilla Excel Actualizada

Se agregó la columna **"Años Vigencia"** en la plantilla de carga masiva:

| Columna | Descripción | Obligatorio | Valores |
|---------|-------------|-------------|---------|
| Fecha Vigencia Inicio | Fecha de inicio de vigencia | Sí (solo PADRE) | dd/mm/yyyy |
| **Años Vigencia** | Años de vigencia de la resolución | **Sí (solo PADRE)** | **4 o 10** |
| Fecha Vigencia Fin | Fecha de fin de vigencia | No (se calcula) | dd/mm/yyyy |

### 2. Validaciones Implementadas

**En `resolucion_excel_service.py`:**

```python
# Validar años de vigencia para resoluciones PADRE
if not anios_vigencia:
    errores.append("Las resoluciones PADRE deben tener años de vigencia (4 o 10)")
else:
    try:
        anios = int(anios_vigencia)
        if anios not in [4, 10]:
            advertencias.append(f"Años de vigencia inusual: {anios}. Normalmente son 4 o 10 años")
        if anios < 1 or anios > 50:
            errores.append(f"Años de vigencia fuera de rango válido (1-50): {anios}")
    except ValueError:
        errores.append(f"Años de vigencia debe ser un número entero: {anios_vigencia}")
```

### 3. Cálculo Automático de Fecha Fin

El sistema ahora calcula automáticamente la fecha de fin de vigencia:

```python
# Calcular fecha fin: inicio + años - 1 día
fecha_inicio_dt = datetime.strptime(fecha_vigencia_inicio, '%Y-%m-%d')
fecha_fin_calculada_dt = fecha_inicio_dt + relativedelta(years=anios_vigencia) - relativedelta(days=1)
fecha_vigencia_fin = fecha_fin_calculada_dt.strftime('%Y-%m-%d')
```

### 4. Validación de Fecha Fin (Opcional)

Si el usuario proporciona una fecha fin en el Excel, el sistema la valida contra el cálculo:

```python
# Si viene fecha fin en el Excel, validar que coincida
if fecha_vigencia_fin_str:
    diferencia_dias = abs((fecha_fin_excel_dt - fecha_fin_calculada_dt).days)
    if diferencia_dias > 2:  # Tolerancia de 2 días
        advertencia = f"Fecha fin del Excel no coincide con el cálculo. Se usará la fecha calculada."
```

## Ejemplos de Uso

### Ejemplo 1: Resolución con 4 años de vigencia

```
Fecha Inicio: 15/01/2024
Años Vigencia: 4
Fecha Fin Calculada: 14/01/2028
```

**Explicación:** 15/01/2024 + 4 años - 1 día = 14/01/2028

### Ejemplo 2: Resolución con 10 años de vigencia

```
Fecha Inicio: 20/03/2024
Años Vigencia: 10
Fecha Fin Calculada: 19/03/2034
```

**Explicación:** 20/03/2024 + 10 años - 1 día = 19/03/2034

### Ejemplo 3: Año Bisiesto

```
Fecha Inicio: 29/02/2024
Años Vigencia: 4
Fecha Fin Calculada: 28/02/2028
```

**Explicación:** 29/02/2024 + 4 años - 1 día = 28/02/2028 (2028 es bisiesto, pero restamos 1 día)

## Estructura de la Plantilla Excel

```
| Resolución Padre | Número Resolución | RUC Empresa | Fecha Emisión | Fecha Vigencia Inicio | Años Vigencia | Fecha Vigencia Fin | Tipo Resolución | ... |
|------------------|-------------------|-------------|---------------|----------------------|---------------|-------------------|-----------------|-----|
|                  | 1001-2024         | 20123456789 | 15/01/2024    | 15/01/2024          | 4             | 14/01/2028        | PADRE           | ... |
|                  | 1002-2024         | 20234567890 | 20/03/2024    | 20/03/2024          | 10            | 19/03/2034        | PADRE           | ... |
| R-1001-2024      | 1003-2024         | 20123456789 | 25/01/2024    |                      |               |                   | HIJO            | ... |
```

## Reglas de Negocio

1. **Resoluciones PADRE:**
   - Deben tener `Fecha Vigencia Inicio`
   - Deben tener `Años Vigencia` (típicamente 4 o 10)
   - `Fecha Vigencia Fin` se calcula automáticamente
   - Si se proporciona `Fecha Vigencia Fin`, se valida contra el cálculo

2. **Resoluciones HIJO:**
   - NO deben tener fechas de vigencia (se heredan del padre)
   - NO deben tener años de vigencia
   - Heredan automáticamente la vigencia de la resolución padre

3. **Cálculo de Fecha Fin:**
   - Fórmula: `Fecha Inicio + Años - 1 día`
   - Razón: La vigencia incluye el día de inicio
   - Ejemplo: Si inicia el 15/01/2024 y tiene 4 años, termina el 14/01/2028

## Archivos Modificados

1. **backend/app/services/resolucion_excel_service.py**
   - Actualizada plantilla Excel con columna "Años Vigencia"
   - Agregadas validaciones para años de vigencia
   - Implementado cálculo automático de fecha fin
   - Agregada validación opcional de fecha fin proporcionada

## Scripts de Prueba

1. **test_calculo_vigencia_resoluciones.py**
   - Prueba el cálculo de fechas con diferentes casos
   - Valida años bisiestos
   - Verifica formatos de fecha

2. **crear_plantilla_resoluciones_con_vigencia.py**
   - Genera plantilla Excel de ejemplo
   - Incluye casos con 4 y 10 años de vigencia
   - Muestra resoluciones PADRE e HIJO

## Cómo Probar

1. Generar plantilla de ejemplo:
   ```bash
   python crear_plantilla_resoluciones_con_vigencia.py
   ```

2. Probar cálculo de fechas:
   ```bash
   python test_calculo_vigencia_resoluciones.py
   ```

3. Usar la plantilla en el frontend:
   - Ir a: http://localhost:4200/resoluciones/carga-masiva
   - Descargar plantilla actualizada
   - Llenar con datos (incluyendo Años Vigencia)
   - Validar y procesar

## Notas Importantes

- ✅ El campo "Años Vigencia" es **obligatorio** para resoluciones PADRE
- ✅ El campo "Fecha Vigencia Fin" es **opcional** (se calcula automáticamente)
- ✅ Si se proporciona "Fecha Vigencia Fin", se valida con tolerancia de 2 días
- ✅ Los valores típicos son 4 o 10 años, pero se aceptan otros valores (con advertencia)
- ✅ Las resoluciones HIJO heredan la vigencia del padre automáticamente

## Beneficios

1. **Precisión:** Cálculo exacto de fechas de vigencia
2. **Flexibilidad:** Soporte para diferentes períodos de vigencia
3. **Validación:** Detección de inconsistencias en fechas
4. **Automatización:** No es necesario calcular manualmente la fecha fin
5. **Trazabilidad:** Se guarda el número de años de vigencia en la base de datos

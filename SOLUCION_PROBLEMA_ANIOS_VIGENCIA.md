# Solución al Problema de Años de Vigencia

## Problema Reportado

Al importar resoluciones mediante carga masiva, todos los registros se guardan con 4 años de vigencia, incluso cuando en el Excel se especifican 10 años.

## Causa Raíz

El problema puede deberse a una de estas causas:

1. **Excel antiguo sin la columna "Años Vigencia"**
   - Si el Excel fue descargado antes de la actualización, no tiene la columna

2. **Valores vacíos o NaN en la columna**
   - Si la celda está vacía, el sistema usa 4 años por defecto

3. **Formato incorrecto de los datos**
   - Si el valor no es numérico, se usa 4 años por defecto

## Solución Paso a Paso

### 1. Descargar Nueva Plantilla

1. Ir a: http://localhost:4200/resoluciones/carga-masiva
2. Hacer clic en **"Descargar Plantilla"**
3. Verificar que la plantilla tenga la columna **"Años Vigencia"** (columna F)

### 2. Verificar Estructura del Excel

La plantilla debe tener estas columnas en este orden:

```
A. Resolución Padre
B. Número Resolución
C. RUC Empresa
D. Fecha Emisión
E. Fecha Vigencia Inicio
F. Años Vigencia          ← IMPORTANTE: Esta columna debe existir
G. Fecha Vigencia Fin
H. Tipo Resolución
I. Tipo Trámite
J. Descripción
K. ID Expediente
L. Usuario Emisión
M. Estado
N. Observaciones
```

### 3. Llenar Correctamente la Columna "Años Vigencia"

#### Para Resoluciones PADRE:

| Número Resolución | Tipo Resolución | Fecha Vigencia Inicio | **Años Vigencia** | Fecha Vigencia Fin |
|-------------------|-----------------|----------------------|-------------------|-------------------|
| 1001-2024         | PADRE           | 15/01/2024          | **4**             | 14/01/2028        |
| 1002-2024         | PADRE           | 20/03/2024          | **10**            | 19/03/2034        |

**IMPORTANTE:**
- ✅ Usar números enteros: `4` o `10`
- ✅ NO dejar la celda vacía
- ✅ NO usar texto: ~~"cuatro"~~, ~~"diez"~~
- ✅ NO usar decimales: ~~4.0~~, ~~10.0~~

#### Para Resoluciones HIJO:

| Número Resolución | Tipo Resolución | Resolución Padre | Años Vigencia |
|-------------------|-----------------|------------------|---------------|
| 1003-2024         | HIJO            | R-1001-2024      | **(vacío)**   |

**IMPORTANTE:**
- ✅ Dejar la celda vacía (heredan del padre)
- ✅ NO poner ningún valor

### 4. Ejemplo de Excel Correcto

```
| Resolución Padre | Número | RUC         | Fecha Emisión | Fecha Inicio | Años | Fecha Fin  | Tipo  |
|------------------|--------|-------------|---------------|--------------|------|------------|-------|
|                  | 1001   | 20123456789 | 15/01/2024    | 15/01/2024   | 4    | 14/01/2028 | PADRE |
|                  | 1002   | 20234567890 | 20/03/2024    | 20/03/2024   | 10   | 19/03/2034 | PADRE |
| R-1001-2024      | 1003   | 20123456789 | 25/01/2024    |              |      |            | HIJO  |
```

### 5. Validar Antes de Procesar

1. Seleccionar el archivo Excel
2. Marcar **"Solo Validar"**
3. Hacer clic en **"Procesar Archivo"**
4. Revisar que no haya errores
5. Verificar en los logs del backend que se lean correctamente los años

### 6. Verificar Logs del Backend

Al procesar, el backend mostrará logs como:

```
[DEBUG] Resolución R-1001-2024: Años Vigencia leído del Excel = '4'
[DEBUG] Resolución R-1001-2024: Años Vigencia convertido = 4
[DEBUG] Resolución R-1002-2024: Años Vigencia leído del Excel = '10'
[DEBUG] Resolución R-1002-2024: Años Vigencia convertido = 10
```

Si ve esto, significa que se está leyendo correctamente.

## Verificación Post-Importación

Después de importar, verificar en la base de datos:

```javascript
// En MongoDB
db.resoluciones.find(
  { nroResolucion: "R-1001-2024" },
  { nroResolucion: 1, aniosVigencia: 1, fechaVigenciaInicio: 1, fechaVigenciaFin: 1 }
)

// Debe mostrar:
{
  "nroResolucion": "R-1001-2024",
  "aniosVigencia": 4,
  "fechaVigenciaInicio": "2024-01-15",
  "fechaVigenciaFin": "2028-01-14"
}
```

## Scripts de Ayuda

### Generar Plantilla de Prueba

```bash
python crear_plantilla_resoluciones_con_vigencia.py
```

Este script genera un Excel de ejemplo con:
- 2 resoluciones PADRE (una con 4 años, otra con 10 años)
- 2 resoluciones HIJO

### Probar Lectura de Excel

```bash
python test_lectura_anios_vigencia.py
```

Este script verifica que el Excel se lea correctamente.

### Debug Completo

```bash
python test_carga_masiva_anios_vigencia_debug.py
```

Este script hace un debug completo del proceso.

## Checklist de Verificación

Antes de reportar que el problema persiste, verificar:

- [ ] La plantilla descargada tiene la columna "Años Vigencia"
- [ ] Los valores en "Años Vigencia" son números enteros (4, 10)
- [ ] Las celdas de resoluciones PADRE no están vacías
- [ ] Las celdas de resoluciones HIJO están vacías
- [ ] El backend muestra los logs de debug al procesar
- [ ] Se descargó una plantilla nueva (no se usó una antigua)

## Solución Rápida

Si el problema persiste:

1. **Borrar el Excel actual**
2. **Descargar nueva plantilla** desde el frontend
3. **Copiar solo los datos** (no la estructura) al nuevo Excel
4. **Verificar que la columna F sea "Años Vigencia"**
5. **Llenar con valores numéricos** (4 o 10)
6. **Validar primero** antes de procesar
7. **Revisar logs** del backend

## Contacto de Soporte

Si después de seguir estos pasos el problema persiste:

1. Enviar el archivo Excel usado
2. Enviar captura de los logs del backend
3. Enviar captura de la validación en el frontend
4. Indicar qué valores se esperaban vs qué valores se guardaron

## Notas Técnicas

### Valores por Defecto

El sistema usa estos valores por defecto:

- Si "Años Vigencia" está vacío → 4 años
- Si "Años Vigencia" no es numérico → 4 años
- Si hay error al calcular fechas → 4 años

### Cálculo de Fecha Fin

```
Fecha Fin = Fecha Inicio + Años de Vigencia - 1 día
```

Ejemplos:
- 15/01/2024 + 4 años - 1 día = 14/01/2028
- 20/03/2024 + 10 años - 1 día = 19/03/2034

### Formato de Fechas

El sistema acepta estos formatos:
- dd/mm/yyyy (español) → 15/01/2024
- yyyy-mm-dd (ISO) → 2024-01-15
- dd-mm-yyyy → 15-01-2024

## Resumen Visual

```
┌─────────────────────────────────────────────────────────────┐
│                  EXCEL CORRECTO                             │
├─────────────────────────────────────────────────────────────┤
│ Columna F: "Años Vigencia"                                  │
│                                                              │
│ Resolución PADRE:                                           │
│   Años Vigencia: 4  ← Número entero                        │
│   Años Vigencia: 10 ← Número entero                        │
│                                                              │
│ Resolución HIJO:                                            │
│   Años Vigencia: (vacío) ← Celda vacía                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  EXCEL INCORRECTO                           │
├─────────────────────────────────────────────────────────────┤
│ ❌ Sin columna "Años Vigencia"                              │
│ ❌ Años Vigencia: (vacío) en resolución PADRE               │
│ ❌ Años Vigencia: "cuatro" (texto)                          │
│ ❌ Años Vigencia: 4.0 (decimal)                             │
│ ❌ Usando plantilla antigua                                 │
└─────────────────────────────────────────────────────────────┘
```

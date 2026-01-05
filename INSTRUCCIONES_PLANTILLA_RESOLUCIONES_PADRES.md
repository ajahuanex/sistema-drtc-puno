# Plantilla de Resoluciones Padres - Instrucciones de Uso

## Descripción
Esta plantilla permite la carga masiva de resoluciones padres con información de estado y resoluciones asociadas, especialmente útil para manejar renovaciones y el historial de resoluciones.

## Campos de la Plantilla

### Campos Obligatorios

1. **RUC_EMPRESA_ASOCIADA**
   - RUC de la empresa (11 dígitos)
   - Ejemplo: `20123456789`

2. **RESOLUCION_NUMERO**
   - Número de la resolución
   - Formato: `XXXX-YYYY`
   - Ejemplo: `0001-2025`

3. **TIPO_RESOLUCION**
   - Tipo de resolución
   - Valores válidos: `NUEVA`, `RENOVACION`, `MODIFICACION`

4. **FECHA_RESOLUCION**
   - Fecha de emisión de la resolución
   - Formato: `DD/MM/YYYY`
   - Ejemplo: `01/01/2025`

5. **ESTADO**
   - Estado actual de la resolución
   - Valores válidos: `ACTIVA`, `VENCIDA`, `RENOVADA`, `ANULADA`

6. **FECHA_INICIO_VIGENCIA**
   - Fecha de inicio de vigencia
   - Formato: `DD/MM/YYYY`
   - Ejemplo: `01/01/2025`

7. **ANIOS_VIGENCIA**
   - Años de vigencia de la resolución
   - Número entero (típicamente 4)
   - Ejemplo: `4`

8. **FECHA_FIN_VIGENCIA**
   - Fecha de fin de vigencia
   - Formato: `DD/MM/YYYY`
   - Ejemplo: `01/01/2029`

### Campos Opcionales

1. **RESOLUCION_ASOCIADA**
   - Número de resolución anterior (para renovaciones)
   - Dejar vacío si es resolución nueva
   - Para renovaciones, indicar la resolución que se está renovando
   - Ejemplo: `0001-2021`

## Estados de Resolución

- **ACTIVA**: Resolución vigente y en uso
- **VENCIDA**: Resolución que ya cumplió su período de vigencia
- **RENOVADA**: Resolución que fue reemplazada por una nueva
- **ANULADA**: Resolución que fue anulada administrativamente

## Tipos de Resolución

- **NUEVA**: Primera resolución para la empresa
- **RENOVACION**: Renovación de resolución existente
- **MODIFICACION**: Modificación de resolución vigente

## Ejemplos de Uso

### Resolución Nueva
```
RUC: 20987654321
NUMERO: 0002-2025
RESOLUCION_ASOCIADA: (vacío)
TIPO: NUEVA
ESTADO: ACTIVA
FECHA_RESOLUCION: 15/01/2025
FECHA_INICIO: 15/01/2025
AÑOS: 4
FECHA_FIN: 15/01/2029
```

### Resolución Renovada
```
RUC: 20123456789
NUMERO: 0001-2025
RESOLUCION_ASOCIADA: 0001-2021
TIPO: RENOVACION
ESTADO: ACTIVA
FECHA_RESOLUCION: 01/01/2025
FECHA_INICIO: 01/01/2025
AÑOS: 4
FECHA_FIN: 01/01/2029
```

### Resolución Vencida
```
RUC: 20456789123
NUMERO: 0150-2020
RESOLUCION_ASOCIADA: 0150-2016
TIPO: RENOVACION
ESTADO: VENCIDA
FECHA_RESOLUCION: 10/03/2020
FECHA_INICIO: 10/03/2020
AÑOS: 4
FECHA_FIN: 10/03/2024
```

## Proceso de Carga

### 1. Generar Plantilla
```bash
python crear_plantilla_resoluciones_padres.py
```

### 2. Llenar Datos
- Abrir el archivo Excel generado
- Completar los datos en la hoja "Resoluciones_Padres"
- Seguir las instrucciones de la hoja "Instrucciones"

### 3. Validar Archivo
- Usar el endpoint `/resoluciones/padres/validar`
- Verificar que no hay errores antes de procesar

### 4. Procesar Carga
- Usar el endpoint `/resoluciones/padres/procesar`
- Revisar el reporte de resultados

## Validaciones Automáticas

### Validaciones de Formato
- RUC debe tener exactamente 11 dígitos
- Fechas deben estar en formato DD/MM/YYYY
- Años de vigencia debe ser número entero positivo
- Estados y tipos deben ser valores válidos

### Validaciones de Negocio
- La empresa con el RUC debe existir en el sistema
- El número de resolución debe ser único
- Las fechas deben ser coherentes (inicio < fin)
- Para renovaciones, se recomienda especificar resolución asociada

## Endpoints de API

### Descargar Plantilla
```
GET /resoluciones/padres/plantilla
```

### Validar Archivo
```
POST /resoluciones/padres/validar
Content-Type: multipart/form-data
Body: archivo Excel
```

### Procesar Carga
```
POST /resoluciones/padres/procesar
Content-Type: multipart/form-data
Body: archivo Excel
Query: solo_validar=true/false
```

### Reporte de Estados
```
GET /resoluciones/padres/reporte-estados
```

## Notas Importantes

1. **Resoluciones Antiguas**: Para resoluciones antiguas sin resolución asociada, dejar el campo vacío
2. **Unicidad**: Cada número de resolución debe ser único en el sistema
3. **Empresas**: Las empresas deben existir previamente en el sistema
4. **Fechas**: Verificar que las fechas sean coherentes y estén en el formato correcto
5. **Estados**: Usar los estados apropiados según el ciclo de vida de la resolución

## Archivos Generados

- `plantilla_resoluciones_padres_YYYYMMDD_HHMMSS.xlsx`: Plantilla con ejemplos
- `backend/app/services/resolucion_padres_service.py`: Servicio de procesamiento
- `test_plantilla_simple.py`: Script de pruebas

## Soporte

Para problemas o dudas sobre la plantilla:
1. Revisar los logs de validación
2. Verificar que los datos cumplan con los formatos requeridos
3. Consultar la hoja de instrucciones en el archivo Excel
4. Usar el endpoint de validación antes de procesar
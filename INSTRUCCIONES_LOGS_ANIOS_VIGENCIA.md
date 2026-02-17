# Instrucciones: Logs de Años de Vigencia

## 🔍 Logs Implementados

He agregado logs detallados en el servicio de resoluciones padres para rastrear exactamente qué está pasando con los años de vigencia.

## 📋 Qué se Registra en los Logs

### 1. Normalización de Columnas
```
======================================================================
NORMALIZACIÓN DE COLUMNAS - INICIO
======================================================================
Columnas ORIGINALES del Excel: ['RUC Empresa', 'Número Resolución', ...]
✅ Columna de años encontrada: 'Años Vigencia'
   Valores en la columna: [4, 10, 4]
   Renombrando: 'Años Vigencia' → 'ANIOS_VIGENCIA'
Columnas NORMALIZADAS: ['RUC_EMPRESA_ASOCIADA', 'RESOLUCION_NUMERO', ...]
✅ Columna 'ANIOS_VIGENCIA' presente después de normalizar
   Valores: [4, 10, 4]
   Distribución: 4 años=2, 10 años=1, vacíos=0
   ⭐ ¡HAY 1 RESOLUCIONES CON 10 AÑOS!
======================================================================
```

### 2. Procesamiento de Cada Fila
```
======================================================================
PROCESANDO FILA 2
======================================================================
Fila 2 - Número: 1001-2025
   ANIOS_VIGENCIA (raw): '10' (tipo: str)
   ANIOS_VIGENCIA (convertido): 10
   ⭐ ¡RESOLUCIÓN CON 10 AÑOS DETECTADA!
```

### 3. Guardado en Base de Datos
```
   📝 ACTUALIZANDO resolución existente: R-1001-2025
   Años de vigencia a guardar: 10
   Datos a actualizar: aniosVigencia=10
   ✅ Resolución ACTUALIZADA en BD
   Verificación: aniosVigencia guardado en BD = 10
   ⭐ ¡CONFIRMADO! Resolución con 10 años guardada correctamente
```

O para nuevas:
```
   ✨ CREANDO nueva resolución: R-1001-2025
   Años de vigencia a guardar: 10
   Documento a crear: aniosVigencia=10
   ✅ Resolución CREADA en BD con ID: 507f1f77bcf86cd799439011
   Verificación: aniosVigencia guardado en BD = 10
   ⭐ ¡CONFIRMADO! Resolución con 10 años guardada correctamente
```

### 4. Resumen Final
```
======================================================================
RESUMEN FINAL DE PROCESAMIENTO
======================================================================
Total procesadas: 3
Creadas: 2
Actualizadas: 1
Errores: 0

Distribución de años de vigencia:
   Con 4 años: 2
   Con 10 años: 1

⭐ ¡ÉXITO! Se procesaron 1 resoluciones con 10 años
Resoluciones con 10 años:
   - R-1001-2025
======================================================================
```

## 📂 Dónde Ver los Logs

### En Desarrollo (Local)

Los logs se muestran en la consola donde está corriendo el backend:

```bash
# Si estás usando uvicorn directamente
uvicorn app.main:app --reload

# Los logs aparecerán en la misma terminal
```

### En Producción

Los logs se guardan en el archivo de logs del servidor. Ubicación típica:

```bash
# Linux/Mac
/var/log/drtc-backend/app.log

# Windows
C:\logs\drtc-backend\app.log

# O donde esté configurado el logging
```

## 🔍 Cómo Usar los Logs para Diagnosticar

### Paso 1: Preparar Archivo de Prueba

```bash
# Generar archivo con 10 años
python test_lectura_excel_10_anios.py
```

Esto crea `TEST_10_ANIOS_*.xlsx` con 2 resoluciones de 10 años.

### Paso 2: Cargar en el Sistema

1. Ir al módulo de Resoluciones
2. Click en "Carga Masiva Padres"
3. Seleccionar `TEST_10_ANIOS_*.xlsx`
4. Click en "Procesar"

### Paso 3: Revisar Logs

Busca en los logs del backend:

```bash
# Buscar logs de normalización
grep "NORMALIZACIÓN DE COLUMNAS" app.log

# Buscar resoluciones con 10 años
grep "10 AÑOS" app.log

# Buscar confirmaciones
grep "CONFIRMADO" app.log

# Ver resumen final
grep "RESUMEN FINAL" app.log
```

## 🚨 Qué Buscar en los Logs

### ✅ Si Todo Funciona Correctamente

Deberías ver:
```
✅ Columna de años encontrada: 'Años Vigencia'
   Valores en la columna: [10, 10]
⭐ ¡HAY 2 RESOLUCIONES CON 10 AÑOS!
⭐ ¡RESOLUCIÓN CON 10 AÑOS DETECTADA!
   Años de vigencia a guardar: 10
⭐ ¡CONFIRMADO! Resolución con 10 años guardada correctamente
⭐ ¡ÉXITO! Se procesaron 2 resoluciones con 10 años
```

### ❌ Si Hay Problemas

#### Problema 1: Columna no encontrada
```
⚠️  NO se encontró columna de años de vigencia en el Excel
```
**Solución**: El archivo Excel no tiene la columna correcta. Verificar encabezados.

#### Problema 2: No hay valores de 10 años
```
   Distribución: 4 años=3, 10 años=0, vacíos=0
⚠️  NO hay resoluciones con 10 años
```
**Solución**: El archivo Excel solo tiene valores de 4 años. Modificar el Excel.

#### Problema 3: Error de conversión
```
❌ ERROR convirtiendo años de vigencia: invalid literal for int()
   Usando valor por defecto: 4
```
**Solución**: El valor en el Excel no es un número válido.

#### Problema 4: No se guarda correctamente
```
❌ ERROR: Se intentó guardar 10 pero se guardó 4
```
**Solución**: Hay un problema en el código de guardado. Reportar con logs completos.

## 📊 Ejemplo de Logs Completos

```
2026-02-15 22:45:01 INFO ======================================================================
2026-02-15 22:45:01 INFO NORMALIZACIÓN DE COLUMNAS - INICIO
2026-02-15 22:45:01 INFO ======================================================================
2026-02-15 22:45:01 INFO Columnas ORIGINALES del Excel: ['Resolución Padre', 'Número Resolución', 'RUC Empresa', 'Fecha Emisión', 'Fecha Vigencia Inicio', 'Años Vigencia', 'Fecha Vigencia Fin', 'Tipo Resolución', 'Tipo Trámite', 'Descripción', 'ID Expediente', 'Usuario Emisión', 'Estado', 'Observaciones']
2026-02-15 22:45:01 INFO ✅ Columna de años encontrada: 'Años Vigencia'
2026-02-15 22:45:01 INFO    Valores en la columna: ['10', '10']
2026-02-15 22:45:01 INFO    Renombrando: 'Resolución Padre' → 'RESOLUCION_ASOCIADA'
2026-02-15 22:45:01 INFO    Renombrando: 'Número Resolución' → 'RESOLUCION_NUMERO'
2026-02-15 22:45:01 INFO    Renombrando: 'RUC Empresa' → 'RUC_EMPRESA_ASOCIADA'
2026-02-15 22:45:01 INFO    Renombrando: 'Fecha Emisión' → 'FECHA_RESOLUCION'
2026-02-15 22:45:01 INFO    Renombrando: 'Fecha Vigencia Inicio' → 'FECHA_INICIO_VIGENCIA'
2026-02-15 22:45:01 INFO    Renombrando: 'Años Vigencia' → 'ANIOS_VIGENCIA'
2026-02-15 22:45:01 INFO    Renombrando: 'Fecha Vigencia Fin' → 'FECHA_FIN_VIGENCIA'
2026-02-15 22:45:01 INFO Columnas NORMALIZADAS: ['RESOLUCION_ASOCIADA', 'RESOLUCION_NUMERO', 'RUC_EMPRESA_ASOCIADA', 'FECHA_RESOLUCION', 'FECHA_INICIO_VIGENCIA', 'ANIOS_VIGENCIA', 'FECHA_FIN_VIGENCIA', 'TIPO_RESOLUCION', 'TIPO_TRAMITE', 'DESCRIPCION', 'ID_EXPEDIENTE', 'USUARIO_EMISION', 'ESTADO', 'OBSERVACIONES']
2026-02-15 22:45:01 INFO ✅ Columna 'ANIOS_VIGENCIA' presente después de normalizar
2026-02-15 22:45:01 INFO    Valores: ['10', '10']
2026-02-15 22:45:01 INFO    Distribución: 4 años=0, 10 años=2, vacíos=0
2026-02-15 22:45:01 INFO    ⭐ ¡HAY 2 RESOLUCIONES CON 10 AÑOS!
2026-02-15 22:45:01 INFO ======================================================================
2026-02-15 22:45:02 INFO ======================================================================
2026-02-15 22:45:02 INFO PROCESANDO FILA 2
2026-02-15 22:45:02 INFO ======================================================================
2026-02-15 22:45:02 INFO Fila 2 - Número: 9001-2025
2026-02-15 22:45:02 INFO    ANIOS_VIGENCIA (raw): '10' (tipo: str)
2026-02-15 22:45:02 INFO    ANIOS_VIGENCIA (convertido): 10
2026-02-15 22:45:02 INFO    ⭐ ¡RESOLUCIÓN CON 10 AÑOS DETECTADA!
2026-02-15 22:45:02 INFO    ✨ CREANDO nueva resolución: R-9001-2025
2026-02-15 22:45:02 INFO    Años de vigencia a guardar: 10
2026-02-15 22:45:02 INFO    Documento a crear: aniosVigencia=10
2026-02-15 22:45:02 INFO    ✅ Resolución CREADA en BD con ID: 507f1f77bcf86cd799439011
2026-02-15 22:45:02 INFO    Verificación: aniosVigencia guardado en BD = 10
2026-02-15 22:45:02 INFO    ⭐ ¡CONFIRMADO! Resolución con 10 años guardada correctamente
2026-02-15 22:45:03 INFO ======================================================================
2026-02-15 22:45:03 INFO RESUMEN FINAL DE PROCESAMIENTO
2026-02-15 22:45:03 INFO ======================================================================
2026-02-15 22:45:03 INFO Total procesadas: 2
2026-02-15 22:45:03 INFO Creadas: 2
2026-02-15 22:45:03 INFO Actualizadas: 0
2026-02-15 22:45:03 INFO Errores: 0
2026-02-15 22:45:03 INFO 
2026-02-15 22:45:03 INFO Distribución de años de vigencia:
2026-02-15 22:45:03 INFO    Con 4 años: 0
2026-02-15 22:45:03 INFO    Con 10 años: 2
2026-02-15 22:45:03 INFO 
2026-02-15 22:45:03 INFO ⭐ ¡ÉXITO! Se procesaron 2 resoluciones con 10 años
2026-02-15 22:45:03 INFO Resoluciones con 10 años:
2026-02-15 22:45:03 INFO    - R-9001-2025
2026-02-15 22:45:03 INFO    - R-9002-2025
2026-02-15 22:45:03 INFO ======================================================================
```

## 🎯 Próximos Pasos

1. **Cargar archivo de prueba** con 10 años
2. **Revisar logs del backend** mientras se procesa
3. **Buscar los mensajes clave**:
   - ⭐ "HAY X RESOLUCIONES CON 10 AÑOS"
   - ⭐ "RESOLUCIÓN CON 10 AÑOS DETECTADA"
   - ⭐ "CONFIRMADO! Resolución con 10 años guardada"
4. **Si no aparecen**, compartir los logs completos para análisis

## 📞 Soporte

Si después de revisar los logs el problema persiste:

1. Copiar los logs completos desde "NORMALIZACIÓN DE COLUMNAS" hasta "RESUMEN FINAL"
2. Incluir el archivo Excel usado
3. Compartir para análisis detallado

---

**Fecha**: 15 de febrero de 2026  
**Versión**: 2.0 con logs detallados  
**Estado**: ✅ Listo para diagnóstico

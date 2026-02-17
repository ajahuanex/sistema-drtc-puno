# 📋 Guía Completa: Carga Masiva de Rutas

**Fecha:** 15/02/2026  
**Módulo:** Carga Masiva de Rutas  
**Estado:** Listo para probar

## 🎯 Descripción General

La carga masiva de rutas permite importar múltiples rutas desde un archivo Excel de forma automatizada, con validaciones y manejo inteligente de localidades.

### Características Principales

✅ **Validación previa** - Valida el archivo antes de procesar  
✅ **Creación automática de localidades** - Las localidades no encontradas se crean como tipo "OTROS"  
✅ **Procesamiento por lotes** - Maneja archivos grandes de forma eficiente  
✅ **Reportes detallados** - Muestra rutas creadas, errores y advertencias  
✅ **Interfaz paso a paso** - Guía al usuario en todo el proceso

## 📝 Pasos para Probar

### Paso 1: Acceder al Módulo

1. Navega a la sección de **Rutas**
2. Busca el botón **"Carga Masiva"** o similar
3. Se abrirá el componente con 4 pasos

### Paso 2: Descargar la Plantilla

1. En el **Paso 1**, haz clic en **"Descargar Plantilla Excel"**
2. Se descargará un archivo llamado `plantilla_rutas.xlsx`
3. El sistema marcará este paso como completado

**Endpoint usado:**
```
GET /api/v1/rutas/carga-masiva/plantilla
```

### Paso 3: Llenar la Plantilla

Abre el archivo Excel descargado y llena los siguientes campos:

#### Columnas Obligatorias

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| **codigo_ruta** | Código único de la ruta | 01, 02, 03 |
| **origen** | Nombre de la localidad origen | PUNO |
| **destino** | Nombre de la localidad destino | JULIACA |
| **tipo_servicio** | Tipo de servicio | PASAJEROS, CARGA, MIXTO |
| **tipo_frecuencia** | Tipo de frecuencia | DIARIO, SEMANAL, QUINCENAL |
| **cantidad_frecuencia** | Cantidad de servicios | 1, 2, 3 |
| **descripcion_frecuencia** | Descripción | 01 DIARIA, 02 DIARIAS |
| **ruc_empresa** | RUC de la empresa | 20448048242 |
| **numero_resolucion** | Número de resolución | R-001-2024 |

#### Columnas Opcionales

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| **tipo_ruta** | Tipo de ruta | INTERREGIONAL, URBANA |
| **descripcion** | Descripción adicional | Ruta principal |
| **observaciones** | Observaciones | Sin observaciones |
| **itinerario** | Localidades intermedias | JULIACA;AZÁNGARO;PUTINA |
| **distancia** | Distancia en km | 45.5 |

#### Ejemplo de Datos

```
codigo_ruta | origen | destino  | tipo_servicio | tipo_frecuencia | cantidad_frecuencia | descripcion_frecuencia | ruc_empresa   | numero_resolucion
------------|--------|----------|---------------|-----------------|---------------------|------------------------|---------------|------------------
01          | PUNO   | JULIACA  | PASAJEROS     | DIARIO          | 1                   | 01 DIARIA              | 20448048242   | R-001-2024
02          | JULIACA| AZÁNGARO | PASAJEROS     | DIARIO          | 2                   | 02 DIARIAS             | 20448048242   | R-001-2024
03          | PUNO   | ILAVE    | PASAJEROS     | SEMANAL         | 3                   | 03 SEMANALES           | 20448048242   | R-001-2024
```

### Paso 4: Subir el Archivo

1. En el **Paso 2**, arrastra el archivo Excel o haz clic para seleccionarlo
2. El sistema validará:
   - Tipo de archivo (.xlsx o .xls)
   - Tamaño máximo (10MB)
3. Se mostrará el nombre y tamaño del archivo

### Paso 5: Configurar el Procesamiento

En el **Paso 3**, configura las opciones:

#### Opción 1: Solo Validar (Recomendado primero)

- Selecciona **"Solo validar archivo"**
- Esto verificará el archivo sin crear rutas
- Útil para detectar errores antes de procesar

#### Opción 2: Validar y Procesar

- Selecciona **"Validar y procesar rutas"**
- Esto creará las rutas en la base de datos
- Opciones adicionales:
  - **Procesar en lotes**: Recomendado para archivos grandes
  - **Tamaño del lote**: 25, 50 o 100 rutas por lote

### Paso 6: Ejecutar el Proceso

1. Haz clic en **"Validar Archivo"** o **"Procesar Rutas"**
2. El sistema mostrará una barra de progreso
3. Si es por lotes, verás el progreso de cada lote

**Endpoints usados:**

**Validación:**
```
POST /api/v1/rutas/carga-masiva/validar
```

**Procesamiento:**
```
POST /api/v1/rutas/carga-masiva/procesar
```

### Paso 7: Revisar Resultados

En el **Paso 4**, verás un resumen completo:

#### Estadísticas Generales

```
📊 Total filas: 50
✅ Válidos: 45
❌ Inválidos: 3
⚠️ Con advertencias: 2
```

#### Rutas Creadas (si procesaste)

Tabla con:
- Código de ruta
- Nombre (Origen - Destino)
- ID generado
- Estado (CREADA)

#### Errores Encontrados

Tabla con:
- Número de fila
- Código de ruta
- Descripción del error

Ejemplos de errores comunes:
- "Campo 'codigo_ruta' es obligatorio"
- "RUC de empresa no encontrado"
- "Número de resolución no encontrado"
- "Origen y destino no pueden ser iguales"

#### Advertencias

Lista de advertencias no críticas:
- "Localidad 'NUEVA_LOCALIDAD' no encontrada, se creará como tipo OTROS"
- "Tipo de ruta no especificado, se usará valor por defecto"

## 🔍 Validaciones Automáticas

El sistema valida automáticamente:

### Validaciones de Campos Obligatorios
- ✅ Código de ruta no vacío
- ✅ Origen y destino especificados
- ✅ Tipo de servicio válido
- ✅ Frecuencia válida
- ✅ RUC de empresa existe
- ✅ Número de resolución existe

### Validaciones de Lógica de Negocio
- ✅ Origen ≠ Destino
- ✅ Código de ruta único en la resolución
- ✅ RUC válido (11 dígitos)
- ✅ Empresa activa
- ✅ Resolución vigente

### Manejo de Localidades

**Localidades Existentes:**
- Se vinculan automáticamente con la base de datos
- Se usa el ID de la localidad existente

**Localidades Nuevas:**
- Se crean automáticamente con:
  - **Tipo:** OTROS
  - **Nivel Territorial:** OTROS
  - **Estado:** Activa
- Se genera un ID único
- Se muestra una advertencia informativa

## 📊 Estructura de Respuesta

### Respuesta de Validación

```json
{
  "archivo": "plantilla_rutas.xlsx",
  "validacion": {
    "total_filas": 50,
    "validos": 45,
    "invalidos": 3,
    "con_advertencias": 2,
    "errores": [
      {
        "fila": 5,
        "codigo_ruta": "05",
        "errores": ["RUC de empresa no encontrado"]
      }
    ],
    "advertencias": [
      {
        "fila": 10,
        "codigo_ruta": "10",
        "advertencias": ["Localidad 'NUEVA' no encontrada, se creará"]
      }
    ],
    "rutas_validas": [...]
  },
  "mensaje": "Archivo validado: 45 válidos, 3 inválidos"
}
```

### Respuesta de Procesamiento

```json
{
  "total_procesadas": 45,
  "exitosas": 43,
  "fallidas": 2,
  "rutas_creadas": [
    {
      "codigo": "01",
      "nombre": "PUNO - JULIACA",
      "id": "6991c125ec61906bc86378cc",
      "estado": "ACTIVA"
    }
  ],
  "errores_procesamiento": [
    {
      "codigo_ruta": "05",
      "error": "Error al crear ruta: ..."
    }
  ]
}
```

## 🎨 Interfaz de Usuario

### Indicadores Visuales

**Colores:**
- 🟢 Verde: Éxito, rutas creadas
- 🔴 Rojo: Errores críticos
- 🟡 Amarillo: Advertencias
- 🔵 Azul: Información

**Iconos:**
- ✅ check_circle: Éxito
- ❌ error: Error
- ⚠️ warning: Advertencia
- 📊 assessment: Estadísticas
- 📁 upload: Subir archivo
- 📥 download: Descargar plantilla

### Barra de Progreso

**Modo Indeterminado:**
- Se usa durante validación
- Animación continua

**Modo Determinado:**
- Se usa en procesamiento por lotes
- Muestra porcentaje exacto
- Indica lote actual / total lotes

## 🚀 Casos de Uso

### Caso 1: Primera Importación

1. Descargar plantilla
2. Llenar con 10-20 rutas de prueba
3. **Validar primero** (solo validar)
4. Revisar errores y corregir
5. **Procesar** (validar y procesar)
6. Verificar rutas creadas

### Caso 2: Importación Masiva

1. Preparar archivo con 100+ rutas
2. Validar primero
3. Activar **"Procesar en lotes"**
4. Seleccionar tamaño de lote: 50
5. Procesar y monitorear progreso

### Caso 3: Actualización de Rutas

1. Exportar rutas existentes (si hay función)
2. Modificar datos en Excel
3. Validar cambios
4. Procesar actualización

## ⚠️ Errores Comunes y Soluciones

### Error: "RUC de empresa no encontrado"

**Causa:** El RUC no existe en la base de datos  
**Solución:** 
- Verificar que el RUC sea correcto
- Crear la empresa primero en el módulo de empresas
- Usar un RUC existente

### Error: "Número de resolución no encontrado"

**Causa:** La resolución no existe  
**Solución:**
- Verificar el número de resolución
- Crear la resolución primero
- Usar una resolución existente

### Error: "Origen y destino no pueden ser iguales"

**Causa:** Se especificó la misma localidad como origen y destino  
**Solución:**
- Cambiar el origen o destino
- Verificar que no haya errores de tipeo

### Advertencia: "Localidad no encontrada, se creará"

**Causa:** La localidad no existe en la base de datos  
**Solución:**
- Esto es normal y esperado
- La localidad se creará automáticamente
- Puedes editarla después en el módulo de localidades

## 📈 Mejores Prácticas

### Antes de Procesar

1. ✅ Siempre validar primero
2. ✅ Corregir todos los errores
3. ✅ Revisar advertencias
4. ✅ Hacer backup de la base de datos (producción)

### Durante el Procesamiento

1. ✅ Usar lotes para archivos grandes (>50 rutas)
2. ✅ No cerrar la ventana durante el proceso
3. ✅ Monitorear la consola del navegador
4. ✅ Esperar a que termine completamente

### Después del Procesamiento

1. ✅ Verificar rutas creadas en la lista
2. ✅ Revisar localidades nuevas creadas
3. ✅ Actualizar información de localidades si es necesario
4. ✅ Guardar el archivo Excel como respaldo

## 🔧 Configuración Técnica

### Límites del Sistema

- **Tamaño máximo de archivo:** 10 MB
- **Formatos aceptados:** .xlsx, .xls
- **Rutas por lote:** 25, 50 o 100
- **Timeout:** 5 minutos por lote

### Parámetros de Procesamiento

```typescript
{
  soloValidar: boolean,           // true = solo validar, false = procesar
  procesarEnLotes: boolean,       // true = por lotes, false = todo junto
  tamanoLote: 25 | 50 | 100      // tamaño del lote
}
```

### Headers HTTP

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa la consola del navegador (F12)
2. Verifica los logs del backend
3. Comprueba que el archivo Excel esté bien formateado
4. Asegúrate de que las empresas y resoluciones existan

## ✅ Checklist de Prueba

- [ ] Descargar plantilla funciona
- [ ] Subir archivo válido funciona
- [ ] Validación detecta errores correctamente
- [ ] Validación muestra advertencias
- [ ] Procesamiento crea rutas correctamente
- [ ] Localidades nuevas se crean automáticamente
- [ ] Errores se muestran claramente
- [ ] Procesamiento por lotes funciona
- [ ] Barra de progreso se actualiza
- [ ] Resultados se muestran correctamente
- [ ] Botón "Ver Rutas Creadas" funciona
- [ ] Botón "Nuevo Proceso" reinicia correctamente

## 🎯 Resultado Esperado

Al finalizar una carga masiva exitosa:

1. ✅ Todas las rutas válidas están creadas
2. ✅ Localidades nuevas están en la base de datos
3. ✅ Se muestra un resumen claro de resultados
4. ✅ Los errores están documentados
5. ✅ Puedes navegar a ver las rutas creadas

---

**¡Listo para probar!** Sigue esta guía paso a paso y reporta cualquier problema que encuentres.

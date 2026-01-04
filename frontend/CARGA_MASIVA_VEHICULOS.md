# Guía de Carga Masiva de Vehículos - SIRRET (Actualizada)

## Descripción
La funcionalidad de carga masiva permite importar múltiples vehículos al sistema SIRRET desde un archivo Excel profesional, facilitando la migración de datos y el registro masivo de flotas vehiculares.

## ✨ NUEVA FUNCIONALIDAD: Plantilla Excel Profesional

### Características de la Nueva Plantilla
La plantilla ahora es un archivo Excel (.xlsx) completo con múltiples hojas:

1. **Hoja "INSTRUCCIONES"**
   - Guía completa de uso paso a paso
   - Información sobre campos obligatorios
   - Formatos válidos y ejemplos
   - Notas importantes y consejos

2. **Hoja "REFERENCIA"**
   - Tabla completa de todos los campos
   - Descripción detallada de cada campo
   - Indicación de campos obligatorios
   - Tipos de datos y ejemplos

3. **Hoja "DATOS"**
   - Donde el usuario completa la información
   - Headers formateados profesionalmente
   - Ejemplos de datos válidos
   - Columnas con ancho optimizado

### Ventajas del Nuevo Formato
- ✅ **Fácil de usar**: Se abre directamente en Excel
- ✅ **Autoexplicativo**: Instrucciones integradas
- ✅ **Profesional**: Formato estándar de la industria
- ✅ **Completo**: Todos los campos disponibles
- ✅ **Validado**: Ejemplos que pasan todas las validaciones

## Acceso a la Funcionalidad

### Desde el Módulo de Vehículos
1. Navegar a **Vehículos** en el menú principal
2. Hacer clic en el botón **"CARGA MASIVA"** en la barra de herramientas
3. Se abrirá el modal de carga masiva

### URL Directa
- Ruta: `/vehiculos/carga-masiva`
- Componente: `CargaMasivaVehiculosComponent`

## Proceso de Carga Masiva

### Paso 1: Descargar Plantilla Excel
1. **Descargar Plantilla Oficial**
   - Hacer clic en "Descargar Plantilla"
   - Se descarga un archivo Excel (.xlsx) con:
     - Hoja de instrucciones completas
     - Hoja de referencia de campos
     - Hoja de datos para completar
     - Ejemplos de datos válidos
     - Formato: `plantilla_vehiculos_sirret_YYYY-MM-DD.xlsx`

2. **Abrir en Excel**
   - El archivo se abre directamente en Microsoft Excel
   - Leer las instrucciones en la primera hoja
   - Consultar la referencia de campos si es necesario
   - Completar datos en la hoja "DATOS"

### Paso 2: Completar Datos
**Campos Obligatorios:**
- `placa`: Placa del vehículo (formato: ABC-123)
- `sedeRegistro`: Sede donde se registra el vehículo

**Campos Opcionales:**
- `marca`: Marca del vehículo
- `modelo`: Modelo del vehículo
- `anioFabricacion`: Año de fabricación (1990-2026)
- `categoria`: Categoría del vehículo (M1, M2, M3, etc.)
- `carroceria`: Tipo de carrocería
- `color`: Color del vehículo
- `asientos`: Número de asientos (1-100)
- `estado`: Estado del vehículo (ACTIVO, INACTIVO, etc.)
- `numeroTuc`: Número de TUC
- `motor`: Número de motor
- `chasis`: Número de chasis
- `tipoCombustible`: Tipo de combustible
- `cilindros`: Número de cilindros
- `ejes`: Número de ejes
- `ruedas`: Número de ruedas
- `pesoNeto`: Peso neto en toneladas
- `pesoBruto`: Peso bruto en toneladas
- `cargaUtil`: Carga útil (se calcula automáticamente)
- `largo`: Largo en metros
- `ancho`: Ancho en metros
- `alto`: Alto en metros
- `empresaId`: ID de la empresa (opcional)
- `resolucionId`: ID de la resolución (opcional)

### Paso 3: Subir Archivo
1. **Seleccionar Archivo**
   - Arrastrar y soltar el archivo en el área designada
   - O hacer clic para seleccionar desde el explorador
   
2. **Formatos Soportados**
   - Excel: `.xlsx`, `.xls`
   - CSV: `.csv`
   - Tamaño máximo: 10MB

### Paso 4: Validación
El sistema valida automáticamente:
- **Formato de placa**: Debe seguir el patrón peruano
- **Campos obligatorios**: Placa y sede de registro
- **Duplicados**: Placas que ya existen en el sistema
- **Rangos numéricos**: Años, capacidades, pesos, etc.
- **Formatos específicos**: TUC, números de motor/chasis

**Resultados de Validación:**
- ✅ **Válidos**: Registros que pasaron todas las validaciones
- ❌ **Con Errores**: Registros con problemas que impiden su procesamiento
- ⚠️ **Advertencias**: Registros con datos incompletos pero procesables

### Paso 5: Procesamiento
1. **Revisión Final**: Verificar estadísticas de validación
2. **Confirmar Carga**: Solo se procesan los registros válidos
3. **Monitoreo**: Barra de progreso muestra el avance
4. **Resultados**: Resumen final con:
   - Vehículos creados exitosamente
   - Errores encontrados
   - Detalles de problemas

## Ejemplos de Datos

### Registro Válido Completo
```csv
placa,marca,modelo,anioFabricacion,categoria,carroceria,color,asientos,estado,numeroTuc,motor,chasis,tipoCombustible,cilindros,ejes,ruedas,pesoNeto,pesoBruto,cargaUtil,largo,ancho,alto,sedeRegistro,empresaId,resolucionId
ABC-123,MERCEDES BENZ,SPRINTER,2020,M3,MINIBUS,BLANCO,20,ACTIVO,T-123456-2024,MB123456789,CH987654321,DIESEL,4,2,6,3.5,5.5,2.0,8.5,2.4,2.8,LIMA,,
```

### Registro Mínimo (Solo Obligatorios)
```csv
placa,sedeRegistro
DEF-456,AREQUIPA
```

## Validaciones Implementadas

### Placa del Vehículo
- **Formato**: 3 caracteres alfanuméricos + guión + 3 números
- **Ejemplos válidos**: ABC-123, A1B-456, 123-789
- **Únicos**: No puede existir otra placa igual en el sistema

### Año de Fabricación
- **Rango**: 1990 - (año actual + 1)
- **Formato**: Número entero de 4 dígitos

### Capacidad de Pasajeros
- **Rango**: 1 - 100 asientos
- **Formato**: Número entero

### Pesos y Medidas
- **Formato**: Números decimales con punto (.)
- **Unidades**: Toneladas para pesos, metros para medidas
- **Validación**: Peso bruto > peso neto

### Número de TUC
- **Formato**: T-XXXXXX-YYYY
- **Ejemplo**: T-123456-2024

## Manejo de Errores

### Errores Comunes
1. **Placa duplicada**: La placa ya existe en el sistema
2. **Formato de placa inválido**: No cumple con el patrón ABC-123
3. **Sede no encontrada**: La sede especificada no existe
4. **Año inválido**: Fuera del rango permitido
5. **Archivo corrupto**: El archivo no se puede leer

### Soluciones
1. **Verificar datos**: Revisar que los datos cumplan con los formatos
2. **Usar plantilla oficial**: Siempre partir de la plantilla descargada
3. **Validar antes de subir**: Revisar los datos en Excel antes de cargar
4. **Procesar por lotes**: Si hay muchos errores, dividir en archivos más pequeños

## Mejores Prácticas

### Preparación de Datos
1. **Usar la plantilla oficial** siempre
2. **Validar datos en Excel** antes de subir
3. **Eliminar filas vacías** o con datos incompletos
4. **Verificar formatos** especialmente de placas y números
5. **Probar con pocos registros** primero

### Durante la Carga
1. **Revisar validaciones** antes de procesar
2. **Corregir errores** y volver a subir si es necesario
3. **Monitorear el progreso** durante el procesamiento
4. **Guardar resultados** para referencia futura

### Después de la Carga
1. **Verificar vehículos creados** en el listado principal
2. **Revisar errores** y corregir datos faltantes
3. **Completar información** adicional si es necesario
4. **Asignar a empresas** si no se hizo en la carga

## Limitaciones Técnicas

- **Tamaño máximo**: 10MB por archivo
- **Registros recomendados**: Máximo 1000 vehículos por carga
- **Formatos soportados**: Excel (.xlsx, .xls) y CSV (.csv)
- **Codificación**: UTF-8 para caracteres especiales
- **Separador CSV**: Coma (,)

## Soporte y Contacto

Para problemas técnicos o dudas sobre la carga masiva:
- **Sistema**: SIRRET - Sistema Integral de Registros y Regulación de Empresas de Transporte
- **Entidad**: Dirección Regional de Transportes y Comunicaciones - Puno
- **Documentación**: Consultar manual de usuario completo

---

**Última actualización**: Enero 2025
**Versión del sistema**: 1.0.0
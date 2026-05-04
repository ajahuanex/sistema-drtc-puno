# Carga Masiva de Empresas desde Google Sheets

## Descripción

Este módulo permite importar múltiples empresas directamente desde una hoja de cálculo de Google Sheets **sin necesidad de API key ni configuraciones complejas**.

## Características

- ✅ Sin necesidad de API key
- ✅ Conexión directa a Google Sheets público
- ✅ Validación de datos antes de crear
- ✅ Previsualización de datos
- ✅ Procesamiento en lotes
- ✅ Reportes detallados de errores
- ✅ Interfaz intuitiva con pasos

## Requisitos

### Único requisito: Google Sheet público

1. Crear un Google Sheet con tus datos
2. Compartir con "Cualquiera con el enlace"
3. ¡Listo! No necesitas nada más

## Preparar la hoja de Google Sheets

### Estructura requerida

Tu hoja debe contener las siguientes columnas (en cualquier orden):

| Columna | Tipo | Requerido | Descripción |
|---------|------|-----------|-------------|
| RUC | Texto | ✅ | Número de RUC (11 dígitos) |
| Razón Social Principal | Texto | ✅ | Nombre principal de la empresa |
| Dirección Fiscal | Texto | ✅ | Dirección completa |
| Estado | Texto | ❌ | AUTORIZADA, EN_TRAMITE, SUSPENDIDA, CANCELADA (default: EN_TRAMITE) |
| Tipos de Servicio | Texto | ❌ | Separados por coma: PERSONAS, TURISMO, TRABAJADORES, MERCANCIAS, CARGA, MIXTO |
| Email Contacto | Texto | ❌ | Email de contacto |
| Teléfono Contacto | Texto | ❌ | Teléfono de contacto |
| Sitio Web | Texto | ❌ | URL del sitio web |

### Ejemplo de datos

```
RUC,Razón Social Principal,Dirección Fiscal,Estado,Tipos de Servicio,Email Contacto,Teléfono Contacto
20448048242,EMPRESA TRANSPORTES S.A.C.,Av. Principal 123 Puno,AUTORIZADA,PERSONAS;TURISMO,contacto@empresa.com,051-123456
20123456789,TRANSPORTES PUNO E.I.R.L.,Jr. Comercio 456 Puno,EN_TRAMITE,PERSONAS,info@transportes.com,051-654321
```

### Hacer la hoja pública

1. Abrir la hoja en Google Sheets
2. Hacer clic en "Compartir" (arriba a la derecha)
3. Cambiar a "Cualquiera con el enlace"
4. Copiar el enlace

## Uso

### Acceder al módulo

1. Ir a "Empresas"
2. Hacer clic en el botón "Carga desde Google Sheets"

### Pasos del proceso

#### Paso 1: Configurar Google Sheets

1. Pegar la URL de la hoja compartida
2. (Opcional) Especificar el nombre de la pestaña
3. Hacer clic en "Validar y Conectar"

**Ejemplo de URL:**
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMKUVfIAewLCkQkQkQkQkQkQkQkQkQk/edit
```

**Ejemplo de ID:**
```
1BxiMVs0XRA5nFMKUVfIAewLCkQkQkQkQkQkQkQkQkQk
```

#### Paso 2: Previsualizar Datos

- Se mostrarán las primeras filas de la hoja
- Verificar que los datos se vean correctamente
- Si hay errores, volver al paso anterior

#### Paso 3: Configurar y Procesar

1. Seleccionar modo:
   - **Solo validar**: Verifica los datos sin crear empresas
   - **Validar y crear**: Crea las empresas en la base de datos

2. Hacer clic en "Validar Datos" o "Procesar Empresas"

#### Paso 4: Resultados

- Ver estadísticas de procesamiento
- Revisar empresas creadas exitosamente
- Revisar errores (si los hay)
- Opción de crear nuevo proceso

## Validaciones

### Validaciones automáticas

- **RUC**: Debe ser único y tener 11 dígitos
- **Razón Social**: No puede estar vacía
- **Dirección Fiscal**: No puede estar vacía
- **Estado**: Debe ser uno de los valores permitidos
- **Tipos de Servicio**: Se validan contra la lista permitida

### Manejo de errores

Si hay errores durante el procesamiento:

1. Se mostrarán en la sección "Errores"
2. Se indicará la fila y el motivo del error
3. Las empresas válidas se crearán normalmente
4. Las empresas con errores se omitirán

## Ejemplos

### Ejemplo 1: Carga simple

```
RUC,Razón Social Principal,Dirección Fiscal
20448048242,EMPRESA A S.A.C.,Av. Principal 123
20123456789,EMPRESA B E.I.R.L.,Jr. Comercio 456
```

### Ejemplo 2: Carga completa

```
RUC,Razón Social Principal,Dirección Fiscal,Estado,Tipos de Servicio,Email Contacto,Teléfono Contacto
20448048242,EMPRESA A S.A.C.,Av. Principal 123,AUTORIZADA,PERSONAS;TURISMO,contacto@a.com,051-123456
20123456789,EMPRESA B E.I.R.L.,Jr. Comercio 456,EN_TRAMITE,PERSONAS,info@b.com,051-654321
20987654321,EMPRESA C S.R.L.,Calle Secundaria 789,AUTORIZADA,CARGA;MERCANCIAS,ventas@c.com,051-789012
```

## Solución de problemas

### Error: "No se pudo acceder a la hoja"

- Verificar que el sheet sea público o compartido
- Asegurarse de que el enlace sea correcto
- Intentar copiar el ID directamente de la URL

### Error: "La hoja debe contener encabezados..."

- Verificar que la primera fila contenga los nombres de las columnas
- Asegurarse de que los nombres sean similares a los esperados

### Las empresas no se crean

- Revisar la sección de errores para detalles
- Verificar que los datos cumplan con las validaciones
- Intentar con "Solo validar" primero

## Limitaciones

- Máximo 100 filas por carga (para preview)
- La hoja debe ser pública o compartida
- Los datos se procesan de forma secuencial
- No se soportan fórmulas complejas en las celdas

## Seguridad

- No se requiere API key
- No se transmiten datos sensibles a terceros
- La conexión es HTTPS
- Se validan todos los datos antes de crear
- El sheet debe ser compartido explícitamente

## Ventajas sobre Excel

- ✅ No necesitas descargar archivos
- ✅ Cambios en tiempo real
- ✅ Acceso desde cualquier dispositivo
- ✅ Sin necesidad de API key
- ✅ Más simple de compartir

## Soporte

Para reportar problemas o sugerencias, contactar al equipo de desarrollo.

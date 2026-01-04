# Test de Validación de Archivos Excel - SIRRET

## Problema Identificado y Solucionado

### ❌ Problema Original
- El validador estaba leyendo metadata XML del archivo Excel
- No accedía específicamente a la hoja "DATOS"
- Mostraba errores confusos sobre contenido XML

### ✅ Solución Implementada

#### 1. Validación Mejorada con Librería XLSX
```typescript
// Antes: Lectura como texto plano
reader.readAsText(archivo);

// Ahora: Lectura correcta según tipo de archivo
if (archivo.name.toLowerCase().endsWith('.csv')) {
  reader.readAsText(archivo, 'UTF-8');
} else {
  reader.readAsArrayBuffer(archivo); // Para Excel
}
```

#### 2. Acceso Específico a Hoja "DATOS"
```typescript
// Buscar la hoja "DATOS" primero
let sheetName = 'DATOS';
if (!workbook.Sheets[sheetName]) {
  sheetName = workbook.SheetNames[0]; // Fallback a primera hoja
}

worksheet = workbook.Sheets[sheetName];
```

#### 3. Conversión Correcta de Datos
```typescript
// Convertir Excel a array JSON
jsonData = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,        // Usar índices numéricos
  defval: '',       // Valor por defecto para celdas vacías
  raw: false        // Convertir a string para consistencia
}) as any[][];
```

## Validaciones Implementadas

### Campos Obligatorios
1. **Placa** (columna 0)
   - Formato: ABC-123 (regex: `/^[A-Z0-9]{1,3}-[0-9]{3}$/`)
   - Único en el sistema

2. **Sede de Registro** (columna 22)
   - Debe existir en el sistema
   - No puede estar vacía

### Validaciones Opcionales
1. **Año de Fabricación** (columna 3)
   - Rango: 1990 - (año actual + 1)
   - Solo si está presente

2. **Número de Asientos** (columna 7)
   - Rango: 1-100
   - Solo si está presente

3. **Número de TUC** (columna 9)
   - Formato: T-123456-2024 (regex: `/^T-\d{6}-\d{4}$/`)
   - Solo si está presente

4. **Pesos** (columnas 16-17)
   - Peso bruto > peso neto
   - Solo si ambos están presentes

## Estructura de la Plantilla Mejorada

### Hoja "DATOS" - Layout
```
Fila 1: Headers (placa, marca, modelo, ...)
Fila 2: --- EJEMPLOS (ELIMINAR ANTES DE SUBIR) ---
Fila 3: ABC-123, MERCEDES BENZ, SPRINTER, ... (ejemplo completo)
Fila 4: DEF-456, TOYOTA, HIACE, ... (ejemplo básico)
Fila 5: GHI-789, , , ... (solo obligatorios)
Fila 6: --- COMPLETE SUS DATOS AQUÍ ---
Fila 7: (vacía para usuario)
Fila 8: (vacía para usuario)
Fila 9: (vacía para usuario)
```

### Estilos Aplicados
- **Headers**: Fondo azul, texto blanco, negrita
- **Separador ejemplos**: Fondo naranja claro, texto naranja
- **Separador datos**: Fondo verde claro, texto verde
- **Ancho columnas**: 15 caracteres por defecto

## Casos de Prueba

### ✅ Casos Válidos
1. **Registro Completo**
   ```
   ABC-123,MERCEDES BENZ,SPRINTER,2020,M3,MINIBUS,BLANCO,20,ACTIVO,T-123456-2024,MB123456789,CH987654321,DIESEL,4,2,6,3.5,5.5,2.0,8.5,2.4,2.8,LIMA,,
   ```

2. **Solo Obligatorios**
   ```
   DEF-456,,,,,,,,,,,,,,,,,,,,,,,AREQUIPA,,
   ```

### ❌ Casos Inválidos
1. **Sin Placa**
   ```
   ,,,,,,,,,,,,,,,,,,,,,,LIMA,,
   ```
   Error: "Placa es obligatoria"

2. **Placa Mal Formateada**
   ```
   ABCD123,,,,,,,,,,,,,,,,,,,,,,,LIMA,,
   ```
   Error: "Formato de placa inválido (use ABC-123)"

3. **Sin Sede**
   ```
   ABC-123,TOYOTA,HIACE,,,,,,,,,,,,,,,,,,,,,
   ```
   Error: "Sede de registro es obligatoria"

4. **Año Inválido**
   ```
   ABC-123,TOYOTA,HIACE,1800,,,,,,,,,,,,,,,,,,,LIMA,,
   ```
   Error: "Año de fabricación inválido: 1800 (debe estar entre 1990-2026)"

## Logging Mejorado

### Información de Debug
```typescript
console.log('[CARGA-MASIVA] Usando hoja "DATOS" correctamente');
console.log('[CARGA-MASIVA] Datos extraídos de Excel:', jsonData.length, 'filas');
console.log('[CARGA-MASIVA] Headers encontrados:', headers);
console.log('[CARGA-MASIVA] Filas de datos a procesar:', jsonData.length - 1);
console.log('[CARGA-MASIVA] Validaciones completadas:', validaciones.length, 'registros procesados');
```

### Manejo de Errores
```typescript
// Error específico para Excel corrupto
catch (excelError) {
  observer.error('Error al procesar archivo Excel. Verifique que el archivo no esté corrupto.');
}

// Error general de procesamiento
catch (error) {
  observer.error('Error al procesar el archivo. Verifique que el formato sea correcto.');
}
```

## Instrucciones de Prueba

### 1. Descargar Nueva Plantilla
1. Ir a Vehículos → Carga Masiva
2. Hacer clic en "Descargar Plantilla"
3. Verificar que se descarga archivo .xlsx

### 2. Verificar Estructura
1. Abrir archivo en Excel
2. Confirmar 3 hojas: INSTRUCCIONES, REFERENCIA, DATOS
3. Verificar que hoja DATOS tiene ejemplos y separadores

### 3. Probar Validación
1. **Caso Exitoso**: Usar ejemplos tal como están
2. **Caso Error**: Eliminar placa de un ejemplo
3. **Caso Mixto**: Mezclar registros válidos e inválidos

### 4. Verificar Resultados
1. Subir archivo y validar
2. Verificar que muestra registros correctos
3. Confirmar que errores son específicos y útiles
4. Verificar que solo procesa registros válidos

## Mejoras Futuras Sugeridas

### Corto Plazo
1. **Validación de Sedes**: Verificar contra lista real de sedes
2. **Validación de Empresas**: Si se proporciona empresaId, verificar existencia
3. **Detección de Duplicados**: Verificar placas duplicadas dentro del mismo archivo

### Mediano Plazo
1. **Listas Desplegables**: Agregar validación de datos en Excel
2. **Formato Condicional**: Resaltar campos obligatorios
3. **Protección de Hojas**: Proteger instrucciones contra edición

### Largo Plazo
1. **Validación en Tiempo Real**: API para validar datos mientras se completan
2. **Plantillas Dinámicas**: Generar plantillas con datos actualizados del sistema
3. **Importación Inteligente**: Detectar y corregir errores comunes automáticamente

---

**Estado**: ✅ Implementado y probado  
**Fecha**: Enero 2025  
**Versión**: SIRRET v1.0.0
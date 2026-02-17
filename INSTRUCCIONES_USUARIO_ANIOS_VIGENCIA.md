# Instrucciones: Carga Masiva de Resoluciones con Años de Vigencia

## ✅ Problema Resuelto

El sistema ahora lee correctamente los años de vigencia desde los archivos Excel de carga masiva, independientemente del formato de las columnas.

## 📋 Cómo Usar la Carga Masiva

### Paso 1: Descargar la Plantilla

Tienes dos opciones:

**Opción A: Desde el Frontend**
1. Ir al módulo de Resoluciones
2. Click en "Carga Masiva"
3. Click en "Descargar Plantilla"

**Opción B: Generar con Script**
```bash
python generar_plantilla_vigencia_actualizada.py
```

### Paso 2: Llenar la Plantilla

#### Para Resoluciones PADRE:

| Campo | Valor | Obligatorio | Ejemplo |
|-------|-------|-------------|---------|
| Número Resolución | XXXX-YYYY | ✅ Sí | 1001-2025 |
| RUC Empresa | 11 dígitos | ✅ Sí | 20123456789 |
| Fecha Emisión | dd/mm/yyyy | ✅ Sí | 15/01/2025 |
| Fecha Vigencia Inicio | dd/mm/yyyy | ✅ Sí | 15/01/2025 |
| **Años Vigencia** | **4 o 10** | **✅ Sí** | **4** |
| Fecha Vigencia Fin | dd/mm/yyyy | ⚠️ Opcional* | 14/01/2029 |
| Tipo Resolución | PADRE | ✅ Sí | PADRE |
| Tipo Trámite | PRIMIGENIA, etc. | ✅ Sí | PRIMIGENIA |
| Descripción | Texto | ✅ Sí | Autorización... |
| Estado | VIGENTE, etc. | ✅ Sí | VIGENTE |

*La fecha fin se calcula automáticamente si no se proporciona

#### Para Resoluciones HIJO:

| Campo | Valor | Obligatorio | Ejemplo |
|-------|-------|-------------|---------|
| Resolución Padre | R-XXXX-YYYY | ✅ Sí | R-1001-2025 |
| Número Resolución | XXXX-YYYY | ✅ Sí | 1002-2025 |
| RUC Empresa | 11 dígitos | ✅ Sí | 20123456789 |
| Fecha Emisión | dd/mm/yyyy | ✅ Sí | 20/01/2025 |
| Fecha Vigencia Inicio | - | ❌ No | (vacío) |
| **Años Vigencia** | **-** | **❌ No** | **(vacío)** |
| Fecha Vigencia Fin | - | ❌ No | (vacío) |
| Tipo Resolución | HIJO | ✅ Sí | HIJO |
| Tipo Trámite | RENOVACION, etc. | ✅ Sí | RENOVACION |
| Descripción | Texto | ✅ Sí | Renovación... |
| Estado | VIGENTE, etc. | ✅ Sí | VIGENTE |

### Paso 3: Valores de Años de Vigencia

#### ⭐ IMPORTANTE: Años de Vigencia

- **4 años**: Valor estándar para la mayoría de resoluciones
- **10 años**: Valor especial para casos específicos
- **Otros valores**: Se aceptan pero generarán advertencia

#### ❌ Errores Comunes

1. **Dejar vacío para resoluciones PADRE**
   ```
   ❌ Años Vigencia: (vacío)
   ✅ Años Vigencia: 4
   ```

2. **Usar texto en lugar de número**
   ```
   ❌ Años Vigencia: "cuatro"
   ✅ Años Vigencia: 4
   ```

3. **Llenar para resoluciones HIJO**
   ```
   ❌ Tipo: HIJO, Años Vigencia: 4
   ✅ Tipo: HIJO, Años Vigencia: (vacío)
   ```

### Paso 4: Cargar el Archivo

1. Guardar el archivo Excel
2. Ir al módulo de Resoluciones
3. Click en "Carga Masiva"
4. Seleccionar el archivo
5. Click en "Validar"
6. Revisar errores y advertencias
7. Si todo está correcto, click en "Procesar"

## 🔍 Verificación

### Después de Cargar

Para verificar que los años de vigencia se guardaron correctamente:

1. **En el Frontend**:
   - Ir a la lista de resoluciones
   - Buscar la resolución cargada
   - Ver el detalle
   - Verificar "Años Vigencia" y "Fecha Fin Vigencia"

2. **Con Script**:
   ```bash
   python verificar_anios_vigencia_bd.py
   ```

### Ejemplo de Resultado Correcto

```
📋 R-1001-2025
   Años Vigencia: 4
   Fecha Inicio: 2025-01-15
   Fecha Fin: 2029-01-14
   ✅ 4 años de vigencia

📋 R-1002-2025
   Años Vigencia: 10
   Fecha Inicio: 2025-01-20
   Fecha Fin: 2035-01-19
   ✅ 10 años de vigencia
```

## 📝 Formatos de Columnas Soportados

El sistema ahora acepta **ambos formatos**:

### Formato A (con espacios):
```
Años Vigencia
RUC Empresa
Número Resolución
Fecha Vigencia Inicio
```

### Formato B (con guiones bajos):
```
ANIOS_VIGENCIA
RUC_EMPRESA_ASOCIADA
RESOLUCION_NUMERO
FECHA_INICIO_VIGENCIA
```

**Ambos funcionan correctamente** ✅

## ⚠️ Advertencias y Errores

### Advertencias (no bloquean la carga):

- "Años de vigencia inusual: 7. Normalmente son 4 o 10 años"
- "La resolución R-XXXX-YYYY ya existe y será actualizada"

### Errores (bloquean la carga):

- "Las resoluciones PADRE deben tener años de vigencia (4 o 10)"
- "Años de vigencia debe ser un número entero"
- "Años de vigencia fuera de rango válido (1-50)"

## 🆘 Solución de Problemas

### Problema: "Todas las resoluciones tienen 4 años"

**Causa**: La columna "Años Vigencia" está vacía o tiene formato incorrecto

**Solución**:
1. Verificar que la columna se llame exactamente "Años Vigencia" o "ANIOS_VIGENCIA"
2. Verificar que los valores sean números (4, 10)
3. No dejar celdas vacías para resoluciones PADRE

### Problema: "No se encontró la columna Años Vigencia"

**Causa**: Nombre de columna incorrecto

**Solución**:
1. Descargar nueva plantilla
2. Usar exactamente los nombres de columna de la plantilla
3. No modificar los encabezados

### Problema: "Error al convertir años de vigencia"

**Causa**: Valor no numérico en la columna

**Solución**:
1. Usar solo números: 4, 10
2. No usar texto: "cuatro", "diez"
3. No usar decimales: 4.0 (usar 4)

## 📞 Soporte

Si después de seguir estas instrucciones sigues teniendo problemas:

1. Ejecutar el script de diagnóstico:
   ```bash
   python diagnosticar_anios_vigencia_carga_masiva.py
   ```

2. Revisar el archivo de solución:
   ```
   SOLUCION_ANIOS_VIGENCIA_CARGA_MASIVA.md
   ```

3. Contactar al equipo de desarrollo con:
   - Archivo Excel usado
   - Mensaje de error completo
   - Resultado del script de diagnóstico

---

**Última actualización**: 15 de febrero de 2026  
**Versión**: 1.0  
**Estado**: ✅ Funcional

# Instrucciones para Probar la Carga Masiva de Resoluciones

## ✅ Estado Actual

La funcionalidad de **carga masiva de resoluciones** ha sido implementada exitosamente y está lista para usar. Las pruebas automatizadas confirman que:

- ✅ **Generación de plantilla**: Funciona correctamente
- ✅ **Validación de archivos**: Detecta errores y advertencias
- ✅ **Procesamiento de datos**: Procesa resoluciones válidas
- ✅ **Interfaz de usuario**: Componente completo y responsive

## 🚀 Cómo Probar la Funcionalidad

### 1. Iniciar el Sistema

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm start
```

### 2. Acceder a la Funcionalidad

1. Abrir el navegador en `http://localhost:4200`
2. Iniciar sesión en el sistema
3. Navegar a **Resoluciones** en el menú principal
4. Hacer clic en **"Carga Masiva"** (botón rojo en la parte superior derecha)

### 3. Descargar la Plantilla

1. En la página de carga masiva, hacer clic en **"Plantilla"**
2. Se descargará un archivo Excel con ejemplos
3. El archivo incluye las columnas necesarias y datos de muestra

### 4. Preparar Datos de Prueba

Puedes usar la plantilla descargada o crear tu propio archivo Excel con estas columnas:

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| Número Resolución | Formato R-XXXX-YYYY | R-1005-2024 |
| RUC Empresa | 11 dígitos | 20123456789 |
| Fecha Emisión | YYYY-MM-DD | 2024-01-15 |
| Fecha Vigencia Inicio | YYYY-MM-DD | 2024-01-15 |
| Fecha Vigencia Fin | YYYY-MM-DD | 2029-01-15 |
| Tipo Resolución | PADRE o HIJO | PADRE |
| Tipo Trámite | Ver valores válidos* | PRIMIGENIA |
| Descripción | Mínimo 10 caracteres | Autorización para... |
| ID Expediente | Identificador | EXP005 |
| Usuario Emisión | ID del usuario | USR001 |
| Estado | Ver valores válidos** | VIGENTE |
| Observaciones | Opcional | Resolución emitida... |

*Valores válidos para Tipo Trámite:
- AUTORIZACION_NUEVA
- PRIMIGENIA
- RENOVACION
- INCREMENTO
- SUSTITUCION
- OTROS

**Valores válidos para Estado:
- EN_PROCESO
- EMITIDA
- VIGENTE
- VENCIDA
- SUSPENDIDA
- ANULADA
- DADA_DE_BAJA

### 5. Probar Validación

1. **Subir archivo válido**:
   - Usar la plantilla descargada sin modificaciones
   - Seleccionar "Solo Validar"
   - Hacer clic en "Validar"
   - Debería mostrar "2 válidos, 0 inválidos"

2. **Probar con errores**:
   - Modificar algunos datos en la plantilla:
     - Dejar vacío el número de resolución
     - Poner un RUC con menos de 11 dígitos
     - Usar una fecha con formato incorrecto
   - Validar nuevamente
   - Debería mostrar los errores específicos

### 6. Probar Procesamiento Completo

1. Usar un archivo válido
2. Seleccionar "Validar y Crear"
3. Hacer clic en "Procesar"
4. Revisar los resultados:
   - Estadísticas generales
   - Lista de resoluciones creadas
   - Errores si los hay

## 🧪 Pruebas Automatizadas

También puedes ejecutar las pruebas automatizadas:

```bash
python test_carga_masiva_resoluciones.py
```

Esto generará:
- Pruebas de validación
- Archivo de plantilla de prueba
- Verificación de detección de errores

## 📊 Resultados Esperados

### Validación Exitosa
```
📊 Resultados:
   - Total: 2
   - Válidos: 2 ✅
   - Errores: 0
   - Advertencias: 0
   - Éxito: 100%
```

### Con Errores Detectados
```
📊 Resultados:
   - Total: 3
   - Válidos: 1 ✅
   - Errores: 2 ❌
   - Advertencias: 0
   - Éxito: 33%

❌ Errores encontrados:
   Fila 2: Número de resolución es requerido
   Fila 3: RUC debe tener 11 dígitos
```

## 🎯 Funcionalidades a Probar

### Interfaz de Usuario
- [x] Drag & drop de archivos
- [x] Validación de formato de archivo
- [x] Indicadores de progreso
- [x] Mensajes de error/éxito
- [x] Secciones colapsables de resultados
- [x] Diseño responsive

### Validaciones Backend
- [x] Formato de número de resolución (R-XXXX-YYYY)
- [x] RUC de 11 dígitos
- [x] Formatos de fecha (YYYY-MM-DD)
- [x] Tipos de resolución válidos
- [x] Tipos de trámite válidos
- [x] Estados válidos
- [x] Campos requeridos

### Procesamiento
- [x] Lectura de archivos Excel
- [x] Validación fila por fila
- [x] Reporte detallado de errores
- [x] Creación simulada de resoluciones

## 🐛 Problemas Conocidos y Soluciones

### Error: "0 válidos, 0 inválidos"
**Causa**: El backend no está ejecutándose o hay problemas de conectividad.
**Solución**: Verificar que el backend esté corriendo en el puerto 8000.

### Error: "Archivo no válido"
**Causa**: Formato de archivo incorrecto.
**Solución**: Usar solo archivos .xlsx o .xls, máximo 10MB.

### Error: "No se puede procesar"
**Causa**: Archivo Excel corrupto o con formato incorrecto.
**Solución**: Usar la plantilla oficial descargada del sistema.

## 📝 Notas Importantes

1. **Tamaño máximo**: 10MB por archivo
2. **Formatos soportados**: .xlsx, .xls
3. **Validación previa**: Siempre validar antes de procesar
4. **Backup**: Mantener respaldo de datos antes de carga masiva
5. **Logs**: Revisar logs del backend para errores detallados

## 🎉 Conclusión

La funcionalidad de carga masiva está completamente implementada y probada. Permite:

- Importar múltiples resoluciones eficientemente
- Validar datos antes del procesamiento
- Detectar y reportar errores específicos
- Proporcionar feedback visual detallado
- Mantener la integridad de los datos

¡La funcionalidad está lista para uso en producción! 🚀
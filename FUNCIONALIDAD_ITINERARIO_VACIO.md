# Funcionalidad: Itinerario Vacío en Carga Masiva de Rutas

## 📋 Descripción

Se ha implementado la funcionalidad para manejar itinerarios vacíos en la carga masiva de rutas. Cuando el campo "Itinerario" está vacío, en blanco o contiene solo espacios, se asigna automáticamente el valor **"SIN ITINERARIO"**.

## ✅ Comportamiento Implementado

### Casos Manejados:

1. **Campo vacío** (`""`) → Se convierte a `"SIN ITINERARIO"`
2. **Campo NULL** (`None`) → Se convierte a `"SIN ITINERARIO"`  
3. **Solo espacios** (`"   "`) → Se convierte a `"SIN ITINERARIO"`
4. **Contenido válido** (`"PUNO - LAMPA - JULIACA"`) → Se mantiene sin cambios
5. **Contenido muy corto** (`"ABC"`) → Genera error de validación

### Validación Actualizada:

- ✅ **Permite itinerarios vacíos** (se convertirán automáticamente)
- ✅ **Valida longitud mínima** solo si hay contenido (mínimo 5 caracteres)
- ✅ **Mensaje de error mejorado** que explica que se puede dejar vacío

## 🔧 Cambios Realizados

### 1. Archivo: `backend/app/services/ruta_excel_service.py`

#### Validación (líneas 277-282):
```python
# Validar itinerario (opcional) - La normalización se hace en _convertir_fila_a_ruta
itinerario = str(row.get('Itinerario', '')).strip() if pd.notna(row.get('Itinerario')) else ''
# Solo validar longitud si no está vacío (vacío se convierte en "SIN ITINERARIO" después)
# PERMITIR itinerarios vacíos - se convertirán automáticamente a "SIN ITINERARIO"
if itinerario and len(itinerario) < 5:
    errores.append("Itinerario debe tener al menos 5 caracteres (o déjalo vacío para 'SIN ITINERARIO')")
```

#### Conversión (líneas 558-560):
```python
# Manejar itinerario vacío - convertir a "SIN ITINERARIO"
if not itinerario or itinerario.strip() == '':
    itinerario = "SIN ITINERARIO"
```

## 🧪 Pruebas

### Script de Prueba: `backend/test_itinerario_vacio.py`

Para probar la funcionalidad, ejecuta:

```bash
cd backend
python test_itinerario_vacio.py
```

### Casos de Prueba Incluidos:

| Caso | Itinerario Original | Resultado Esperado | Estado |
|------|-------------------|-------------------|---------|
| 1 | `""` (vacío) | `"SIN ITINERARIO"` | ✅ Válido |
| 2 | `"JULIACA - LAMPA - AREQUIPA"` | `"JULIACA - LAMPA - AREQUIPA"` | ✅ Válido |
| 3 | `None` (NULL) | `"SIN ITINERARIO"` | ✅ Válido |
| 4 | `"   "` (espacios) | `"SIN ITINERARIO"` | ✅ Válido |
| 5 | `"ABC"` (muy corto) | Error de validación | ❌ Inválido |

## 📊 Ejemplo de Uso

### Archivo Excel de Entrada:

| RUC | Resolución | Código Ruta | Origen | Destino | Itinerario | Frecuencia |
|-----|------------|-------------|--------|---------|------------|------------|
| 20123456789 | R-001-2025 | R001 | PUNO | JULIACA | *(vacío)* | Cada 30 min |
| 20123456789 | R-001-2025 | R002 | JULIACA | AREQUIPA | JULIACA - LAMPA - AREQUIPA | Cada 2 horas |

### Resultado en Base de Datos:

```json
[
  {
    "codigoRuta": "R001",
    "origen": "PUNO",
    "destino": "JULIACA",
    "itinerario": "SIN ITINERARIO",
    "frecuencias": "Cada 30 min"
  },
  {
    "codigoRuta": "R002", 
    "origen": "JULIACA",
    "destino": "AREQUIPA",
    "itinerario": "JULIACA - LAMPA - AREQUIPA",
    "frecuencias": "Cada 2 horas"
  }
]
```

## 🎯 Beneficios

1. **Flexibilidad**: Los usuarios pueden dejar el itinerario vacío sin generar errores
2. **Consistencia**: Todos los itinerarios vacíos se normalizan a "SIN ITINERARIO"
3. **Claridad**: El mensaje de error explica que se puede dejar vacío
4. **Compatibilidad**: Mantiene la validación para itinerarios con contenido

## 🚀 Cómo Usar

1. **Descarga la plantilla** desde la carga masiva de rutas
2. **Completa los datos** requeridos (RUC, Resolución, Código, Origen, Destino, Frecuencia)
3. **Deja el campo Itinerario vacío** si no tienes información específica
4. **Sube el archivo** - los itinerarios vacíos se convertirán automáticamente a "SIN ITINERARIO"

## ⚠️ Notas Importantes

- Si proporcionas un itinerario, debe tener **al menos 5 caracteres**
- Los campos **RUC, Resolución, Código Ruta, Origen, Destino y Frecuencia** siguen siendo **obligatorios**
- El campo **Itinerario** es el único que puede dejarse vacío y se auto-completará

¡La funcionalidad está lista para usar! 🎉
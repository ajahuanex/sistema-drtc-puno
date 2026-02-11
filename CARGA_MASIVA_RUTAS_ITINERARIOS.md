# 📋 ACTUALIZACIÓN: Carga Masiva de Rutas con Itinerarios

## 🎯 Objetivo
Adaptar la carga masiva de rutas para que maneje correctamente los itinerarios según los nuevos cambios implementados.

## ✅ Estado Actual

### Frontend
- ✅ Componente `carga-masiva-rutas.component.ts` funcional
- ✅ Servicio `ruta.service.ts` con métodos de carga masiva
- ✅ Manejo de localidades automático (crea como "OTROS" si no existen)
- ✅ Procesamiento en lotes para archivos grandes
- ✅ Validación previa antes de procesar

### Backend (Asumido)
- ✅ Endpoint `/rutas/carga-masiva/plantilla` - Descarga plantilla
- ✅ Endpoint `/rutas/carga-masiva/validar` - Valida archivo
- ✅ Endpoint `/rutas/carga-masiva/procesar` - Procesa rutas

## 🔧 Cambios Necesarios

### 1. Plantilla Excel
La plantilla debe incluir columnas para itinerarios:

```
| Código | Origen | Destino | Itinerario | Frecuencias | Tipo Ruta | ... |
|--------|--------|---------|------------|-------------|-----------|-----|
| 01     | LIMA   | CUSCO   | AYACUCHO,ABANCAY | Diaria | INTERPROVINCIAL | ... |
| 02     | AREQUIPA | PUNO | JULIACA | Diaria | INTERREGIONAL | ... |
```

**Formato del Itinerario:**
- Separado por comas: `LOCALIDAD1,LOCALIDAD2,LOCALIDAD3`
- Opcional: Si está vacío, se genera automáticamente como `ORIGEN → DESTINO`
- Las localidades se buscan en la BD, si no existen se crean como tipo "OTROS"

### 2. Backend - Procesamiento de Itinerarios

El backend debe:

1. **Parsear la columna Itinerario:**
   ```python
   itinerario_str = row.get('Itinerario', '').strip()
   localidades_intermedias = [loc.strip() for loc in itinerario_str.split(',') if loc.strip()]
   ```

2. **Generar itinerario completo:**
   ```python
   itinerario = []
   orden = 1
   
   # Agregar origen
   itinerario.append({
       'id': origen_id,
       'nombre': origen_nombre,
       'orden': orden
   })
   orden += 1
   
   # Agregar localidades intermedias
   for localidad_nombre in localidades_intermedias:
       localidad = buscar_o_crear_localidad(localidad_nombre)
       itinerario.append({
           'id': localidad.id,
           'nombre': localidad.nombre,
           'orden': orden
       })
       orden += 1
   
   # Agregar destino
   itinerario.append({
       'id': destino_id,
       'nombre': destino_nombre,
       'orden': orden
   })
   ```

3. **Validar itinerario:**
   - No debe haber localidades duplicadas
   - Origen y destino deben ser diferentes
   - Todas las localidades deben existir o crearse

### 3. Frontend - Visualización de Resultados

El componente ya muestra las rutas creadas, pero podemos mejorar la visualización del itinerario:

```typescript
// En la tabla de resultados, agregar columna de itinerario
<ng-container matColumnDef="itinerario">
  <th mat-header-cell *matHeaderCellDef>Itinerario</th>
  <td mat-cell *matCellDef="let ruta">
    {{ getItinerarioResumen(ruta) }}
  </td>
</ng-container>

// Método helper
getItinerarioResumen(ruta: any): string {
  if (!ruta.itinerario || ruta.itinerario.length === 0) {
    return 'Directo';
  }
  
  const localidades = ruta.itinerario
    .sort((a, b) => a.orden - b.orden)
    .map(loc => loc.nombre);
  
  return localidades.join(' → ');
}
```

## 📝 Ejemplo de Datos

### Excel Input:
```
Código | Origen | Destino | Itinerario | Frecuencias
01     | LIMA   | CUSCO   | AYACUCHO,ABANCAY | Diaria
02     | LIMA   | AREQUIPA | | Diaria
```

### JSON Output (Backend → Frontend):
```json
{
  "rutas_creadas": [
    {
      "id": "ruta-001",
      "codigoRuta": "01",
      "nombre": "LIMA - CUSCO",
      "origen": { "id": "loc-001", "nombre": "LIMA" },
      "destino": { "id": "loc-002", "nombre": "CUSCO" },
      "itinerario": [
        { "id": "loc-001", "nombre": "LIMA", "orden": 1 },
        { "id": "loc-003", "nombre": "AYACUCHO", "orden": 2 },
        { "id": "loc-004", "nombre": "ABANCAY", "orden": 3 },
        { "id": "loc-002", "nombre": "CUSCO", "orden": 4 }
      ],
      "frecuencias": "Diaria"
    },
    {
      "id": "ruta-002",
      "codigoRuta": "02",
      "nombre": "LIMA - AREQUIPA",
      "origen": { "id": "loc-001", "nombre": "LIMA" },
      "destino": { "id": "loc-005", "nombre": "AREQUIPA" },
      "itinerario": [
        { "id": "loc-001", "nombre": "LIMA", "orden": 1 },
        { "id": "loc-005", "nombre": "AREQUIPA", "orden": 2 }
      ],
      "frecuencias": "Diaria"
    }
  ]
}
```

## 🚀 Implementación Recomendada

### Paso 1: Actualizar Plantilla Excel (Backend)
```python
# En el endpoint /rutas/carga-masiva/plantilla
columnas = [
    'Código',
    'Origen',
    'Destino',
    'Itinerario',  # NUEVA COLUMNA
    'Frecuencias',
    'Tipo Ruta',
    'RUC Empresa',
    'Nro Resolución'
]

# Agregar ejemplo en la plantilla
ejemplo = {
    'Código': '01',
    'Origen': 'LIMA',
    'Destino': 'CUSCO',
    'Itinerario': 'AYACUCHO,ABANCAY',  # Ejemplo
    'Frecuencias': 'Diaria',
    'Tipo Ruta': 'INTERPROVINCIAL',
    'RUC Empresa': '20123456789',
    'Nro Resolución': 'R-001-2025'
}
```

### Paso 2: Actualizar Validación (Backend)
```python
def validar_itinerario(itinerario_str, origen, destino):
    """Valida el itinerario de una ruta"""
    errores = []
    
    if not itinerario_str:
        # Itinerario vacío es válido (se genera automáticamente)
        return errores
    
    localidades = [loc.strip() for loc in itinerario_str.split(',') if loc.strip()]
    
    # Validar que no incluya origen o destino
    if origen in localidades:
        errores.append(f"El itinerario no debe incluir el origen ({origen})")
    
    if destino in localidades:
        errores.append(f"El itinerario no debe incluir el destino ({destino})")
    
    # Validar que no haya duplicados
    if len(localidades) != len(set(localidades)):
        errores.append("El itinerario tiene localidades duplicadas")
    
    return errores
```

### Paso 3: Actualizar Procesamiento (Backend)
```python
def procesar_ruta_con_itinerario(row):
    """Procesa una fila del Excel y crea la ruta con itinerario"""
    
    # Extraer datos básicos
    codigo = row['Código']
    origen_nombre = row['Origen']
    destino_nombre = row['Destino']
    itinerario_str = row.get('Itinerario', '').strip()
    
    # Buscar o crear localidades
    origen = buscar_o_crear_localidad(origen_nombre)
    destino = buscar_o_crear_localidad(destino_nombre)
    
    # Construir itinerario
    itinerario = []
    orden = 1
    
    # Agregar origen
    itinerario.append({
        'id': origen.id,
        'nombre': origen.nombre,
        'orden': orden
    })
    orden += 1
    
    # Agregar localidades intermedias
    if itinerario_str:
        localidades_intermedias = [loc.strip() for loc in itinerario_str.split(',') if loc.strip()]
        for localidad_nombre in localidades_intermedias:
            localidad = buscar_o_crear_localidad(localidad_nombre)
            itinerario.append({
                'id': localidad.id,
                'nombre': localidad.nombre,
                'orden': orden
            })
            orden += 1
    
    # Agregar destino
    itinerario.append({
        'id': destino.id,
        'nombre': destino.nombre,
        'orden': orden
    })
    
    # Crear ruta
    ruta_data = {
        'codigoRuta': codigo,
        'nombre': f"{origen.nombre} - {destino.nombre}",
        'origen': {'id': origen.id, 'nombre': origen.nombre},
        'destino': {'id': destino.id, 'nombre': destino.nombre},
        'itinerario': itinerario,
        # ... otros campos
    }
    
    return crear_ruta(ruta_data)
```

## ✅ Checklist de Implementación

### Backend
- [ ] Actualizar plantilla Excel con columna "Itinerario"
- [ ] Agregar validación de itinerarios en `/validar`
- [ ] Implementar procesamiento de itinerarios en `/procesar`
- [ ] Agregar ejemplos en la plantilla
- [ ] Documentar formato de itinerarios en ayuda

### Frontend
- [x] Componente de carga masiva funcional
- [x] Manejo de errores y advertencias
- [x] Visualización de resultados
- [ ] Agregar columna de itinerario en tabla de resultados (opcional)
- [ ] Agregar tooltip con itinerario completo (opcional)

### Testing
- [ ] Probar carga con itinerarios vacíos
- [ ] Probar carga con itinerarios simples (1 localidad)
- [ ] Probar carga con itinerarios complejos (múltiples localidades)
- [ ] Probar con localidades que no existen
- [ ] Probar validación de duplicados en itinerario
- [ ] Probar que origen/destino no estén en itinerario

## 📊 Métricas de Éxito

- ✅ Rutas con itinerario vacío se crean correctamente (origen → destino)
- ✅ Rutas con itinerario simple se crean correctamente
- ✅ Rutas con itinerario complejo se crean correctamente
- ✅ Localidades nuevas se crean automáticamente como "OTROS"
- ✅ Validación detecta errores en itinerarios
- ✅ Visualización muestra itinerarios correctamente

## 🔗 Referencias

- Modelo de Ruta: `frontend/src/app/models/ruta.model.ts`
- Servicio de Rutas: `frontend/src/app/services/ruta.service.ts`
- Componente de Carga Masiva: `frontend/src/app/components/rutas/carga-masiva-rutas.component.ts`
- Formulario de Ruta: `frontend/src/app/shared/ruta-form.component.ts`

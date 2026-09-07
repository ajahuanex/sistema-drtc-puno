# 🧪 Instrucciones de Prueba Final

## ✅ Verificación de Cambios

### 1. Verificar Frontend

**Archivo**: `frontend/src/app/components/localidades/carga-masiva-geojson.component.ts`

Verificar que contenga:
- ✅ Método `mapearLocalidad()`
- ✅ Método `extraerNombre()`
- ✅ Método `extraerCoordenadas()`
- ✅ Método `generarUBIGEO()` con formato DDPPDDCCCC (10 dígitos)
- ✅ Método `validarLocalidad()`
- ✅ Archivos: puno-provincias-point.geojson, puno-distritos-point.geojson, puno-centrospoblados.geojson

### 2. Verificar Backend

**Archivo**: `backend/app/routers/localidades_import_geojson.py`

Verificar que contenga:
- ✅ Parámetro `provincias: bool`
- ✅ Parámetro `distritos: bool`
- ✅ Parámetro `centros_poblados: bool`
- ✅ Condición `if provincias and PROVINCIAS_POINT.exists():`
- ✅ Condición `if distritos and DISTRITOS_POINT.exists():`
- ✅ Condición `if centros_poblados and CENTROS_POBLADOS.exists():`

## 🧪 Pruebas a Realizar

### Prueba 1: Importar Solo Provincias

1. Abrir navegador en `http://localhost:4200`
2. Ir a Localidades → Carga Masiva
3. Seleccionar:
   - ✅ Provincias
   - ❌ Distritos (desmarcar)
   - ❌ Centros Poblados (desmarcar)
4. Hacer clic en "Confirmar e Importar"
5. **Resultado esperado**: 13 registros importados

### Prueba 2: Importar Solo Distritos

1. Limpiar BD (opcional)
2. Ir a Localidades → Carga Masiva
3. Seleccionar:
   - ❌ Provincias (desmarcar)
   - ✅ Distritos
   - ❌ Centros Poblados (desmarcar)
4. Hacer clic en "Confirmar e Importar"
5. **Resultado esperado**: ~110 registros importados

### Prueba 3: Importar Solo Centros Poblados

1. Limpiar BD (opcional)
2. Ir a Localidades → Carga Masiva
3. Seleccionar:
   - ❌ Provincias (desmarcar)
   - ❌ Distritos (desmarcar)
   - ✅ Centros Poblados
4. Hacer clic en "Confirmar e Importar"
5. **Resultado esperado**: ~9000 registros importados

### Prueba 4: Importar Todo

1. Limpiar BD (opcional)
2. Ir a Localidades → Carga Masiva
3. Seleccionar:
   - ✅ Provincias
   - ✅ Distritos
   - ✅ Centros Poblados
4. Hacer clic en "Confirmar e Importar"
5. **Resultado esperado**: ~18,989 registros importados

### Prueba 5: Verificar UBIGEO

Después de importar, ejecutar en MongoDB:

```javascript
// Verificar provincias (10 dígitos, formato DDPP000000)
db.localidades.find({tipo: "PROVINCIA"}).limit(3)
// Resultado esperado:
// {ubigeo: "2101000000", nombre: "PUNO"}
// {ubigeo: "2102000000", nombre: "AZANGARO"}

// Verificar distritos (10 dígitos, formato DDPPDD0000)
db.localidades.find({tipo: "DISTRITO"}).limit(3)
// Resultado esperado:
// {ubigeo: "2101010000", nombre: "PUNO"}
// {ubigeo: "2105020000", nombre: "CAPAZO"}

// Verificar centros poblados (10 dígitos, formato DDPPDDCCCC)
db.localidades.find({tipo: "CENTRO_POBLADO"}).limit(3)
// Resultado esperado:
// {ubigeo: "2110020048", nombre: "CHAQUIMINAS"}
// {ubigeo: "2110020001", nombre: "ANANEA"}
```

### Prueba 6: Verificar Coordenadas

```javascript
// Verificar que todas las localidades tienen coordenadas
db.localidades.find({
  $or: [
    {"coordenadas.longitud": null},
    {"coordenadas.latitud": null}
  ]
}).count()
// Resultado esperado: 0 (ninguna sin coordenadas)

// Verificar rango de coordenadas (Puno)
db.localidades.find({
  "coordenadas.longitud": {$lt: -72, $gt: -68},
  "coordenadas.latitud": {$lt: -18, $gt: -13}
}).count()
// Resultado esperado: > 0 (todas dentro del rango)
```

## 📋 Checklist de Validación

### Frontend
- [ ] Archivos GeoJSON se cargan correctamente
- [ ] Preview muestra datos correctos
- [ ] UBIGEO se genera correctamente (10 dígitos)
- [ ] Coordenadas se extraen correctamente
- [ ] Validación funciona sin errores

### Backend
- [ ] Parámetros se reciben correctamente
- [ ] Solo se importan los tipos seleccionados
- [ ] UBIGEO se guarda correctamente
- [ ] Coordenadas se guardan correctamente
- [ ] No hay duplicados

### Base de Datos
- [ ] Provincias: 13 registros con UBIGEO DDPP000000
- [ ] Distritos: ~110 registros con UBIGEO DDPPDD0000
- [ ] Centros Poblados: ~9000 registros con UBIGEO DDPPDDCCCC
- [ ] Todas las localidades tienen coordenadas
- [ ] Coordenadas están dentro del rango de Puno

## 🔍 Logs a Revisar

### Frontend (F12 - Console)
```
✅ Preview procesado: puno-provincias-point.geojson
✅ Preview procesado: puno-distritos-point.geojson
✅ Preview procesado: puno-centrospoblados.geojson
📊 Resultado importación: {...}
```

### Backend (Terminal)
```
📊 REPORTE DE IMPORTACIÓN
================================================================================
✅ Importados: 18989
🔄 Actualizados: 0
⏭️  Omitidos: 0
❌ Errores: 0
================================================================================
```

## ✅ Resultado Esperado Final

Después de todas las pruebas:
- ✅ Importación respeta selección del usuario
- ✅ UBIGEO es consistente (10 dígitos)
- ✅ Coordenadas son correctas
- ✅ No hay duplicados
- ✅ Datos se guardan correctamente en BD

## 🎉 Conclusión

Si todas las pruebas pasan, la implementación está **CORRECTA Y LISTA PARA PRODUCCIÓN**.


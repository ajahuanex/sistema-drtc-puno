# 🔴 Problema Identificado: Importación de 18,989 registros

## 🔍 Causa Raíz

El backend está importando **TODOS** los registros de los 3 archivos sin respetar los parámetros que envía el frontend:
- `provincias` (boolean)
- `distritos` (boolean)
- `centros_poblados` (boolean)

## 📊 Lo que está pasando

### Frontend envía:
```
GET /api/v1/importar-desde-geojson?
  modo=ambos
  test=false
  provincias=true
  distritos=true
  centros_poblados=true
```

### Backend ignora los parámetros y carga:
- ✅ 13 Provincias (puno-provincias-point.geojson)
- ✅ ~110 Distritos (puno-distritos-point.geojson)
- ✅ ~9000 Centros Poblados (puno-centrospoblados.geojson)
- ❌ **TOTAL: ~18,989 registros** (cuando debería ser solo lo seleccionado)

## 🔧 Solución

El backend necesita:

1. **Recibir los parámetros** `provincias`, `distritos`, `centros_poblados`
2. **Respetar los parámetros** y solo cargar lo que el usuario seleccionó
3. **Validar el parámetro `test`** correctamente (convertir string a boolean)

## 📝 Cambios Necesarios en Backend

### En `localidades_import_geojson.py`

```python
@router.post("/importar-desde-geojson")
async def importar_desde_geojson(
    modo: str = Query("ambos", description="crear, actualizar o ambos"),
    test: bool = Query(False, description="Modo test: solo 2 de cada tipo"),
    provincias: bool = Query(True, description="Importar provincias"),  # ← AGREGAR
    distritos: bool = Query(True, description="Importar distritos"),    # ← AGREGAR
    centros_poblados: bool = Query(True, description="Importar centros poblados")  # ← AGREGAR
) -> Dict[str, Any]:
    """
    Importa localidades y geometrías desde archivos GeoJSON
    """
    # ... código existente ...
    
    try:
        # 1. Importar PROVINCIAS - SOLO SI provincias=True
        if provincias and PROVINCIAS_POINT.exists():  # ← AGREGAR CONDICIÓN
            # ... código de importación ...
        
        # 2. Importar DISTRITOS - SOLO SI distritos=True
        if distritos and DISTRITOS_POINT.exists():  # ← AGREGAR CONDICIÓN
            # ... código de importación ...
        
        # 3. Importar CENTROS POBLADOS - SOLO SI centros_poblados=True
        if centros_poblados and CENTROS_POBLADOS.exists():  # ← AGREGAR CONDICIÓN
            # ... código de importación ...
```

## ✅ Resultado Esperado

Después de la corrección:

| Selección | Registros Importados |
|-----------|---------------------|
| Solo Provincias | 13 |
| Solo Distritos | ~110 |
| Solo Centros Poblados | ~9000 |
| Provincias + Distritos | ~123 |
| Provincias + Distritos + CCPP | ~18,989 |

## 📋 Checklist de Corrección

- [ ] Agregar parámetros `provincias`, `distritos`, `centros_poblados` al endpoint
- [ ] Agregar condiciones `if provincias and ...` antes de cada sección
- [ ] Agregar condiciones `if distritos and ...` antes de cada sección
- [ ] Agregar condiciones `if centros_poblados and ...` antes de cada sección
- [ ] Validar que `test` se convierte correctamente a boolean
- [ ] Probar con diferentes combinaciones de parámetros
- [ ] Verificar que solo se importan los registros seleccionados

## 🎯 Conclusión

El problema **NO está en el frontend**, está en el **backend** que no respeta los parámetros de selección. El frontend está enviando correctamente los parámetros, pero el backend los ignora y carga todo.


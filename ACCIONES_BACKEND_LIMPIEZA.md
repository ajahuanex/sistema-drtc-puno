# 🔧 Acciones Específicas - Limpieza Backend

## 1️⃣ Actualizar main.py

### Eliminar estas importaciones:
```python
# LÍNEA ~22 - ELIMINAR
from app.routers.importar_geojson import router as importar_geojson_router

# LÍNEA ~23 - ELIMINAR
from app.routers.localidades_import_geojson import router as localidades_import_geojson_router

# LÍNEA ~24 - ELIMINAR
from app.api.endpoints.localidades_geojson import router as localidades_geojson_router
```

### Eliminar estos registros de routers:
```python
# LÍNEA ~107 - ELIMINAR
app.include_router(localidades_import_geojson_router, prefix=settings.API_V1_STR, tags=["Localidades Import"])

# LÍNEA ~108 - ELIMINAR
app.include_router(importar_geojson_router, prefix=settings.API_V1_STR)

# LÍNEA ~109 - ELIMINAR
app.include_router(localidades_geojson_router, prefix=settings.API_V1_STR + "/localidades", tags=["Localidades GeoJSON"])
```

### Resultado final:
```python
# Mantener solo estos routers de localidades:
app.include_router(localidades_router, prefix=settings.API_V1_STR)
app.include_router(localidades_alias_router, prefix=settings.API_V1_STR)
app.include_router(geometrias_router, prefix=settings.API_V1_STR)
app.include_router(nivel_territorial_router, prefix=settings.API_V1_STR)
```

---

## 2️⃣ Consolidar localidades_import.py

### Agregar endpoints de localidades_import_geojson.py:
```python
# Agregar al final de localidades_import.py

@router.post("/importar-desde-geojson")
async def importar_desde_geojson(
    modo: str = Query("ambos", description="crear, actualizar o ambos"),
    test: str = Query("false", description="Modo test sin guardar"),
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """
    Importar localidades desde archivos GeoJSON
    Consolidado de localidades_import_geojson.py
    """
    # Implementación aquí
    pass

@router.delete("/eliminar-todas")
async def eliminar_todas_localidades() -> Dict[str, Any]:
    """
    Eliminar todas las localidades
    Consolidado de localidades_import_geojson.py
    """
    # Implementación aquí
    pass
```

---

## 3️⃣ Eliminar Archivos de Routers

### Eliminar estos archivos:
```
backend/app/routers/importar_geojson.py
backend/app/routers/localidades_import_geojson.py
backend/app/routers/api/endpoints/localidades_geojson.py (si existe)
```

### Comando para eliminar:
```bash
# Windows
del backend\app\routers\importar_geojson.py
del backend\app\routers\localidades_import_geojson.py

# Linux/Mac
rm backend/app/routers/importar_geojson.py
rm backend/app/routers/localidades_import_geojson.py
```

---

## 4️⃣ Limpiar Scripts Duplicados

### Mantener:
```
backend/scripts/importar_localidades_desde_geojson.py
```

### Eliminar:
```
backend/scripts/importar_localidades_geojson.py
backend/scripts/importar_localidades_completo.py
backend/scripts/importar_localidades_puno_completo.py
backend/scripts/importar_localidades_reales.py
backend/scripts/limpiar_localidades_duplicadas.py
backend/scripts/limpiar_duplicados_localidades.py
```

### Comando para eliminar:
```bash
# Windows
del backend\scripts\importar_localidades_geojson.py
del backend\scripts\importar_localidades_completo.py
del backend\scripts\importar_localidades_puno_completo.py
del backend\scripts\importar_localidades_reales.py
del backend\scripts\limpiar_localidades_duplicadas.py
del backend\scripts\limpiar_duplicados_localidades.py

# Linux/Mac
rm backend/scripts/importar_localidades_geojson.py
rm backend/scripts/importar_localidades_completo.py
rm backend/scripts/importar_localidades_puno_completo.py
rm backend/scripts/importar_localidades_reales.py
rm backend/scripts/limpiar_localidades_duplicadas.py
rm backend/scripts/limpiar_duplicados_localidades.py
```

---

## 5️⃣ Verificar Cambios

### Después de hacer los cambios, verificar:

1. **Compilación del backend**
   ```bash
   cd backend
   python -m py_compile app/main.py
   ```

2. **Verificar imports**
   ```bash
   python -c "from app.main import app; print('✅ Imports OK')"
   ```

3. **Iniciar backend**
   ```bash
   python main.py
   ```

4. **Verificar endpoints**
   - Acceder a http://localhost:8000/docs
   - Verificar que los endpoints de localidades funcionan
   - Verificar que NO hay endpoints duplicados

---

## 6️⃣ Checklist de Validación

- [ ] main.py actualizado sin errores
- [ ] Archivos de routers eliminados
- [ ] Scripts duplicados eliminados
- [ ] Backend compila sin errores
- [ ] Endpoints de localidades funcionan
- [ ] Importación de GeoJSON funciona
- [ ] Exportación de localidades funciona
- [ ] Búsqueda de localidades funciona
- [ ] Filtros funcionan
- [ ] Paginación funciona
- [ ] Aliases funcionan
- [ ] Centros poblados funcionan
- [ ] Nivel territorial funciona

---

## 📊 Resumen de Cambios

| Acción | Cantidad | Archivos |
|--------|----------|----------|
| Eliminar routers | 2 | importar_geojson.py, localidades_import_geojson.py |
| Eliminar scripts | 6 | importar_*.py, limpiar_*.py |
| Consolidar endpoints | 2 | En localidades_import.py |
| Actualizar main.py | 6 líneas | Eliminar imports y registros |

**Total de líneas eliminadas**: ~500+
**Reducción de complejidad**: ~40%

---

## ⚠️ Notas Importantes

1. **Backup**: Hacer backup antes de eliminar archivos
2. **Testing**: Probar todos los endpoints después de cambios
3. **Git**: Hacer commit de cambios por separado
4. **Documentación**: Actualizar documentación si es necesario

---

## 🚀 Próximos Pasos

1. Ejecutar acciones 1-4
2. Ejecutar verificaciones en paso 5
3. Completar checklist en paso 6
4. Hacer commit a git
5. Hacer push a repositorio

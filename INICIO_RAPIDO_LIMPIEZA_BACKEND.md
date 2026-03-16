# 🚀 Inicio Rápido - Limpieza Backend

## 1️⃣ Actualizar main.py (5 minutos)

### Eliminar 3 importaciones (líneas ~22-24):
```python
# ELIMINAR:
from app.routers.importar_geojson import router as importar_geojson_router
from app.routers.localidades_import_geojson import router as localidades_import_geojson_router
from app.api.endpoints.localidades_geojson import router as localidades_geojson_router
```

### Eliminar 3 registros (líneas ~107-109):
```python
# ELIMINAR:
app.include_router(localidades_import_geojson_router, prefix=settings.API_V1_STR, tags=["Localidades Import"])
app.include_router(importar_geojson_router, prefix=settings.API_V1_STR)
app.include_router(localidades_geojson_router, prefix=settings.API_V1_STR + "/localidades", tags=["Localidades GeoJSON"])
```

---

## 2️⃣ Eliminar Archivos (2 minutos)

### Windows:
```batch
del backend\app\routers\importar_geojson.py
del backend\app\routers\localidades_import_geojson.py
del backend\scripts\importar_localidades_geojson.py
del backend\scripts\importar_localidades_completo.py
del backend\scripts\importar_localidades_puno_completo.py
del backend\scripts\importar_localidades_reales.py
del backend\scripts\limpiar_localidades_duplicadas.py
del backend\scripts\limpiar_duplicados_localidades.py
```

### Linux/Mac:
```bash
rm backend/app/routers/importar_geojson.py
rm backend/app/routers/localidades_import_geojson.py
rm backend/scripts/importar_localidades_geojson.py
rm backend/scripts/importar_localidades_completo.py
rm backend/scripts/importar_localidades_puno_completo.py
rm backend/scripts/importar_localidades_reales.py
rm backend/scripts/limpiar_localidades_duplicadas.py
rm backend/scripts/limpiar_duplicados_localidades.py
```

---

## 3️⃣ Verificar (3 minutos)

### Compilación:
```bash
cd backend
python -m py_compile app/main.py
```

### Iniciar backend:
```bash
python main.py
```

### Verificar en navegador:
```
http://localhost:8000/docs
```

---

## ✅ Checklist Rápido

- [ ] main.py actualizado
- [ ] Archivos eliminados
- [ ] Backend compila sin errores
- [ ] Endpoints funcionan en /docs
- [ ] NO hay endpoints duplicados

---

## 📊 Resultado

```
Antes:  8 routers, 16 scripts
Después: 6 routers, 2 scripts
Reducción: 25% routers, 87% scripts
```

---

## ⏱️ Tiempo Total: ~10 minutos

**Beneficio**: Código más limpio y mantenible

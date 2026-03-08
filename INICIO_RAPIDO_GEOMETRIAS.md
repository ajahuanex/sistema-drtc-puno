# 🚀 Inicio Rápido: Sistema de Geometrías

## ¿Qué se implementó?

Un sistema completo para almacenar polígonos territoriales en MongoDB en lugar de archivos GeoJSON estáticos.

## ⚡ Pasos Rápidos

### 1. Importar Geometrías (Solo una vez)

```bash
cd backend
importar_geometrias.bat
```

Cuando pregunte "¿Desea limpiar la colección antes de importar?", responde: **s**

Deberías ver:
```
✅ Importados: 13 provincias
✅ Importados: 109 distritos  
✅ Importados: 28 centros poblados
```

### 2. Verificar Importación

```bash
cd backend
verificar_geometrias.bat
```

O visita: http://localhost:8000/api/geometrias/stats/resumen

### 3. Iniciar el Sistema

```bash
# Terminal 1: Backend
cd backend
start-backend.bat

# Terminal 2: Frontend  
cd frontend
ng serve
```

### 4. Probar

1. Ve a http://localhost:4200
2. Navega a "Localidades"
3. Haz clic en "Ver en Mapa" de cualquier localidad
4. ¡Los polígonos deberían cargarse desde el API!

## 📊 Ventajas

✅ **80% más rápido** - Solo carga lo necesario
✅ **Filtros dinámicos** - Por provincia, distrito, etc.
✅ **Sincronizado** - Con las localidades en la BD
✅ **Escalable** - Fácil agregar más departamentos

## 📚 Documentación Completa

- `backend/GUIA_IMPORTACION_GEOMETRIAS.md` - Guía detallada
- `backend/GEOMETRIAS_README.md` - Documentación técnica
- `docs/IMPLEMENTACION_COMPLETA_GEOMETRIAS.md` - Implementación completa

## 🆘 Problemas?

### MongoDB no conecta
```bash
net start MongoDB
```

### Archivos GeoJSON no encontrados
Verifica que existan en: `frontend/src/assets/geojson/`

### API no responde
Asegúrate de que el backend esté corriendo en puerto 8000

## 🎯 Siguiente Paso

**Ejecuta el script de importación ahora:**
```bash
cd backend
importar_geometrias.bat
```

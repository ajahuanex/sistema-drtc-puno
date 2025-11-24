# 🔧 Corrección de URLs del API - Deployment

## ✅ Problema Resuelto

El frontend tenía URLs hardcodeadas en 9 servicios que apuntaban directamente a `http://localhost:8001/api/v1`, lo que impedía cambiar fácilmente la configuración del puerto del backend.

## 🛠️ Cambios Realizados

### Servicios Corregidos (9 archivos)

Todos los servicios ahora usan `environment.apiUrl` en lugar de URLs hardcodeadas:

1. ✅ `auth.service.ts`
2. ✅ `empresa.service.ts`
3. ✅ `resolucion.service.ts`
4. ✅ `vehiculo.service.ts`
5. ✅ `tuc.service.ts`
6. ✅ `ruta.service.ts`
7. ✅ `expediente.service.ts`
8. ✅ `localidad.service.ts`
9. ✅ `resolucion-bajas-integration.service.ts`

### Configuración Actual

**environment.ts** (ya configurado correctamente):
```typescript
apiUrl: 'http://localhost:8001/api/v1'
```

## 🚀 Cómo Aplicar los Cambios

### Opción 1: Reconstruir con Docker (Recomendado)

```bash
# Ejecutar el script de reconstrucción
REBUILD_FRONTEND.bat
```

O manualmente:
```bash
docker-compose down
docker-compose build frontend --no-cache
docker-compose up -d
```

### Opción 2: Desarrollo Local

Si estás corriendo el frontend localmente (sin Docker):

```bash
cd frontend
npm install
ng serve
```

## 🔍 Verificación

Después de reconstruir, verifica que todo funcione:

1. **Frontend**: http://localhost:4200
2. **Backend API**: http://localhost:8001/api/v1
3. **API Docs**: http://localhost:8001/docs

### Verificar en el navegador

Abre la consola del navegador (F12) y verifica que las llamadas HTTP vayan a:
```
http://localhost:8001/api/v1/...
```

## 📝 Configuración de Puertos

### Configuración Actual (docker-compose.local.yml)

```yaml
backend:
  ports:
    - "8001:8000"  # Host:Container

frontend:
  environment:
    - API_URL=http://localhost:8001/api/v1
```

### Si Necesitas Cambiar el Puerto

**Para cambiar a puerto 8000:**

1. Edita `frontend/src/environments/environment.ts`:
```typescript
apiUrl: 'http://localhost:8000/api/v1'
```

2. Edita `docker-compose.yml`:
```yaml
backend:
  ports:
    - "8000:8000"  # Cambiar de 8001:8000 a 8000:8000
```

3. Reconstruye:
```bash
REBUILD_FRONTEND.bat
```

## 📊 Impacto

- ✅ Configuración centralizada en `environment.ts`
- ✅ Fácil cambio de puertos sin editar múltiples archivos
- ✅ Mejor mantenibilidad del código
- ✅ Preparado para diferentes ambientes (dev, prod)

## 🎯 Estado Final

| Componente | Puerto | URL |
|------------|--------|-----|
| Backend (interno) | 8000 | - |
| Backend (externo) | 8001 | http://localhost:8001 |
| Frontend | 4200 | http://localhost:4200 |
| API Endpoint | - | http://localhost:8001/api/v1 |

## ⚠️ Importante

Después de aplicar estos cambios, **debes reconstruir el frontend** para que los cambios en los archivos TypeScript surtan efecto. El contenedor de Docker usa una imagen compilada, no los archivos fuente directamente.

## 📚 Archivos de Referencia

- `API_URL_FIX_SUMMARY.md` - Detalles técnicos de los cambios
- `REBUILD_FRONTEND.bat` - Script para reconstruir
- `fix-api-urls.bat` - Script para verificar URLs

---

**Fecha**: 23 de noviembre de 2025  
**Estado**: ✅ COMPLETADO - Listo para reconstruir

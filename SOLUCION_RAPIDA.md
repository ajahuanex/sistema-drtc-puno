# 🔧 Solución Rápida - URLs del API Corregidas

## ¿Qué se hizo?

Corregí **9 servicios** del frontend que tenían URLs hardcodeadas. Ahora todos usan la configuración centralizada de `environment.ts`.

## ¿Qué necesitas hacer ahora?

### Paso 1: Reconstruir el Frontend

Ejecuta este comando:

```bash
REBUILD_FRONTEND.bat
```

O manualmente:

```bash
docker-compose down
docker-compose build frontend --no-cache
docker-compose up -d
```

### Paso 2: Verificar que funcione

Abre tu navegador en:
- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:8001/api/v1/docs

### Paso 3: Verificar en la consola del navegador

1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Verifica que las peticiones vayan a `http://localhost:8001/api/v1`

## Archivos Corregidos

✅ auth.service.ts  
✅ empresa.service.ts  
✅ resolucion.service.ts  
✅ vehiculo.service.ts  
✅ tuc.service.ts  
✅ ruta.service.ts  
✅ expediente.service.ts  
✅ localidad.service.ts  
✅ resolucion-bajas-integration.service.ts  

## Configuración Actual

El frontend está configurado para conectarse a:
```
http://localhost:8001/api/v1
```

Si necesitas cambiar el puerto, edita:
```
frontend/src/environments/environment.ts
```

## Scripts Útiles

- `REBUILD_FRONTEND.bat` - Reconstruye el frontend con los cambios
- `check-deployment-status.bat` - Verifica el estado del deployment
- `fix-api-urls.bat` - Busca URLs hardcodeadas restantes

## ¿Por qué necesito reconstruir?

Docker usa una imagen compilada del frontend. Los cambios en archivos TypeScript no se reflejan hasta que reconstruyas la imagen.

## Listo! 🎉

Después de reconstruir, tu aplicación debería funcionar correctamente con el backend en el puerto 8001.

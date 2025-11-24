# Corrección de URLs del API - Resumen

## Problema Identificado
El frontend tenía URLs hardcodeadas en múltiples servicios apuntando a `http://localhost:8001/api/v1`, lo que causaba problemas al cambiar el puerto del backend.

## Solución Implementada
Se corrigieron todos los servicios para usar `environment.apiUrl` en lugar de URLs hardcodeadas.

## Archivos Corregidos

### ✅ Servicios Actualizados

1. **auth.service.ts**
   - Antes: `private apiUrl = 'http://localhost:8001/api/v1';`
   - Después: `private apiUrl = environment.apiUrl;`

2. **empresa.service.ts**
   - Antes: `private apiUrl = 'http://localhost:8001/api/v1';`
   - Después: `private apiUrl = environment.apiUrl;`

3. **resolucion.service.ts**
   - Antes: `private apiUrl = 'http://localhost:8001/api/v1';`
   - Después: `private apiUrl = environment.apiUrl;`

4. **vehiculo.service.ts**
   - Antes: `private apiUrl = environment.apiUrl + '/api/v1';` (duplicado)
   - Después: `private apiUrl = environment.apiUrl;`

5. **tuc.service.ts**
   - Antes: `private apiUrl = 'http://localhost:8001/api/v1';`
   - Después: `private apiUrl = environment.apiUrl;`

6. **ruta.service.ts**
   - Antes: `private apiUrl = 'http://localhost:8001/api/v1';`
   - Después: `private apiUrl = environment.apiUrl;`

7. **expediente.service.ts**
   - Antes: `private apiUrl = 'http://localhost:8001/api/v1/expedientes';`
   - Después: `private apiUrl = environment.apiUrl + '/expedientes';`

8. **localidad.service.ts**
   - Antes: `private apiUrl = 'http://localhost:8001/api/v1/localidades';`
   - Después: `private apiUrl = environment.apiUrl + '/localidades';`

9. **resolucion-bajas-integration.service.ts**
   - Antes: `private apiUrl = 'http://localhost:8001/api/v1';`
   - Después: `private apiUrl = environment.apiUrl;`

## Configuración de Environment

### environment.ts (Desarrollo)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8001/api/v1',  // ← Cambiar aquí el puerto si es necesario
  useDataManager: true,
  mockData: false,
  features: { ... }
};
```

### environment.prod.ts (Producción)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.drtc-puno.gob.pe',  // ← URL de producción
  useDataManager: false,
  mockData: false,
  features: { ... }
};
```

## Cómo Cambiar el Puerto del Backend

### Opción 1: Modificar environment.ts
Edita `frontend/src/environments/environment.ts` y cambia el puerto:
```typescript
apiUrl: 'http://localhost:8000/api/v1',  // Cambiar 8001 por 8000
```

### Opción 2: Usar Variable de Entorno
En `docker-compose.yml`:
```yaml
frontend:
  environment:
    - API_URL=http://localhost:8000/api/v1
```

## Verificación

Para verificar que todos los servicios usan la configuración correcta:

```bash
# Buscar URLs hardcodeadas restantes (debe estar vacío)
findstr /S /N "localhost:8001" frontend\src\app\services\*.ts
```

## Puertos Actuales

Según la configuración de Docker:

- **Backend (contenedor)**: Puerto 8000 interno
- **Backend (host)**: Puerto 8001 mapeado (8001:8000)
- **Frontend**: Debe apuntar a `http://localhost:8001/api/v1`

## Estado
✅ **COMPLETADO** - Todos los servicios ahora usan `environment.apiUrl`

## Próximos Pasos

1. Verificar que el backend esté corriendo en el puerto correcto
2. Confirmar que `environment.ts` tiene el puerto correcto
3. Reconstruir el frontend si es necesario:
   ```bash
   cd frontend
   npm run build
   ```

## Notas

- Los archivos `.spec.ts` (tests) pueden tener URLs hardcodeadas, esto es normal
- `data-manager-client.service.ts` ya usa `environment.apiUrl` con fallback
- Todos los imports de `environment` fueron agregados donde faltaban

# 🔧 Corrección de URL del Backend

## Problema Detectado
El frontend está intentando conectarse a URLs incorrectas:
- `localhost:8003` (configurado en environment.ts)
- `localhost:8000` (hardcodeado en múltiples servicios)

Pero el backend está corriendo en:
- `localhost:8001`

## Solución Aplicada

### 1. Actualizado environment.ts
```typescript
// ANTES
apiUrl: 'http://localhost:8003'

// DESPUÉS  
apiUrl: 'http://localhost:8001/api/v1'
```

### 2. Servicios que necesitan actualización
Los siguientes servicios tienen URLs hardcodeadas que deben usar `environment.apiUrl`:

- auth.service.ts
- empresa.service.ts
- expediente.service.ts
- localidad.service.ts
- resolucion.service.ts
- ruta.service.ts
- tuc.service.ts
- data-manager-client.service.ts
- resolucion-bajas-integration.service.ts
- Mesa Partes services (documento, derivacion, notificacion, integracion, reporte)

## Solución Temporal
Reinicia el contenedor frontend para que tome los cambios:

```bash
docker-compose -f docker-compose.local.yml restart frontend
```

## Verificación
Espera 1-2 minutos y recarga la página. Los errores de conexión deberían desaparecer.

## Solución Permanente (Recomendada)
Crear un servicio de configuración centralizado que todos los servicios usen.


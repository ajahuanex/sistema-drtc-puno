# Consulta Pública por QR - Mesa de Partes

## Descripción

Sistema de consulta pública que permite a los ciudadanos verificar el estado de sus trámites sin necesidad de autenticación, utilizando el código QR o número de expediente proporcionado en su comprobante de recepción.

## Características

### 1. Consulta Sin Autenticación
- Acceso público sin necesidad de login
- Dos métodos de búsqueda:
  - Por número de expediente
  - Por código QR

### 2. Información Mostrada
- Número de expediente
- Tipo de documento
- Asunto
- Estado actual
- Prioridad
- Fecha de recepción
- Ubicación actual (área)
- Historial completo de movimientos

### 3. Seguridad
- Solo se expone información pública
- No se muestran datos sensibles:
  - Archivos adjuntos
  - Información del usuario que registró
  - Etiquetas internas
  - Observaciones privadas

## Uso

### Desde URL con Parámetros

```typescript
// Consulta por QR
/consulta-publica?qr=QR-CODE-123

// Consulta por expediente
/consulta-publica?expediente=EXP-2025-0001
```

### Desde Código QR

El código QR generado en el comprobante puede incluir una URL que apunte directamente a la consulta:

```
https://sistema.gob.pe/consulta-publica?qr=QR-CODE-123
```

## API Endpoints

### Backend

#### GET /api/v1/public/qr/consultar/{codigo_qr}
Consulta documento por código QR.

**Parámetros:**
- `codigo_qr` (path): Código QR del documento

**Respuesta:**
```json
{
  "success": true,
  "documento": {
    "numero_expediente": "EXP-2025-0001",
    "tipo_documento": "Solicitud",
    "asunto": "Solicitud de información",
    "estado": "EN_PROCESO",
    "prioridad": "NORMAL",
    "fecha_recepcion": "2025-01-08T10:00:00",
    "area_actual": "Área Legal",
    "historial": [
      {
        "area_origen": "Mesa de Partes",
        "area_destino": "Área Legal",
        "fecha_derivacion": "2025-01-08T11:00:00",
        "estado": "RECIBIDO"
      }
    ]
  },
  "mensaje": "Documento encontrado"
}
```

#### GET /api/v1/public/qr/consultar-expediente/{numero_expediente}
Consulta documento por número de expediente.

**Parámetros:**
- `numero_expediente` (path): Número de expediente

**Respuesta:** Igual que el endpoint anterior

## Componentes

### ConsultaPublicaQRComponent

Componente standalone que maneja toda la interfaz de consulta pública.

**Características:**
- Diseño responsive
- Interfaz amigable para ciudadanos
- Timeline visual del historial
- Badges de estado y prioridad
- Búsqueda por Enter key
- Manejo de errores amigable

### QRConsultaService

Servicio que maneja las peticiones HTTP a la API pública.

**Métodos:**
```typescript
consultarPorQR(codigoQR: string): Observable<QRConsultaResponse>
consultarPorExpediente(numeroExpediente: string): Observable<QRConsultaResponse>
```

## Modelos

### DocumentoPublico
```typescript
interface DocumentoPublico {
  numero_expediente: string;
  tipo_documento: string;
  asunto: string;
  estado: string;
  prioridad: string;
  fecha_recepcion: Date;
  area_actual?: string;
  historial: DerivacionPublica[];
}
```

### DerivacionPublica
```typescript
interface DerivacionPublica {
  area_origen: string;
  area_destino: string;
  fecha_derivacion: Date;
  estado: string;
}
```

## Integración con QR Generator

El componente `QRCodeGeneratorComponent` debe generar códigos QR que incluyan:

```typescript
const qrData = {
  url: `${baseUrl}/consulta-publica?qr=${documento.codigo_qr}`,
  expediente: documento.numero_expediente
};
```

## Estilos

El componente utiliza un diseño moderno con:
- Gradiente de fondo atractivo
- Cards con sombras
- Timeline visual para el historial
- Badges de colores para estados
- Diseño responsive para móviles

## Testing

### Unit Tests

```bash
# Frontend
ng test --include='**/consulta-publica-qr.component.spec.ts'
ng test --include='**/qr-consulta.service.spec.ts'

# Backend
pytest backend/app/routers/mesa_partes/test_qr_consulta_router.py
```

### Tests Incluidos

**Frontend:**
- Búsqueda por expediente
- Búsqueda por QR
- Manejo de errores
- Parámetros de URL
- Reset de búsqueda

**Backend:**
- Consulta exitosa por QR
- Consulta exitosa por expediente
- Documento no encontrado
- Historial de derivaciones
- Case-insensitive search
- No exposición de datos sensibles
- Sin autenticación requerida

## Configuración de Rutas

Agregar en el routing de Angular:

```typescript
{
  path: 'consulta-publica',
  component: ConsultaPublicaQRComponent,
  // No requiere guards de autenticación
}
```

## Mejoras Futuras

1. **Escaneo de QR con Cámara**
   - Integrar librería de escaneo QR
   - Permitir escaneo directo desde el navegador

2. **Notificaciones**
   - Permitir suscripción a notificaciones por email
   - Alertas cuando cambie el estado

3. **Compartir**
   - Botón para compartir enlace de consulta
   - Generar PDF del estado actual

4. **Multiidioma**
   - Soporte para múltiples idiomas
   - Especialmente importante para accesibilidad

5. **Estadísticas**
   - Tracking de consultas públicas
   - Métricas de uso

## Requisitos Cumplidos

✅ **Requirement 1.6:** Generación de comprobante con código QR
✅ **Requirement 5.7:** Búsqueda por código QR sin autenticación

## Notas de Implementación

- El endpoint es completamente público (no requiere token)
- La información expuesta es limitada por seguridad
- El código QR debe ser único por documento
- La búsqueda por expediente es case-insensitive
- El historial se ordena por fecha descendente (más reciente primero)

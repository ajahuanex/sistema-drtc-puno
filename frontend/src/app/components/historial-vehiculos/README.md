# Módulo de Historial de Vehículos

Este módulo permite rastrear y gestionar todo el historial de cambios de estado y transferencias entre empresas de los vehículos del sistema.

## Características Principales

### 📊 **Rastreo Completo de Cambios**
- **Transferencias entre empresas**: Registra cuando un vehículo cambia de una empresa a otra
- **Cambios de estado**: Mantiene un historial de todos los cambios de estado del vehículo
- **Asignaciones de ruta**: Rastrea cambios en las rutas asignadas
- **Cambios de resolución**: Registra modificaciones en las resoluciones asociadas
- **Renovaciones de TUC**: Mantiene historial de renovaciones del TUC
- **Inspecciones técnicas**: Registra inspecciones y mantenimientos
- **Sanciones y rehabilitaciones**: Rastrea sanciones y procesos de rehabilitación

### 🔍 **Filtros Avanzados**
- Búsqueda por placa del vehículo
- Filtro por empresa (origen o destino)
- Filtro por tipo de cambio
- Filtro por estado del vehículo
- Filtro por rango de fechas
- Filtro por usuario que realizó el cambio
- Filtro por oficina

### 📈 **Resumen y Estadísticas**
- Total de cambios realizados
- Fecha del último cambio
- Empresa actual del vehículo
- Estado actual
- Resolución vigente
- Ruta asignada actualmente

### 🎨 **Interfaz Visual Intuitiva**
- **Timeline visual**: Muestra el historial en formato de línea de tiempo
- **Códigos de color**: Diferentes colores para cada tipo de cambio
- **Iconos descriptivos**: Iconos específicos para cada tipo de operación
- **Diseño responsive**: Adaptable a diferentes tamaños de pantalla
- **Tema oscuro**: Soporte para modo oscuro

## Componentes

### 1. **HistorialVehiculosComponent**
Componente principal que muestra una lista completa de todos los historiales de vehículos con filtros avanzados.

**Ruta**: `/historial-vehiculos`

**Características**:
- Tabla con paginación y ordenamiento
- Filtros avanzados de búsqueda
- Vista de resumen general
- Acciones para ver detalles y editar

### 2. **HistorialVehiculoDetailComponent**
Componente que muestra el historial detallado de un vehículo específico.

**Ruta**: `/vehiculos/:id/historial`

**Características**:
- Información completa del vehículo
- Timeline visual del historial
- Resumen estadístico
- Opción de exportación

## Tipos de Cambio Soportados

| Tipo de Cambio | Descripción | Color |
|----------------|-------------|-------|
| `TRANSFERENCIA_EMPRESA` | Vehículo cambia de empresa | 🟠 Naranja |
| `CAMBIO_ESTADO` | Modificación del estado del vehículo | 🔵 Azul |
| `ASIGNACION_RUTA` | Asignación de nueva ruta | 🔴 Rojo |
| `REMOCION_RUTA` | Remoción de ruta asignada | 🔴 Rojo |
| `CAMBIO_RESOLUCION` | Cambio en la resolución | 🟣 Púrpura |
| `ACTIVACION` | Activación del vehículo | 🟢 Verde |
| `DESACTIVACION` | Desactivación del vehículo | 🔴 Rojo |
| `RENOVACION_TUC` | Renovación del TUC | 🔵 Azul |
| `MODIFICACION_DATOS` | Cambio en datos técnicos | 🔘 Gris |
| `INSPECCION_TECNICA` | Inspección técnica | 🟠 Naranja |
| `MANTENIMIENTO` | Trabajos de mantenimiento | 🟠 Naranja |
| `SANCION` | Aplicación de sanción | 🔴 Rojo |
| `REHABILITACION` | Proceso de rehabilitación | 🟢 Verde |

## Uso del Servicio

### **HistorialVehiculoService**

El servicio proporciona métodos para:

```typescript
// Obtener historial con filtros
obtenerHistorial(filtros?: FiltroHistorialVehiculo): Observable<HistorialVehiculo[]>

// Obtener historial de un vehículo específico
obtenerHistorialVehiculo(vehiculoId: string): Observable<HistorialVehiculo[]>

// Obtener resumen del historial
obtenerResumenHistorial(vehiculoId: string): Observable<ResumenHistorialVehiculo>

// Registrar cambio de estado
registrarCambioEstado(vehiculoId: string, placa: string, estadoAnterior: string, estadoNuevo: string, motivo: string, observaciones?: string): Observable<HistorialVehiculo>

// Registrar transferencia entre empresas
registrarTransferenciaEmpresa(vehiculoId: string, placa: string, empresaOrigenId: string, empresaDestinoId: string, motivo: string, observaciones?: string): Observable<HistorialVehiculo>

// Registrar asignación de ruta
registrarAsignacionRuta(vehiculoId: string, placa: string, rutaId: string, motivo: string, observaciones?: string): Observable<HistorialVehiculo>
```

## Modelos de Datos

### **HistorialVehiculo**
```typescript
interface HistorialVehiculo {
  id: string;
  vehiculoId: string;
  placa: string;
  fechaCambio: string;
  tipoCambio: TipoCambioVehiculo;
  empresaOrigenId?: string;
  empresaDestinoId?: string;
  empresaOrigenNombre?: string;
  empresaDestinoNombre?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  resolucionId?: string;
  resolucionNumero?: string;
  rutaId?: string;
  rutaNombre?: string;
  motivo?: string;
  observaciones?: string;
  usuarioId: string;
  usuarioNombre: string;
  oficinaId?: string;
  oficinaNombre?: string;
  documentos?: DocumentoHistorial[];
  fechaCreacion: string;
  fechaActualizacion: string;
}
```

### **ResumenHistorialVehiculo**
```typescript
interface ResumenHistorialVehiculo {
  vehiculoId: string;
  placa: string;
  totalCambios: number;
  ultimoCambio: string;
  empresaActual: string;
  estadoActual: string;
  resolucionActual: string;
  rutaActual: string;
  tiposCambio: TipoCambioVehiculo[];
  empresasInvolucradas: string[];
}
```

## Integración con el Sistema

### **Rutas Disponibles**
- `/historial-vehiculos` - Vista general de todos los historiales
- `/vehiculos/:id/historial` - Historial específico de un vehículo

### **Navegación**
El módulo se integra con:
- **Vista de vehículos**: Enlace directo al historial desde el detalle del vehículo
- **Menú principal**: Acceso directo a la vista general de historiales
- **Breadcrumbs**: Navegación contextual

### **Permisos**
- **Lectura**: Todos los usuarios autenticados pueden ver historiales
- **Escritura**: Solo usuarios con permisos específicos pueden crear/modificar historiales
- **Eliminación**: Solo administradores pueden eliminar registros de historial

## Personalización

### **Temas y Colores**
Los colores y estilos se pueden personalizar modificando:
- Variables CSS en los archivos `.scss`
- Configuración del tema de Angular Material
- Paleta de colores para los tipos de cambio

### **Configuración de Filtros**
Los filtros disponibles se pueden configurar:
- Agregando nuevos campos de filtro
- Modificando la lógica de búsqueda
- Personalizando los valores por defecto

### **Exportación**
El módulo incluye funcionalidad de exportación:
- Exportación a PDF
- Exportación a Excel
- Generación de reportes personalizados

## Mantenimiento

### **Limpieza de Datos**
- Los registros de historial se mantienen indefinidamente
- Se recomienda implementar políticas de retención según necesidades legales
- Backup automático de datos históricos

### **Rendimiento**
- Paginación para grandes volúmenes de datos
- Lazy loading de componentes
- Optimización de consultas a la base de datos
- Caché de datos frecuentemente consultados

## Futuras Mejoras

- [ ] **Notificaciones en tiempo real** para cambios críticos
- [ ] **Análisis predictivo** basado en patrones históricos
- [ ] **Integración con GPS** para rastreo en tiempo real
- [ ] **Reportes avanzados** con gráficos y estadísticas
- [ ] **API REST** para integración con sistemas externos
- [ ] **Auditoría completa** de todos los cambios realizados 
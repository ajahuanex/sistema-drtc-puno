# Modelo de Empresa - Versión Definitiva

## 🎯 Estructura Final Simplificada

### Empresa (Entidad Principal)
```typescript
{
  // Identificación
  id: string;                              // UUID único
  ruc: string;                             // RUC (11 dígitos)
  
  // Información Básica
  razonSocial: RazonSocial;               // Nombre de la empresa
  direccionFiscal: string;                // Dirección registrada
  estado: EstadoEmpresa;                  // AUTORIZADA | EN_TRAMITE | SUSPENDIDA | CANCELADA
  tiposServicio: TipoServicio[];          // Servicios que ofrece
  estaActivo: boolean;                    // Activo/Inactivo
  
  // Fechas
  fechaRegistro: Date;                    // Fecha de creación
  fechaActualizacion?: Date;              // Última actualización
  
  // Personas Autorizadas
  personasFacultadas: PersonaFacultada[]; // Personas autorizadas para realizar trámites
  
  // Contacto de la Empresa
  datosContacto: DatosContactoEmpresa;    // Email, teléfonos, dirección de contacto
  sitioWeb?: string;                      // Sitio web
  
  // Documentos y Auditoría
  documentos: DocumentoEmpresa[];          // Documentos de la empresa
  auditoria: AuditoriaEmpresa[];          // Historial de cambios
  historialEventos: EventoHistorialEmpresa[]; // Eventos unificados
  historialEstados: CambioEstadoEmpresa[];    // Cambios de estado
  historialRepresentantes: CambioRepresentanteLegal[]; // Cambios de representante
  
  // Relaciones
  resolucionesPrimigeniasIds: string[];   // IDs de resoluciones
  vehiculosHabilitadosIds: string[];      // IDs de vehículos autorizados
  conductoresHabilitadosIds: string[];    // IDs de conductores autorizados
  rutasAutorizadasIds: string[];          // IDs de rutas autorizadas
  
  // Notas
  observaciones?: string;                 // Observaciones adicionales
}
```

## 📦 Interfaces Principales

### RazonSocial
```typescript
{
  principal: string;    // Nombre principal (requerido)
  sunat?: string;       // Nombre según SUNAT
  minimo?: string;      // Nombre abreviado
}
```

### PersonaFacultada (SIMPLIFICADA)
```typescript
{
  dni: string;          // DNI (requerido)
  nombres: string;      // Nombres (requerido)
  apellidos: string;    // Apellidos (requerido)
  cargo: string;        // Gerente, Administrador, Representante Legal, etc.
  estaActivo: boolean;  // Activo/Inactivo
}
```

### DatosContactoEmpresa
```typescript
{
  emailContacto?: string;           // Email de la empresa
  telefonoContacto?: string[];      // Array de teléfonos (puede tener 2 o 3)
  direccionContacto?: string;       // Dirección de contacto
}
```

### DocumentoEmpresa
```typescript
{
  tipo: TipoDocumento;           // Tipo de documento
  numero: string;                // Número del documento
  fechaEmision: Date;            // Fecha de emisión
  fechaVencimiento?: Date;       // Fecha de vencimiento
  urlDocumento?: string;         // URL del documento
  observaciones?: string;        // Notas
  estaActivo: boolean;           // Activo/Inactivo
}
```

### AuditoriaEmpresa
```typescript
{
  fechaCambio: Date;             // Fecha del cambio
  usuarioId: string;             // Usuario que realizó el cambio
  tipoCambio: string;            // Tipo de cambio
  campoAnterior?: string;        // Valor anterior
  campoNuevo?: string;           // Valor nuevo
  observaciones?: string;        // Notas
}
```

### EventoHistorialEmpresa
```typescript
{
  id?: string;
  fechaEvento: Date;
  usuarioId: string;
  tipoEvento: TipoEventoEmpresa;
  titulo: string;
  descripcion: string;
  datosAnterior?: any;
  datosNuevo?: any;
  requiereDocumento: boolean;
  documentoSustentatorio?: DocumentoSustentatorio;
  motivo?: string;
  observaciones?: string;
  vehiculoId?: string;
  rutaId?: string;
  resolucionId?: string;
  ipUsuario?: string;
  userAgent?: string;
}
```

### CambioEstadoEmpresa
```typescript
{
  fechaCambio: Date;
  usuarioId: string;
  estadoAnterior: EstadoEmpresa;
  estadoNuevo: EstadoEmpresa;
  motivo: string;
  documentoSustentatorio?: DocumentoSustentatorio;
  observaciones?: string;
}
```

### CambioRepresentanteLegal
```typescript
{
  fechaCambio: Date;
  usuarioId: string;
  tipoCambio: TipoCambioRepresentante;
  representanteAnterior: RepresentanteLegal;
  representanteNuevo: RepresentanteLegal;
  motivo: string;
  documentoSustentatorio?: DocumentoSustentatorio;
  observaciones?: string;
}
```

## 🔑 Enumeraciones

### EstadoEmpresa
```
AUTORIZADA    - Empresa autorizada para operar
EN_TRAMITE    - Solicitud en proceso
SUSPENDIDA    - Operaciones suspendidas
CANCELADA     - Empresa cancelada
```

### TipoServicio (8 opciones)
```
PERSONAS              - Transporte de personas
TURISMO              - Servicios turísticos
TRABAJADORES         - Transporte de trabajadores
MERCANCIAS           - Transporte de mercancías
ESTUDIANTES          - Transporte de estudiantes
TERMINAL_TERRESTRE   - Operador de terminal
ESTACION_DE_RUTA     - Estación de ruta
OTROS                - Otros servicios
```

### TipoDocumento
```
RUC                    - Registro Único de Contribuyente
DNI                    - Documento Nacional de Identidad
LICENCIA_CONDUCIR      - Licencia de conducir
CERTIFICADO_VEHICULAR  - Certificado de vehículo
RESOLUCION             - Resolución administrativa
TUC                    - Tarjeta de Circulación
OTRO                   - Otro tipo de documento
```

### TipoEventoEmpresa
```
CAMBIO_REPRESENTANTE_LEGAL
ACTUALIZACION_DATOS_REPRESENTANTE
CAMBIO_RAZON_SOCIAL
CAMBIO_ESTADO
RENOVACION
INCREMENTO
SUSTITUCION
DUPLICADO
BAJA_VEHICULAR
CAMBIO_RUTAS
CANCELACION_RUTAS
AUTORIZACION_RUTAS
CREACION_EMPRESA
ACTUALIZACION_DATOS_GENERALES
```

## 🔄 Operaciones CRUD

### EmpresaCreate
```typescript
{
  ruc: string;                   // Requerido
  razonSocial: RazonSocial;      // Requerido
  direccionFiscal: string;       // Requerido
  personasFacultadas: PersonaFacultada[]; // Requerido
  tiposServicio: TipoServicio[]; // Requerido
  datosContacto?: DatosContactoEmpresa;
  sitioWeb?: string;
  documentos?: DocumentoEmpresa[];
}
```

### EmpresaUpdate
```typescript
{
  ruc?: string;
  razonSocial?: RazonSocial;
  direccionFiscal?: string;
  personasFacultadas?: PersonaFacultada[];
  estado?: EstadoEmpresa;
  tiposServicio?: TipoServicio[];
  datosContacto?: DatosContactoEmpresa;
  sitioWeb?: string;
  documentos?: DocumentoEmpresa[];
  observaciones?: string;
}
```

## 🔍 Filtros y Estadísticas

### EmpresaFiltros
```typescript
{
  ruc?: string;
  razonSocial?: string;
  estado?: EstadoEmpresa;
  fechaDesde?: Date;
  fechaHasta?: Date;
  tieneDocumentosVencidos?: boolean;
  tieneVehiculos?: boolean;
  tieneConductores?: boolean;
}
```

### EmpresaEstadisticas
```typescript
{
  totalEmpresas: number;
  empresasAutorizadas: number;
  empresasEnTramite: number;
  empresasSuspendidas: number;
  empresasCanceladas: number;
  empresasConDocumentosVencidos: number;
  promedioVehiculosPorEmpresa: number;
  promedioConductoresPorEmpresa: number;
}
```

### EmpresaResumen
```typescript
{
  id: string;
  ruc: string;
  razonSocial: string;
  estado: EstadoEmpresa;
  vehiculosCount: number;
  conductoresCount: number;
  documentosVencidosCount: number;
  ultimaActualizacion: Date;
}
```

## 📊 Cambios Finales Realizados

✅ Eliminado: scoreRiesgo (no es negocio)
✅ Eliminado: codigoEmpresa (redundante)
✅ Eliminado: datosSunat de Empresa
✅ Simplificado: PersonaFacultada (solo dni, nombres, apellidos, cargo, estaActivo)
✅ Eliminado: tipoFacultad, fechaVigencia, documentoFacultad (verificación visual)
✅ Convertido: telefonoContacto a array (permite 2-3 teléfonos)
✅ Separado: Datos de empresa vs datos de personas

## 🎯 Resumen Final

- **Interfaces Principales**: 10
- **Enumeraciones**: 4
- **Operaciones CRUD**: 3
- **Campos en Empresa**: 18
- **Enfoque**: Registro integral administrativo
- **Flexibilidad**: Múltiples personas facultadas, múltiples teléfonos
- **Simplicidad**: Eliminados campos innecesarios

---

**Estado**: ✅ DEFINITIVO Y LISTO PARA IMPLEMENTAR
**Fecha**: 21/04/2026
**Objetivo**: Registro integral de empresas de transporte
**Características**: Limpio, simple, escalable

# Modelo de Empresa - Simplificado para Registro Integral

## 🎯 Objetivo
Registro integral de empresas de transporte con enfoque en datos administrativos y operacionales.

## 📋 Estructura Principal

### Empresa (Entidad Central)
```typescript
{
  // Identificación
  id: string;                              // UUID único
  ruc: string;                             // RUC (11 dígitos) - Identificador único
  
  // Información Básica
  razonSocial: RazonSocial;               // Nombre de la empresa
  direccionFiscal: string;                // Dirección registrada
  estado: EstadoEmpresa;                  // AUTORIZADA | EN_TRAMITE | SUSPENDIDA | CANCELADA
  tiposServicio: TipoServicio[];          // Servicios que ofrece
  estaActivo: boolean;                    // Activo/Inactivo
  
  // Fechas
  fechaRegistro: Date;                    // Fecha de creación
  fechaActualizacion?: Date;              // Última actualización
  
  // Contacto
  representanteLegal: RepresentanteLegal;  // Datos del representante
  emailContacto?: string;                  // Email de contacto
  telefonoContacto?: string;               // Teléfono
  sitioWeb?: string;                       // Sitio web
  
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

## 📦 Interfaces Relacionadas

### RazonSocial
```typescript
{
  principal: string;    // Nombre principal (requerido)
  sunat?: string;       // Nombre según SUNAT
  minimo?: string;      // Nombre abreviado
}
```

### RepresentanteLegal
```typescript
{
  dni: string;          // DNI (requerido)
  nombres: string;      // Nombres (requerido)
  apellidos: string;    // Apellidos (requerido)
  email?: string;       // Email
  telefono?: string;    // Teléfono
  direccion?: string;   // Dirección
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

## 🔄 Operaciones CRUD

### Crear Empresa (EmpresaCreate)
```typescript
{
  ruc: string;                   // Requerido
  razonSocial: RazonSocial;      // Requerido
  direccionFiscal: string;       // Requerido
  representanteLegal: RepresentanteLegal; // Requerido
  tiposServicio: TipoServicio[]; // Requerido
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  documentos?: DocumentoEmpresa[];
}
```

### Actualizar Empresa (EmpresaUpdate)
```typescript
{
  ruc?: string;
  razonSocial?: RazonSocial;
  direccionFiscal?: string;
  representanteLegal?: RepresentanteLegal;
  estado?: EstadoEmpresa;
  tiposServicio?: TipoServicio[];
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  documentos?: DocumentoEmpresa[];
  observaciones?: string;
}
```

## 🔍 Filtros (EmpresaFiltros)
```typescript
{
  ruc?: string;                      // Búsqueda por RUC
  razonSocial?: string;              // Búsqueda por razón social
  estado?: EstadoEmpresa;            // Filtro por estado
  fechaDesde?: Date;                 // Rango de fechas
  fechaHasta?: Date;
  tieneDocumentosVencidos?: boolean; // Documentos vencidos
  tieneVehiculos?: boolean;          // Tiene vehículos
  tieneConductores?: boolean;        // Tiene conductores
}
```

## 📊 Estadísticas (EmpresaEstadisticas)
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

## 📝 Resumen (EmpresaResumen)
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

## 🔗 Relaciones

```
Empresa
├── RazonSocial (1:1)
├── RepresentanteLegal (1:1)
├── DocumentoEmpresa[] (1:N)
├── AuditoriaEmpresa[] (1:N)
├── EventoHistorialEmpresa[] (1:N)
├── CambioEstadoEmpresa[] (1:N)
├── CambioRepresentanteLegal[] (1:N)
├── Resolucion[] (1:N) - por resolucionesPrimigeniasIds
├── Vehiculo[] (1:N) - por vehiculosHabilitadosIds
├── Conductor[] (1:N) - por conductoresHabilitadosIds
└── Ruta[] (1:N) - por rutasAutorizadasIds
```

## 📌 Campos por Componente

### Tabla (empresas.component.ts)
- `ruc` - Identificador
- `razonSocial.principal` - Nombre
- `estado` - Estado actual
- `tiposServicio` - Servicios
- `estaActivo` - Activo/Inactivo

### Detalle (empresa-detail.component.ts)
- Información básica: ruc, razonSocial, direccionFiscal, estado
- Representante: dni, nombres, apellidos, email
- Contacto: emailContacto, telefonoContacto, sitioWeb
- Servicios: tiposServicio
- Observaciones: observaciones

### Formulario (empresa-form.component.ts)
- `ruc` - Requerido
- `razonSocial.principal` - Requerido
- `direccionFiscal` - Requerido
- `representanteLegal` - Requerido
- `tiposServicio` - Requerido
- Contacto: emailContacto, telefonoContacto, sitioWeb
- Observaciones: observaciones

## ✅ Validaciones Necesarias

- RUC: 11 dígitos, único
- Email: Formato válido
- Teléfono: Formato válido
- Razón Social: No vacío
- Dirección: No vacío
- Representante: Todos los campos requeridos
- Tipos de Servicio: Al menos uno

## 🎯 Cambios Realizados

✅ Eliminado: scoreRiesgo (no es negocio)
✅ Eliminado: codigoEmpresa (redundante con RUC)
✅ Eliminado: datosSunat (validación externa)
✅ Eliminado: ultimaValidacionSunat
✅ Simplificado: EmpresaEstadisticas
✅ Simplificado: EmpresaFiltros
✅ Simplificado: EmpresaResumen

## 📊 Resumen Final

- **Campos Principales**: 18
- **Interfaces Relacionadas**: 6
- **Enumeraciones**: 3
- **Operaciones CRUD**: 4
- **Relaciones**: 8
- **Enfoque**: Registro integral administrativo

---

**Estado**: ✅ SIMPLIFICADO Y LISTO
**Fecha**: 21/04/2026
**Objetivo**: Registro integral de empresas de transporte

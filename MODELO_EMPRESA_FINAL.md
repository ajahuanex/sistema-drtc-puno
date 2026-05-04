# Modelo de Empresa - Versión Final

## 🎯 Estructura Definitiva

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
  datosContacto: DatosContactoEmpresa;    // Email, teléfono, dirección de contacto
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

## 📦 Interfaces Relacionadas

### RazonSocial
```typescript
{
  principal: string;    // Nombre principal (requerido)
  sunat?: string;       // Nombre según SUNAT
  minimo?: string;      // Nombre abreviado
}
```

### PersonaFacultada
```typescript
{
  dni: string;                            // DNI (requerido)
  nombres: string;                        // Nombres (requerido)
  apellidos: string;                      // Apellidos (requerido)
  cargo: string;                          // Gerente, Administrador, Representante Legal, etc.
  tipoFacultad: string;                   // Representante Legal, Carta Poder, Poder Notarial, etc.
  fechaVigenciaDesde?: Date;              // Fecha desde la cual es válida la facultad
  fechaVigenciaHasta?: Date;              // Fecha hasta la cual es válida la facultad
  documentoFacultad?: string;             // Número de documento que acredita la facultad
  estaActivo: boolean;                    // Activo/Inactivo
}
```

### DatosContactoEmpresa
```typescript
{
  emailContacto?: string;                 // Email de la empresa
  telefonoContacto?: string;              // Teléfono de la empresa
  direccionContacto?: string;             // Dirección de contacto (puede diferir de fiscal)
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
├── PersonaFacultada[] (1:N)
│   ├── dni
│   ├── cargo
│   ├── tipoFacultad
│   └── vigencia
├── DatosContactoEmpresa (1:1)
│   ├── emailContacto
│   ├── telefonoContacto
│   └── direccionContacto
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

## ✅ Validaciones Necesarias

- RUC: 11 dígitos, único
- Razón Social: No vacío
- Dirección Fiscal: No vacío
- Personas Facultadas: Al menos una
- Tipos de Servicio: Al menos uno
- Email: Formato válido (si existe)
- Teléfono: Formato válido (si existe)
- Fecha Vigencia: Desde <= Hasta (si ambas existen)

## 📌 Cambios Realizados

✅ Eliminado: scoreRiesgo (no es negocio)
✅ Eliminado: codigoEmpresa (redundante)
✅ Eliminado: datosSunat de Empresa
✅ Reemplazado: representanteLegal → personasFacultadas[]
✅ Separado: Datos de contacto de la empresa en DatosContactoEmpresa
✅ Simplificado: EmpresaEstadisticas, EmpresaFiltros

## 🎯 Resumen Final

- **Campos Principales**: 18
- **Interfaces Relacionadas**: 7
- **Enumeraciones**: 3
- **Operaciones CRUD**: 4
- **Relaciones**: 10+
- **Enfoque**: Registro integral administrativo
- **Flexibilidad**: Múltiples personas facultadas
- **Separación**: Datos de empresa vs datos de personas

---

**Estado**: ✅ FINAL Y LISTO PARA IMPLEMENTAR
**Fecha**: 21/04/2026
**Objetivo**: Registro integral de empresas de transporte
**Características**: Flexible, escalable, auditable

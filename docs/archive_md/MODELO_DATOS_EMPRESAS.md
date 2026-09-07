# MODELO DE DATOS - EMPRESAS

## 📋 Estructura General

```
Empresa
├── Identificación
│   ├── id: string
│   ├── codigoEmpresa: string
│   └── ruc: string
├── Información Básica
│   ├── razonSocial: RazonSocial
│   ├── direccionFiscal: string
│   ├── estado: EstadoEmpresa
│   ├── tiposServicio: TipoServicio[]
│   └── estaActivo: boolean
├── Representante Legal
│   ├── dni: string
│   ├── nombres: string
│   ├── apellidos: string
│   ├── email?: string
│   ├── telefono?: string
│   └── direccion?: string
├── Contacto
│   ├── emailContacto?: string
│   ├── telefonoContacto?: string
│   └── sitioWeb?: string
├── Documentos
│   └── documentos: DocumentoEmpresa[]
├── Historial
│   ├── historialEventos: EventoHistorialEmpresa[]
│   ├── historialEstados: CambioEstadoEmpresa[]
│   └── historialRepresentantes: CambioRepresentanteLegal[]
├── Relaciones
│   ├── resolucionesPrimigeniasIds: string[]
│   ├── vehiculosHabilitadosIds: string[]
│   ├── conductoresHabilitadosIds: string[]
│   └── rutasAutorizadasIds: string[]
├── Validación
│   ├── datosSunat?: DatosSunat
│   ├── ultimaValidacionSunat?: Date
│   └── scoreRiesgo?: number
└── Auditoría
    ├── auditoria: AuditoriaEmpresa[]
    ├── fechaRegistro: Date
    └── fechaActualizacion?: Date
```

---

## 🔑 Enumeraciones

### EstadoEmpresa
```typescript
enum EstadoEmpresa {
  AUTORIZADO = 'AUTORIZADA',
  SUSPENDIDO = 'SUSPENDIDA',
  CANCELADO = 'CANCELADA',
  EN_TRAMITE = 'EN_TRAMITE'
}
```

### TipoServicio
```typescript
enum TipoServicio {
  PERSONAS = 'PERSONAS',
  TURISMO = 'TURISMO',
  TRABAJADORES = 'TRABAJADORES',
  MERCANCIAS = 'MERCANCIAS',
  ESTUDIANTES = 'ESTUDIANTES',
  TERMINAL_TERRESTRE = 'TERMINAL_TERRESTRE',
  ESTACION_DE_RUTA = 'ESTACION_DE_RUTA',
  OTROS = 'OTROS'
}
```

### TipoEventoEmpresa
```typescript
enum TipoEventoEmpresa {
  // Cambios de datos básicos
  CAMBIO_REPRESENTANTE_LEGAL = 'CAMBIO_REPRESENTANTE_LEGAL',
  ACTUALIZACION_DATOS_REPRESENTANTE = 'ACTUALIZACION_DATOS_REPRESENTANTE',
  CAMBIO_RAZON_SOCIAL = 'CAMBIO_RAZON_SOCIAL',
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
  
  // Operaciones vehiculares
  RENOVACION = 'RENOVACION',
  INCREMENTO = 'INCREMENTO',
  SUSTITUCION = 'SUSTITUCION',
  DUPLICADO = 'DUPLICADO',
  BAJA_VEHICULAR = 'BAJA_VEHICULAR',
  
  // Operaciones de rutas
  CAMBIO_RUTAS = 'CAMBIO_RUTAS',
  CANCELACION_RUTAS = 'CANCELACION_RUTAS',
  AUTORIZACION_RUTAS = 'AUTORIZACION_RUTAS',
  
  // Otros eventos
  CREACION_EMPRESA = 'CREACION_EMPRESA',
  ACTUALIZACION_DATOS_GENERALES = 'ACTUALIZACION_DATOS_GENERALES'
}
```

### TipoDocumento
```typescript
enum TipoDocumento {
  RUC = 'RUC',
  DNI = 'DNI',
  LICENCIA_CONDUCIR = 'LICENCIA_CONDUCIR',
  CERTIFICADO_VEHICULAR = 'CERTIFICADO_VEHICULAR',
  RESOLUCION = 'RESOLUCION',
  TUC = 'TUC',
  OTRO = 'OTRO'
}
```

---

## 📦 Interfaces Principales

### RazonSocial
```typescript
interface RazonSocial {
  principal: string;      // Razón social principal
  sunat?: string;         // Razón social según SUNAT
  minimo?: string;        // Versión abreviada
}
```

### RepresentanteLegal
```typescript
interface RepresentanteLegal {
  dni: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}
```

### DocumentoEmpresa
```typescript
interface DocumentoEmpresa {
  tipo: TipoDocumento;
  numero: string;
  fechaEmision: Date;
  fechaVencimiento?: Date;
  urlDocumento?: string;
  observaciones?: string;
  estaActivo: boolean;
}
```

### EventoHistorialEmpresa
```typescript
interface EventoHistorialEmpresa {
  id?: string;
  fechaEvento: Date;
  usuarioId: string;
  tipoEvento: TipoEventoEmpresa;
  titulo: string;
  descripcion: string;
  datosAnterior?: any;
  datosNuevo?: any;
  requiereDocumento: boolean;
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
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
interface CambioEstadoEmpresa {
  fechaCambio: Date;
  usuarioId: string;
  estadoAnterior: EstadoEmpresa;
  estadoNuevo: EstadoEmpresa;
  motivo: string;
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  observaciones?: string;
}
```

### CambioRepresentanteLegal
```typescript
interface CambioRepresentanteLegal {
  fechaCambio: Date;
  usuarioId: string;
  tipoCambio: TipoCambioRepresentante;
  representanteAnterior: RepresentanteLegal;
  representanteNuevo: RepresentanteLegal;
  motivo: string;
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  observaciones?: string;
}
```

### DatosSunat
```typescript
interface DatosSunat {
  valido: boolean;
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  fechaActualizacion?: Date;
  error?: string;
}
```

### AuditoriaEmpresa
```typescript
interface AuditoriaEmpresa {
  fechaCambio: Date;
  usuarioId: string;
  tipoCambio: string;
  campoAnterior?: string;
  campoNuevo?: string;
  observaciones?: string;
}
```

---

## 📝 Interfaces de Operación

### EmpresaCreate
```typescript
interface EmpresaCreate {
  codigoEmpresa?: string;
  ruc: string;
  razonSocial: RazonSocial;
  direccionFiscal: string;
  representanteLegal: RepresentanteLegal;
  tiposServicio: TipoServicio[];
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  documentos?: DocumentoEmpresa[];
}
```

### EmpresaUpdate
```typescript
interface EmpresaUpdate {
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

### EmpresaCambioEstado
```typescript
interface EmpresaCambioEstado {
  estadoNuevo: EstadoEmpresa;
  motivo: string;
  tipoDocumentoSustentatorio?: TipoDocumento;
  numeroDocumentoSustentatorio?: string;
  esDocumentoFisico?: boolean;
  urlDocumentoSustentatorio?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
  observaciones?: string;
}
```

---

## 📊 Interfaces de Consulta

### EmpresaFiltros
```typescript
interface EmpresaFiltros {
  ruc?: string;
  razonSocial?: string;
  estado?: EstadoEmpresa;
  fechaDesde?: Date;
  fechaHasta?: Date;
  scoreRiesgoMin?: number;
  scoreRiesgoMax?: number;
  tieneDocumentosVencidos?: boolean;
  tieneVehiculos?: boolean;
  tieneConductores?: boolean;
}
```

### EmpresaEstadisticas
```typescript
interface EmpresaEstadisticas {
  totalEmpresas: number;
  empresasAutorizadas: number;
  empresasEnTramite: number;
  empresasSuspendidas: number;
  empresasCanceladas: number;
  empresasDadasDeBaja: number;
  empresasConDocumentosVencidos: number;
  empresasConScoreAltoRiesgo: number;
  promedioVehiculosPorEmpresa: number;
  promedioConductoresPorEmpresa: number;
}
```

### EmpresaReporte
```typescript
interface EmpresaReporte {
  empresa: Empresa;
  documentosVencidos: DocumentoEmpresa[];
  scoreRiesgo: number;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
  recomendaciones: string[];
}
```

### EmpresaResumen
```typescript
interface EmpresaResumen {
  id: string;
  ruc: string;
  razonSocial: string;
  estado: EstadoEmpresa;
  scoreRiesgo: number;
  vehiculosCount: number;
  conductoresCount: number;
  documentosVencidosCount: number;
  ultimaActualizacion: Date;
}
```

---

## 🔗 Relaciones

### Empresa ↔ Vehículos
- **Campo**: `vehiculosHabilitadosIds: string[]`
- **Descripción**: IDs de vehículos habilitados para la empresa
- **Tipo**: One-to-Many

### Empresa ↔ Conductores
- **Campo**: `conductoresHabilitadosIds: string[]`
- **Descripción**: IDs de conductores habilitados para la empresa
- **Tipo**: One-to-Many

### Empresa ↔ Rutas
- **Campo**: `rutasAutorizadasIds: string[]`
- **Descripción**: IDs de rutas autorizadas para la empresa
- **Tipo**: One-to-Many

### Empresa ↔ Resoluciones
- **Campo**: `resolucionesPrimigeniasIds: string[]`
- **Descripción**: IDs de resoluciones primigenias de la empresa
- **Tipo**: One-to-Many

---

## 📈 Validaciones

### RUC
- Formato: 11 dígitos
- Validación: Algoritmo de dígito verificador
- Consulta: SUNAT

### DNI
- Formato: 8 dígitos
- Validación: Algoritmo de dígito verificador
- Consulta: RENIEC

### Razón Social
- Mínimo: 3 caracteres
- Máximo: 200 caracteres
- Requerido: Sí

### Tipos de Servicio
- Mínimo: 1 tipo
- Máximo: 8 tipos
- Requerido: Sí

---

## 🔐 Auditoría

Cada cambio en la empresa se registra en:
- `auditoria`: Cambios de campos específicos
- `historialEventos`: Eventos importantes
- `historialEstados`: Cambios de estado
- `historialRepresentantes`: Cambios de representante

---

## 📌 Notas Importantes

1. **Múltiples Tipos de Servicio**: Una empresa puede ofrecer varios tipos de servicio (ARRAY)
2. **Razón Social Flexible**: Se almacenan 3 versiones (principal, SUNAT, mínima)
3. **Documentación Simplificada**: Se almacena tipo, número, URL y fecha
4. **Score de Riesgo**: Calculado automáticamente basado en documentos vencidos, cambios frecuentes, etc.
5. **Validación SUNAT**: Se consulta y almacenan datos de SUNAT
6. **Historial Completo**: Se mantiene registro de todos los cambios

---

**Última Actualización**: 21 de Abril de 2026
**Versión**: 1.0

# Análisis de Interfaces de Datos - Módulo de Empresas

## 📊 Estructura General

### Backend (Python/Pydantic) vs Frontend (TypeScript)

Las interfaces están **sincronizadas** entre backend y frontend, con algunas diferencias menores en nomenclatura.

---

## 🏢 Entidades Principales

### 1. **Empresa** (Entidad Central)

```typescript
// Frontend
interface Empresa {
  id: string;
  codigoEmpresa: string;  // ⚠️ Solo en frontend
  ruc: string;
  razonSocial: RazonSocial;
  direccionFiscal: string;
  estado: EstadoEmpresa;
  tiposServicio: TipoServicio[];
  estaActivo: boolean;
  fechaRegistro: Date;
  fechaActualizacion?: Date;
  representanteLegal: RepresentanteLegal;
  emailContacto?: string;
  telefonoContacto?: string;
  sitioWeb?: string;
  documentos: DocumentoEmpresa[];
  auditoria: AuditoriaEmpresa[];
  historialEventos: EventoHistorialEmpresa[];
  historialEstados: CambioEstadoEmpresa[];
  historialRepresentantes: CambioRepresentanteLegal[];
  resolucionesPrimigeniasIds: string[];
  vehiculosHabilitadosIds: string[];
  conductoresHabilitadosIds: string[];
  rutasAutorizadasIds: string[];
  datosSunat?: DatosSunat;
  ultimaValidacionSunat?: Date;
  scoreRiesgo?: number;
  observaciones?: string;
}
```

**Campos Clave:**
- `ruc`: Identificador único (11 dígitos)
- `estado`: AUTORIZADA | EN_TRAMITE | SUSPENDIDA | CANCELADA | DADA_DE_BAJA
- `tiposServicio`: Array de tipos de servicio que ofrece
- `vehiculosHabilitadosIds`: IDs de vehículos autorizados
- `rutasAutorizadasIds`: IDs de rutas autorizadas

---

### 2. **RazonSocial** (Datos de Identificación)

```typescript
interface RazonSocial {
  principal: string;      // Nombre principal
  sunat?: string;         // Nombre según SUNAT
  minimo?: string;        // Nombre mínimo/abreviado
}
```

---

### 3. **RepresentanteLegal** (Contacto Principal)

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

---

### 4. **DocumentoSustentatorio** (Reutilizable)

```typescript
interface DocumentoSustentatorio {
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  esDocumentoFisico?: boolean;
  urlDocumento?: string;
  fechaDocumento?: Date;
  entidadEmisora?: string;
}
```

**Uso:** Se reutiliza en múltiples contextos (cambios de representante, cambios de estado, etc.)

---

### 5. **DocumentoEmpresa** (Documentos de la Empresa)

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

---

## 📋 Historial y Auditoría

### 6. **EventoHistorialEmpresa** (Evento Unificado)

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

**Tipos de Eventos:**
- Cambios de datos: CAMBIO_REPRESENTANTE_LEGAL, CAMBIO_RAZON_SOCIAL, CAMBIO_ESTADO
- Operaciones vehiculares: RENOVACION, INCREMENTO, SUSTITUCION, BAJA_VEHICULAR
- Operaciones de rutas: CAMBIO_RUTAS, CANCELACION_RUTAS, AUTORIZACION_RUTAS
- Otros: CREACION_EMPRESA, ACTUALIZACION_DATOS_GENERALES

---

### 7. **CambioEstadoEmpresa** (Historial de Estados)

```typescript
interface CambioEstadoEmpresa {
  fechaCambio: Date;
  usuarioId: string;
  estadoAnterior: EstadoEmpresa;
  estadoNuevo: EstadoEmpresa;
  motivo: string;
  documentoSustentatorio?: DocumentoSustentatorio;
  observaciones?: string;
}
```

---

### 8. **CambioRepresentanteLegal** (Historial de Representantes)

```typescript
interface CambioRepresentanteLegal {
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

---

### 9. **AuditoriaEmpresa** (Auditoría General)

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

## 🔄 Operaciones

### 10. **EmpresaCambioRepresentante** (Solicitud de Cambio)

```typescript
interface EmpresaCambioRepresentante {
  tipoCambio: TipoCambioRepresentante;
  representanteNuevo: RepresentanteLegal;
  motivo: string;
  documentoSustentatorio?: DocumentoSustentatorio;
  observaciones?: string;
}
```

---

### 11. **EmpresaCambioEstado** (Solicitud de Cambio de Estado)

```typescript
interface EmpresaCambioEstado {
  estadoNuevo: EstadoEmpresa;
  motivo: string;
  documentoSustentatorio?: DocumentoSustentatorio;
  observaciones?: string;
}
```

---

### 12. **EmpresaOperacionVehicular** (Operaciones con Vehículos)

```typescript
interface EmpresaOperacionVehicular {
  tipoOperacion: TipoEventoEmpresa;
  vehiculoId?: string;
  vehiculosIds?: string[];
  motivo: string;
  documentoSustentatorio?: DocumentoSustentatorio;
  observaciones?: string;
  datosAdicionales?: any;
}
```

---

### 13. **EmpresaOperacionRutas** (Operaciones con Rutas)

```typescript
interface EmpresaOperacionRutas {
  tipoOperacion: TipoEventoEmpresa;
  rutaId?: string;
  rutasIds?: string[];
  motivo: string;
  documentoSustentatorio?: DocumentoSustentatorio;
  observaciones?: string;
  datosAdicionales?: any;
}
```

---

## 📊 Reportes y Estadísticas

### 14. **EmpresaEstadisticas** (Estadísticas Generales)

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

---

### 15. **EmpresaReporte** (Reporte Detallado)

```typescript
interface EmpresaReporte {
  empresa: Empresa;
  documentosVencidos: DocumentoEmpresa[];
  scoreRiesgo: number;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
  recomendaciones: string[];
}
```

---

### 16. **EmpresaResumen** (Resumen Ejecutivo)

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

## 🔐 Validación Externa

### 17. **ValidacionSunat** (Validación SUNAT)

```typescript
interface ValidacionSunat {
  ruc: string;
  valido: boolean;
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  fechaConsulta: Date;
  error?: string;
}
```

---

### 18. **ValidacionDni** (Validación DNI)

```typescript
interface ValidacionDni {
  dni: string;
  valido: boolean;
  nombres?: string;
  apellidos?: string;
  fechaNacimiento?: string;
  estado?: string;
  fechaConsulta: Date;
  error?: string;
}
```

---

## 📝 Enumeraciones

### Estados de Empresa
```typescript
enum EstadoEmpresa {
  AUTORIZADA = 'AUTORIZADA',
  EN_TRAMITE = 'EN_TRAMITE',
  SUSPENDIDA = 'SUSPENDIDA',
  CANCELADA = 'CANCELADA',
  DADA_DE_BAJA = 'DADA_DE_BAJA'
}
```

### Tipos de Servicio
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

### Tipos de Documento
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

## 🔍 Diferencias Backend vs Frontend

| Aspecto | Backend (Python) | Frontend (TypeScript) |
|--------|------------------|----------------------|
| **Tipo de Dato** | Pydantic BaseModel | TypeScript Interface |
| `codigoEmpresa` | ❌ No existe | ✅ Presente |
| Validación | Automática (Pydantic) | Manual (validadores) |
| Valores por defecto | Field(default_factory=...) | Inicialización manual |
| Documentación | Field(description=...) | Comentarios JSDoc |

---

## 📌 Notas Importantes

1. **DocumentoSustentatorio es reutilizable**: Se usa en múltiples contextos para evitar duplicación
2. **EventoHistorialEmpresa es unificado**: Reemplaza múltiples tipos de eventos específicos
3. **Historial múltiple**: Se mantienen `historialEventos`, `historialEstados` y `historialRepresentantes` para compatibilidad
4. **IDs de relaciones**: Se almacenan como arrays de strings (vehiculosHabilitadosIds, rutasAutorizadasIds, etc.)
5. **Validación SUNAT**: Se almacenan datos de validación con timestamp

---

## 🎯 Recomendaciones

1. ✅ **Interfaces bien estructuradas** - Buena separación de responsabilidades
2. ✅ **Reutilización de componentes** - DocumentoSustentatorio es un buen ejemplo
3. ⚠️ **Considerar eliminar `codigoEmpresa`** del frontend si no se usa
4. ⚠️ **Simplificar historial** - Considerar usar solo `historialEventos` en futuras versiones
5. ✅ **Validación externa integrada** - SUNAT y DNI bien modelados

---

**Fecha**: 21/04/2026
**Estado**: ✅ Sincronizado Backend-Frontend

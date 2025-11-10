# Sistema DRTC Puno - Frontend

Frontend Angular 20+ para el Sistema de Gestión de la Dirección Regional de Transportes y Comunicaciones Puno.

## 🚀 Características

- **Angular 20+**: Framework moderno con componentes standalone
- **Angular Material**: Componentes de UI Material Design
- **Angular Signals**: Gestión de estado reactivo
- **Formularios Reactivos**: Control avanzado de formularios
- **Lazy Loading**: Carga diferida de módulos para optimización
- **Responsive Design**: Diseño adaptable a dispositivos móviles
- **TypeScript**: Tipado estático para mayor robustez

## 📊 Estado del Proyecto

### ✅ Completado
- **Modelo de expediente expandido**: Sistema universal para cualquier trámite
- **Numeración automática**: Formato E-XXXX-YYYY con padding automático
- **Descripción automática**: Generada según tipo de trámite
- **Componentes de modal**: Crear expediente y resolución con validaciones
- **Tabla de expedientes**: Material Design con funcionalidades avanzadas
- **Validaciones simplificadas**: Sin errores innecesarios, campos opcionales

### 🔄 En Progreso
- **Integración de tipos**: Campo `tipoExpediente` en el modal
- **Validaciones condicionales**: Según `tipoSolicitante`
- **Lógica de descripción**: Por `tipoExpediente` específico

### 🚀 Pendiente
- **Componentes de solicitantes**: Para diferentes tipos de solicitantes
- **Integración con backend**: Conectar con la API real
- **Flujo de oficinas**: Implementar movimiento entre oficinas
- **Documentos resultantes**: Generar diferentes tipos según expediente

### 🎯 Próximos Pasos
1. Completar la implementación del campo `tipoExpediente`
2. Implementar validaciones condicionales según solicitante
3. Crear componentes para diferentes tipos de solicitantes
4. Integrar con el sistema de oficinas
5. Conectar con el backend

## 📋 Requisitos

- Node.js 18+
- npm o yarn
- Angular CLI 20+

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
cd frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo environment.ts si es necesario
# Configurar URLs del backend
```

## 🚀 Ejecución

### Desarrollo
```bash
ng serve
```

La aplicación estará disponible en `http://localhost:4200/`

### Producción
```bash
ng build --configuration production
```

## 🏗️ Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Componente principal de la aplicación
│   │   ├── app.config.ts             # Configuración de la aplicación
│   │   ├── app.routes.ts             # Configuración de rutas
│   │   ├── app.html                  # Template principal
│   │   ├── app.scss                  # Estilos globales
│   │   ├── components/               # Componentes de la aplicación
│   │   │   ├── ayuda/                # Componente de ayuda
│   │   │   ├── cambiar-contrasena/   # Cambio de contraseña
│   │   │   ├── conductores/          # Gestión de conductores
│   │   │   ├── configuracion/        # Configuración del sistema
│   │   │   ├── dashboard/            # Panel principal
│   │   │   ├── empresas/             # Gestión de empresas
│   │   │   ├── expedientes/          # Gestión de expedientes
│   │   │   ├── fiscalizaciones/      # Actividades de fiscalización
│   │   │   ├── layout/               # Componentes de layout
│   │   │   ├── login/                # Autenticación
│   │   │   ├── notificaciones/       # Sistema de notificaciones
│   │   │   ├── perfil/               # Perfil de usuario
│   │   │   ├── reportes/             # Generación de reportes
│   │   │   ├── resoluciones/         # Gestión de resoluciones
│   │   │   ├── rutas/                # Gestión de rutas
│   │   │   ├── tucs/                 # Gestión de TUCs
│   │   │   └── vehiculos/            # Gestión de vehículos
│   │   ├── guards/                   # Guards de autenticación
│   │   ├── interceptors/             # Interceptores HTTP
│   │   ├── models/                   # Modelos de datos
│   │   └── services/                 # Servicios de la aplicación
│   ├── assets/                       # Recursos estáticos
│   ├── styles.scss                   # Estilos globales
│   └── main.ts                       # Punto de entrada
├── angular.json                       # Configuración de Angular
├── package.json                       # Dependencias del proyecto
└── tsconfig.json                      # Configuración de TypeScript
```

## 🗃️ Modelos de Datos

### 🔐 Usuario
- **Propósito**: Gestión de usuarios del sistema
- **Campos clave**: `id`, `username`, `email`, `rol`, `estaActivo`, `fechaRegistro`
- **Roles**: ADMIN, FUNCIONARIO, SUPERVISOR, DIRECTOR

### 🏢 Empresa
- **Propósito**: Empresas de transporte autorizadas
- **Campos clave**: `ruc`, `razonSocial`, `estado`, `datosSunat`, `scoreRiesgo`
- **Relaciones**: Vehículos, conductores, rutas, resoluciones

### 🚗 Vehículo
- **Propósito**: Vehículos autorizados para transporte
- **Campos clave**: `placa`, `marca`, `modelo`, `capacidad`, `estado`
- **Relaciones**: Empresa propietaria, TUCs, rutas autorizadas

### 👨‍💼 Conductor
- **Propósito**: Conductores autorizados
- **Campos clave**: `dni`, `nombres`, `apellidos`, `licencia`, `estado`
- **Relaciones**: Empresa, vehículos asignados

### 🛣️ Ruta
- **Propósito**: Rutas autorizadas para el transporte
- **Campos clave**: `codigoRuta`, `origen`, `destino`, `distancia`, `tipoServicio`
- **Relaciones**: Empresas autorizadas, vehículos habilitados

### 📋 TUC (Tarjeta Única de Circulación)
- **Propósito**: Documento oficial de autorización
- **Campos clave**: `numeroTuc`, `fechaEmision`, `fechaVencimiento`, `estado`
- **Relaciones**: Vehículo, empresa, rutas autorizadas

### 📄 Resolución
- **Propósito**: Documento administrativo de autorización
- **Campos clave**: `nroResolucion`, `fechaEmision`, `tipoTramite`, `estado`
- **Relaciones**: Empresa, expediente, vehículos autorizados

### 📁 Expediente
- **Propósito**: **CENTRO DEL SISTEMA** - Inicio de todo acto administrativo
- **Formato**: `E-XXXX-YYYY` (E-Número-Año)
- **Campos clave**: `nroExpediente`, `fechaEmision`, `tipoTramite`, `estado`, `tipoExpediente`, `tipoSolicitante`
- **🆕 Nuevo**: Sistema universal para cualquier tipo de trámite administrativo
- **🆕 Nuevo**: Seguimiento por oficina con trazabilidad completa

### 🏢 Oficina
- **Propósito**: Gestión de oficinas del sistema
- **Campos clave**: `nombre`, `codigo`, `ubicacion`, `tipoOficina`, `responsable`
- **🆕 Nuevo**: Modelo reutilizable para seguimiento de expedientes

## 🆕 Sistema Universal de Expedientes

### 🎯 Concepto Clave
**El expediente ES el inicio de todo acto administrativo** - no solo para empresas de transporte, sino para cualquier solicitud administrativa del DRTC Puno.

### 🔢 Numeración Automática
- **Formato**: `E-XXXX-YYYY` donde XXXX se rellena automáticamente con ceros
- **Ejemplos**: 
  - `1` → `E-0001-2025`
  - `25` → `E-0025-2025`
  - `1234` → `E-1234-2025`
- **Unicidad por año**: E-0001-2025 ≠ E-0001-2026

### 🏷️ Tipos de Expedientes
```typescript
enum TipoExpediente {
  // Transporte
  AUTORIZACION_TRANSPORTE, RENOVACION_TRANSPORTE, 
  INCREMENTO_FLOTA, SUSTITUCION_VEHICULOS,
  
  // Información y Documentación
  SOLICITUD_INFORMACION, COPIA_DOCUMENTO, 
  CERTIFICADO, CONSTANCIA,
  
  // Administrativos
  SOLICITUD_ADMINISTRATIVA, RECLAMO, 
  SUGERENCIA, CONSULTA,
  
  // Fiscalización
  DENUNCIA, INSPECCION, AUDITORIA,
  
  // General
  OTROS = 'OTROS'  // Para cualquier trámite no específico
}
```

### 👥 Tipos de Solicitantes
```typescript
enum TipoSolicitante {
  EMPRESA,           // Para expedientes de transporte
  PERSONA_NATURAL,   // Ciudadanos particulares
  FUNCIONARIO,       // Personal interno del DRTC
  ORGANIZACION,      // ONGs, instituciones
  OTROS              // Para cualquier otro tipo
}
```

### 📄 Documentos Resultantes
```typescript
enum TipoDocumentoResultado {
  RESOLUCION,        // Para expedientes empresariales
  CONSTANCIA,        // Para solicitudes de información
  CERTIFICADO,       // Para copias de documentos
  INFORME,          // Para auditorías, inspecciones
  ACTA,             // Para reuniones, decisiones
  DECISION,         // Para decisiones administrativas
  NOTIFICACION,     // Para notificaciones oficiales
  OTROS             // Para cualquier otro documento
}
```

### 🔄 Flujos del Sistema

#### **Flujo Empresarial** 🚌
```
Expediente (E-0001-2025) 
  ↓ [Solicita empresa]
Empresa (Transportes ABC)
  ↓ [Genera]
Resolución (R-0001-2025)
  ↓ [Autoriza]
TUCs + Vehículos + Rutas
```

#### **Flujo de Información** 📋
```
Expediente (E-0002-2025)
  ↓ [Solicita ciudadano]
Persona Natural (Juan Pérez)
  ↓ [Genera]
Constancia (C-0001-2025)
  ↓ [Certifica]
Información solicitada
```

#### **Flujo de Copias** 📄
```
Expediente (E-0003-2025)
  ↓ [Solicita funcionario]
Funcionario (María López)
  ↓ [Genera]
Certificado (C-0002-2025)
  ↓ [Certifica]
Copia del documento
```

### 🤖 Funcionalidades Automáticas

#### **1. Descripción Automática**
- Se genera según el tipo de trámite
- **PRIMIGENIA**: "SOLICITUD DE AUTORIZACIÓN PRIMIGENIA PARA OPERAR TRANSPORTE..."
- **OTROS**: "SOLICITUD ADMINISTRATIVA GENERAL - TRÁMITE DIVERSO"

#### **2. Numeración Reactiva**
- Hint del input se actualiza en tiempo real
- Muestra el formato completo mientras escribes
- Validación automática de unicidad

#### **3. Validaciones Inteligentes**
- Solo se requiere `empresaId` o `solicitanteId` según el tipo
- Campo descripción opcional (se genera automáticamente)
- Sin errores de validación innecesarios

## 🆕 Nueva Funcionalidad: Seguimiento de Expedientes por Oficina

### Propósito
Implementar trazabilidad completa de expedientes permitiendo conocer:
- **Dónde se encuentra** físicamente el expediente
- **Quién es el responsable** en cada oficina
- **Cuánto tiempo** permanecerá en cada oficina
- **Historial completo** de movimientos entre oficinas

### Campos Agregados al Expediente
```typescript
// Campos para seguimiento por oficina
oficinaActual?: OficinaExpediente;        // Oficina actual
historialOficinas?: HistorialOficina[];   // Historial de movimientos
tiempoEstimadoOficina?: number;           // Tiempo estimado en días
fechaLlegadaOficina?: Date;               // Fecha de llegada
proximaRevision?: Date;                   // Próxima revisión
urgencia?: NivelUrgencia;                 // Nivel de urgencia
```

### Tipos de Oficina
1. **RECEPCIÓN** → Recepción y validación inicial
2. **REVISION_TECNICA** → Análisis técnico
3. **LEGAL** → Verificación normativa
4. **FINANCIERA** → Verificación de pagos
5. **APROBACION** → Decisión final
6. **FISCALIZACION** → Control posterior
7. **ARCHIVO** → Almacenamiento final

### Niveles de Urgencia
- **NORMAL** → Procesamiento estándar
- **URGENTE** → Atención prioritaria
- **MUY_URGENTE** → Atención inmediata
- **CRITICO** → Máxima prioridad

## 🧩 Componentes Implementados

### 📁 Expedientes
- **ExpedientesComponent**: Tabla avanzada con Material Design
  - Ordenamiento por columna
  - Paginación
  - Filtros avanzados
  - Columnas configurables
  - Datos mock con formato correcto

- **CrearExpedienteModalComponent**: Modal reutilizable para crear expedientes
  - Numeración automática reactiva
  - Descripción automática según tipo de trámite
  - Campo descripción de solo lectura
  - Validaciones simplificadas

### 📋 Resoluciones
- **CrearResolucionModalComponent**: Modal para crear resoluciones
  - Numeración automática con formato R-XXXX-YYYY
  - Integración con expedientes
  - Hint reactivo que se actualiza en tiempo real
  - **🆕 Integrado con EmpresaSelectorComponent mejorado**

### 🏢 Empresas
- **EmpresaVehiculosBatchComponent**: Gestión de vehículos por empresa
- **AgregarVehiculosModalComponent**: Modal para agregar vehículos
- **ValidacionSunatModalComponent**: Validación con SUNAT
- **🆕 EmpresaDetailComponent**: Vista detallada con CodigoEmpresaInfoComponent integrado

### 🚗 Vehículos
- **VehiculoFormComponent**: Formulario completo de vehículos
- **VehiculoDetailComponent**: Vista detallada de vehículos
- **VehiculoModalComponent**: Modal para gestión de vehículos

### 🛣️ Rutas
- **RutaFormComponent**: Formulario de rutas
- **RutaDetailComponent**: Vista detallada de rutas
- **AgregarRutaModalComponent**: Modal para agregar rutas

## 🆕 Componentes Integrados Recientemente

### 🏢 CodigoEmpresaInfoComponent
**Ubicación**: `src/app/components/shared/codigo-empresa-info.component.ts`
**Integrado en**: `EmpresaDetailComponent`

Componente visual para mostrar información detallada del código de empresa con formato `XXXXYYY`.

**Características:**
- **Visualización dividida**: Muestra el código separado en número (4 dígitos) y letras (3 letras)
- **Chips de colores**: Cada tipo de empresa tiene su color distintivo
  - 🟦 **P** (Personas) - Azul
  - 🟩 **R** (Regional) - Verde  
  - 🟨 **T** (Turismo) - Amarillo
- **Información del formato**: Muestra ejemplos y explicación del formato
- **Estado sin código**: Maneja empresas que no tienen código asignado
- **Responsive**: Se adapta a diferentes tamaños de pantalla

**Props:**
```typescript
@Input() codigoEmpresa: Signal<string> // Código de empresa reactivo
```

**Ejemplo de uso:**
```html
<app-codigo-empresa-info 
  [codigoEmpresa]="signal(empresa?.codigoEmpresa || '')">
</app-codigo-empresa-info>
```

### 🎯 SmartIconComponent
**Ubicación**: `src/app/shared/smart-icon.component.ts`
**Servicio**: `src/app/services/icon.service.ts`
**Integrado en**: Componentes principales (MainLayout, Dashboard, etc.)

Sistema inteligente de iconos con fallbacks automáticos cuando Material Icons no se carga.

**Características:**
- **Detección automática**: Verifica si Material Icons están disponibles
- **Fallback inteligente**: Usa emojis cuando Material Icons fallan
- **Tooltips automáticos**: Descripción automática del icono
- **Estados interactivos**: Clickable, disabled, hover effects
- **Tamaños predefinidos**: small (18px), normal (24px), large (32px), xl (48px)
- **80+ iconos mapeados**: Cobertura completa de iconos comunes

**Props:**
```typescript
@Input() iconName: string = ''        // Nombre del icono de Material Icons
@Input() size: number = 24            // Tamaño en píxeles
@Input() tooltipText: string = ''     // Texto del tooltip (opcional)
@Input() clickable: boolean = false   // Si es clickeable
@Input() disabled: boolean = false    // Si está deshabilitado
```

**Ejemplo de uso:**
```html
<app-smart-icon 
  [iconName]="'business'"
  [size]="32"
  [tooltipText]="'Información de empresa'"
  [clickable]="true">
</app-smart-icon>
```

### 🔧 IconService
**Ubicación**: `src/app/services/icon.service.ts`
**Configurado en**: `app.config.ts` como provider global

Servicio que gestiona la detección y fallbacks de iconos.

**API Principal:**
```typescript
// Signals reactivos
readonly materialIconsLoaded: Signal<boolean>

// Métodos principales
getIcon(iconName: string): string              // Obtiene icono o fallback
getIconText(iconName: string): string          // Obtiene descripción
getIconInfo(iconName: string): IconFallback    // Obtiene info completa
hasFallback(iconName: string): boolean         // Verifica si tiene fallback

// Gestión de fallbacks
addFallback(iconName: string, fallback: IconFallback): void
removeFallback(iconName: string): boolean
getAllFallbacks(): IconFallback[]

// Utilidades
forceReload(): void                            // Fuerza recarga de detección
getIconStatus(): IconStatus                    // Estado del servicio
```

### 🔍 EmpresaSelectorComponent (Mejorado)
**Ubicación**: `src/app/shared/empresa-selector.component.ts`
**Integrado en**: `CrearResolucionModalComponent`

Selector de empresas con búsqueda avanzada y autocompletado.

**Mejoras implementadas:**
- **Búsqueda múltiple**: Por RUC, razón social o código de empresa
- **Autocompletado en tiempo real**: Filtrado mientras se escribe
- **UX mejorada**: Loading states, mensajes de error, indicadores
- **Integración con formularios reactivos**: Compatible con Angular Forms
- **Performance optimizada**: Filtrado eficiente sin bloquear UI

**Props:**
```typescript
@Input() label: string = 'Empresa'
@Input() placeholder: string = 'Buscar empresa...'
@Input() hint: string = 'Selecciona una empresa'
@Input() required: boolean = false
@Input() empresaId: string = ''
@Input() disabled: boolean = false

@Output() empresaSeleccionada = new EventEmitter<Empresa | null>()
@Output() empresaIdChange = new EventEmitter<string>()
```

**Ejemplo de uso en modal de resolución:**
```html
<app-empresa-selector
  [label]="'EMPRESA'"
  [placeholder]="'Buscar por RUC, razón social o código'"
  [hint]="'Seleccione la empresa para la cual se creará la resolución'"
  [required]="true"
  [empresaId]="resolucionForm.get('empresaId')?.value"
  (empresaSeleccionada)="onEmpresaSeleccionadaBuscador($event)"
  (empresaIdChange)="resolucionForm.patchValue({ empresaId: $event })">
</app-empresa-selector>
```

### ⚙️ FlujoTrabajoService (Preparado)
**Ubicación**: `src/app/services/flujo-trabajo.service.ts`
**Estado**: Preparado para uso futuro, no integrado activamente
**Documentación**: `src/app/services/flujo-trabajo-service.README.md`

Servicio completo para gestión de flujos de trabajo de expedientes entre oficinas.

**Características preparadas:**
- **Gestión de flujos**: Crear, actualizar, consultar flujos de trabajo
- **Movimientos de expedientes**: Transferencia entre oficinas con trazabilidad
- **Estados de flujo**: Seguimiento completo del estado de expedientes
- **Notificaciones**: Sistema de alertas automáticas
- **Reportes**: Métricas y análisis de flujos
- **Validaciones**: Control de permisos y reglas de negocio

**API Principal:**
```typescript
// Flujos de Trabajo
getFlujos(filtros?: FlujoFiltros): Observable<FlujoTrabajo[]>
getFlujoById(id: string): Observable<FlujoTrabajo>
crearFlujo(flujo: Omit<FlujoTrabajo, 'id'>): Observable<FlujoTrabajo>
actualizarFlujo(id: string, flujo: Partial<FlujoTrabajo>): Observable<FlujoTrabajo>

// Movimientos
moverExpediente(movimiento: MovimientoExpediente): Observable<MovimientoExpediente>
getMovimientos(expedienteId?: string): Observable<MovimientoExpediente[]>

// Estados
getEstadoFlujo(expedienteId: string): Observable<EstadoFlujo>
actualizarEstado(expedienteId: string, estado: Partial<EstadoFlujo>): Observable<EstadoFlujo>

// Reportes
getReporteFlujo(flujoId: string, fechaDesde: Date, fechaHasta: Date): Observable<any>
getDashboardFlujos(): Observable<any>
```

**Preparación para integración futura:**
- Servicio configurado como `providedIn: 'root'`
- Estructura de datos completa y documentada
- Métodos HTTP configurados con environment.apiUrl
- Ejemplos de uso documentados
- Listo para inyectar en componentes de expedientes

### 📦 Shared Components Export
**Ubicación**: `src/app/shared/index.ts`

Archivo de exportación centralizado para facilitar imports de componentes compartidos.

**Componentes exportados:**
```typescript
export * from './ruta-form-shared.component';
export * from './mat-confirm-dialog.component';
export * from './smart-icon.component';                    // 🆕 Agregado
export * from './empresa-selector.component';
export * from './resolucion-number-validator.component';
export * from './expediente-number-validator.component';
export * from '../components/shared/codigo-empresa-info.component';  // 🆕 Agregado
export * from '../components/vehiculos/vehiculos-resolucion-modal.component';
export * from '../services/vehiculo-modal.service';
```

**Beneficios:**
- **Imports simplificados**: Un solo import para múltiples componentes
- **Mejor organización**: Centralización de exportaciones
- **Mantenimiento fácil**: Un solo lugar para gestionar exports
- **Tree shaking**: Optimización automática de bundle

**Uso:**
```typescript
// Antes (múltiples imports)
import { SmartIconComponent } from '../../shared/smart-icon.component';
import { EmpresaSelectorComponent } from '../../shared/empresa-selector.component';
import { CodigoEmpresaInfoComponent } from '../../shared/codigo-empresa-info.component';

// Después (import unificado)
import { 
  SmartIconComponent, 
  EmpresaSelectorComponent,
  CodigoEmpresaInfoComponent 
} from '../../shared';
```

## 🧩 Componentes Principales

### 📊 Dashboard
- **Propósito**: Panel principal con resumen de actividades
- **Funcionalidades**: Estadísticas, gráficos, alertas, accesos rápidos

### 🏢 Gestión de Empresas
- **Componentes**: Lista, detalle, formulario, modal de resolución
- **Funcionalidades**: CRUD completo, validación SUNAT, gestión de documentos

### 🚗 Gestión de Vehículos
- **Componentes**: Lista, detalle, formulario, asignación de TUCs
- **Funcionalidades**: CRUD completo, validación técnica, historial de mantenimiento

### 📋 Gestión de TUCs
- **Componentes**: Lista, detalle, formulario, verificación QR
- **Funcionalidades**: CRUD completo, renovación automática, seguimiento de vencimientos

### 📄 Gestión de Resoluciones
- **Componentes**: Lista, detalle, formulario, modal de creación
- **Funcionalidades**: CRUD completo, flujos de aprobación, gestión de expedientes

### 📁 Gestión de Expedientes
- **Componentes**: Lista, detalle, formulario, seguimiento por oficina
- **Funcionalidades**: CRUD completo, transferencia entre oficinas, historial de movimientos

### 🛣️ Gestión de Rutas
- **Componentes**: Lista, detalle, formulario, asignación de empresas
- **Funcionalidades**: CRUD completo, validación geográfica, gestión de permisos

### 👨‍💼 Gestión de Conductores
- **Componentes**: Lista, detalle, formulario, validación de licencias
- **Funcionalidades**: CRUD completo, verificación de antecedentes, asignación de vehículos

## 📋 Lista de Componentes Disponibles

### 🧩 Componentes Compartidos (Shared)
- **CodigoEmpresaInfoComponent** - Información visual de códigos de empresa
- **SmartIconComponent** - Iconos inteligentes con fallbacks automáticos
- **EmpresaSelectorComponent** - Selector de empresas con búsqueda avanzada
- **RutaFormSharedComponent** - Formulario compartido de rutas
- **MatConfirmDialogComponent** - Diálogos de confirmación Material Design
- **ResolucionNumberValidatorComponent** - Validador de números de resolución
- **ExpedienteNumberValidatorComponent** - Validador de números de expediente
- **DateRangePickerComponent** - Selector de rangos de fechas
- **SortableHeaderComponent** - Headers ordenables para tablas
- **ColumnSelectorComponent** - Selector de columnas para tablas

### 🏢 Componentes de Empresas
- **EmpresasComponent** - Lista principal de empresas
- **EmpresaDetailComponent** - Vista detallada de empresa (con CodigoEmpresaInfoComponent)
- **EmpresaFormComponent** - Formulario de empresa
- **EmpresaVehiculosBatchComponent** - Gestión masiva de vehículos
- **AgregarVehiculosModalComponent** - Modal para agregar vehículos
- **ValidacionSunatModalComponent** - Validación con SUNAT

### 📋 Componentes de Resoluciones
- **ResolucionesComponent** - Lista principal de resoluciones
- **CrearResolucionModalComponent** - Modal de creación (con EmpresaSelectorComponent mejorado)
- **ResolucionesTableComponent** - Tabla avanzada de resoluciones
- **ResolucionesFiltersComponent** - Filtros avanzados
- **ResolucionSelectorComponent** - Selector de resoluciones

### 📁 Componentes de Expedientes
- **ExpedientesComponent** - Lista principal de expedientes
- **CrearExpedienteModalComponent** - Modal de creación con numeración automática
- **ExpedienteDetailComponent** - Vista detallada de expediente

### 🚗 Componentes de Vehículos
- **VehiculosComponent** - Lista principal de vehículos (mejorada)
- **VehiculoModalComponent** - Modal de gestión de vehículos
- **VehiculoFormComponent** - Formulario de vehículo
- **VehiculoDetailComponent** - Vista detallada de vehículo

### 🛣️ Componentes de Rutas
- **RutasComponent** - Lista principal de rutas
- **RutaFormComponent** - Formulario de ruta
- **RutaDetailComponent** - Vista detallada de ruta
- **AgregarRutaModalComponent** - Modal para agregar rutas

### 📊 Componentes de Dashboard
- **DashboardComponent** - Panel principal (con SmartIconComponent integrado)
- **StatsCardComponent** - Tarjetas de estadísticas
- **ChartComponent** - Componente de gráficos

### 🏗️ Componentes de Layout
- **MainLayoutComponent** - Layout principal (con SmartIconComponent integrado)
- **SidebarComponent** - Barra lateral de navegación
- **HeaderComponent** - Cabecera de la aplicación
- **FooterComponent** - Pie de página

### 🔍 Componentes de Mesa de Partes
- **MesaPartesComponent** - Componente principal de mesa de partes
- **RegistroDocumentoComponent** - Registro de documentos
- **ListaDocumentosComponent** - Lista de documentos
- **DetalleDocumentoComponent** - Detalle de documento
- **DerivarDocumentoComponent** - Derivación de documentos
- **BusquedaDocumentosComponent** - Búsqueda avanzada
- **DashboardMesaComponent** - Dashboard de mesa de partes
- **ConfiguracionIntegracionesComponent** - Configuración de integraciones

## 🔧 Servicios Principales

### 🔐 AuthService
- **Propósito**: Gestión de autenticación y autorización
- **Funcionalidades**: Login, logout, refresh token, validación de roles

### 🏢 EmpresaService
- **Propósito**: Gestión de empresas
- **Funcionalidades**: CRUD, validación SUNAT, búsquedas avanzadas

### 🚗 VehiculoService
- **Propósito**: Gestión de vehículos
- **Funcionalidades**: CRUD, validación técnica, asignación de TUCs

### 📋 TucService
- **Propósito**: Gestión de TUCs
- **Funcionalidades**: CRUD, renovación, verificación de estado

### 📄 ResolucionService
- **Propósito**: Gestión de resoluciones
- **Funcionalidades**: CRUD, flujos de aprobación, gestión de expedientes

### 📁 ExpedienteService
- **Propósito**: Gestión de expedientes
- **Funcionalidades**: CRUD, seguimiento por oficina, transferencias

### 🎯 IconService (Nuevo)
- **Propósito**: Gestión inteligente de iconos con fallbacks
- **Funcionalidades**: Detección de Material Icons, fallbacks automáticos, gestión de mapeos

### ⚙️ FlujoTrabajoService (Preparado)
- **Propósito**: Gestión de flujos de trabajo de expedientes
- **Funcionalidades**: Movimientos entre oficinas, estados de flujo, reportes, notificaciones

### 🔔 NotificationService
- **Propósito**: Sistema de notificaciones
- **Funcionalidades**: Alertas, notificaciones push, historial

### 🎨 ThemeService
- **Propósito**: Gestión de temas y estilos
- **Funcionalidades**: Cambio de tema, personalización de colores

## 🎨 Características de UI/UX

### 🎯 Principios de Diseño
- **Material Design**: Componentes consistentes y accesibles
- **Responsive**: Adaptable a todos los dispositivos
- **Accesibilidad**: Cumplimiento de estándares WCAG
- **Performance**: Lazy loading y optimización de rendimiento

### 🎨 Sistema de Temas
- **Tema Claro**: Para uso diurno y oficinas bien iluminadas
- **Tema Oscuro**: Para uso nocturno y reducción de fatiga visual
- **Personalización**: Colores corporativos de DRTC Puno

### 📱 Responsive Design
- **Desktop**: Layout completo con sidebar y navegación expandida
- **Tablet**: Layout adaptado con navegación colapsable
- **Mobile**: Layout optimizado para pantallas pequeñas

## 🚀 Estado del Desarrollo

### ✅ Completado
- Arquitectura base con Angular 20+
- Componentes standalone para todas las entidades
- Sistema de autenticación JWT
- Formularios reactivos con validación
- Integración con backend FastAPI
- Sistema de temas y estilos

### 🔄 En Desarrollo
- Sistema de seguimiento por oficina
- Gestión de flujos de trabajo
- Notificaciones automáticas
- Reportes y métricas básicas
- Optimización de rendimiento

### 📋 Planificado
- Aplicación móvil PWA
- Integración con sistemas externos
- Dashboard ejecutivo avanzado
- Sistema de auditoría en tiempo real

## 🧪 Testing

### Unit Tests
```bash
ng test
```

### E2E Tests
```bash
ng e2e
```

### Coverage
```bash
ng test --code-coverage
```

## 📦 Build y Despliegue

### Desarrollo
```bash
ng serve
```

### Build de Producción
```bash
ng build --configuration production
```

### Build de Staging
```bash
ng build --configuration staging
```

### Análisis de Bundle
```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/frontend/stats.json
```

## 🔒 Seguridad

- **Interceptores HTTP**: Para manejo de tokens JWT
- **Guards de Ruta**: Para protección de rutas por roles
- **Validación de Formularios**: Para prevenir entrada de datos maliciosos
- **Sanitización de Datos**: Para prevenir XSS y otros ataques

## 📊 Monitoreo y Performance

- **Lazy Loading**: Para optimización de carga inicial
- **Angular Signals**: Para gestión eficiente del estado
- **Change Detection**: Estrategia OnPush para mejor rendimiento
- **Bundle Analysis**: Para optimización del tamaño del bundle

## 🤝 Contribución

Ver [CONTRIBUTING.md](../CONTRIBUTING.md) para detalles sobre cómo contribuir al proyecto.

## 📚 Documentación Adicional

- **[📋 Brief Oficial del Sistema](../docs/BRIEF_SISTEMA_DRTC_PUNO.md)** - Documento de referencia para la lógica de negocio
- **[🔌 API Documentation](../docs/API.md)** - Especificaciones de la API REST
- **[🏢 Mejoras Empresas](../docs/MEJORAS_EMPRESAS.md)** - Funcionalidades específicas para gestión empresarial

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](../LICENSE) para más detalles.


## 📊 Mejoras de Tabla de Resoluciones

El sistema incluye mejoras avanzadas para la gestión de resoluciones con las siguientes características:

### 🔍 Filtrado Avanzado
- Filtro por número de resolución
- Filtro por empresa con búsqueda inteligente
- Filtro por tipo de trámite (múltiple)
- Filtro por estado (múltiple)
- Filtro por rango de fechas
- Chips visuales de filtros activos

### 📊 Tabla Personalizable
- Selección de columnas visibles
- Reordenamiento de columnas
- Persistencia de configuración
- Columna de empresa mejorada

### 🔄 Ordenamiento Avanzado
- Ordenamiento por cualquier columna
- Ordenamiento múltiple con prioridad
- Indicadores visuales de dirección

### 📤 Exportación
- Exportar a Excel
- Exportar a PDF
- Respeta filtros y ordenamiento

### 📚 Documentación Completa

- **[README Principal](../.kiro/specs/resoluciones-table-improvements/README.md)** - Descripción general y arquitectura
- **[Guía de Usuario](../.kiro/specs/resoluciones-table-improvements/USER_GUIDE.md)** - Manual completo para usuarios finales
- **[API Documentation](../.kiro/specs/resoluciones-table-improvements/API_DOCUMENTATION.md)** - Documentación de APIs y servicios
- **[Ejemplos de Componentes](../.kiro/specs/resoluciones-table-improvements/COMPONENT_EXAMPLES.md)** - Ejemplos prácticos de uso
- **[Guía de Testing](../.kiro/specs/resoluciones-table-improvements/TESTING_GUIDE.md)** - Guía de pruebas
- **[Guía de Accesibilidad](../.kiro/specs/resoluciones-table-improvements/ACCESSIBILITY_GUIDE.md)** - Estándares de accesibilidad

### 🚀 Inicio Rápido

```typescript
import { 
  ResolucionesFiltersComponent,
  ResolucionesTableComponent
} from './shared';

@Component({
  template: `
    <app-resoluciones-filters
      [filtros]="filtros"
      (filtrosChange)="onFiltrosChange($event)">
    </app-resoluciones-filters>

    <app-resoluciones-table
      [resoluciones]="resoluciones"
      [configuracion]="config"
      (resolucionSeleccionada)="onSelect($event)">
    </app-resoluciones-table>
  `
})
export class MiComponente {
  // Implementación
}
```

Ver [ejemplos completos](../.kiro/specs/resoluciones-table-improvements/COMPONENT_EXAMPLES.md) para más detalles.

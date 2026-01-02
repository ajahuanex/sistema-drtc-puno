# Sistema SIRRET

Sistema de gestión integral para la Dirección Regional de Transportes y Comunicaciones de Puno.

## 📚 Documentación

- **[📋 Brief Oficial del Sistema](docs/BRIEF_SISTEMA_SIRRET.md)** - Documento de referencia para la lógica de negocio
- **[📋 Briefing Actualizado](docs/BRIEFING.md)** - Estado actual y cambios recientes implementados
- **[🔌 API Documentation](docs/API.md)** - Especificaciones de la API REST
- **[🏢 Mejoras Empresas](docs/MEJORAS_EMPRESAS.md)** - Funcionalidades específicas para gestión empresarial
- **[📊 Mejoras Tabla Resoluciones](.kiro/specs/resoluciones-table-improvements/README.md)** - Sistema avanzado de filtrado y gestión de resoluciones

## 🏗️ Arquitectura

- **Backend**: Python 3.10+ con FastAPI
- **Base de Datos**: MongoDB
- **Frontend Web**: Angular 20
- **Frontend Móvil**: Flutter (en desarrollo)

## 🚀 Instalación

### Prerrequisitos
- Python 3.10+
- Node.js 18+
- MongoDB
- Git

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
ng serve
```

## 📋 Funcionalidades

- Gestión de empresas de transporte
- Control de vehículos y TUCs
- **🆕 Seguimiento de expedientes por oficina**
- Fiscalización móvil
- Reportes y estadísticas
- Interoperabilidad con sistemas externos

## 🧩 Componentes Integrados

### 🏢 CodigoEmpresaInfoComponent
Componente visual para mostrar información detallada del código de empresa con formato `XXXXYYY` (4 dígitos + 3 letras).

**Características:**
- Visualización dividida del código (número | letras)
- Chips de colores para tipos de empresa (P: Personas, R: Regional, T: Turismo)
- Información del formato con ejemplos
- Estado "sin código" cuando no hay código asignado

**Uso:**
```html
<app-codigo-empresa-info [codigoEmpresa]="signal('0123PRT')">
</app-codigo-empresa-info>
```

### 🎯 SmartIconComponent e IconService
Sistema inteligente de iconos con fallbacks automáticos cuando Material Icons no se carga correctamente.

**Características:**
- Detección automática de Material Icons
- Fallback a emojis cuando Material Icons no están disponibles
- Tooltips automáticos con descripción del icono
- Efectos hover para iconos clickables
- Estado disabled con opacidad reducida
- Mapeo de 80+ iconos comunes

**Uso:**
```html
<app-smart-icon 
  [iconName]="'business'"
  [size]="32"
  [tooltipText]="'Información de empresa'"
  [clickable]="true">
</app-smart-icon>
```

### 🔍 EmpresaSelectorComponent (Mejorado)
Selector de empresas con búsqueda y autocompletado para mejorar la experiencia de usuario en formularios.

**Características:**
- Búsqueda por RUC, razón social o código de empresa
- Autocompletado en tiempo real
- Filtrado eficiente sin bloquear la UI
- Indicadores de carga y estados vacíos
- Integración con formularios reactivos

**Uso:**
```html
<app-empresa-selector
  [label]="'EMPRESA'"
  [placeholder]="'Buscar por RUC, razón social o código'"
  [required]="true"
  (empresaSeleccionada)="onEmpresaSelected($event)">
</app-empresa-selector>
```

### ⚙️ FlujoTrabajoService (Preparado)
Servicio completo para gestión de flujos de trabajo de expedientes, preparado para uso futuro.

**Características:**
- Gestión de flujos de trabajo entre oficinas
- Movimientos de expedientes con trazabilidad
- Estados de flujo con historial completo
- Notificaciones automáticas
- Reportes y métricas de flujo
- Validaciones de flujo y permisos

**API Principal:**
```typescript
// Flujos de Trabajo
getFlujos(filtros?: FlujoFiltros): Observable<FlujoTrabajo[]>
crearFlujo(flujo: Omit<FlujoTrabajo, 'id'>): Observable<FlujoTrabajo>

// Movimientos
moverExpediente(movimiento: MovimientoExpediente): Observable<MovimientoExpediente>
getMovimientos(expedienteId?: string): Observable<MovimientoExpediente[]>

// Estados y Reportes
getEstadoFlujo(expedienteId: string): Observable<EstadoFlujo>
getReporteFlujo(flujoId: string, fechas: DateRange): Observable<any>
```

### 📦 Componentes Compartidos
Archivo de exportación centralizado (`shared/index.ts`) para facilitar la importación de componentes compartidos.

**Componentes Disponibles:**
- `CodigoEmpresaInfoComponent` - Información visual de códigos de empresa
- `SmartIconComponent` - Iconos inteligentes con fallbacks
- `EmpresaSelectorComponent` - Selector de empresas con búsqueda
- `RutaFormSharedComponent` - Formulario compartido de rutas
- `MatConfirmDialogComponent` - Diálogos de confirmación
- `ResolucionNumberValidatorComponent` - Validador de números de resolución
- `ExpedienteNumberValidatorComponent` - Validador de números de expediente

**Uso:**
```typescript
// En lugar de múltiples imports
import { 
  SmartIconComponent, 
  EmpresaSelectorComponent,
  CodigoEmpresaInfoComponent 
} from '../../shared';
```

## 🔄 Estado del Desarrollo

### ✅ Completado
- Modelos de datos básicos
- API REST para entidades principales
- Frontend Angular con componentes básicos
- Autenticación JWT

### 🔄 En Desarrollo
- Sistema de seguimiento por oficina
- Gestión de flujos de trabajo
- Notificaciones automáticas
- Reportes y métricas básicas

### 📋 Planificado
- Aplicación móvil Flutter
- Integración con sistemas externos
- Inteligencia artificial para optimización
- Dashboard ejecutivo avanzado

## 🤝 Contribución

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para detalles.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles. 
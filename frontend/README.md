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
- **Propósito**: Conjunto de documentos y trámites
- **Campos clave**: `nroExpediente`, `fechaEmision`, `tipoTramite`, `estado`
- **🆕 Nuevo**: Sistema de seguimiento por oficina

### 🏢 Oficina
- **Propósito**: Gestión de oficinas del sistema
- **Campos clave**: `nombre`, `codigo`, `ubicacion`, `tipoOficina`, `responsable`
- **🆕 Nuevo**: Modelo reutilizable para seguimiento de expedientes

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

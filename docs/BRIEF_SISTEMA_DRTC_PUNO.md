# BRIEF OFICIAL DEL SISTEMA DRTC PUNO
## Documento de Referencia para la Lógica de Negocio

**Versión:** 2.0  
**Fecha de Actualización:** Enero 2025  
**Estado:** APROBADO  

---

## 1. VISIÓN GENERAL DEL SISTEMA

### 1.1 Propósito
El Sistema DRTC Puno es una plataforma integral de gestión para la Dirección Regional de Transportes y Comunicaciones de Puno, diseñada para digitalizar y optimizar todos los procesos administrativos, operativos y de fiscalización relacionados con el transporte terrestre en la región.

### 1.2 Objetivos Principales
- **Digitalización completa** de expedientes y trámites administrativos
- **Trazabilidad total** de expedientes desde su creación hasta su resolución
- **Fiscalización eficiente** con herramientas móviles y en tiempo real
- **Interoperabilidad** con sistemas externos de gestión documentaria
- **Transparencia** en el seguimiento de trámites para usuarios y empresas
- **Optimización** de flujos de trabajo entre oficinas y dependencias

---

## 2. ARQUITECTURA TÉCNICA

### 2.1 Stack Tecnológico
- **Backend:** Python 3.10+ con FastAPI
- **Base de Datos:** MongoDB (NoSQL)
- **Frontend Web:** Angular 20+ (Standalone Components)
- **Frontend Móvil:** Flutter (en desarrollo)
- **Autenticación:** JWT con OAuth2
- **API:** RESTful con documentación automática (Swagger/OpenAPI)

### 2.2 Principios de Diseño
- **Arquitectura modular** con separación clara de responsabilidades
- **Componentes standalone** en Angular (sin NgModules)
- **Validación robusta** con Pydantic en backend
- **Gestión de estado reactiva** con Angular Signals
- **Formularios reactivos** para mejor control y validación
- **Lazy loading** para optimización de rendimiento

---

## 3. MODELOS DE DATOS PRINCIPALES

### 3.1 Empresa
**Propósito:** Representa las empresas de transporte autorizadas para operar en la región.

**Campos Clave:**
- `ruc`: Identificación fiscal única
- `razonSocial`: Nombre legal de la empresa
- `estado`: Estado de autorización (ACTIVA, SUSPENDIDA, CANCELADA)
- `datosSunat`: Información validada desde SUNAT
- `scoreRiesgo`: Evaluación de riesgo operativo

**Relaciones:**
- Vehículos habilitados
- Conductores autorizados
- Rutas autorizadas
- Resoluciones emitidas

### 3.2 Vehículo
**Propósito:** Representa los vehículos autorizados para el transporte de pasajeros y carga.

**Campos Clave:**
- `placa`: Matrícula del vehículo
- `marca`: Marca del fabricante
- `modelo`: Modelo específico
- `capacidad`: Capacidad de pasajeros o carga
- `estado`: Estado operativo del vehículo

**Relaciones:**
- Empresa propietaria
- TUCs asociados
- Rutas autorizadas
- Historial de mantenimiento

### 3.3 TUC (Tarjeta Única de Circulación)
**Propósito:** Documento oficial que autoriza la circulación de un vehículo en rutas específicas.

**Campos Clave:**
- `numeroTuc`: Número único de identificación
- `fechaEmision`: Fecha de emisión del documento
- `fechaVencimiento`: Fecha de caducidad
- `estado`: Estado del TUC (VIGENTE, VENCIDO, SUSPENDIDO)
- `qrVerificationUrl`: URL para verificación QR

**Relaciones:**
- Vehículo asociado
- Empresa operadora
- Rutas autorizadas
- Resolución que lo autoriza

### 3.4 Ruta
**Propósito:** Define las rutas autorizadas para el transporte de pasajeros y carga.

**Campos Clave:**
- `codigoRuta`: Código único de la ruta
- `origen`: Punto de partida
- `destino`: Punto de llegada
- `distancia`: Distancia en kilómetros
- `tiempoEstimado`: Tiempo estimado del viaje
- `tipoServicio`: Tipo de servicio (URBANO, INTERURBANO, INTERPROVINCIAL)

**Relaciones:**
- Empresas autorizadas
- Vehículos habilitados
- TUCs asociados

### 3.5 Resolución
**Propósito:** Documento administrativo que autoriza operaciones específicas.

**Campos Clave:**
- `nroResolucion`: Número único de resolución
- `fechaEmision`: Fecha de emisión
- `tipoTramite`: Tipo de trámite autorizado
- `estado`: Estado de la resolución
- `empresaId`: Empresa beneficiaria

**Relaciones:**
- Empresa solicitante
- Expediente asociado
- Vehículos autorizados
- Rutas permitidas

---

## 4. NUEVA FUNCIONALIDAD: SEGUIMIENTO DE EXPEDIENTES POR OFICINA

### 4.1 Propósito
Implementar un sistema de trazabilidad completa que permita a los usuarios interesados (empresas, solicitantes, funcionarios) conocer en tiempo real:
- **Dónde se encuentra** físicamente el expediente
- **Quién es el responsable** en cada oficina
- **Cuánto tiempo** permanecerá en cada oficina
- **Cuál es el siguiente paso** en el flujo de trabajo
- **Historial completo** de movimientos entre oficinas

### 4.2 Modelo de Expediente Actualizado

#### 4.2.1 Campos de Seguimiento por Oficina
```typescript
// Campos para seguimiento por oficina
oficinaActual?: OficinaExpediente; // Oficina donde se encuentra actualmente
historialOficinas?: HistorialOficina[]; // Historial de movimientos entre oficinas
tiempoEstimadoOficina?: number; // Tiempo estimado en días en la oficina actual
fechaLlegadaOficina?: Date; // Fecha cuando llegó a la oficina actual
proximaRevision?: Date; // Fecha de la próxima revisión programada
urgencia?: NivelUrgencia; // Nivel de urgencia del expediente
```

#### 4.2.2 Tipos de Oficina
- **RECEPCIÓN:** Primera oficina donde llegan los expedientes
- **REVISION_TECNICA:** Análisis técnico de documentación
- **LEGAL:** Revisión legal y cumplimiento normativo
- **FINANCIERA:** Verificación de pagos y aspectos financieros
- **APROBACION:** Decisión final de aprobación
- **FISCALIZACION:** Control y verificación posterior
- **ARCHIVO:** Almacenamiento final de expedientes completados
- **COORDINACION:** Coordinación entre oficinas
- **DIRECCION:** Decisiones de alto nivel

#### 4.2.3 Niveles de Urgencia
- **NORMAL:** Procesamiento estándar
- **URGENTE:** Requiere atención prioritaria
- **MUY_URGENTE:** Atención inmediata requerida
- **CRITICO:** Máxima prioridad, posible paralización de operaciones

### 4.3 Modelo de Oficina

#### 4.3.1 Características Principales
```typescript
export interface Oficina {
  id: string;
  nombre: string;
  codigo: string; // Código interno de la oficina
  ubicacion: string; // Dirección física de la oficina
  responsable?: ResponsableOficina;
  tipoOficina: TipoOficina;
  estaActiva: boolean;
  
  // Información de capacidad y carga de trabajo
  capacidadMaxima: number; // Expedientes máximos que puede procesar simultáneamente
  expedientesActivos: number; // Expedientes actualmente en proceso
  tiempoPromedioTramite: number; // Tiempo promedio en días para procesar un expediente
  prioridad: PrioridadOficina; // Prioridad de la oficina en el flujo de trabajo
}
```

#### 4.3.2 Responsable de Oficina
```typescript
export interface ResponsableOficina {
  id: string;
  nombre: string;
  cargo: string;
  email: string;
  telefono?: string;
  extension?: string;
  horarioDisponibilidad?: string;
  fechaAsignacion: Date;
  estaActivo: boolean;
}
```

### 4.4 Historial de Movimientos

#### 4.4.1 Estructura del Historial
```typescript
export interface HistorialOficina {
  id: string;
  oficinaId: string;
  oficinaNombre: string;
  fechaEntrada: Date;
  fechaSalida?: Date;
  responsableId?: string;
  responsableNombre?: string;
  motivo: string; // Por qué llegó a esta oficina
  observaciones?: string;
  tiempoEnOficina?: number; // Días que estuvo en esta oficina
  estado: EstadoHistorialOficina;
}
```

#### 4.4.2 Estados del Historial
- **EN_TRAMITE:** Expediente actualmente en proceso en esta oficina
- **COMPLETADO:** Proceso en esta oficina finalizado exitosamente
- **DEVUELTO:** Expediente devuelto por requerir información adicional
- **TRANSFERIDO:** Expediente transferido a otra oficina
- **ARCHIVADO:** Expediente archivado en esta oficina

### 4.5 Flujo de Trabajo Optimizado

#### 4.5.1 Flujo Estándar
1. **RECEPCIÓN** → Recepción y validación inicial de documentación
2. **REVISION_TECNICA** → Análisis técnico de requisitos
3. **LEGAL** → Verificación de cumplimiento normativo
4. **FINANCIERA** → Verificación de pagos y aspectos económicos
5. **APROBACION** → Decisión final de aprobación
6. **FISCALIZACION** → Control posterior y verificación
7. **ARCHIVO** → Almacenamiento final

#### 4.5.2 Flujos Alternativos
- **Flujo Acelerado:** Para expedientes de urgencia crítica
- **Flujo de Renovación:** Para renovaciones de autorizaciones existentes
- **Flujo de Suspensión:** Para casos que requieren suspensión temporal
- **Flujo de Cancelación:** Para casos que requieren cancelación definitiva

---

## 5. BENEFICIOS DEL SEGUIMIENTO POR OFICINA

### 5.1 Para Usuarios y Empresas
- **Transparencia total** en el estado de sus trámites
- **Planificación anticipada** basada en tiempos estimados
- **Identificación rápida** de cuellos de botella
- **Comunicación directa** con responsables de oficina
- **Historial completo** de movimientos para auditoría

### 5.2 Para Funcionarios y Administradores
- **Control de carga de trabajo** por oficina
- **Identificación de ineficiencias** en el flujo de trabajo
- **Optimización de recursos** humanos y materiales
- **Métricas de rendimiento** por oficina y funcionario
- **Prevención de retrasos** mediante alertas automáticas

### 5.3 Para la Institución
- **Mejora de la imagen pública** mediante transparencia
- **Reducción de consultas presenciales** y telefónicas
- **Optimización de procesos** administrativos
- **Cumplimiento normativo** mejorado
- **Toma de decisiones** basada en datos reales

---

## 6. IMPLEMENTACIÓN TÉCNICA

### 6.1 Backend (FastAPI)
- **Modelos Pydantic** para validación de datos
- **Endpoints REST** para gestión de expedientes y oficinas
- **Middleware de autenticación** JWT
- **Validación de permisos** por rol de usuario
- **Logging y auditoría** de todas las operaciones

### 6.2 Frontend (Angular)
- **Componentes standalone** para cada funcionalidad
- **Formularios reactivos** para entrada de datos
- **Angular Signals** para gestión de estado reactivo
- **Lazy loading** para optimización de rendimiento
- **Responsive design** para dispositivos móviles

### 6.3 Base de Datos (MongoDB)
- **Colecciones optimizadas** para consultas frecuentes
- **Índices compuestos** para búsquedas eficientes
- **Agregaciones** para reportes y estadísticas
- **Backup automático** y replicación

---

## 7. SEGURIDAD Y COMPLIANCE

### 7.1 Autenticación y Autorización
- **JWT tokens** con expiración configurable
- **Roles y permisos** granulares por funcionalidad
- **Auditoría completa** de todas las operaciones
- **Encriptación** de datos sensibles

### 7.2 Protección de Datos
- **Cumplimiento GDPR** para datos personales
- **Encriptación en tránsito** (HTTPS/TLS)
- **Encriptación en reposo** para datos críticos
- **Backup y recuperación** de desastres

---

## 8. MÉTRICAS Y REPORTES

### 8.1 Métricas de Rendimiento
- **Tiempo promedio** de procesamiento por oficina
- **Tasa de completitud** de expedientes
- **Identificación de cuellos de botella**
- **Eficiencia por funcionario** y oficina

### 8.2 Reportes Operativos
- **Estado actual** de todos los expedientes
- **Expedientes retrasados** por oficina
- **Carga de trabajo** por funcionario
- **Tendencias temporales** de procesamiento

---

## 9. ROADMAP DE DESARROLLO

### 9.1 Fase 1 (Completada)
- ✅ Modelos de datos básicos
- ✅ API REST para entidades principales
- ✅ Frontend Angular con componentes básicos
- ✅ Autenticación JWT

### 9.2 Fase 2 (En Desarrollo)
- 🔄 Sistema de seguimiento por oficina
- 🔄 Gestión de flujos de trabajo
- 🔄 Notificaciones automáticas
- 🔄 Reportes y métricas básicas

### 9.3 Fase 3 (Planificada)
- 📋 Aplicación móvil Flutter
- 📋 Integración con sistemas externos
- 📋 Inteligencia artificial para optimización
- 📋 Dashboard ejecutivo avanzado

---

## 10. CONSIDERACIONES DE NEGOCIO

### 10.1 Impacto en la Operación
- **Reducción del 40-60%** en tiempo de procesamiento de expedientes
- **Mejora del 80%** en satisfacción del usuario
- **Reducción del 70%** en consultas presenciales
- **Optimización del 50%** en uso de recursos humanos

### 10.2 ROI Esperado
- **Inversión inicial:** $150,000 - $200,000
- **Ahorro anual estimado:** $80,000 - $120,000
- **ROI esperado:** 40-60% anual
- **Período de recuperación:** 18-24 meses

---

## 11. CONCLUSIÓN

El Sistema DRTC Puno con la nueva funcionalidad de seguimiento de expedientes por oficina representa un salto cualitativo en la gestión administrativa de la institución. La implementación de esta funcionalidad no solo mejora la eficiencia operativa, sino que también fortalece la transparencia y la confianza de los usuarios en el sistema.

La arquitectura modular y escalable permite futuras expansiones y mejoras, mientras que el enfoque en la experiencia del usuario asegura una adopción exitosa por parte de todos los stakeholders.

---

**Documento preparado por:** Equipo de Desarrollo DRTC Puno  
**Revisado por:** Jefatura de Sistemas  
**Aprobado por:** Dirección General  

**Próxima revisión:** Marzo 2025 
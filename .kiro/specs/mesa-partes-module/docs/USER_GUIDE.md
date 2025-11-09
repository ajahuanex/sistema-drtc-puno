# Guía de Usuario - Módulo de Mesa de Partes

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Registro de Documentos](#registro-de-documentos)
4. [Gestión de Documentos](#gestión-de-documentos)
5. [Derivación de Documentos](#derivación-de-documentos)
6. [Búsqueda y Consulta](#búsqueda-y-consulta)
7. [Dashboard y Reportes](#dashboard-y-reportes)
8. [Notificaciones](#notificaciones)
9. [Consulta Pública por QR](#consulta-pública-por-qr)
10. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

El Módulo de Mesa de Partes es un sistema integral para la gestión de documentos y trámites administrativos. Permite registrar, derivar, hacer seguimiento y generar reportes sobre todos los documentos que ingresan a la institución.

### Características Principales

- ✅ Registro rápido de documentos con generación automática de número de expediente
- ✅ Derivación de documentos a diferentes áreas con seguimiento completo
- ✅ Búsqueda avanzada y consulta de estado
- ✅ Notificaciones en tiempo real
- ✅ Generación de reportes y estadísticas
- ✅ Comprobantes con código QR para consulta pública
- ✅ Integración con otras mesas de partes

---

## Acceso al Sistema

### Inicio de Sesión

1. Ingrese a la URL del sistema proporcionada por su administrador
2. Introduzca su nombre de usuario y contraseña
3. Haga clic en "Iniciar Sesión"

### Navegación Principal

Una vez dentro del sistema, encontrará el módulo de Mesa de Partes en el menú lateral izquierdo:

```
📋 Mesa de Partes
```

Al hacer clic, accederá a la interfaz principal con las siguientes pestañas:

- **Registro**: Para registrar nuevos documentos
- **Documentos**: Lista de todos los documentos
- **Búsqueda**: Búsqueda avanzada de documentos
- **Dashboard**: Estadísticas y métricas
- **Configuración**: Configuración de integraciones (solo administradores)

---

## Registro de Documentos

### Proceso de Registro

1. **Acceder al Formulario**
   - Haga clic en la pestaña "Registro"
   - O use el botón "Nuevo Documento" en la lista de documentos

2. **Completar Información Básica**
   
   **Campos Obligatorios:**
   - **Tipo de Documento**: Seleccione de la lista (Solicitud, Oficio, Memorándum, etc.)
   - **Remitente**: Nombre completo de quien envía el documento
   - **Asunto**: Descripción breve del contenido del documento
   
   **Campos Opcionales:**
   - **Número de Documento Externo**: Si el documento tiene un número de referencia
   - **Número de Folios**: Cantidad de páginas del documento
   - **Tiene Anexos**: Marque si incluye documentos adicionales
   - **Prioridad**: Normal, Alta o Urgente
   - **Fecha Límite**: Si requiere respuesta en fecha específica
   - **Expediente Relacionado**: Si está vinculado a un expediente existente

3. **Adjuntar Archivos**
   - Arrastre archivos al área de carga o haga clic para seleccionar
   - Formatos permitidos: PDF, JPG, PNG, DOCX
   - Tamaño máximo por archivo: 10 MB
   - Puede adjuntar múltiples archivos

4. **Guardar el Documento**
   - Revise que toda la información esté correcta
   - Haga clic en "Guardar Documento"
   - El sistema generará automáticamente un número de expediente

5. **Comprobante de Recepción**
   - Después de guardar, se generará un comprobante con código QR
   - Puede imprimir o descargar el comprobante
   - El código QR permite consultar el estado del documento sin necesidad de iniciar sesión

### Ejemplo de Número de Expediente

```
EXP-2025-0001
```

El formato es configurable por el administrador del sistema.

---

## Gestión de Documentos

### Lista de Documentos

La pestaña "Documentos" muestra todos los documentos registrados en el sistema.

#### Columnas de la Tabla

- **Expediente**: Número único del documento
- **Tipo**: Tipo de documento
- **Remitente**: Quien envió el documento
- **Asunto**: Descripción breve
- **Estado**: Estado actual (Registrado, En Proceso, Atendido, Archivado)
- **Prioridad**: Indicador visual de prioridad
- **Fecha**: Fecha de registro
- **Acciones**: Botones para ver, derivar, archivar

#### Filtros Disponibles

- **Por Estado**: Filtre por estado del documento
- **Por Tipo**: Filtre por tipo de documento
- **Por Fecha**: Seleccione un rango de fechas
- **Por Prioridad**: Filtre por nivel de prioridad
- **Búsqueda Rápida**: Busque por expediente, remitente o asunto

#### Acciones Disponibles

**Ver Detalle** (👁️)
- Muestra toda la información del documento
- Historial completo de derivaciones
- Archivos adjuntos con opción de descarga

**Derivar** (➡️)
- Envía el documento a otra área
- Solo disponible si tiene permisos

**Archivar** (📁)
- Marca el documento como finalizado
- Solo disponible para documentos atendidos

### Ver Detalle de Documento

Al hacer clic en "Ver Detalle", se muestra:

1. **Información General**
   - Todos los datos del documento
   - Estado actual y ubicación
   - Usuario que registró el documento

2. **Archivos Adjuntos**
   - Lista de archivos con opción de descarga
   - Vista previa para imágenes y PDFs

3. **Historial de Derivaciones**
   - Timeline con todas las derivaciones
   - Fechas de envío y recepción
   - Instrucciones y observaciones
   - Usuarios involucrados

4. **Notas y Observaciones**
   - Comentarios agregados durante el proceso
   - Historial de cambios

---

## Derivación de Documentos

### ¿Qué es una Derivación?

Una derivación es el proceso de enviar un documento a otra área u oficina para su atención.

### Proceso de Derivación

1. **Seleccionar Documento**
   - Desde la lista de documentos, haga clic en el botón "Derivar" (➡️)

2. **Completar Formulario de Derivación**
   
   **Campos Obligatorios:**
   - **Área Destino**: Seleccione el área que debe atender el documento
   - **Instrucciones**: Indique qué debe hacer el área receptora
   
   **Campos Opcionales:**
   - **Marcar como Urgente**: Para derivaciones prioritarias
   - **Fecha Límite**: Si requiere atención en fecha específica
   - **Notificar por Email**: Envía notificación adicional por correo

3. **Confirmar Derivación**
   - Revise la información
   - Haga clic en "Derivar Documento"
   - El sistema enviará notificaciones automáticas

### Derivación Múltiple

Puede derivar un documento a múltiples áreas simultáneamente:

1. En el campo "Área Destino", seleccione múltiples áreas
2. Cada área recibirá una copia del documento
3. Todas las áreas pueden trabajar en paralelo

### Recepción de Documentos

Cuando recibe un documento derivado:

1. Recibirá una notificación en el sistema y por email
2. El documento aparecerá en su lista con estado "Pendiente"
3. Debe hacer clic en "Recibir" para confirmar la recepción
4. Una vez recibido, puede comenzar a trabajar en él

### Atención de Documentos

Para registrar que atendió un documento:

1. Abra el detalle del documento
2. Haga clic en "Registrar Atención"
3. Agregue observaciones sobre la atención realizada
4. Adjunte documentos de respuesta si corresponde
5. Guarde los cambios

---

## Búsqueda y Consulta

### Búsqueda Avanzada

La pestaña "Búsqueda" ofrece opciones avanzadas de búsqueda:

#### Criterios de Búsqueda

- **Número de Expediente**: Búsqueda exacta por número
- **Remitente**: Busque por nombre del remitente
- **Asunto**: Busque palabras clave en el asunto
- **Rango de Fechas**: Desde - Hasta
- **Tipo de Documento**: Seleccione uno o varios tipos
- **Estado**: Seleccione uno o varios estados
- **Prioridad**: Filtre por nivel de prioridad
- **Área Actual**: Documentos en área específica

#### Combinación de Criterios

Puede combinar múltiples criterios para búsquedas más precisas:

```
Ejemplo:
- Tipo: Solicitud
- Estado: En Proceso
- Fecha: 01/01/2025 - 31/01/2025
- Prioridad: Alta
```

#### Resultados de Búsqueda

- Los resultados se muestran en tabla paginada
- Puede ordenar por cualquier columna
- Exportar resultados a Excel o PDF
- Acceder al detalle de cualquier documento

---

## Dashboard y Reportes

### Dashboard Principal

El Dashboard muestra métricas clave en tiempo real:

#### Indicadores Principales

**Documentos Recibidos**
- Total de documentos registrados en el período
- Comparación con período anterior

**Documentos en Proceso**
- Documentos actualmente en trámite
- Desglose por área

**Documentos Atendidos**
- Documentos finalizados
- Porcentaje de cumplimiento

**Documentos Vencidos**
- Documentos que excedieron su fecha límite
- Alertas de documentos próximos a vencer

#### Gráficos y Estadísticas

**Tendencias por Fecha**
- Gráfico de líneas mostrando documentos por día/semana/mes
- Permite identificar picos de trabajo

**Distribución por Tipo**
- Gráfico circular con porcentaje por tipo de documento
- Identifica los tipos más frecuentes

**Distribución por Área**
- Gráfico de barras con documentos por área
- Muestra carga de trabajo por área

**Tiempos de Atención**
- Tiempo promedio de atención por área
- Identifica áreas con demoras

### Generación de Reportes

#### Tipos de Reportes

1. **Reporte General**
   - Resumen de todos los documentos
   - Filtrable por fecha, tipo, estado

2. **Reporte por Área**
   - Documentos atendidos por área específica
   - Métricas de desempeño

3. **Reporte de Vencimientos**
   - Documentos vencidos y próximos a vencer
   - Útil para seguimiento

4. **Reporte de Integraciones**
   - Documentos intercambiados con otras mesas
   - Estado de sincronizaciones

#### Exportación de Reportes

Los reportes pueden exportarse en:
- **Excel (.xlsx)**: Para análisis adicional
- **PDF**: Para impresión o archivo

---

## Notificaciones

### Tipos de Notificaciones

El sistema envía notificaciones automáticas para:

- ✉️ **Documento Derivado**: Cuando recibe un documento
- ⏰ **Próximo a Vencer**: 3, 2 y 1 día antes del vencimiento
- 🚨 **Documento Urgente**: Para documentos marcados como urgentes
- ✅ **Documento Atendido**: Cuando se completa la atención
- 📝 **Actualización**: Cuando hay cambios en documentos que sigue

### Panel de Notificaciones

Acceda al panel de notificaciones haciendo clic en el ícono de campana (🔔) en la barra superior.

#### Características del Panel

- Muestra las últimas 20 notificaciones
- Indica notificaciones no leídas con punto azul
- Enlace directo al documento relacionado
- Opción de marcar como leída
- Opción de eliminar notificación

### Configuración de Notificaciones

Puede personalizar sus preferencias de notificación:

1. Haga clic en el ícono de engranaje en el panel de notificaciones
2. Seleccione qué tipos de notificaciones desea recibir
3. Elija el canal: Sistema, Email, o Ambos
4. Configure sonido para notificaciones urgentes
5. Guarde los cambios

---

## Consulta Pública por QR

### ¿Qué es la Consulta por QR?

Cada documento registrado genera un código QR único que permite consultar su estado sin necesidad de iniciar sesión en el sistema.

### Uso del Código QR

1. **Obtener el QR**
   - El QR se genera automáticamente al registrar un documento
   - Aparece en el comprobante de recepción
   - También disponible en el detalle del documento

2. **Escanear el QR**
   - Use cualquier aplicación de lectura de códigos QR
   - O acceda a la URL directamente desde el comprobante

3. **Ver Estado**
   - Se mostrará una página pública con:
     - Número de expediente
     - Estado actual del documento
     - Ubicación actual (área)
     - Historial resumido de movimientos
     - Fecha de registro y última actualización

### Consulta Manual

Si no puede escanear el QR, puede consultar manualmente:

1. Acceda a: `https://[sistema]/consulta-publica`
2. Ingrese el número de expediente
3. Haga clic en "Consultar"

---

## Preguntas Frecuentes

### Registro de Documentos

**P: ¿Puedo editar un documento después de registrarlo?**
R: Sí, puede editar la información básica del documento, pero el número de expediente no puede cambiarse.

**P: ¿Qué hago si me equivoqué al registrar un documento?**
R: Puede editar el documento o, si es necesario eliminarlo, contacte al administrador del sistema.

**P: ¿Cuántos archivos puedo adjuntar?**
R: No hay límite en la cantidad de archivos, pero cada archivo no debe exceder 10 MB.

### Derivación

**P: ¿Puedo derivar un documento que ya fue derivado?**
R: Sí, un documento puede tener múltiples derivaciones. Cada área puede derivarlo a otra área según sea necesario.

**P: ¿Qué pasa si derivo a un área equivocada?**
R: Contacte al área receptora para que devuelva el documento, o solicite al administrador que corrija la derivación.

**P: ¿Cómo sé si el área receptora recibió el documento?**
R: En el historial de derivaciones verá la fecha de recepción cuando el área confirme que lo recibió.

### Búsqueda

**P: ¿Por qué no encuentro un documento?**
R: Verifique que tiene permisos para ver ese documento. Algunos documentos pueden estar restringidos a ciertas áreas.

**P: ¿Puedo buscar documentos archivados?**
R: Sí, en los filtros de búsqueda seleccione el estado "Archivado".

### Notificaciones

**P: ¿Por qué no recibo notificaciones por email?**
R: Verifique su configuración de notificaciones y que su email esté correctamente registrado en su perfil.

**P: ¿Puedo desactivar las notificaciones?**
R: Puede desactivar notificaciones específicas, pero se recomienda mantener activas las notificaciones de documentos urgentes y vencimientos.

### Reportes

**P: ¿Puedo programar reportes automáticos?**
R: Esta funcionalidad está disponible solo para administradores. Contacte a su administrador si necesita reportes periódicos.

**P: ¿Los reportes incluyen documentos archivados?**
R: Sí, puede incluir documentos archivados seleccionando el rango de fechas apropiado.

---

## Soporte Técnico

Si tiene problemas técnicos o preguntas no cubiertas en esta guía:

- **Email**: soporte@[institucion].gob.pe
- **Teléfono**: [número de soporte]
- **Horario**: Lunes a Viernes, 8:00 AM - 5:00 PM

---

## Glosario

- **Expediente**: Número único asignado a cada documento registrado
- **Derivación**: Proceso de enviar un documento a otra área
- **Trámite**: Proceso completo desde el registro hasta la atención final
- **Mesa de Partes**: Oficina encargada del registro y control de documentos
- **QR**: Código de barras bidimensional para consulta rápida
- **Integración**: Conexión con otras mesas de partes para intercambio de documentos

---

**Versión**: 1.0  
**Última actualización**: Enero 2025  
**Módulo**: Mesa de Partes

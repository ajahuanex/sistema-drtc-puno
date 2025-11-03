# Implementation Plan - Módulo de Mesa de Partes

- [x] 1. Configurar estructura base del módulo
  - Crear estructura de carpetas para componentes de mesa de partes
  - Crear estructura de carpetas para modelos y servicios
  - Configurar rutas en el routing de Angular
  - Agregar entrada en el menú lateral para Mesa de Partes
  - _Requirements: 1.1, 1.2_

- [x] 2. Implementar modelos de datos en frontend
- [x] 2.1 Crear modelo de Documento
  - Definir interface Documento con todos sus campos
  - Definir interface TipoDocumento y Categoria
  - Definir interface ArchivoAdjunto
  - Definir enums para Estado, Prioridad
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [x] 2.2 Crear modelo de Derivacion
  - Definir interface Derivacion con campos completos
  - Definir enum EstadoDerivacion
  - Crear tipos para historial de derivaciones
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 2.3 Crear modelo de Integracion
  - Definir interface Integracion
  - Definir interface MapeoCampo
  - Definir interface ConfiguracionWebhook
  - Definir enums para tipos de integración y autenticación
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.8_

- [x] 3. Implementar servicios en frontend
- [x] 3.1 Crear DocumentoService
  - Implementar método crearDocumento()
  - Implementar método obtenerDocumento()
  - Implementar método listarDocumentos() con filtros
  - Implementar método actualizarDocumento()
  - Implementar método archivarDocumento()
  - Implementar método adjuntarArchivo()
  - Implementar método generarComprobante()
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.1, 9.2, 9.3_

- [x] 3.2 Crear DerivacionService
  - Implementar método derivarDocumento()
  - Implementar método recibirDocumento()
  - Implementar método obtenerHistorial()
  - Implementar método obtenerDocumentosArea()
  - Implementar método registrarAtencion()
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3.3 Crear IntegracionService
  - Implementar método crearIntegracion()
  - Implementar método probarConexion()
  - Implementar método enviarDocumento()
  - Implementar método obtenerLogSincronizacion()
  - Implementar método configurarWebhook()
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 10.1, 10.2, 10.3, 10.4_

- [x] 3.4 Crear NotificacionService
  - Implementar método obtenerNotificaciones()
  - Implementar método marcarComoLeida()
  - Implementar WebSocket para notificaciones en tiempo real
  - Implementar método suscribirseAEventos()
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 3.5 Crear ReporteService
  - Implementar método obtenerEstadisticas()
  - Implementar método generarReporte()
  - Implementar método exportarReporte()
  - Implementar método obtenerMetricas()
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 4. Implementar componente principal MesaPartesComponent
  - Crear componente con estructura de tabs
  - Implementar navegación entre secciones
  - Agregar contador de notificaciones pendientes
  - Implementar layout responsive
  - _Requirements: 1.1, 5.1_

- [x] 5. Implementar RegistroDocumentoComponent
- [x] 5.1 Crear formulario de registro
  - Crear formulario reactivo con FormBuilder
  - Agregar validaciones para campos obligatorios
  - Implementar selección de tipo de documento
  - Implementar campo de remitente con autocompletado
  - Implementar campo de asunto
  - Agregar campos de número de folios y anexos
  - _Requirements: 1.1, 1.2, 1.7_

- [x] 5.2 Implementar upload de archivos
  - Agregar componente de drag & drop para archivos
  - Implementar vista previa de archivos
  - Validar tipos de archivo permitidos
  - Mostrar progreso de carga
  - Permitir eliminar archivos antes de guardar
  - _Requirements: 1.3_

- [x] 5.3 Implementar funcionalidades adicionales
  - Agregar selector de prioridad
  - Implementar generación automática de número de expediente
  - Agregar opción de asociar a expediente existente
  - Implementar generación de comprobante con QR
  - Mostrar mensaje de éxito y opciones post-registro
  - _Requirements: 1.2, 1.4, 1.5, 1.6_

- [x] 6. Implementar ListaDocumentosComponent
- [x] 6.1 Crear tabla de documentos
  - Implementar tabla con MatTable
  - Agregar columnas: expediente, tipo, remitente, asunto, estado, fecha, acciones
  - Implementar paginación
  - Implementar ordenamiento por columnas
  - _Requirements: 5.1, 5.2_

- [x] 6.2 Implementar filtros y búsqueda
  - Agregar filtros por estado
  - Agregar filtros por tipo de documento
  - Agregar filtros por rango de fechas
  - Agregar filtros por prioridad
  - Implementar búsqueda rápida por texto
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6.3 Implementar acciones y exportación
  - Agregar botones de acción por fila (ver, derivar, archivar)
  - Implementar indicadores visuales de estado y prioridad
  - Agregar opción de exportar a Excel
  - Agregar opción de exportar a PDF
  - _Requirements: 5.4, 5.6_

- [x] 7. Implementar DetalleDocumentoComponent
  - Mostrar información completa del documento
  - Implementar sección de archivos adjuntos con descarga
  - Mostrar historial de derivaciones en timeline
  - Agregar botones de acción según permisos del usuario
  - Implementar sección de notas y observaciones
  - Mostrar estado actual y ubicación
  - _Requirements: 5.4, 5.5, 3.5, 3.6_

- [x] 8. Implementar DerivarDocumentoComponent
- [x] 8.1 Crear modal de derivación
  - Crear componente modal con MatDialog
  - Implementar formulario de derivación
  - Agregar selector de área destino (con opción múltiple)
  - Agregar campo de instrucciones/notas
  - _Requirements: 3.1, 3.2_

- [x] 8.2 Implementar opciones de derivación
  - Agregar checkbox para marcar como urgente
  - Implementar selector de fecha límite
  - Agregar opción de notificar por email
  - Implementar confirmación antes de derivar
  - Mostrar mensaje de éxito con número de derivación
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [x] 9. Implementar BusquedaDocumentosComponent




  - Crear formulario de búsqueda avanzada
  - Implementar búsqueda por número de expediente
  - Implementar búsqueda por remitente
  - Implementar búsqueda por asunto
  - Implementar búsqueda por rango de fechas
  - Implementar búsqueda por tipo y estado
  - Mostrar resultados en tabla con paginación
  - Agregar opción de búsqueda por código QR
  - _Requirements: 5.1, 5.2, 5.3, 5.7_

- [x] 10. Implementar DashboardMesaComponent





- [x] 10.1 Crear indicadores clave


  - Mostrar total de documentos recibidos
  - Mostrar documentos en proceso
  - Mostrar documentos atendidos
  - Mostrar documentos vencidos
  - Implementar actualización en tiempo real
  - _Requirements: 6.1_


- [x] 10.2 Implementar gráficos y estadísticas

  - Agregar gráfico de tendencias por fecha
  - Agregar gráfico de distribución por tipo
  - Agregar gráfico de distribución por área
  - Agregar gráfico de tiempos promedio de atención
  - Implementar filtros por rango de fechas
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 10.3 Agregar alertas y notificaciones

  - Mostrar lista de documentos próximos a vencer
  - Mostrar lista de documentos vencidos
  - Agregar indicador de documentos urgentes pendientes
  - _Requirements: 6.6, 8.2, 8.3_

- [x] 11. Implementar ConfiguracionIntegracionesComponent


- [x] 11.1 Crear lista de integraciones

  - Mostrar tabla de integraciones configuradas
  - Mostrar estado de conexión de cada integración
  - Agregar indicador de última sincronización
  - Implementar botón para probar conexión
  - Agregar botones de editar y eliminar
  - _Requirements: 4.1, 4.2_

- [x] 11.2 Crear formulario de integración

  - Implementar formulario para nueva integración
  - Agregar campos: nombre, descripción, tipo
  - Agregar campos de URL y autenticación
  - Implementar selector de tipo de autenticación
  - Agregar campo de credenciales (encriptado)
  - _Requirements: 4.1, 4.2_

- [x] 11.3 Implementar mapeo de campos

  - Crear interfaz para mapear campos locales a remotos
  - Permitir agregar/eliminar mapeos
  - Implementar validación de mapeos
  - Agregar opción de transformaciones de datos
  - _Requirements: 4.8_

- [x] 11.4 Configurar webhooks

  - Agregar sección de configuración de webhooks
  - Implementar campo de URL de webhook
  - Agregar selector de eventos a notificar
  - Implementar generación de secreto para firma
  - Agregar opción de probar webhook
  - _Requirements: 10.3, 10.4_

- [x] 11.5 Implementar log de sincronizaciones

  - Mostrar historial de sincronizaciones
  - Mostrar documentos enviados y recibidos
  - Mostrar errores de sincronización
  - Implementar filtros por fecha y estado
  - _Requirements: 4.5, 4.6_

- [x] 12. Implementar componentes compartidos



- [x] 12.1 Crear DocumentoCardComponent


  - Diseñar card con información resumida del documento
  - Mostrar indicadores de estado y prioridad
  - Agregar acciones rápidas
  - Implementar diseño responsive
  - _Requirements: 5.4_

- [x] 12.2 Crear EstadoBadgeComponent


  - Implementar badge con colores según estado
  - Agregar iconos representativos
  - Hacer componente reutilizable
  - _Requirements: 5.4_

- [x] 12.3 Crear PrioridadIndicatorComponent


  - Implementar indicador visual de prioridad
  - Usar colores diferenciados (normal, alta, urgente)
  - Agregar tooltip con descripción
  - _Requirements: 1.5, 5.4_

- [x] 12.4 Crear QRCodeGeneratorComponent


  - Implementar generación de código QR
  - Permitir descarga del QR
  - Agregar opción de imprimir
  - _Requirements: 1.6, 5.7_

- [x] 13. Implementar backend - Modelos de base de datos





- [x] 13.1 Crear modelo Documento


  - Definir tabla documentos con SQLAlchemy
  - Agregar todos los campos necesarios
  - Definir relaciones con otras tablas
  - Crear índices para optimización
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 13.2 Crear modelo Derivacion


  - Definir tabla derivaciones
  - Establecer relaciones con documentos y áreas
  - Agregar campos de fechas y estado
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 13.3 Crear modelo Integracion


  - Definir tabla integraciones
  - Agregar campos de configuración
  - Implementar encriptación de credenciales
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_


- [x] 13.4 Crear modelo ArchivoAdjunto

  - Definir tabla archivos_adjuntos
  - Establecer relación con documentos
  - Agregar campos de metadata del archivo
  - _Requirements: 1.3_


- [x] 13.5 Crear modelo Notificacion

  - Definir tabla notificaciones
  - Establecer relación con usuarios
  - Agregar campos de tipo y estado
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 13.6 Crear modelos auxiliares


  - Crear modelo TipoDocumento
  - Crear modelo LogSincronizacion
  - Crear modelo Alerta
  - Ejecutar migraciones de base de datos
  - _Requirements: 2.1, 4.5, 8.2_

- [x] 14. Implementar backend - Schemas Pydantic





- [x] 14.1 Crear schemas de Documento


  - Definir DocumentoCreate schema
  - Definir DocumentoUpdate schema
  - Definir DocumentoResponse schema
  - Definir FiltrosDocumento schema
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 14.2 Crear schemas de Derivacion


  - Definir DerivacionCreate schema
  - Definir DerivacionUpdate schema
  - Definir DerivacionResponse schema
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 14.3 Crear schemas de Integracion


  - Definir IntegracionCreate schema
  - Definir IntegracionUpdate schema
  - Definir IntegracionResponse schema
  - Definir DocumentoExterno schema para intercambio
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.8_

- [x] 15. Implementar backend - Repositories





- [x] 15.1 Crear DocumentoRepository


  - Implementar método create()
  - Implementar método get_by_id()
  - Implementar método list() con filtros y paginación
  - Implementar método update()
  - Implementar método delete()
  - Implementar método generar_numero_expediente()
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2, 5.3_

- [x] 15.2 Crear DerivacionRepository


  - Implementar método create()
  - Implementar método get_by_documento()
  - Implementar método get_by_area()
  - Implementar método update()
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 15.3 Crear IntegracionRepository


  - Implementar método create()
  - Implementar método get_by_id()
  - Implementar método list()
  - Implementar método update()
  - Implementar método delete()
  - _Requirements: 4.1, 4.2_

- [x] 16. Implementar backend - Services







- [x] 16.1 Crear DocumentoService


  - Implementar crear_documento()
  - Implementar obtener_documento()
  - Implementar listar_documentos() con filtros
  - Implementar actualizar_documento()
  - Implementar archivar_documento()
  - Implementar adjuntar_archivo() con upload a storage
  - Implementar generar_comprobante_pdf()
  - Implementar generar_qr()
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.1, 9.2, 9.3_

- [x] 16.2 Crear DerivacionService


  - Implementar derivar_documento()
  - Implementar recibir_documento()
  - Implementar obtener_historial()
  - Implementar obtener_documentos_area()
  - Implementar registrar_atencion()
  - Implementar validar_permisos_derivacion()
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 16.3 Crear IntegracionService


  - Implementar crear_integracion()
  - Implementar probar_conexion()
  - Implementar enviar_documento()
  - Implementar recibir_documento_externo()
  - Implementar sincronizar_estado()
  - Implementar mapear_campos()
  - Implementar encriptar_credenciales()
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 16.4 Crear NotificacionService


  - Implementar enviar_notificacion()
  - Implementar obtener_notificaciones()
  - Implementar marcar_como_leida()
  - Implementar enviar_email() con plantillas
  - Implementar programar_alerta()
  - Implementar sistema de alertas automáticas
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 16.5 Crear ReporteService



  - Implementar obtener_estadisticas()
  - Implementar generar_reporte()
  - Implementar exportar_excel()
  - Implementar exportar_pdf()
  - Implementar calcular_metricas()
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 16.6 Crear WebhookService


  - Implementar enviar_webhook()
  - Implementar validar_firma()
  - Implementar procesar_webhook_entrante()
  - Implementar sistema de reintentos
  - _Requirements: 10.3, 10.4_

- [x] 17. Implementar backend - API Endpoints



- [x] 17.1 Crear endpoints de documentos


  - POST /api/v1/documentos - Crear documento
  - GET /api/v1/documentos/{id} - Obtener documento
  - GET /api/v1/documentos - Listar documentos con filtros
  - PUT /api/v1/documentos/{id} - Actualizar documento
  - DELETE /api/v1/documentos/{id} - Eliminar documento
  - POST /api/v1/documentos/{id}/archivos - Adjuntar archivo
  - GET /api/v1/documentos/{id}/comprobante - Generar comprobante
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 17.2 Crear endpoints de derivaciones


  - POST /api/v1/derivaciones - Derivar documento
  - PUT /api/v1/derivaciones/{id}/recibir - Recibir documento
  - GET /api/v1/derivaciones/documento/{id} - Historial de derivaciones
  - GET /api/v1/derivaciones/area/{id} - Documentos por área
  - PUT /api/v1/derivaciones/{id}/atender - Registrar atención
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 17.3 Crear endpoints de integraciones


  - POST /api/v1/integraciones - Crear integración
  - GET /api/v1/integraciones/{id} - Obtener integración
  - GET /api/v1/integraciones - Listar integraciones
  - PUT /api/v1/integraciones/{id} - Actualizar integración
  - DELETE /api/v1/integraciones/{id} - Eliminar integración
  - POST /api/v1/integraciones/{id}/probar - Probar conexión
  - POST /api/v1/integraciones/{id}/enviar/{documento_id} - Enviar documento
  - GET /api/v1/integraciones/{id}/log - Obtener log de sincronización
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 17.4 Crear endpoints de integración externa


  - POST /api/v1/integracion/recibir-documento - Recibir documento externo
  - POST /api/v1/integracion/webhook - Recibir webhook
  - GET /api/v1/integracion/estado/{id} - Consultar estado de documento
  - _Requirements: 4.3, 4.4, 10.3, 10.4_


- [x] 17.5 Crear endpoints de notificaciones

  - GET /api/v1/notificaciones - Obtener notificaciones del usuario
  - PUT /api/v1/notificaciones/{id}/leer - Marcar como leída
  - DELETE /api/v1/notificaciones/{id} - Eliminar notificación
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 17.6 Crear endpoints de reportes


  - GET /api/v1/reportes/estadisticas - Obtener estadísticas
  - POST /api/v1/reportes/generar - Generar reporte personalizado
  - GET /api/v1/reportes/exportar/excel - Exportar a Excel
  - GET /api/v1/reportes/exportar/pdf - Exportar a PDF
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 18. Implementar sistema de permisos y seguridad






- [x] 18.1 Configurar roles y permisos

  - Definir roles: administrador, operador_mesa, usuario_area, consulta
  - Implementar decoradores de permisos en endpoints
  - Crear middleware de autorización
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [x] 18.2 Implementar seguridad en integraciones

  - Implementar validación de API keys
  - Implementar firma HMAC para webhooks
  - Agregar rate limiting en endpoints de integración
  - Implementar encriptación de credenciales
  - _Requirements: 4.1, 4.2, 10.1, 10.4, 10.8_

- [x] 18.3 Implementar auditoría


  - Crear tabla de logs de auditoría
  - Registrar todas las operaciones críticas
  - Implementar endpoint para consultar logs
  - _Requirements: 7.5, 10.7_

- [ ] 19. Implementar sistema de notificaciones en tiempo real
- [ ] 19.1 Configurar WebSocket
  - Implementar servidor WebSocket en backend
  - Crear servicio de WebSocket en frontend
  - Implementar reconexión automática
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 19.2 Implementar eventos de notificación
  - Emitir evento al derivar documento
  - Emitir evento al recibir documento
  - Emitir evento de documento próximo a vencer
  - Emitir evento de documento urgente
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 19.3 Crear componente de notificaciones
  - Implementar badge de notificaciones en header
  - Crear panel de notificaciones
  - Implementar sonido/vibración para notificaciones urgentes
  - Agregar opción de configurar preferencias
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 20. Implementar sistema de búsqueda por QR
  - Crear endpoint público para consulta por QR
  - Implementar página de consulta sin autenticación
  - Mostrar estado actual del documento
  - Mostrar historial resumido
  - _Requirements: 1.6, 5.7_

- [ ] 21. Implementar sistema de archivado
- [ ] 21.1 Crear funcionalidad de archivo
  - Implementar endpoint para archivar documento
  - Agregar clasificación de archivo
  - Implementar políticas de retención
  - _Requirements: 9.1, 9.2, 9.3, 9.6_

- [ ] 21.2 Crear vista de archivo
  - Implementar componente de archivo documental
  - Agregar búsqueda en documentos archivados
  - Implementar opción de restaurar documento
  - Agregar generación de código de ubicación física
  - _Requirements: 9.3, 9.4, 9.5, 9.7_

- [ ] 22. Implementar tests unitarios
- [ ] 22.1 Tests de servicios frontend
  - Escribir tests para DocumentoService
  - Escribir tests para DerivacionService
  - Escribir tests para IntegracionService
  - Escribir tests para NotificacionService
  - _Requirements: Todos_

- [ ] 22.2 Tests de componentes frontend
  - Escribir tests para RegistroDocumentoComponent
  - Escribir tests para ListaDocumentosComponent
  - Escribir tests para DerivarDocumentoComponent
  - Escribir tests para ConfiguracionIntegracionesComponent
  - _Requirements: Todos_

- [ ] 22.3 Tests de backend
  - Escribir tests para DocumentoService
  - Escribir tests para DerivacionService
  - Escribir tests para IntegracionService
  - Escribir tests para endpoints de API
  - _Requirements: Todos_

- [ ] 23. Implementar tests de integración
  - Escribir test de flujo completo: registro → derivación → atención
  - Escribir test de integración externa: envío y recepción
  - Escribir test de sistema de notificaciones
  - Escribir test de generación de reportes
  - _Requirements: Todos_

- [ ] 24. Implementar tests E2E
  - Escribir test E2E de registro de documento
  - Escribir test E2E de derivación de documento
  - Escribir test E2E de búsqueda y consulta
  - Escribir test E2E de configuración de integración
  - _Requirements: Todos_

- [ ] 25. Optimización y mejoras de performance
- [ ] 25.1 Optimizar frontend
  - Implementar lazy loading del módulo
  - Agregar virtual scrolling en listas grandes
  - Implementar caché de datos frecuentes
  - Optimizar carga de imágenes
  - _Requirements: Todos_

- [ ] 25.2 Optimizar backend
  - Agregar índices en campos de búsqueda
  - Implementar caché con Redis
  - Optimizar queries con EXPLAIN
  - Implementar procesamiento asíncrono de tareas pesadas
  - _Requirements: Todos_

- [ ] 26. Documentación y deployment
- [ ] 26.1 Crear documentación
  - Escribir documentación de usuario
  - Escribir documentación técnica de API
  - Crear guía de configuración de integraciones
  - Documentar proceso de deployment
  - _Requirements: Todos_

- [ ] 26.2 Preparar deployment
  - Crear Dockerfiles para frontend y backend
  - Crear docker-compose.yml
  - Configurar CI/CD pipeline
  - Configurar monitoreo y logs
  - _Requirements: Todos_